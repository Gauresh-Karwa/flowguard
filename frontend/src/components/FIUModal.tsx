import { useState } from 'react'
import { X, Download } from 'lucide-react'
import type { FIUCase, DashboardSummary } from '../types'

const PATTERN_COLOR: Record<string, string> = {
  'Circular Transaction': '#DC2626',
  'Layering':             '#7C3AED',
  'Mule Account':         '#2563EB',
  'Structuring':          '#D97706',
  'Dormant Activation':   '#DB2777',
  'Flow Conservation':    '#0891B2',
}

interface Props { cases: FIUCase[]; summary: DashboardSummary | null; onClose: () => void }

export default function FIUModal({ cases, summary, onClose }: Props) {
  const [tab, setTab] = useState<'summary' | 'cases' | 'escalate'>('summary')

  const escalate = cases.filter(c => c.recommendation === 'escalate')
  const freeze   = cases.filter(c => c.recommendation === 'freeze')
  const monitor  = cases.filter(c => c.recommendation === 'monitor')
  const reportId = `FIU-${Date.now().toString(36).toUpperCase()}`
  const date     = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const download = () => {
    const data = { report_id: reportId, generated_at: new Date().toISOString(), summary: { total_cases: cases.length, escalate: escalate.length, freeze: freeze.length, monitor: monitor.length, total_fraud_amount: summary?.fraudAmount ?? 0 }, cases }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = `${reportId}.json`; a.click()
  }

  const Th = ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
      {children}
    </th>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }}>
      <div className="fade-in" style={{ width: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

        {/* Modal Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>FIU Investigation Report</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono' }}>{reportId} · {date}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={download} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--brand)', border: '1px solid var(--brand)', color: '#fff' }}>
              <Download size={14} /> Export JSON
            </button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['summary', 'cases', 'escalate'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent',
              color: tab === t ? 'var(--brand)' : 'var(--text-2)',
              borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
            }}>
              {t === 'summary' ? 'Summary' : t === 'cases' ? `All Cases (${cases.length})` : `Escalate (${escalate.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {tab === 'summary' && (
            <div className="fade-in">
              {/* Action counts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Escalate to Authority', value: escalate.length, color: 'var(--risk-high)', bg: 'var(--risk-high-bg)', border: 'var(--risk-high-border)' },
                  { label: 'Freeze Account',         value: freeze.length,   color: 'var(--brand)',    bg: 'var(--brand-bg)',    border: 'var(--brand-border)' },
                  { label: 'Monitor',                value: monitor.length,  color: 'var(--risk-low)', bg: 'var(--risk-low-bg)', border: 'var(--risk-low-border)' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 20px' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: s.color, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pattern breakdown */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><Th>Pattern Type</Th><Th>Cases</Th><Th>Total Amount</Th><Th>ML Confirmed</Th></tr>
                  </thead>
                  <tbody>
                    {['Circular Transaction','Layering','Mule Account','Structuring','Dormant Activation','Flow Conservation'].map(type => {
                      const tc = cases.filter(c => c.type === type)
                      if (!tc.length) return null
                      const ml = tc.filter(c => c.ml_flag).length
                      return (
                        <tr key={type} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px', color: PATTERN_COLOR[type], fontWeight: 600, fontSize: 13 }}>{type}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-1)', fontFamily: 'JetBrains Mono' }}>{tc.length}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--risk-medium)', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>₹{tc.reduce((s,c)=>s+c.total_amount,0).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', color: ml > 0 ? 'var(--risk-medium)' : 'var(--text-3)', fontSize: 13 }}>{ml}/{tc.length}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--risk-high)' }}>Total Suspicious Amount</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--risk-high)', fontFamily: 'JetBrains Mono' }}>
                  ₹{cases.reduce((s,c)=>s+c.total_amount,0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {tab === 'cases' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cases.map(c => (
                <div key={c.case_id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: PATTERN_COLOR[c.type] }}>{c.type}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono' }}>{c.case_id}</span>
                      {c.ml_flag === 1 && <span className="badge badge-medium">ML Confirmed</span>}
                    </div>
                    <span className={`badge badge-${c.recommendation}`}>{c.recommendation.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>{c.pattern}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-2)' }}>Score: <b style={{ color: c.risk_score >= 10 ? 'var(--risk-high)' : 'var(--risk-medium)' }}>{c.risk_score}</b></span>
                    <span style={{ color: 'var(--text-2)' }}>Amount: <b style={{ color: 'var(--risk-medium)' }}>₹{c.total_amount.toLocaleString()}</b></span>
                    <span style={{ color: 'var(--text-2)' }}>Accounts: <b>{c.accounts.length}</b></span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{c.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'escalate' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {escalate.length === 0 ? (
                <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: 32 }}>No cases require escalation</p>
              ) : escalate.map(c => (
                <div key={c.case_id} style={{ background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--risk-high)' }}>{c.type}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono' }}>{c.case_id}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>{c.explanation}</p>
                  {c.transaction_trail.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4, fontFamily: 'JetBrains Mono' }}>
                      <span style={{ color: 'var(--brand)' }}>{t.from}</span>
                      <span style={{ color: 'var(--text-3)' }}>→</span>
                      <span style={{ color: 'var(--brand)' }}>{t.to}</span>
                      <span style={{ color: 'var(--risk-medium)', fontWeight: 600 }}>₹{t.amount.toLocaleString()}</span>
                      <span style={{ color: 'var(--text-3)' }}>{t.timestamp}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}