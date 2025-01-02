'use client'

import AddTradeForm from '@/components/AddTradeForm'
import TradeHistory from '@/components/TradeHistory'
import TradingCalendar from '@/components/TradingCalendar'
import Header from '@/components/Header'
import { usePortfolio } from '@/lib/portfolio-context'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'

export default function Home() {
  const { stats, loading } = usePortfolio()
  const { user } = useAuth()

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
        <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg shadow-lg">
          <p className="text-white text-sm">{payload[0].payload.date}</p>
          <p className={`text-sm font-medium ${payload[0].value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Stock Trading Tracker</h1>
          <p className="text-xl text-gray-400 mb-8">Sign in to track your trades and analyze your performance.</p>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-6 text-lg font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Summary Card */}
          <div className="p-6 rounded-lg bg-gray-800 border border-gray-700 shadow-xl hover:shadow-2xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Portfolio Summary</h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                Total Value: <span className="text-white font-medium">${stats.totalValue.toFixed(2)}</span>
              </p>
              <p className="text-gray-300">
                Daily P/L: <span className={`font-medium ${stats.dailyPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.dailyPL.toFixed(2)}
                </span>
              </p>
              <p className="text-gray-300">
                Total P/L: <span className={`font-medium ${stats.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.totalPL.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          {/* Recent Trades Card */}
          <div className="p-6 rounded-lg bg-gray-800 border border-gray-700 shadow-xl hover:shadow-2xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Recent Trades</h2>
            <div className="space-y-2">
              {stats.recentTrades.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent trades</p>
              ) : (
                stats.recentTrades.map((trade: any) => (
                  <div key={trade.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">{trade.symbol}</span>
                      <span className="text-xs text-gray-500">{trade.trade_type}</span>
                    </div>
                    <span className={`${trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.profit_loss.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Metrics Card */}
          <div className="p-6 rounded-lg bg-gray-800 border border-gray-700 shadow-xl hover:shadow-2xl transition-shadow">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Performance Metrics</h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                Win Rate: <span className="text-white font-medium">{stats.winRate.toFixed(1)}%</span>
              </p>
              <p className="text-gray-300">
                Avg. Win: <span className="text-green-400 font-medium">${stats.avgWin.toFixed(2)}</span>
              </p>
              <p className="text-gray-300">
                Avg. Loss: <span className="text-red-400 font-medium">${stats.avgLoss.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Cumulative Gain Chart */}
        <div className="mb-8">
          <div className="p-6 rounded-lg bg-gray-800 border border-gray-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Cumulative Gain</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trading Calendar */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Trading Calendar</h2>
          <div className="bg-gray-800 border border-gray-700 shadow-xl rounded-lg p-6">
            <TradingCalendar />
          </div>
        </div>

        {/* Add Trade Form */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Add New Trade</h2>
          <div className="bg-gray-800 border border-gray-700 shadow-xl rounded-lg p-6">
            <AddTradeForm />
          </div>
        </div>

        {/* Trade History */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-white">Trade History</h2>
          <div className="bg-gray-800 border border-gray-700 shadow-xl rounded-lg">
            <TradeHistory />
          </div>
        </div>
      </div>
    </div>
  )
}
