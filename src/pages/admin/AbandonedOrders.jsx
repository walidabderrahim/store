import { useState, useEffect } from 'react'
import { supabase, STORE_ID } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { PhoneOff, Phone, Trash2, CheckCircle, RefreshCw } from 'lucide-react'

export default function AbandonedOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('abandoned_orders')
      .select('*')
      .eq('store_id', STORE_ID)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const markRecovered = async (id) => {
    await supabase.from('abandoned_orders').update({ recovered: true }).eq('id', id)
    fetch()
  }

  const remove = async (id) => {
    await supabase.from('abandoned_orders').delete().eq('id', id)
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  const pending   = orders.filter((o) => !o.recovered)
  const recovered = orders.filter((o) => o.recovered)

  const formatDate = (d) => {
    const date = new Date(d)
    return date.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commandes abandonnées</h1>
            <p className="text-sm text-gray-400 mt-1">
              Clients qui ont saisi leur numéro mais n'ont pas confirmé la commande
            </p>
          </div>
          <button
            onClick={fetch}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full" />
          </div>
        ) : pending.length === 0 && recovered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <PhoneOff size={40} className="mx-auto mb-4 text-gray-200" />
            <p>Aucune commande abandonnée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* En attente de rappel */}
            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                  <p className="text-sm font-semibold text-gray-700">
                    À rappeler
                    <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {pending.length}
                    </span>
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y">
                    {pending.map((o) => (
                      <div key={o.id} className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                          <PhoneOff size={18} className="text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">
                            {o.customer_name || <span className="text-gray-400 font-normal">Nom inconnu</span>}
                          </p>
                          <a
                            href={`tel:${o.customer_phone}`}
                            className="text-blue-600 font-mono text-sm hover:underline"
                          >
                            {o.customer_phone}
                          </a>
                          {o.product_name && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">Produit : {o.product_name}</p>
                          )}
                          <p className="text-xs text-gray-300 mt-0.5">{formatDate(o.created_at)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <a
                            href={`tel:${o.customer_phone}`}
                            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                          >
                            <Phone size={12} /> Appeler
                          </a>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => markRecovered(o.id)}
                              title="Marquer comme récupéré"
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => remove(o.id)}
                              title="Supprimer"
                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Récupérés */}
            {recovered.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <p className="text-sm font-semibold text-gray-700">
                    Récupérés
                    <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {recovered.length}
                    </span>
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden opacity-60">
                  <div className="divide-y">
                    {recovered.map((o) => (
                      <div key={o.id} className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                          <CheckCircle size={18} className="text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm line-through">
                            {o.customer_name || 'Nom inconnu'}
                          </p>
                          <p className="font-mono text-sm text-gray-500">{o.customer_phone}</p>
                          {o.product_name && (
                            <p className="text-xs text-gray-400 truncate">{o.product_name}</p>
                          )}
                        </div>
                        <button
                          onClick={() => remove(o.id)}
                          className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
