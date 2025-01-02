'use client'

import AddTradeForm from '@/components/AddTradeForm'
import TradeHistory from '@/components/TradeHistory'
import TradingCalendar from '@/components/TradingCalendar'
import StockAnalysis from '@/components/StockAnalysis'
import Header from '@/components/Header'
import { usePortfolio } from '@/lib/portfolio-context'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'

type Tab = 'dashboard' | 'stock-analysis'

export default function Home() {
  const { stats, loading } = usePortfolio()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const chartData = useMemo(() => {
    let cumulative = 0
    return stats.recentTrades.map(trade => {
      if (trade.profit_loss) {
        cumulative += trade.profit_loss
      }
      return {
        date: new Date(trade.exit_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: cumulative
      }
    })
  }, [stats.recentTrades])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-2 rounded-lg shadow-lg">
          <p className="text-card-foreground text-sm">{payload[0].payload.date}</p>
          <p className={`text-sm font-medium ${payload[0].value >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Stock Trading Tracker</h1>
          <p className="text-xl text-muted-foreground mb-8">Sign in to track your trades and analyze your performance.</p>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="inline-flex justify-center rounded-md border border-transparent bg-primary py-3 px-6 text-lg font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Portfolio Summary Card */}
              <div className="p-6 rounded-lg bg-card border border-border shadow-xl hover:shadow-2xl transition-shadow">
                <h2 className="text-xl font-semibold mb-4 text-primary">Portfolio Summary</h2>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Total Value: <span className="text-card-foreground font-medium">${stats.totalValue.toFixed(2)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Daily P/L: <span className={`font-medium ${stats.dailyPL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                      ${stats.dailyPL.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Total P/L: <span className={`font-medium ${stats.totalPL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                      ${stats.totalPL.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Recent Trades Card */}
              <div className="p-6 rounded-lg bg-card border border-border shadow-xl hover:shadow-2xl transition-shadow">
                <h2 className="text-xl font-semibold mb-4 text-primary">Recent Trades</h2>
                <div className="space-y-2">
                  {stats.recentTrades.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent trades</p>
                  ) : (
                    stats.recentTrades.map((trade: any) => (
                      <div key={trade.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-card-foreground">{trade.symbol}</span>
                          <span className="text-xs text-muted-foreground">{trade.trade_type}</span>
                        </div>
                        <span className={`${trade.profit_loss >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                          ${trade.profit_loss.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Performance Metrics Card */}
              <div className="p-6 rounded-lg bg-card border border-border shadow-xl hover:shadow-2xl transition-shadow">
                <h2 className="text-xl font-semibold mb-4 text-primary">Performance Metrics</h2>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Win Rate: <span className="text-card-foreground font-medium">{stats.winRate.toFixed(1)}%</span>
                  </p>
                  <p className="text-muted-foreground">
                    Avg. Win: <span className="text-emerald-500 dark:text-emerald-400 font-medium">${stats.avgWin.toFixed(2)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Avg. Loss: <span className="text-rose-500 dark:text-rose-400 font-medium">${stats.avgLoss.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Trading Calendar */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Trading Calendar</h2>
              <div className="bg-card border border-border shadow-xl rounded-lg p-6">
                <TradingCalendar />
              </div>
            </div>

            {/* Add Trade Form */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Add New Trade</h2>
              <div className="bg-card border border-border shadow-xl rounded-lg p-6">
                <AddTradeForm />
              </div>
            </div>

            {/* Trade History */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Trade History</h2>
              <div className="bg-card border border-border shadow-xl rounded-lg">
                <TradeHistory />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card border border-border shadow-xl rounded-lg p-6">
            <StockAnalysis />
          </div>
        )}
      </div>
    </div>
  )
}
