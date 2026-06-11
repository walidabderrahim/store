import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase, STORE_ID } from '../lib/supabase'
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, PhoneOff } from 'lucide-react'
import { useLang } from '../contexts/LangContext'

const NAV = [
  { to: '/admin/dashboard', Icon: LayoutDashboard, fr: 'Tableau de bord', ar: 'لوحة التحكم',  short_fr: 'Accueil',   short_ar: 'الرئيسية' },
  { to: '/admin/products',  Icon: Package,          fr: 'Produits',        ar: 'المنتجات',      short_fr: 'Produits',  short_ar: 'المنتجات' },
  { to: '/admin/orders',    Icon: ShoppingCart,     fr: 'Commandes',       ar: 'الطلبات',       short_fr: 'Commandes', short_ar: 'الطلبات'  },
  { to: '/admin/abandoned', Icon: PhoneOff,         fr: 'Abandonnées',     ar: 'المتروكة',      short_fr: 'Abandon',   short_ar: 'المتروكة' },
  { to: '/admin/settings',  Icon: Settings,         fr: 'Paramètres',      ar: 'الإعدادات',     short_fr: 'Réglages',  short_ar: 'الإعدادات'},
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const { lang, setLang, t } = useLang()

  const [newOrdersCount,    setNewOrdersCount]    = useState(0)
  const [abandonedCount,    setAbandonedCount]    = useState(0)

  const fetchCounts = async () => {
    const [{ count: ordC }, { count: abC }] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', STORE_ID)
        .or('status.eq.new,status.eq.pending'),
      supabase
        .from('abandoned_orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', STORE_ID)
        .eq('recovered', false),
    ])
    setNewOrdersCount(ordC || 0)
    setAbandonedCount(abC  || 0)
  }

  useEffect(() => {
    fetchCounts()
    const channel = supabase
      .channel('admin-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders',           filter: `store_id=eq.${STORE_ID}` }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'abandoned_orders', filter: `store_id=eq.${STORE_ID}` }, fetchCounts)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const badgeFor = (to) => {
    if (to === '/admin/orders')    return newOrdersCount
    if (to === '/admin/abandoned') return abandonedCount
    return 0
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <div className="min-h-screen flex bg-gray-50" dir={dir}>
      {/* Sidebar — desktop only */}
      <aside className={`hidden lg:flex w-60 bg-gray-900 text-white flex-col shrink-0 ${lang === 'ar' ? 'order-last' : ''}`}>
        <div className="px-5 py-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold tracking-tight">ECOMWEB</span>
            <p className="text-xs text-gray-400 mt-0.5">{t('Admin', 'الإدارة')}</p>
          </div>
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition-colors"
          >
            {lang === 'fr' ? 'عربي' : 'FR'}
          </button>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(({ to, Icon, fr, ar }) => {
            const badge = badgeFor(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                    isActive ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={18} />
                <span className="flex-1">{lang === 'ar' ? ar : fr}</span>
                {badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shrink-0">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            {t('Déconnexion', 'تسجيل الخروج')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-700 z-40 flex" dir="ltr">
        {NAV.map(({ to, Icon, short_fr, short_ar }) => {
          const badge = badgeFor(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors relative ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span>{lang === 'ar' ? short_ar : short_fr}</span>
            </NavLink>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] text-gray-500 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>{t('Sortir', 'خروج')}</span>
        </button>
      </nav>

      {/* Mobile lang toggle */}
      <button
        onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
        className="lg:hidden fixed top-3 right-3 z-50 text-xs bg-gray-800 text-white font-bold px-2.5 py-1.5 rounded-lg shadow"
      >
        {lang === 'fr' ? 'عربي' : 'FR'}
      </button>
    </div>
  )
}
