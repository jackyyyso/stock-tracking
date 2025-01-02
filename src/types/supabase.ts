export type Trade = {
  id: string
  user_id: string
  symbol: string
  entry_price: number
  exit_price: number | null
  quantity: number
  entry_date: string
  exit_date: string | null
  trade_type: 'LONG' | 'SHORT'
  profit_loss: number | null
  notes: string
  chart_url: string | null
  created_at: string
}

export type Portfolio = {
  id: string
  user_id: string
  total_value: number
  cash_balance: number
  created_at: string
  updated_at: string
}

export type PerformanceMetrics = {
  id: string
  user_id: string
  win_rate: number
  total_trades: number
  profitable_trades: number
  losing_trades: number
  average_win: number
  average_loss: number
  largest_win: number
  largest_loss: number
  created_at: string
  updated_at: string
} 