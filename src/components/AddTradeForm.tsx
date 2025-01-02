import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { usePortfolio } from '@/lib/portfolio-context'
import { format } from 'date-fns'

export default function AddTradeForm() {
  const { user } = useAuth()
  const { refreshData } = usePortfolio()
  const [formData, setFormData] = useState({
    symbol: '',
    entry_price: '',
    exit_price: '',
    quantity: '',
    trade_type: 'LONG',
    notes: '',
    chart_image: null as File | null,
    entry_date: format(new Date(), 'yyyy-MM-dd')
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!user) {
      setError('Please sign in to add trades')
      setIsSubmitting(false)
      return
    }

    try {
      let chart_url = null

      // Upload image if provided
      if (formData.chart_image) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trade-charts')
          .upload(`${user.id}/${Date.now()}-${formData.chart_image.name}`, formData.chart_image)

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('trade-charts')
          .getPublicUrl(uploadData.path)

        chart_url = publicUrl
      }

      // Validate numeric fields
      const entry_price = parseFloat(formData.entry_price)
      const exit_price = formData.exit_price ? parseFloat(formData.exit_price) : null
      const quantity = parseInt(formData.quantity)

      if (isNaN(entry_price)) {
        setError('Invalid entry price')
        setIsSubmitting(false)
        return
      }

      if (formData.exit_price && isNaN(exit_price!)) {
        setError('Invalid exit price')
        setIsSubmitting(false)
        return
      }

      if (isNaN(quantity)) {
        setError('Invalid quantity')
        setIsSubmitting(false)
        return
      }

      // Calculate P/L if both prices are available
      let profit_loss = null
      if (exit_price) {
        profit_loss = formData.trade_type === 'LONG'
          ? (exit_price - entry_price) * quantity
          : (entry_price - exit_price) * quantity
      }

      // Insert trade data
      const { data, error: insertError } = await supabase
        .from('trades')
        .insert([{
          user_id: user.id,
          symbol: formData.symbol.toUpperCase(),
          entry_price,
          exit_price,
          quantity,
          trade_type: formData.trade_type,
          notes: formData.notes,
          entry_date: formData.entry_date,
          exit_date: exit_price ? new Date().toISOString() : null,
          profit_loss,
          chart_url
        }])

      if (insertError) {
        throw new Error(`Error adding trade: ${insertError.message}`)
      }

      // Refresh portfolio data immediately
      await refreshData()

      // Reset form after successful refresh
      setFormData({
        symbol: '',
        entry_price: '',
        exit_price: '',
        quantity: '',
        trade_type: 'LONG',
        notes: '',
        chart_image: null,
        entry_date: format(new Date(), 'yyyy-MM-dd')
      })

    } catch (error: any) {
      console.error('Error adding trade:', error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-4">Please sign in to add trades</p>
        <button
          onClick={() => window.location.href = '/auth/signin'}
          className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors"
        >
          Sign In
        </button>
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, chart_image: e.target.files[0] })
    }
  }

  const inputClass = "mt-1 block w-full rounded-md bg-background border border-input text-foreground shadow-sm focus:border-primary focus:ring-primary p-2.5"
  const labelClass = "block text-sm font-medium text-card-foreground mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/50 border border-destructive text-destructive-foreground px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Symbol</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            className={inputClass}
            placeholder="AAPL"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Trade Type</label>
          <select
            value={formData.trade_type}
            onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
            className={inputClass}
          >
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Entry Date</label>
          <input
            type="date"
            value={formData.entry_date}
            onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
            className={`${inputClass} dark:[color-scheme:dark] [color-scheme:light]`}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Entry Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.entry_price}
            onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
            className={inputClass}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Exit Price (Optional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.exit_price}
            onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
            className={inputClass}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className={labelClass}>Quantity</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className={inputClass}
            placeholder="100"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Chart Image (Optional)</label>
          <input
            id="chart_image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer`}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={`${inputClass} min-h-[100px]`}
            placeholder="Add your trade notes here..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-md text-primary-foreground font-medium ${
            isSubmitting
              ? 'bg-primary/70 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isSubmitting ? 'Adding Trade...' : 'Add Trade'}
        </button>
      </div>
    </form>
  )
} 