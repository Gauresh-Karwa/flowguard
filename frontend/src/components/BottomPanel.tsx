import type { FIUCase } from '../types'

const PATTERN_COLOR: Record<string, string> = {
  'Circular Transaction': '#DC2626',
  'Layering':             '#7C3AED',
  'Mule Account':         '#2563EB',
  'Structuring':          '#D97706',
  'Dormant Activation':   '#DB2777',
  'Flow Conservation':    '#0891B2',
}

interface Props { cases: FIUCase[]; setSelectedCase: (c: FIUCase) => void }

export default function BottomPanel({ cases, setSelectedCase }: Props) {
  const rows = cases.flatMap(c =>
    c.transaction_trail.map(t => ({ ...t, case_id: c.case_id, type: c.type, recommendation: c.recommendation, case: c }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--border)' }}>
            {['Case ID', 'Pattern', 'From', 'To', 'Amount', 'Timestamp', 'Action'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} onClick={() => setSelectedCase(row.case)}
              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
              <td style={{ padding: '10px 14px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{row.case_id}</td>
              <td style={{ padding: '10px 14px', color: PATTERN_COLOR[row.type] ?? 'var(--text-2)', fontWeight: 600, fontSize: 12 }}>{row.type}</td>
              <td style={{ padding: '10px 14px', color: 'var(--text-1)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{row.from}</td>
              <td style={{ padding: '10px 14px', color: 'var(--text-1)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{row.to}</td>
              <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--risk-medium)', fontFamily: 'JetBrains Mono' }}>₹{row.amount.toLocaleString()}</td>
              <td style={{ padding: '10px 14px', color: 'var(--text-3)', fontSize: 12 }}>{row.timestamp}</td>
              <td style={{ padding: '10px 14px' }}><span className={`badge badge-${row.recommendation}`}>{row.recommendation}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No transaction trails available</p>
        </div>
      )}
    </div>
  )
}