export interface TransactionTrail {
  from: string
  to: string
  amount: number
  timestamp: string
}

export interface FIUCase {
  case_id: string
  type: 'Circular Transaction' | 'Layering' | 'Mule Account' | 'Structuring' | 'Dormant Activation' | 'Flow Conservation'
  accounts: string[]
  pattern: string
  risk_score: number
  ml_flag: number
  total_amount: number
  transaction_trail: TransactionTrail[]
  recommendation: 'escalate' | 'freeze' | 'monitor'
  explanation: string
}

export interface MonthlyData {
  month: string
  count: number
  fraud_count: number
  total_amount: number
}

export interface RiskAccount {
  account_id: string
  score: number
  level: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface DashboardSummary {
  totalTransactions: number
  fraudTransactions: number
  totalAmount: number
  fraudAmount: number
  uniqueAccounts: number
  totalCases: number
  fraudRate: number
  monthlyData: MonthlyData[]
  topRiskAccounts: RiskAccount[]
}

export interface GraphNode {
  id: string
  risk: 'HIGH' | 'MEDIUM' | 'LOW'
  score: number
  cases: FIUCase[]
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
  amount: number
  timestamp: string
  type: string
}

export type PatternFilter = 'all' | 'Circular Transaction' | 'Layering' | 'Mule Account' | 'Structuring' | 'Dormant Activation' | 'Flow Conservation'
export type RiskFilter = 'all' | 'HIGH' | 'MEDIUM' | 'LOW'