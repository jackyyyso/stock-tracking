import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type StockData = {
  c: number // close price
  h: number // high
  l: number // low
  o: number // open
  t: number // timestamp
  v: number // volume
}

// Rate limiter configuration
const RATE_LIMIT = 5 // calls per minute
const RATE_LIMIT_WINDOW = 60000 // 1 minute in milliseconds

export default function StockAnalysis() {
  const [symbol, setSymbol] = useState('')
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [apiCalls, setApiCalls] = useState<number[]>([])

  // Calculate remaining calls
  const getRemainingCalls = useCallback(() => {
    const now = Date.now()
    const validCalls = apiCalls.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW)
    return RATE_LIMIT - validCalls.length
  }, [apiCalls])

  // Clean up expired API calls
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setApiCalls(prev => prev.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchStockData = async () => {
    if (!symbol || !date) return
    
    const remaining = getRemainingCalls()
    if (remaining <= 0) {
      setError('API rate limit reached. Please wait a minute before trying again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/5/minute/${date}/${date}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`
      )

      // Update API calls count
      setApiCalls(prev => [...prev, Date.now()])

      const data = await response.json()

      if (data.status === 'ERROR') {
        throw new Error(data.error)
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No data available for this symbol and date')
      }

      setStockData(data.results)
    } catch (error: any) {
      console.error('Error fetching stock data:', error)
      setError(error.message || 'Failed to fetch stock data')
    } finally {
      setLoading(false)
    }
  }

  const chartData = stockData.map(d => ({
    time: new Date(d.t).toLocaleTimeString(),
    price: d.c,
    high: d.h,
    low: d.l,
    volume: d.v
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-card-foreground text-sm font-medium">Time: {payload[0].payload.time}</p>
          <p className="text-card-foreground text-sm">Price: ${payload[0].value.toFixed(2)}</p>
          <p className="text-emerald-500 dark:text-emerald-400 text-sm">High: ${payload[0].payload.high.toFixed(2)}</p>
          <p className="text-rose-500 dark:text-rose-400 text-sm">Low: ${payload[0].payload.low.toFixed(2)}</p>
          <p className="text-muted-foreground text-sm">Volume: {payload[0].payload.volume.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  const remainingCalls = getRemainingCalls()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md bg-background border border-input text-foreground shadow-sm focus:border-primary focus:ring-primary p-2.5"
            placeholder="AAPL"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md bg-background border border-input text-foreground shadow-sm focus:border-primary focus:ring-primary p-2.5"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm text-muted-foreground mb-2">
            API Calls Remaining: <span className={`font-medium ${remainingCalls > 1 ? 'text-emerald-500' : 'text-rose-500'}`}>{remainingCalls}</span>
            <span className="text-xs ml-2">(Resets every minute)</span>
          </div>
          <button
            onClick={fetchStockData}
            disabled={loading || !symbol || remainingCalls <= 0}
            className={`w-full px-6 py-2.5 rounded-md text-primary-foreground font-medium ${
              loading || !symbol || remainingCalls <= 0
                ? 'bg-primary/70 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {stockData.length > 0 && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border border-border shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-primary">Price Chart</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="time"
                    stroke="currentColor"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={CustomTooltip} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground">Current Price</h3>
              <p className="text-2xl font-semibold text-card-foreground">
                ${stockData[stockData.length - 1].c.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground">Day High</h3>
              <p className="text-2xl font-semibold text-emerald-500 dark:text-emerald-400">
                ${Math.max(...stockData.map(d => d.h)).toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground">Day Low</h3>
              <p className="text-2xl font-semibold text-rose-500 dark:text-rose-400">
                ${Math.min(...stockData.map(d => d.l)).toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground">Volume</h3>
              <p className="text-2xl font-semibold text-card-foreground">
                {stockData.reduce((sum, d) => sum + d.v, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 