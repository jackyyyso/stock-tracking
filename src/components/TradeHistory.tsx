import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trade } from '@/types/supabase'
import { usePortfolio } from '@/lib/portfolio-context'

type DetailsModalProps = {
  trade: Trade
  onClose: () => void
}

function DetailsModal({ trade, onClose }: DetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-card-foreground">
            Trade Details: {trade.symbol}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {trade.chart_url && (
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-2">Chart</h4>
              <div className="relative w-full h-[400px]">
                {/* eslint-disable-next-line */}
                <img
                  src={trade.chart_url}
                  alt="Trade Chart"
                  className="w-full h-full object-contain bg-muted rounded-lg"
                />
              </div>
            </div>
          )}

          {trade.notes && (
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-2">Notes</h4>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-card-foreground whitespace-pre-wrap">{trade.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { refreshData, stats } = usePortfolio()
  const [currentPage, setCurrentPage] = useState(1)
  const tradesPerPage = 10

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
  }, [stats])

  const handleDelete = async (tradeId: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId)

      if (error) throw error

      await Promise.all([
        fetchTrades(),
        refreshData()
      ])
    } catch (error: any) {
      console.error('Error deleting trade:', error)
      setError('Failed to delete trade')
    }
  }

  if (loading) {
    return <div className="text-muted-foreground p-4">Loading trades...</div>
  }

  // Pagination calculations
  const totalPages = Math.ceil(trades.length / tradesPerPage)
  const indexOfLastTrade = currentPage * tradesPerPage
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage
  const currentTrades = trades.slice(indexOfFirstTrade, indexOfLastTrade)

  return (
    <>
      <div className="overflow-x-auto">
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entry Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Exit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">P/L</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {currentTrades.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                  No trades found
                </td>
              </tr>
            ) : (
              currentTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-500 hover:text-blue-600">{trade.symbol}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium">{trade.trade_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">${trade.entry_price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{trade.quantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      trade.profit_loss === null ? 'text-muted-foreground' : 
                      trade.profit_loss >= 0 ? 'text-emerald-500' : 
                      'text-rose-500'
                    }`}>
                      {trade.profit_loss === null ? '-' : `$${trade.profit_loss.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{new Date(trade.entry_date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-4">
                      {(trade.chart_url || trade.notes) && (
                        <button
                          onClick={() => setSelectedTrade(trade)}
                          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                        >
                          Details
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(trade.id)}
                        className="text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-border">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === 1
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-blue-500 hover:text-blue-600'
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === totalPages
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-blue-500 hover:text-blue-600'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedTrade && (
        <DetailsModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}
    </>
  )
} 