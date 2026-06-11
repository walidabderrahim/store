import { useState, useEffect } from 'react'
import { supabase, STORE_ID } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { ChevronRight, ShoppingCart } from 'lucide-react'
import OrderRow from '../../components/OrderRow'
import { useLang } from '../../contexts/LangContext'

export default function Orders() {
  const { lang, t } = useLang()
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeFilter, setFilter]   = useState('all')
  const [selected, setSelected]     = useState(null)
  const [orderItems, setOrderItems] = useState([])

  const STATUS_FILTERS = [
    { value: 'all',       label: t('Toutes',      'الكل') },
    { value: 'new',       label: t('Nouveau',     'جديد') },
    { value: 'pending',   label: t('En attente',  'قيد الانتظار') },
    { value: 'confirmed', label: t('Confirmées',  'مؤكدة') },
    { value: 'shipped',   label: t('Expédiées',   'مشحونة') },
    { value: 'delivered', label: t('Livrées',     'تم التوصيل') },
    { value: 'cancelled', label: t('Annulées',    'ملغاة') },
  ]

  const STATUS_LABELS = {
    new:       { label: t('Nouveau',    'جديد'),          classes: 'bg-gray-100 text-gray-600' },
    pending:   { label: t('En attente', 'قيد الانتظار'), classes: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: t('Confirmée',  'مؤكدة'),         classes: 'bg-blue-100 text-blue-700' },
    shipped:   { label: t('Expédiée',   'مشحونة'),        classes: 'bg-purple-100 text-purple-700' },
    delivered: { label: t('Livrée',     'تم التوصيل'),    classes: 'bg-green-100 text-green-700' },
    cancelled: { label: t('Annulée',    'ملغاة'),         classes: 'bg-red-100 text-red-700' },
  }

  const fetchOrders = async () => {
    let q = supabase
      .from('orders')
      .select('*')
      .eq('store_id', STORE_ID)
      .order('created_at', { ascending: false })
    if (activeFilter !== 'all') q = q.eq('status', activeFilter)
    const { data } = await q
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [activeFilter])

  const handleStatusChange = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    fetchOrders()
    if (selected?.id === orderId) setSelected((o) => ({ ...o, status: newStatus }))
  }

  const handleOpenDetail = async (order) => {
    setSelected(order)
    const { data } = await supabase
      .from('order_items')
      .select('*, products(name, image_url)')
      .eq('order_id', order.id)
    setOrderItems(data || [])
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl font-bold text-gray-900 mb-5">{t('Commandes', 'الطلبات')}</h1>

        {/* Filters */}
        <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingCart size={40} className="mx-auto mb-4 text-gray-200" />
            <p>{t('Aucune commande', 'لا توجد طلبات')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm">
            {/* Mobile */}
            <div className="md:hidden divide-y">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => handleOpenDetail(o)}
                  className="p-4 flex items-center gap-3 cursor-pointer active:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-800">{o.customer_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[o.status]?.classes}`}>
                        {STATUS_LABELS[o.status]?.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {o.customer_wilaya} · {new Date(o.created_at).toLocaleDateString('fr-DZ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <p className="font-semibold text-sm">{Number(o.total).toLocaleString('fr-DZ')} DA</p>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">{t('Date',    'التاريخ')}</th>
                    <th className="px-4 py-3 text-left">{t('Client',  'العميل')}</th>
                    <th className="px-4 py-3 text-left">{t('Wilaya',  'الولاية')}</th>
                    <th className="px-4 py-3 text-left">{t('Total',   'الإجمالي')}</th>
                    <th className="px-4 py-3 text-left">{t('Statut',  'الحالة')}</th>
                    <th className="px-4 py-3 text-right">{t('Actions', 'إجراءات')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      statusLabels={STATUS_LABELS}
                      onStatusChange={handleStatusChange}
                      onClick={handleOpenDetail}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">{t('Détail commande', 'تفاصيل الطلب')}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_LABELS[selected.status]?.classes}`}>
                  {STATUS_LABELS[selected.status]?.label}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(selected.created_at).toLocaleString('fr-DZ')}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="font-medium text-gray-500">{t('Nom', 'الاسم')} :</span> {selected.customer_name}</p>
                <p><span className="font-medium text-gray-500">{t('Téléphone', 'الهاتف')} :</span> {selected.customer_phone}</p>
                <p><span className="font-medium text-gray-500">{t('Wilaya', 'الولاية')} :</span> {selected.customer_wilaya}</p>
                <p><span className="font-medium text-gray-500">{t('Adresse', 'العنوان')} :</span> {selected.customer_address}</p>
                {selected.notes && (
                  <p><span className="font-medium text-gray-500">{t('Notes', 'ملاحظات')} :</span> {selected.notes}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('Produits commandés', 'المنتجات المطلوبة')}</p>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {item.products?.image_url ? (
                          <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.products?.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.quantity} × {Number(item.unit_price).toLocaleString('fr-DZ')} DA
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {(item.quantity * item.unit_price).toLocaleString('fr-DZ')} DA
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-4">
                <span>{t('Total', 'الإجمالي')}</span>
                <span>{Number(selected.total).toLocaleString('fr-DZ')} DA</span>
              </div>

              <div className="flex gap-2 flex-wrap">
                {(selected.status === 'new' || selected.status === 'pending') && (
                  <button onClick={() => handleStatusChange(selected.id, 'confirmed')}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                    {t('Confirmer', 'تأكيد')}
                  </button>
                )}
                {selected.status === 'confirmed' && (
                  <button onClick={() => handleStatusChange(selected.id, 'shipped')}
                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
                    {t('Marquer expédiée', 'تم الشحن')}
                  </button>
                )}
                {selected.status === 'shipped' && (
                  <button onClick={() => handleStatusChange(selected.id, 'delivered')}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
                    {t('Marquer livrée', 'تم التوصيل')}
                  </button>
                )}
                {!['delivered', 'cancelled'].includes(selected.status) && (
                  <button onClick={() => handleStatusChange(selected.id, 'cancelled')}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100">
                    {t('Annuler', 'إلغاء')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
