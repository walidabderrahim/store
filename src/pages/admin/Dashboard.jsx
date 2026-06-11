import { useState, useEffect } from 'react'
import { supabase, STORE_ID } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { AlertTriangle } from 'lucide-react'
import { useLang } from '../../contexts/LangContext'

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { lang, t } = useLang()
  const [stats, setStats]       = useState({ today: 0, revenue: 0, week: 0 })
  const [lowStock, setLowStock] = useState([])
  const [recent, setRecent]     = useState([])
  const [loading, setLoading]   = useState(true)

  const STATUS_LABELS = {
    new:       t('Nouveau',    'جديد'),
    pending:   t('En attente', 'قيد الانتظار'),
    confirmed: t('Confirmée',  'مؤكدة'),
    shipped:   t('Expédiée',   'مشحونة'),
    delivered: t('Livrée',     'تم التوصيل'),
    cancelled: t('Annulée',    'ملغاة'),
  }

  useEffect(() => {
    const load = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      const weekAgo  = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekISO  = weekAgo.toISOString()

      const [{ data: ordersToday }, { data: ordersWeek }, { data: products }, { data: recentOrders }] =
        await Promise.all([
          supabase.from('orders').select('total').eq('store_id', STORE_ID).gte('created_at', todayISO).neq('status', 'cancelled'),
          supabase.from('orders').select('id').eq('store_id', STORE_ID).gte('created_at', weekISO).neq('status', 'cancelled'),
          supabase.from('products').select('id, name, stock').eq('store_id', STORE_ID).eq('stock', 0),
          supabase.from('orders').select('*').eq('store_id', STORE_ID).order('created_at', { ascending: false }).limit(5),
        ])

      setStats({
        today:   (ordersToday || []).length,
        revenue: (ordersToday || []).reduce((s, o) => s + Number(o.total), 0),
        week:    (ordersWeek  || []).length,
      })
      setLowStock(products     || [])
      setRecent(recentOrders   || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl font-bold text-gray-900">{t('Tableau de bord', 'لوحة التحكم')}</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label={t("Commandes aujourd'hui", 'طلبات اليوم')}        value={stats.today} color="text-blue-600" />
              <StatCard label={t("CA aujourd'hui",        'مبيعات اليوم')}        value={`${stats.revenue.toLocaleString('fr-DZ')} DA`} color="text-green-600" />
              <StatCard label={t('Commandes cette semaine', 'طلبات هذا الأسبوع')} value={stats.week} />
            </div>

            {lowStock.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-red-600 shrink-0" />
                  <h2 className="font-semibold text-red-700">
                    {t(`Rupture de stock (${lowStock.length})`, `نفاد المخزون (${lowStock.length})`)}
                  </h2>
                </div>
                <ul className="space-y-1">
                  {lowStock.map((p) => (
                    <li key={p.id} className="text-sm text-red-600">• {p.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-800">{t('Dernières commandes', 'آخر الطلبات')}</h2>
              </div>

              {recent.length === 0 ? (
                <p className="text-center text-gray-400 py-10">{t("Aucune commande pour l'instant", 'لا توجد طلبات حتى الآن')}</p>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="md:hidden divide-y">
                    {recent.map((o) => (
                      <div key={o.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{o.customer_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {o.customer_wilaya} · {new Date(o.created_at).toLocaleDateString('fr-DZ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{Number(o.total).toLocaleString('fr-DZ')} DA</p>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop */}
                  <table className="hidden md:table w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">{t('Client',  'العميل')}</th>
                        <th className="px-6 py-3 text-left">{t('Wilaya',  'الولاية')}</th>
                        <th className="px-6 py-3 text-left">{t('Total',   'الإجمالي')}</th>
                        <th className="px-6 py-3 text-left">{t('Statut',  'الحالة')}</th>
                        <th className="px-6 py-3 text-left">{t('Date',    'التاريخ')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recent.map((o) => (
                        <tr key={o.id} className="text-sm">
                          <td className="px-6 py-3 font-medium">{o.customer_name}</td>
                          <td className="px-6 py-3 text-gray-500">{o.customer_wilaya}</td>
                          <td className="px-6 py-3">{Number(o.total).toLocaleString('fr-DZ')} DA</td>
                          <td className="px-6 py-3">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {STATUS_LABELS[o.status] || o.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-400">
                            {new Date(o.created_at).toLocaleDateString('fr-DZ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
