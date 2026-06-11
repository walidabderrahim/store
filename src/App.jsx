import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

import StoreFront    from './pages/StoreFront'
import ProductDetail from './pages/ProductDetail'
import Checkout      from './pages/Checkout'
import OrderConfirm  from './pages/OrderConfirm'
import Login        from './pages/admin/Login'
import Dashboard    from './pages/admin/Dashboard'
import Products     from './pages/admin/Products'
import Orders       from './pages/admin/Orders'
import Settings     from './pages/admin/Settings'

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public storefront */}
        <Route path="/"                element={<StoreFront />} />
        <Route path="/product/:id"     element={<ProductDetail />} />
        <Route path="/checkout"        element={<Checkout />} />
        <Route path="/order-confirm"   element={<OrderConfirm />} />

        {/* Admin */}
        <Route path="/admin/login"   element={<Login />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/products"  element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/admin/orders"    element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/admin/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Redirect /admin → /admin/dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
