import type { FIUCase, PatternFilter, RiskFilter } from '../types'

const PATTERNS: { key: PatternFilter; label: string; color: string }[] = [
  { key: 'all',                  label: 'All Patterns',     color: '#475569' },
  { key: 'Circular Transaction', label: 'Circular',         color: '#DC2626' },
  { key: 'Layering',             label: 'Layering',         color: '#7C3AED' },
  { key: 'Mule Account',         label: 'Mule Account',     color: '#2563EB' },
  { key: 'Structuring',          label: 'Structuring',      color: '#D97706' },
  { key: 'Dormant Activation',   label: 'Dormant',          color: '#DB2777' },
  { key: 'Flow Conservation',    label: 'Flow Conservation',color: '#0891B2' },
]

interface Props {
  patternFilter: PatternFilter; setPatternFilter: (p: PatternFilter) => void
  riskFilter: RiskFilter;       setRiskFilter: (r: RiskFilter) => void
  amountRange?: [number, number]; setAmountRange?: (r: [number, number]) => void
  cases: FIUCase[]; selectedCase: FIUCase | null; setSelectedCase: (c: FIUCase | null) => void
}

export default function LeftPanel({ patternFilter, setPatternFilter, riskFilter, setRiskFilter, cases, selectedCase, setSelectedCase }: Props) {

  const filteredCases = cases.filter(c => {
    if (patternFilter !== 'all' && c.type !== patternFilter) return false
    if (riskFilter !== 'all') {
      const level = c.risk_score >= 10 ? 'HIGH' : c.risk_score >= 4 ? 'MEDIUM' : 'LOW'
      if (level !== riskFilter) return false
    }
    return true
  })

  const patternColor = (type: string) => PATTERNS.find(p => p.key === type)?.color ?? '#475569'

  return (
    <div className="panel" style={{ width: 260, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div className="section-label">Detection Patterns</div>
      <div style={{ padding: '0 10px 8px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        {PATTERNS.map(p => {
          const count = p.key === 'all' ? cases.length : cases.filter(c => c.type === p.key).length
          const active = patternFilter === p.key
          return (
            <button key={p.key} onClick={() => setPatternFilter(p.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                background: active ? `${p.color}12` : 'transparent',
                border: `1px solid ${active ? `${p.color}40` : 'transparent'}`,
                transition: 'all 0.12s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: p.key === 'all' ? 'var(--text-3)' : p.color,
                  opacity: active ? 1 : 0.5,
                }} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text-1)' : 'var(--text-2)' }}>
                  {p.label}
                </span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: active ? p.color : 'var(--text-3)',
                background: active ? `${p.color}15` : 'var(--surface-2)',
                padding: '1px 6px', borderRadius: 10,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '4px 10px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'HIGH', 'MEDIUM', 'LOW'] as RiskFilter[]).map(r => (
            <button key={r} onClick={() => setRiskFilter(r)}
              style={{
                flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: riskFilter === r
                  ? r === 'HIGH' ? 'var(--risk-high-bg)' : r === 'MEDIUM' ? 'var(--risk-med-bg)' : r === 'LOW' ? 'var(--risk-low-bg)' : 'var(--brand-bg)'
                  : 'var(--surface-2)',
                color: riskFilter === r
                  ? r === 'HIGH' ? 'var(--risk-high)' : r === 'MEDIUM' ? 'var(--risk-medium)' : r === 'LOW' ? 'var(--risk-low)' : 'var(--brand)'
                  : 'var(--text-3)',
                border: `1px solid ${riskFilter === r ? 'currentColor' : 'var(--border)'}`,
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 10px 4px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>
          Cases — {filteredCases.length}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
        {filteredCases.map(c => {
          const level  = c.risk_score >= 10 ? 'HIGH' : c.risk_score >= 4 ? 'MEDIUM' : 'LOW'
          const col    = patternColor(c.type)
          const active = selectedCase?.case_id === c.case_id
          return (
            <button key={c.case_id} onClick={() => setSelectedCase(active ? null : c)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 10px', marginBottom: 4,
                borderRadius: 7, cursor: 'pointer',
                background: active ? 'var(--brand-bg)' : 'var(--surface)',
                border: `1px solid ${active ? 'var(--brand-border)' : 'var(--border)'}`,
                transition: 'all 0.12s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: col }}>● {c.type}</span>
                <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
                {c.case_id}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                  ₹{c.total_amount.toLocaleString()}
                </span>
                <span className={`badge badge-${c.recommendation}`}>
                  {c.recommendation}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}