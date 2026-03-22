import type { DashboardSummary } from '../types'

export default function StatsBar({ summary }: { summary: DashboardSummary }) {
  const stats = [
    { label: 'TRANSACTIONS', value: summary.totalTransactions.toLocaleString(), color: 'var(--text-primary)' },
    { label: 'FRAUD RATE',   value: `${summary.fraudRate}%`,                    color: 'var(--accent-amber)' },
    { label: 'CASES',        value: summary.totalCases,                          color: 'var(--accent-red)' },
    { label: 'ACCOUNTS',     value: summary.uniqueAccounts,                      color: 'var(--accent-cyan)' },
  ]
  return (
    <div className="flex items-center gap-4">
      {stats.map(s => (
        <div key={s.label} className="flex items-center gap-2">
          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.1em' }}>
            {s.label}
          </span>
          <span className="mono font-bold text-sm" style={{ color: s.color }}>
            {s.value}
          </span>
        </div>
      ))}
    </div>
  )
}