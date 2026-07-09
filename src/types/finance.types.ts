export interface FinancialKpi {
  totalRevenue: number
  totalCosts: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  grossMargin: number
  netMargin: number
  averageTicket: number
  totalSales: number
  revenueVsPreviousPeriod: number
  currency: string
}

export interface CashFlowEntry {
  label: string
  inflows: number
  outflows: number
  balance: number
}

export interface CashFlow {
  entries: CashFlowEntry[]
  totalInflows: number
  totalOutflows: number
  netBalance: number
  currency: string
}

export interface RevenueByDay {
  date: string
  revenue: number
  costs: number
  expenses: number
}

export interface TopProduct {
  productName: string
  revenue: number
  cost: number
  profit: number
  margin: number
  quantity: number
}

export interface FinanceDashboard {
  kpis: FinancialKpi
  cashFlow: CashFlow
  revenueByDay: RevenueByDay[]
  topProducts: TopProduct[]
  period: string
  from: string
  to: string
}
