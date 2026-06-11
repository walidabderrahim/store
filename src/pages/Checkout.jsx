import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, STORE_ID } from '../lib/supabase'
import { useStore } from '../hooks/useStore'
import { usePixel } from '../hooks/usePixel'

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','MSila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt',
  'El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma',
  'Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar',
  'Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet',
  'El MGhair','El Meniaa',
]

// Cart is passed via location state from CartDrawer navigation
import { useLocation } from 'react-router-dom'

export default function Checkout() {
  const { store } = useStore()
  const { track } = usePixel(store?.pixel_id)
  const navigate = useNavigate()
  const location = useLocation()

  // Cart items come from location.state if passed, otherwise empty
  const cartItems = location.state?.items || []
  const cartTotal = location.state?.total || 0
  const primaryColor = store?.primary_color || '#111827'

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_wilaya: '',
    customer_address: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Votre panier est vide.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 underline">
          Retour à la boutique
        </button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    track('InitiateCheckout', { value: cartTotal, currency: 'DZD', num_items: cartItems.length })

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{ ...form, store_id: STORE_ID, total: cartTotal }])
      .select()
      .single()

    if (orderErr) {
      setError("Une erreur s'est produite. Veuillez réessayer.")
      setLoading(false)
      return
    }

    const orderItemsPayload = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.qty,
      unit_price: item.price,
    }))

    await supabase.from('order_items').insert(orderItemsPayload)

    track('Purchase', { value: cartTotal, currency: 'DZD', order_id: order.id })

    navigate('/order-confirm', { state: { orderId: order.id, customerName: form.customer_name } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-800">
            ← Retour
          </button>
          <span className="font-bold text-gray-800">{store?.store_name}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Votre commande</h1>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 divide-y">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <span className="text-gray-700">
                {item.name} × {item.qty}
              </span>
              <span className="font-medium">
                {(item.price * item.qty).toLocaleString('fr-DZ')} DA
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-3 font-bold">
            <span>Total</span>
            <span style={{ color: primaryColor }}>{cartTotal.toLocaleString('fr-DZ')} DA</span>
          </div>
        </div>

        {/* Delivery form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Informations de livraison</h2>

          {[
            { name: 'customer_name', label: 'Nom complet', type: 'text', required: true },
            { name: 'customer_phone', label: 'Numéro de téléphone', type: 'tel', required: true },
            { name: 'customer_address', label: 'Adresse complète', type: 'text', required: true },
          ].map(({ name, label, type, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                required={required}
                value={form[name]}
                onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Wilaya</label>
            <select
              required
              value={form.customer_wilaya}
              onChange={(e) => setForm((f) => ({ ...f, customer_wilaya: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white"
            >
              <option value="">Sélectionner une wilaya…</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Notes (optionnel)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
              placeholder="Instructions spéciales…"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 flex items-center gap-2">
            💵 Paiement à la livraison uniquement
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white font-semibold rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? 'Envoi en cours…' : 'Confirmer la commande'}
          </button>
        </form>
      </div>
    </div>
  )
}
