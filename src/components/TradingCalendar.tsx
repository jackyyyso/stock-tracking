import { useState, useEffect, useMemo } from 'react'
import Calendar from 'react-calendar'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import 'react-calendar/dist/Calendar.css'

type Trade = {
  id: string
  symbol: string
  trade_type: string
  profit_loss: number | null
  entry_price: number
  exit_price: number | null
  quantity: number
  entry_date: string
  exit_date: string | null
}

type DayStats = {
  trades: Trade[]
  totalPL: number
  winCount: number
  lossCount: number
}

type CalendarData = {
  [date: string]: DayStats
}

type ChartData = {
  date: string
  value: number
}

type TradeMetrics = {
  avgWin: number
  avgLoss: number
  avgGainPercent: number
  avgLossPercent: number
  biggestProfit: number
  biggestLoss: number
  biggestGainPercent: number
  biggestLossPercent: number
}

type WeeklyStats = {
  [weekStart: string]: {
    totalPL: number
    tradeCount: number
  }
}

export default function TradingCalendar() {
  const { user } = useAuth()
  const [value, setValue] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData>({})
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<TradeMetrics>({
    avgWin: 0,
    avgLoss: 0,
    avgGainPercent: 0,
    avgLossPercent: 0,
    biggestProfit: 0,
    biggestLoss: 0,
    biggestGainPercent: 0,
    biggestLossPercent: 0
  })
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({})

  const chartData = useMemo(() => {
    const dates = Object.keys(calendarData).sort()
    let cumulative = 0
    return dates.map(date => {
      cumulative += calendarData[date].totalPL
      return {
        date: format(parseISO(date), 'MMM d'),
        value: cumulative
      }
    })
  }, [calendarData])

  useEffect(() => {
    if (user) {
      fetchTradeData()
    }
  }, [user])

  const calculateMetrics = (trades: Trade[]) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Filter trades for current month only
    const monthlyTrades = trades.filter(t => {
      if (!t.exit_date) return false
      const exitDate = new Date(t.exit_date)
      return exitDate >= startOfMonth && exitDate <= endOfMonth
    })

    const closedTrades = monthlyTrades.filter(t => t.exit_price !== null && t.profit_loss !== null)
    
    const winningTrades = closedTrades.filter(t => t.profit_loss! > 0)
    const losingTrades = closedTrades.filter(t => t.profit_loss! < 0)

    const calculatePercentage = (trade: Trade) => {
      const entryValue = trade.entry_price * trade.quantity
      return ((trade.profit_loss || 0) / entryValue) * 100
    }

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.profit_loss!, 0) / winningTrades.length
      : 0

    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + t.profit_loss!, 0) / losingTrades.length
      : 0

    const tradePercentages = closedTrades.map(calculatePercentage)
    const winPercentages = winningTrades.map(calculatePercentage)
    const lossPercentages = losingTrades.map(calculatePercentage)

    const avgGainPercent = winPercentages.length > 0
      ? winPercentages.reduce((sum, p) => sum + p, 0) / winPercentages.length
      : 0

    const avgLossPercent = lossPercentages.length > 0
      ? lossPercentages.reduce((sum, p) => sum + p, 0) / lossPercentages.length
      : 0

    return {
      avgWin,
      avgLoss,
      avgGainPercent,
      avgLossPercent,
      biggestProfit: Math.max(...winningTrades.map(t => t.profit_loss!), 0),
      biggestLoss: Math.min(...losingTrades.map(t => t.profit_loss!), 0),
      biggestGainPercent: Math.max(...tradePercentages, 0),
      biggestLossPercent: Math.min(...tradePercentages, 0)
    }
  }

  const calculateWeeklyStats = (tradesByDate: CalendarData) => {
    const weeklyData: WeeklyStats = {}
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    Object.entries(tradesByDate).forEach(([dateStr, dayData]) => {
      const date = parseISO(dateStr)
      // Skip if not in current month
      if (date < startOfMonth || date > endOfMonth) return

      const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      
      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { totalPL: 0, tradeCount: 0 }
      }
      
      weeklyData[weekStart].totalPL += dayData.totalPL
      weeklyData[weekStart].tradeCount += dayData.trades.length
    })

    return weeklyData
  }

  const fetchTradeData = async () => {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('exit_date', { ascending: true })

      if (error) throw error

      const tradesByDate: CalendarData = {}
      
      trades.forEach((trade: Trade) => {
        if (trade.exit_date && trade.profit_loss !== null) {
          const exitDate = format(new Date(trade.exit_date), 'yyyy-MM-dd')
          if (!tradesByDate[exitDate]) {
            tradesByDate[exitDate] = { trades: [], totalPL: 0, winCount: 0, lossCount: 0 }
          }
          tradesByDate[exitDate].trades.push(trade)
          tradesByDate[exitDate].totalPL += trade.profit_loss
          if (trade.profit_loss > 0) {
            tradesByDate[exitDate].winCount++
          } else if (trade.profit_loss < 0) {
            tradesByDate[exitDate].lossCount++
          }
        }
      })

      setCalendarData(tradesByDate)
      setWeeklyStats(calculateWeeklyStats(tradesByDate))
      setMetrics(calculateMetrics(trades))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trade data:', error)
      setLoading(false)
    }
  }

  const handleDateChange = (newValue: any) => {
    if (!newValue) return
    setValue(newValue)
    const selectedDate = format(newValue, 'yyyy-MM-dd')
    setSelectedDayTrades(calendarData[selectedDate]?.trades || [])
  }

  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = calendarData[dateStr]

    if (!dayData?.trades.length) return null

    return (
      <div className="text-[10px] flex flex-col items-center">
        <div className={`font-semibold ${dayData.totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          ${dayData.totalPL.toFixed(0)}
        </div>
      </div>
    )
  }

  const tileDisabled = ({ date }: { date: Date }) => {
    return isWeekend(date)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1f2e] border border-[#2d3548] p-2 rounded-lg shadow-lg">
          <p className="text-white text-sm">{payload[0].payload.date}</p>
          <p className={`text-sm font-medium ${payload[0].value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <div className="text-gray-400">Loading calendar...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1f2e] rounded-lg p-4 border border-[#2d3548]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Avg Win</h4>
              <p className="text-emerald-400 font-semibold">${metrics.avgWin.toFixed(2)}</p>
            </div>
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Avg Loss</h4>
              <p className="text-rose-400 font-semibold">${metrics.avgLoss.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1f2e] rounded-lg p-4 border border-[#2d3548]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Avg % Gain</h4>
              <p className="text-emerald-400 font-semibold">{metrics.avgGainPercent.toFixed(2)}%</p>
            </div>
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Avg % Loss</h4>
              <p className="text-rose-400 font-semibold">{metrics.avgLossPercent.toFixed(2)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1f2e] rounded-lg p-4 border border-[#2d3548]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Best</h4>
              <p className="text-emerald-400 font-semibold">${metrics.biggestProfit.toFixed(2)}</p>
            </div>
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Worst</h4>
              <p className="text-rose-400 font-semibold">${metrics.biggestLoss.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1f2e] rounded-lg p-4 border border-[#2d3548]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Best %</h4>
              <p className="text-emerald-400 font-semibold">{metrics.biggestGainPercent.toFixed(2)}%</p>
            </div>
            <div>
              <h4 className="text-gray-400 text-sm">Monthly Worst %</h4>
              <p className="text-rose-400 font-semibold">{metrics.biggestLossPercent.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
        <div>
          <div className="calendar-container">
            <style jsx global>{`
              .react-calendar {
                width: 100%;
                background-color: #1a1f2e;
                border: 1px solid #2d3548;
                border-radius: 1rem;
                color: #e5e7eb;
                padding: 1rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              }
              .react-calendar__navigation {
                margin-bottom: 0.5rem;
              }
              .react-calendar__navigation button {
                min-width: 44px;
                background: none;
                font-size: 14px;
                color: #e5e7eb;
              }
              .react-calendar__navigation button:disabled {
                background-color: #1a1f2e;
                opacity: 0.5;
              }
              .react-calendar__navigation button:enabled:hover,
              .react-calendar__navigation button:enabled:focus {
                background-color: #2d3548;
                border-radius: 0.5rem;
              }
              .react-calendar__month-view__weekdays {
                text-align: center;
                text-transform: uppercase;
                font-size: 0.7em;
                font-weight: bold;
                color: #9ca3af;
                padding: 0.25rem 0;
                display: grid !important;
                grid-template-columns: repeat(5, 1fr);
              }
              .react-calendar__month-view__weekdays__weekday {
                padding: 0.25rem;
                text-decoration: none;
              }
              .react-calendar__month-view__weekdays__weekday abbr {
                text-decoration: none;
                cursor: default;
              }
              .react-calendar__month-view__weekdays__weekday:nth-child(6),
              .react-calendar__month-view__weekdays__weekday:nth-child(7) {
                display: none;
              }
              .react-calendar__month-view__days__day--weekend {
                display: none;
              }
              .react-calendar__tile {
                padding: 0.5em 0.25em;
                height: 70px;
                font-size: 0.8rem;
                color: #e5e7eb;
                border: 1px solid #2d3548;
              }
              .react-calendar__tile:enabled:hover,
              .react-calendar__tile:enabled:focus {
                background-color: #2d3548;
                border-radius: 0.5rem;
              }
              .react-calendar__tile--now {
                background-color: #374151;
                border-radius: 0.5rem;
              }
              .react-calendar__tile--active {
                background-color: #4338ca !important;
                border-radius: 0.5rem;
              }
              .react-calendar__tile--active:enabled:hover,
              .react-calendar__tile--active:enabled:focus {
                background-color: #4338ca;
              }
              .react-calendar__tile:disabled {
                display: none;
              }
              .react-calendar__month-view__days {
                display: grid !important;
                grid-template-columns: repeat(5, 1fr);
              }
            `}</style>
            <Calendar
              onChange={handleDateChange}
              value={value}
              tileContent={tileContent}
              tileDisabled={tileDisabled}
              className="rounded-lg shadow-xl"
            />
          </div>

          {selectedDayTrades.length > 0 && (
            <div className="bg-[#1a1f2e] rounded-lg p-4 mt-4 border border-[#2d3548] shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-3">
                Trades on {format(value as Date, 'MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {selectedDayTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex justify-between items-center p-3 bg-[#2d3548] rounded-lg hover:bg-[#374151] transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-indigo-400 font-medium">{trade.symbol}</span>
                      <span className="text-gray-400 text-xs">{trade.trade_type}</span>
                    </div>
                    {trade.profit_loss !== null && (
                      <span className={`font-medium ${
                        trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        ${trade.profit_loss.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="bg-[#1a1f2e] rounded-lg p-4 border border-[#2d3548] shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Weekly Gains</h3>
            <div className="space-y-3">
              {Object.entries(weeklyStats)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([weekStart, stats]) => {
                  const weekEnd = format(endOfWeek(parseISO(weekStart), { weekStartsOn: 1 }), 'MMM d')
                  const weekStartFormatted = format(parseISO(weekStart), 'MMM d')
                  return (
                    <div
                      key={weekStart}
                      className="flex justify-between items-center p-3 bg-[#2d3548] rounded-lg"
                    >
                      <div className="flex flex-col">
                        <span className="text-gray-300 text-sm">
                          {weekStartFormatted} - {weekEnd}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {stats.tradeCount} trades
                        </span>
                      </div>
                      <span className={`font-medium ${
                        stats.totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        ${stats.totalPL.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 