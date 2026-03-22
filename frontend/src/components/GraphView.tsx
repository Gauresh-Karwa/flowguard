import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { FIUCase, DashboardSummary, PatternFilter, RiskFilter, GraphNode, GraphEdge } from '../types'

interface Props {
  cases: FIUCase[]
  summary: DashboardSummary | null
  patternFilter: PatternFilter
  riskFilter: RiskFilter
  highlightSuspicious: boolean
  selectedNode: GraphNode | null
  setSelectedNode: (n: GraphNode | null) => void
  selectedCase: FIUCase | null
}

const PATTERN_COLOR: Record<string, string> = {
  'Circular Transaction': '#DC2626',
  'Layering':             '#7C3AED',
  'Mule Account':         '#2563EB',
  'Structuring':          '#D97706',
  'Dormant Activation':   '#DB2777',
  'Flow Conservation':    '#0891B2',
}

const RISK_COLOR = { HIGH: '#DC2626', MEDIUM: '#D97706', LOW: '#94A3B8' }
const RISK_SIZE  = { HIGH: 14, MEDIUM: 10, LOW: 5 }

function buildGraph(cases: FIUCase[], summary: DashboardSummary | null) {
  const nodeMap = new Map<string, GraphNode>()
  const edgeMap = new Map<string, GraphEdge>()

  const getOrCreate = (id: string): GraphNode => {
    if (!nodeMap.has(id)) {
      const info = summary?.topRiskAccounts?.find(r => r.account_id === id)
      nodeMap.set(id, { id, risk: info?.level ?? 'LOW', score: info?.score ?? 0, cases: [] })
    }
    return nodeMap.get(id)!
  }

  cases.forEach(c => {
    c.accounts.forEach(acc => {
      getOrCreate(acc).cases.push(c)
    })
    c.transaction_trail.forEach(t => {
      getOrCreate(t.from)
      getOrCreate(t.to)
      const key = `${t.from}→${t.to}@${t.amount}`
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          source: t.from,
          target: t.to,
          amount: t.amount,
          timestamp: t.timestamp,
          type: c.type,
        })
      }
    })
  })

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  }
}

