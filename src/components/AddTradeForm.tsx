import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { usePortfolio } from '@/lib/portfolio-context'

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
    chart_image: null as File | null
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    
    if (!user) {
      setError('User not authenticated')
      setIsSubmitting(false)
      return
    }

    try {
      // Upload image if exists
      let chart_url = null
      if (formData.chart_image) {
        try {
          const fileExt = formData.chart_image.name.split('.').pop()
          const fileName = `${user.id}/${Math.random()}.${fileExt}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('trade-charts')
            .upload(fileName, formData.chart_image, {
              upsert: false,
              contentType: formData.chart_image.type
            })

          if (uploadError) {
            console.error('Image upload error:', uploadError)
            throw new Error(`Image upload failed: ${uploadError.message}`)
          }

          // Get the public URL for the uploaded image
          const { data: { publicUrl } } = supabase.storage
            .from('trade-charts')
            .getPublicUrl(fileName)

          chart_url = publicUrl
        } catch (uploadError: any) {
          console.error('Detailed upload error:', uploadError)
          setError(`Image upload failed: ${uploadError.message}`)
          setIsSubmitting(false)
          return
        }
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
          entry_date: new Date().toISOString(),
          exit_date: exit_price ? new Date().toISOString() : null,
          profit_loss,
          chart_url
        }])

      if (insertError) {
        console.error('Trade insert error:', insertError)
        throw new Error(`Failed to add trade: ${insertError.message}`)
      }
      
      // Reset form on success
      setFormData({
        symbol: '',
        entry_price: '',
        exit_price: '',
        quantity: '',
        trade_type: 'LONG',
        notes: '',
        chart_image: null
      })

      // Reset file input
      const fileInput = document.getElementById('chart_image') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Refresh portfolio data
      await refreshData()

    } catch (error: any) {
      console.error('Detailed error:', error)
      setError(error.message || 'Failed to add trade')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400 mb-4">Please sign in to add trades</p>
        <button
          onClick={() => window.location.href = '/auth/signin'}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
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

  const inputClass = "mt-1 block w-full rounded-md bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5"
  const labelClass = "block text-sm font-medium text-gray-200 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">
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

        <div>
          <label className={labelClass}>Chart Image (Optional)</label>
          <input
            id="chart_image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className={`${inputClass} min-h-[100px]`}
          placeholder="Add your trade notes here..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full inline-flex justify-center rounded-md border border-transparent ${
          isSubmitting ? 'bg-indigo-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        } py-3 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors`}
      >
        {isSubmitting ? 'Adding Trade...' : 'Add Trade'}
      </button>
    </form>
  )
} 