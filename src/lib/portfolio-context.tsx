'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

type PortfolioStats = {
  totalValue: number
  dailyPL: number
  totalPL: number
  winRate: number
  avgWin: number
  avgLoss: number
  recentTrades: any[]
}

type PortfolioContextType = {
  stats: PortfolioStats
  refreshData: () => Promise<void>
  loading: boolean
}

const defaultStats: PortfolioStats = {
  totalValue: 0,
  dailyPL: 0,
  totalPL: 0,
  winRate: 0,
  avgWin: 0,
  avgLoss: 0,
  recentTrades: []
}

const PortfolioContext = createContext<PortfolioContextType>({
  stats: defaultStats,
  refreshData: async () => {},
  loading: true
})

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [stats, setStats] = useState<PortfolioStats>(defaultStats)
  const [loading, setLoading] = useState(true)

  const calculateStats = async () => {
    if (!user) return defaultStats

    try {
      // Fetch all trades
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })

      if (error) throw error

      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

      // Calculate statistics
      let totalPL = 0
      let dailyPL = 0
      let winCount = 0
      let totalWins = 0
      let totalLosses = 0
      let openPositionsValue = 0

      trades.forEach(trade => {
        // Calculate total P/L
        if (trade.profit_loss !== null) {
          totalPL += trade.profit_loss
          if (trade.profit_loss > 0) {
            winCount++
            totalWins += trade.profit_loss
          } else if (trade.profit_loss < 0) {
            totalLosses += Math.abs(trade.profit_loss)
          }
        }

        // Calculate daily P/L
        if (trade.exit_date && trade.exit_date >= startOfDay) {
          dailyPL += trade.profit_loss || 0
        }

        // Calculate open positions value
        if (!trade.exit_price) {
          openPositionsValue += trade.entry_price * trade.quantity
        }
      })

      const totalTrades = trades.filter(t => t.profit_loss !== null).length
      const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0
      const avgWin = winCount > 0 ? totalWins / winCount : 0
      const lossCount = totalTrades - winCount
      const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0

      // Get recent trades (last 5 closed trades)
      const recentTrades = trades
        .filter(t => t.exit_price !== null)
        .slice(0, 5)

      return {
        totalValue: openPositionsValue,
        dailyPL,
        totalPL,
        winRate,
        avgWin,
        avgLoss,
        recentTrades
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
      return defaultStats
    }
  }

  const refreshData = async () => {
    setLoading(true)
    const newStats = await calculateStats()
    setStats(newStats)
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
  }, [user])

  return (
    <PortfolioContext.Provider value={{ stats, refreshData, loading }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export const usePortfolio = () => {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
} 