export default function GraphView({
  cases, summary, patternFilter,
  selectedNode, setSelectedNode,
}: Props) {
  const svgRef     = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const simRef     = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null)
  const drawRef    = useRef<() => void>(() => {})

  const filteredCases = cases.filter(c =>
    patternFilter === 'all' || c.type === patternFilter
  )

  const { nodes, edges } = buildGraph(filteredCases, summary)

  useEffect(() => {
    drawRef.current = () => {
      const svgEl = svgRef.current
      if (!svgEl) return
      if (simRef.current) simRef.current.stop()

      const W = svgEl.clientWidth  || 800
      const H = svgEl.clientHeight || 600

      const svg = d3.select(svgEl)
      svg.selectAll('*').remove()

      // ── DEFS ───────────────────────────────────────────────────────────────
      const defs = svg.append('defs')

      Object.entries(PATTERN_COLOR).forEach(([type, col]) => {
        const id = `arr-${type.replace(/\s+/g, '-')}`
        defs.append('marker')
          .attr('id', id)
          .attr('viewBox', '0 -4 8 8')
          .attr('refX', 20).attr('refY', 0)
          .attr('markerWidth', 5).attr('markerHeight', 5)
          .attr('orient', 'auto')
          .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', col)
      })

      const shadow = defs.append('filter').attr('id', 'shadow')
        .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
      shadow.append('feDropShadow')
        .attr('dx', 0).attr('dy', 2).attr('stdDeviation', 4)
        .attr('flood-color', '#DC2626').attr('flood-opacity', 0.25)

      const shadowMed = defs.append('filter').attr('id', 'shadow-med')
        .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
      shadowMed.append('feDropShadow')
        .attr('dx', 0).attr('dy', 1).attr('stdDeviation', 3)
        .attr('flood-color', '#D97706').attr('flood-opacity', 0.2)

      // ── BACKGROUND ─────────────────────────────────────────────────────────
      svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#F8FAFC')

      const grid = svg.append('g').attr('opacity', 0.4)
      for (let x = 0; x < W; x += 40)
        grid.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', H)
          .attr('stroke', '#E2E8F0').attr('stroke-width', 0.5)
      for (let y = 0; y < H; y += 40)
        grid.append('line').attr('x1', 0).attr('y1', y).attr('x2', W).attr('y2', y)
          .attr('stroke', '#E2E8F0').attr('stroke-width', 0.5)

      // ── ZOOM CONTAINER ─────────────────────────────────────────────────────
      const g = svg.append('g')
      svg.call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on('zoom', e => g.attr('transform', e.transform))
      )

      // ── EDGES ──────────────────────────────────────────────────────────────
      const link = g.append('g').selectAll<SVGLineElement, GraphEdge>('line')
        .data(edges).join('line')
        .attr('stroke', d => PATTERN_COLOR[d.type] ?? '#CBD5E1')
        .attr('stroke-width', d => Math.max(1, Math.min(3, d.amount / 20000)))
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', d => {
          const id = `arr-${d.type.replace(/\s+/g, '-')}`
          return `url(#${id})`
        })
        .style('cursor', 'pointer')

      link.on('mouseover', (event, d) => {
        const tip = tooltipRef.current!
        tip.style.display = 'block'
        tip.style.left = `${event.clientX + 14}px`
        tip.style.top  = `${event.clientY - 12}px`
        const src = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source
        const tgt = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target
        tip.innerHTML = `
          <div style="font-size:11px;color:var(--text-3);margin-bottom:4px">TRANSACTION</div>
          <div style="font-size:12px;color:var(--text-1);margin-bottom:2px;font-family:JetBrains Mono">${src} → ${tgt}</div>
          <div style="font-size:16px;font-weight:700;color:var(--risk-medium);margin-bottom:2px">₹${d.amount.toLocaleString()}</div>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">${d.timestamp}</div>
          <span style="font-size:11px;font-weight:600;color:${PATTERN_COLOR[d.type] ?? 'var(--text-2)'}">● ${d.type}</span>
        `
      }).on('mousemove', event => {
        const tip = tooltipRef.current!
        tip.style.left = `${event.clientX + 14}px`
        tip.style.top  = `${event.clientY - 12}px`
      }).on('mouseout', () => {
        tooltipRef.current!.style.display = 'none'
      })

      // ── NODES ──────────────────────────────────────────────────────────────
      const nodeG = g.append('g').selectAll<SVGGElement, GraphNode>('g')
        .data(nodes).join('g').style('cursor', 'pointer')

      // Selection ring
      nodeG.filter(d => selectedNode?.id === d.id)
        .append('circle')
        .attr('r', d => RISK_SIZE[d.risk] + 7)
        .attr('fill', 'none')
        .attr('stroke', 'var(--brand)')
        .attr('stroke-width', 2)

      // Main circle
      nodeG.append('circle')
        .attr('r', d => RISK_SIZE[d.risk])
        .attr('fill', d => RISK_COLOR[d.risk])
        .attr('fill-opacity', d => d.risk === 'LOW' ? 0.45 : 0.85)
        .attr('stroke', d => RISK_COLOR[d.risk])
        .attr('stroke-width', d => d.risk === 'HIGH' ? 2 : d.risk === 'MEDIUM' ? 1.5 : 1)
        .attr('filter', d =>
          d.risk === 'HIGH' ? 'url(#shadow)' :
          d.risk === 'MEDIUM' ? 'url(#shadow-med)' : 'none'
        )

      // Label for HIGH and MEDIUM
      nodeG.filter(d => d.risk !== 'LOW')
        .append('text')
        .attr('dy', d => RISK_SIZE[d.risk] + 12)
        .attr('text-anchor', 'middle')
        .style('font-family', 'JetBrains Mono')
        .style('font-size', '8px')
        .style('fill', d => d.risk === 'HIGH' ? 'var(--risk-high)' : 'var(--text-2)')
        .style('pointer-events', 'none')
        .text(d => d.id)

      // ── NODE INTERACTIONS ─────────────────────────────────────────────────
      nodeG.on('mouseover', (event, d) => {
        const tip = tooltipRef.current!
        const col = RISK_COLOR[d.risk]
        const patterns = [...new Set(d.cases.map(c => c.type))].join(', ')
        tip.style.display = 'block'
        tip.style.left = `${event.clientX + 16}px`
        tip.style.top  = `${event.clientY - 12}px`
        tip.innerHTML = `
          <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">ACCOUNT</div>
          <div style="font-size:14px;font-weight:600;color:${col};margin-bottom:4px;font-family:JetBrains Mono">${d.id}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
            <span class="badge badge-${d.risk.toLowerCase()}">${d.risk} RISK</span>
            <span style="font-size:11px;color:var(--text-3)">score: ${d.score}</span>
          </div>
          ${d.cases.length > 0 ? `<div style="font-size:11px;color:var(--text-2)">Cases: <b>${d.cases.length}</b></div>` : ''}
          ${patterns ? `<div style="font-size:11px;color:var(--text-3);margin-top:2px">${patterns}</div>` : ''}
        `
        d3.select(event.currentTarget as SVGGElement).select('circle')
          .transition().duration(120)
          .attr('r', RISK_SIZE[d.risk] + 3)
      }).on('mousemove', event => {
        const tip = tooltipRef.current!
        tip.style.left = `${event.clientX + 16}px`
        tip.style.top  = `${event.clientY - 12}px`
      }).on('mouseout', (event, d) => {
        tooltipRef.current!.style.display = 'none'
        d3.select(event.currentTarget as SVGGElement).select('circle')
          .transition().duration(120)
          .attr('r', RISK_SIZE[d.risk])
      }).on('click', (_, d) => {
        setSelectedNode(selectedNode?.id === d.id ? null : d)
      })

      // Drag
      nodeG.call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end',   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )

      // ── SIMULATION ─────────────────────────────────────────────────────────
      const sim = d3.forceSimulation<GraphNode>(nodes)
        .force('link',    d3.forceLink<GraphNode, GraphEdge>(edges).id(d => d.id).distance(100).strength(0.5))
        .force('charge',  d3.forceManyBody().strength(-280))
        .force('center',  d3.forceCenter(W / 2, H / 2))
        .force('collide', d3.forceCollide(22))

      simRef.current = sim

      sim.on('tick', () => {
        link
          .attr('x1', d => (d.source as GraphNode).x ?? 0)
          .attr('y1', d => (d.source as GraphNode).y ?? 0)
          .attr('x2', d => (d.target as GraphNode).x ?? 0)
          .attr('y2', d => (d.target as GraphNode).y ?? 0)
        nodeG.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      // ── LEGEND ─────────────────────────────────────────────────────────────
      const legend = svg.append('g').attr('transform', 'translate(16, 16)')

      const items = [
        { color: '#DC2626', label: 'High Risk',    circle: true,  size: 7 },
        { color: '#D97706', label: 'Medium Risk',  circle: true,  size: 5 },
        { color: '#94A3B8', label: 'Low Risk',     circle: true,  size: 3 },
        { color: '#DC2626', label: 'Circular',     circle: false, size: 0 },
        { color: '#7C3AED', label: 'Layering',     circle: false, size: 0 },
        { color: '#2563EB', label: 'Mule',         circle: false, size: 0 },
        { color: '#D97706', label: 'Structuring',  circle: false, size: 0 },
        { color: '#DB2777', label: 'Dormant',      circle: false, size: 0 },
        { color: '#0891B2', label: 'Flow Cons.',   circle: false, size: 0 },
      ]

      const lh = items.length * 18 + 16
      legend.append('rect')
        .attr('rx', 6).attr('fill', 'white')
        .attr('stroke', '#E2E8F0').attr('stroke-width', 1)
        .attr('width', 108).attr('height', lh)

      items.forEach((item, i) => {
        const row = legend.append('g').attr('transform', `translate(10, ${i * 18 + 10})`)
        if (item.circle) {
          row.append('circle').attr('cx', 5).attr('cy', 5).attr('r', item.size)
            .attr('fill', item.color).attr('fill-opacity', 0.85)
        } else {
          row.append('line').attr('x1', 0).attr('y1', 5).attr('x2', 12).attr('y2', 5)
            .attr('stroke', item.color).attr('stroke-width', 2).attr('stroke-dasharray', '3,2')
        }
        row.append('text').attr('x', 16).attr('y', 9)
          .style('font-family', 'Inter').style('font-size', '10px').style('fill', '#475569')
          .text(item.label)
      })
    }

    drawRef.current()
  }, [nodes.length, edges.length, patternFilter, selectedNode?.id])

  useEffect(() => {
    const ro = new ResizeObserver(() => drawRef.current())
    if (svgRef.current) ro.observe(svgRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <svg ref={svgRef} width="100%" height="100%" />
      <div ref={tooltipRef} className="g-tooltip" style={{ display: 'none' }} />

      {patternFilter !== 'all' && (
        <div className="fade-in" style={{
          position: 'absolute', top: 12, right: 12,
          background: 'var(--surface)',
          border: `1px solid ${PATTERN_COLOR[patternFilter] ?? 'var(--border)'}`,
          borderRadius: 6, padding: '4px 12px',
          fontSize: 12, fontWeight: 600,
          color: PATTERN_COLOR[patternFilter] ?? 'var(--text-2)',
        }}>
          {patternFilter}
        </div>
      )}

      {nodes.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 32, color: 'var(--text-3)' }}>○</div>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No nodes match the current filter</p>
        </div>
      )}
    </div>
  )
}