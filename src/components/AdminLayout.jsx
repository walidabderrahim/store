import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, PhoneOff } from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard',  Icon: LayoutDashboard, label: 'Tableau de bord',        short: 'Accueil'  },
  { to: '/admin/products',   Icon: Package,          label: 'Produits',               short: 'Produits' },
  { to: '/admin/orders',     Icon: ShoppingCart,     label: 'Commandes',              short: 'Commandes'},
  { to: '/admin/abandoned',  Icon: PhoneOff,         label: 'Abandonnées',            short: 'Abandon'  },
  { to: '/admin/settings',   Icon: Settings,         label: 'Paramètres',             short: 'Réglages' },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex w-56 bg-gray-900 text-white flex-col shrink-0">
        <div className="px-5 py-6 border-b border-gray-700">
          <span className="text-lg font-bold tracking-tight">ECOMWEB</span>
          <p className="text-xs text-gray-400 mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(({ to, Icon, label }) => (
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
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-700 z-40 flex">
        {NAV.map(({ to, Icon, short }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs transition-colors ${
                isActive ? 'text-white' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            <span>{short}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs text-gray-500 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Sortir</span>
        </button>
      </nav>
    </div>
  )
}
