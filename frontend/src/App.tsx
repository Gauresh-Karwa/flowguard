import { useState, useEffect } from 'react'
import { ShieldCheck, FileText } from 'lucide-react'
import type { FIUCase, DashboardSummary, PatternFilter, RiskFilter, GraphNode } from './types'
import GraphView from './components/GraphView'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import BottomPanel from './components/BottomPanel'
import FIUModal from './components/FIUModal'

export default function App() {
  const [cases, setCases] = useState<FIUCase[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [patternFilter, setPatternFilter] = useState<PatternFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const highlightSuspicious = true
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedCase, setSelectedCase] = useState<FIUCase | null>(null)
  const [showFIUModal, setShowFIUModal] = useState(false)
  const [activeView, setActiveView] = useState<'graph' | 'table'>('graph')

  useEffect(() => {
    Promise.all([
      fetch('/data/fiu_report.json').then(r => r.json()),
      fetch('/data/dashboard_summary.json').then(r => r.json()),
    ]).then(([c, s]) => {
      setCases(c)
      setSummary(s)
      setLoading(false)
    }).catch(() => {
      setError(true)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Loading FlowGuard data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 8 }}>
        <p style={{ color: 'var(--risk-high)', fontWeight: 600 }}>Could not load data</p>
        <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Make sure fiu_report.json and dashboard_summary.json are in /public/data/</p>
      </div>
    )
  }

  const stats = summary ? [
    { label: 'Total Transactions', value: summary.totalTransactions.toLocaleString() },
    { label: 'Fraud Transactions', value: summary.fraudTransactions.toLocaleString(), color: 'var(--risk-high)' },
    { label: 'Fraud Rate',         value: `${summary.fraudRate}%`,                    color: 'var(--risk-medium)' },
    { label: 'Cases Detected',     value: summary.totalCases,                          color: 'var(--brand)' },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <header style={{
        height: 56,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 24,
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <ShieldCheck size={20} color="var(--brand)" />
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            FlowGuard
          </span>
          <span style={{
            fontSize: 11, color: 'var(--text-3)', fontWeight: 500,
            borderLeft: '1px solid var(--border)', paddingLeft: 8, marginLeft: 4,
          }}>
            Fund Flow Intelligence
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'baseline', gap: 6,
              padding: '4px 12px',
              background: 'var(--surface-2)',
              borderRadius: 6,
              border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: s.color ?? 'var(--text-1)', fontFamily: 'JetBrains Mono' }}>
                {s.value}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowFIUModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'var(--brand)', border: '1px solid var(--brand)',
              color: '#fff',
            }}>
            <FileText size={14} />
            Generate FIU Report
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        <LeftPanel
          patternFilter={patternFilter} setPatternFilter={setPatternFilter}
          riskFilter={riskFilter} setRiskFilter={setRiskFilter}
          cases={cases} selectedCase={selectedCase} setSelectedCase={setSelectedCase}
        />

        {/* CENTER */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* View tabs */}
          <div style={{
            height: 40, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 4, flexShrink: 0,
          }}>
            {(['graph', 'table'] as const).map(v => (
              <button key={v} onClick={() => setActiveView(v)}
                style={{
                  padding: '4px 12px', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: activeView === v ? 'var(--brand-bg)' : 'transparent',
                  color: activeView === v ? 'var(--brand)' : 'var(--text-2)',
                  border: activeView === v ? '1px solid var(--brand-border)' : '1px solid transparent',
                }}>
                {v === 'graph' ? 'Network Graph' : 'Transaction Table'}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
              {cases.length} cases · {summary?.uniqueAccounts ?? 0} accounts · {summary?.fraudTransactions ?? 0} fraud transactions
            </span>
          </div>

          {activeView === 'graph' ? (
            <GraphView
              cases={cases} summary={summary}
              patternFilter={patternFilter} riskFilter={riskFilter}
              highlightSuspicious={highlightSuspicious}
              selectedNode={selectedNode} setSelectedNode={setSelectedNode}
              selectedCase={selectedCase}
            />
          ) : (
            <BottomPanel cases={cases} setSelectedCase={setSelectedCase} />
          )}
        </div>

        <RightPanel selectedNode={selectedNode} cases={cases} summary={summary} />
      </div>

      {showFIUModal && (
        <FIUModal cases={cases} summary={summary} onClose={() => setShowFIUModal(false)} />
      )}
    </div>
  )
}