import type { GraphNode, FIUCase, DashboardSummary } from '../types'

const PATTERN_COLOR: Record<string, string> = {
  'Circular Transaction': '#DC2626',
  'Layering':             '#7C3AED',
  'Mule Account':         '#2563EB',
  'Structuring':          '#D97706',
  'Dormant Activation':   '#DB2777',
  'Flow Conservation':    '#0891B2',
}

interface Props { selectedNode: GraphNode | null; cases: FIUCase[]; summary: DashboardSummary | null }

export default function RightPanel({ selectedNode, cases, summary }: Props) {
  const nodeCases  = selectedNode ? cases.filter(c => c.accounts.includes(selectedNode.id)) : []
  const riskColor  = selectedNode
    ? selectedNode.risk === 'HIGH' ? 'var(--risk-high)' : selectedNode.risk === 'MEDIUM' ? 'var(--risk-medium)' : 'var(--risk-low)'
    : 'var(--text-2)'

  const Divider = () => <div style={{ height: 1, background: 'var(--border)', margin: '0 0' }} />

  return (
    <div className="panel-right" style={{ width: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div className="section-label">Account Details</div>
      <Divider />

      {!selectedNode ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, padding: 24 }}>
          <div style={{ fontSize: 28, color: 'var(--text-3)' }}>○</div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
            Click any node on the graph to inspect the account
          </p>
        </div>
      ) : (
        <div className="fade-in" style={{ flex: 1, overflowY: 'auto' }}>

          {/* Account ID + Risk */}
          <div style={{ padding: '16px 16px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.06em' }}>ACCOUNT ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: riskColor, fontFamily: 'JetBrains Mono', marginBottom: 10 }}>
              {selectedNode.id}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge badge-${selectedNode.risk.toLowerCase()}`}>{selectedNode.risk} RISK</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Risk score: <b style={{ color: 'var(--text-2)' }}>{selectedNode.score}</b></span>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width 0.4s ease',
                width: `${Math.min(100, (selectedNode.score / 50) * 100)}%`,
                background: riskColor,
              }} />
            </div>
          </div>

          <Divider />

          {/* Detected patterns */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em' }}>
              DETECTED PATTERNS {nodeCases.length > 0 && `(${nodeCases.length})`}
            </div>
            {nodeCases.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No fraud patterns detected</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nodeCases.map(c => (
                  <div key={c.case_id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: PATTERN_COLOR[c.type] ?? 'var(--text-2)' }}>{c.type}</span>
                      <span className={`badge badge-${c.recommendation}`}>{c.recommendation}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{c.case_id}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-2)' }}>₹{c.total_amount.toLocaleString()}</span>
                      {c.ml_flag === 1 && <span style={{ color: 'var(--risk-medium)', fontWeight: 500 }}>⚠ ML flagged</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction trail */}
          {nodeCases.some(c => c.transaction_trail.length > 0) && (
            <>
              <Divider />
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em' }}>
                  TRANSACTION TRAIL
                </div>
                {nodeCases.filter(c => c.transaction_trail.length > 0).slice(0, 1).map(c =>
                  c.transaction_trail.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
                        {i < c.transaction_trail.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 2 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-1)' }}>
                          {t.from} → {t.to}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--risk-medium)', marginTop: 2 }}>
                          ₹{t.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Explanation */}
          {nodeCases[0] && (
            <>
              <Divider />
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, letterSpacing: '0.06em' }}>WHY FLAGGED</div>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{nodeCases[0].explanation}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* System stats */}
      {summary && (
        <>
          <Divider />
          <div style={{ padding: '12px 16px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em' }}>SYSTEM OVERVIEW</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Total Cases',   value: summary.totalCases },
                { label: 'Fraud Txns',    value: summary.fraudTransactions },
                { label: 'Fraud Amount',  value: `₹${(summary.fraudAmount / 1e6).toFixed(1)}M` },
                { label: 'Fraud Rate',    value: `${summary.fraudRate}%` },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'JetBrains Mono' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}