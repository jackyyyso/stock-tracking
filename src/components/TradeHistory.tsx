import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trade } from '@/types/supabase'
import Image from 'next/image'
import { usePortfolio } from '@/lib/portfolio-context'

type CloseTradeModalProps = {
  trade: Trade
  onClose: () => void
  onSubmit: (exitPrice: number) => Promise<void>
}

function CloseTradeModal({ trade, onClose, onSubmit }: CloseTradeModalProps) {
  const [exitPrice, setExitPrice] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const price = parseFloat(exitPrice)
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid exit price')
      setIsSubmitting(false)
      return
    }

    try {
      await onSubmit(price)
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">Close Trade: {trade.symbol}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Exit Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="w-full rounded-md bg-gray-700 border border-gray-600 text-white p-2.5 focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isSubmitting ? 'bg-indigo-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Closing...' : 'Close Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type ImageModalProps = {
  imageUrl: string
  onClose: () => void
}

function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* eslint-disable-next-line */}
        <img
          src={imageUrl}
          alt="Trade Chart"
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

export default function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { refreshData } = usePortfolio()

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('entry_date', { ascending: false })

      if (error) throw error
      
      setTrades(data || [])
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [])

  const handleCloseTrade = async (trade: Trade, exitPrice: number) => {
    try {
      const profit_loss = trade.trade_type === 'LONG'
        ? (exitPrice - trade.entry_price) * trade.quantity
        : (trade.entry_price - exitPrice) * trade.quantity

      const { error } = await supabase
        .from('trades')
        .update({
          exit_price: exitPrice,
          exit_date: new Date().toISOString(),
          profit_loss
        })
        .eq('id', trade.id)

      if (error) throw error

      // Refresh trades and portfolio data
      await Promise.all([
        fetchTrades(),
        refreshData()
      ])
    } catch (error: any) {
      console.error('Error closing trade:', error)
      throw new Error('Failed to close trade')
    }
  }

  if (loading) {
    return <div className="text-gray-400 p-4">Loading trades...</div>
  }

  return (
    <>
      <div className="overflow-x-auto">
        {error && (
          <div className="bg-destructive/50 border border-destructive text-destructive-foreground px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entry Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Exit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">P/L</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {trades.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                  No trades found
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{trade.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">{trade.trade_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">${trade.entry_price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">{trade.quantity}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    trade.profit_loss === null ? 'text-muted-foreground' : trade.profit_loss >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                  }`}>
                    {trade.profit_loss === null ? '-' : `$${trade.profit_loss.toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {new Date(trade.entry_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">
                    <div className="space-y-2">
                      {trade.chart_url && (
                        <div>
                          <button
                            onClick={() => setSelectedImage(trade.chart_url)}
                            className="text-primary hover:text-primary/80"
                          >
                            [Chart]
                          </button>
                        </div>
                      )}
                      {trade.notes && (
                        <div>
                          <span className="text-muted-foreground">[Note]</span>
                          <p className="text-sm text-card-foreground mt-1">{trade.notes}</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
} 