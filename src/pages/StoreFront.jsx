import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ShoppingCart, MessageCircle, Truck,
  Banknote, ShieldCheck, ChevronRight, ChevronLeft,
  Package, Tag, Phone, RefreshCw
} from 'lucide-react'
import { supabase, STORE_ID } from '../lib/supabase'
import { useStore } from '../hooks/useStore'
import { useCart } from '../hooks/useCart'
import { usePixel } from '../hooks/usePixel'
import { useTikTokPixel } from '../hooks/useTikTokPixel'
import ProductCard from '../components/ProductCard'
import CartDrawer from '../components/CartDrawer'

const DEMO_PRODUCTS = [
  {
    id: 'd1', name: 'سماعات قيمنق احترافية',
    description: 'سماعات Gaming بصوت محيطي 7.1، مايكروفون قابل للسحب، مريحة للاستخدام الطويل',
    price: 4500, compare_price: 7000,
    stock: 12, category: 'سماعات', is_active: true,
    image_url: '/prod1.jpg', images: ['/prod1.jpg'], variants: { colors: [], sizes: [] },
  },
  {
    id: 'd2', name: 'فأرة قيمنق RGB احترافية',
    description: 'فأرة Gaming بإضاءة RGB، 7 أزرار قابلة للبرمجة، دقة 12400 DPI',
    price: 2800, compare_price: 4200,
    stock: 20, category: 'فئران', is_active: true,
    image_url: '/prod2.jpg', images: ['/prod2.jpg'], variants: { colors: [], sizes: [] },
  },
  {
    id: 'd3', name: 'فأرة Logitech G Pro لاسلكية',
    description: 'فأرة محترفة بتقنية LIGHTSPEED اللاسلكية، خفيفة الوزن، بطارية تدوم 60 ساعة',
    price: 5200, compare_price: 7500,
    stock: 8, category: 'فئران', is_active: true,
    image_url: '/prod3.jpg', images: ['/prod3.jpg'], variants: { colors: [], sizes: [] },
  },
  {
    id: 'd4', name: 'كيبورد قيمنق RGB Spirit of Gamer',
    description: 'لوحة مفاتيح Gaming بإضاءة RGB كاملة، مفاتيح ميكانيكية هاجيز، مقاومة للماء',
    price: 3800, compare_price: 5500,
    stock: 15, category: 'كيبوردات', is_active: true,
    image_url: '/prod4.jpg', images: ['/prod4.jpg'], variants: { colors: [], sizes: [] },
  },
  {
    id: 'd5', name: 'كيبورد ميكانيكي 65% كومباكت',
    description: 'كيبورد ميكانيكي كومباكت بإضاءة RGB، مفاتيح تكتايل، مثالي للمكتب والقيمنق',
    price: 4200, compare_price: 6000,
    stock: 10, category: 'كيبوردات', is_active: true,
    image_url: '/prod5.jpg', images: ['/prod5.jpg'], variants: { colors: [], sizes: [] },
  },
  {
    id: 'd6', name: 'شاشة قيمنق 27″ 165Hz IPS',
    description: 'شاشة Gaming بدقة QHD 2560×1440، تردد 165Hz، وقت استجابة 1ms، ألوان نابضة',
    price: 42000, compare_price: 55000,
    stock: 5, category: 'شاشات', is_active: true,
    image_url: '/prod6.jpg', images: ['/prod6.jpg'], variants: { colors: [], sizes: [] },
  },
  {
    id: 'd7', name: 'شاشة قيمنق 24″ 144Hz',
    description: 'شاشة Gaming بدقة FHD 1920×1080، تردد 144Hz، حافة رفيعة، مثالية للتنافسي',
    price: 28000, compare_price: 36000,
    stock: 7, category: 'شاشات', is_active: true,
    image_url: '/prod7.jpg', images: ['/prod7.jpg'], variants: { colors: [], sizes: [] },
  },
  {
    id: 'd8', name: 'باور بانك 30000mAh 22.5W',
    description: 'بطارية محمولة بقدرة 30000mAh، شحن سريع 22.5W، منفذ USB-C وUSB-A',
    price: 3500, compare_price: 5000,
    stock: 25, category: 'اكسسوارات', is_active: true,
    image_url: '/prod8.jpg', images: ['/prod8.jpg'], variants: { colors: [], sizes: [] },
  },
]

const CAT_IMAGES = {
  'سماعات':    '/prod1.jpg',
  'فئران':     '/prod2.jpg',
  'كيبوردات':  '/prod4.jpg',
  'شاشات':     '/prod6.jpg',
  'اكسسوارات': '/prod8.jpg',
}

const TRUST_BADGES = [
  { Icon: Banknote,   title: 'الدفع عند الاستلام', sub: 'COD فقط — بدون دفع مسبق' },
  { Icon: Truck,      title: 'توصيل سريع',          sub: 'لجميع ولايات الجزائر' },
  { Icon: RefreshCw,  title: 'ضمان الجودة',          sub: 'استرداد المال في حال المشكل' },
]

export default function StoreFront() {
  const { store } = useStore()
  const { items, addItem, removeItem, updateQty, total, count } = useCart()
  const { track }   = usePixel(store?.pixel_id)
  const { track: trackTT } = useTikTokPixel(store?.tiktok_pixel_id)

  const [products, setProducts]     = useState(DEMO_PRODUCTS)
  const [categories, setCategories] = useState([...new Set(DEMO_PRODUCTS.map(p => p.category))])
  const [activeCategory, setActive] = useState('الكل')
  const [cartOpen, setCartOpen]     = useState(false)
  const [search, setSearch]         = useState('')
  const productsRef = useRef(null)
  const catRef      = useRef(null)

  const primary  = store?.primary_color || '#EA580C'
  const logoSrc  = store?.logo_url || '/logo.png'

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('store_id', STORE_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data?.length > 0) {
          setProducts(data)
          setCategories([...new Set(data.map(p => p.category).filter(Boolean))])
        }
      })
  }, [])

  const handleAddToCart = (product) => {
    addItem(product)
    track('AddToCart', { content_name: product.name, value: product.price, currency: 'DZD' })
    trackTT('AddToCart', { content_id: product.id, content_name: product.name, value: product.price, currency: 'DZD' })
    setCartOpen(true)
  }

  const filtered = products.filter(p => {
    const matchCat    = activeCategory === 'الكل' || p.category === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const scrollCat = (dir) => {
    catRef.current?.scrollBy({ left: dir === 'next' ? -160 : 160, behavior: 'smooth' })
  }

  return (
    <div dir="rtl" className="font-arabic min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-3">

          {/* Right: Logo + Store name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="rounded-xl p-1.5 h-12 w-12 flex items-center justify-center shadow-sm border border-gray-100">
              <img
                src={logoSrc}
                alt={store?.store_name}
                className="h-full w-full object-contain"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
            <span className="font-black text-gray-800 text-sm leading-tight hidden sm:block max-w-[110px] line-clamp-2">
              {store?.store_name}
            </span>
          </div>

          {/* Center: Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="إبحث عن منتجك..."
              className="w-full bg-gray-100 text-gray-800 placeholder-gray-400 rounded-full pr-10 pl-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 transition"
              style={{ '--tw-ring-color': primary + '50' }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
          </div>

          {/* Left: WhatsApp + Cart */}
          <div className="flex items-center gap-2.5 shrink-0">
            {store?.whatsapp_number && (
              <a
                href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-full transition"
              >
                <MessageCircle size={14} />
                واتساب
              </a>
            )}
            <button onClick={() => setCartOpen(true)} className="relative p-1.5 text-gray-600 hover:text-violet-600 transition">
              <ShoppingCart size={22} />
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black"
                  style={{ backgroundColor: primary }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="bg-white">
        <div className="relative overflow-hidden">
          <img
            src="/banner1.png"
            alt={store?.store_name}
            className="w-full object-cover block"
            style={{ maxHeight: '480px' }}
          />
        </div>
        <div className="flex justify-center py-5">
          <button
            onClick={() => productsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="px-12 py-3.5 text-white font-black text-base rounded-full shadow-xl hover:opacity-90 transition"
            style={{ background: `linear-gradient(135deg, ${primary}, #A78BFA)` }}
          >
            تسوق الآن
          </button>
        </div>
      </div>

      {/* ── Trust badges strip ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100">
          {TRUST_BADGES.map(({ Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-1.5 px-3 text-center">
              <Icon size={20} style={{ color: primary }} />
              <p className="text-xs font-black text-gray-800">{title}</p>
              <p className="text-[10px] text-gray-400 hidden md:block">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <div className="bg-white py-8 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div className="h-px flex-1 bg-gray-200" />
              <h2 className="text-xl font-black text-gray-800 mx-4 flex items-center gap-2">
                <Tag size={18} style={{ color: primary }} />
                أقسام المتجر
              </h2>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="relative flex items-center">
              <button
                onClick={() => scrollCat('prev')}
                className="absolute right-0 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-sm transition"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => scrollCat('next')}
                className="absolute left-0 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-sm transition"
              >
                <ChevronLeft size={18} />
              </button>

              <div ref={catRef} className="flex gap-5 overflow-x-auto scrollbar-hide px-12 w-full">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActive(cat); productsRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="flex flex-col items-center gap-2 shrink-0 group"
                  >
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all shadow-sm group-hover:shadow-md"
                      style={{ borderColor: activeCategory === cat ? primary : '#e5e7eb' }}
                    >
                      {CAT_IMAGES[cat]
                        ? <img src={CAT_IMAGES[cat]} alt={cat} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><Package size={28} /></div>
                      }
                    </div>
                    <span
                      className="text-xs font-bold whitespace-nowrap transition-colors"
                      style={{ color: activeCategory === cat ? primary : '#6b7280' }}
                    >
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Products ── */}
      <div ref={productsRef} className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-xl font-black text-gray-800">
            {activeCategory === 'الكل' ? 'جميع المنتجات' : activeCategory}
            <span className="text-sm font-normal text-gray-400 mr-2">({filtered.length})</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {['الكل', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 border"
                style={
                  activeCategory === cat
                    ? { backgroundColor: primary, color: '#fff', borderColor: primary }
                    : { backgroundColor: '#fff', color: '#374151', borderColor: '#e5e7eb' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-300">
            <Package size={64} strokeWidth={1} className="mx-auto mb-4" />
            <p className="text-gray-400 font-bold">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                primaryColor={primary}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 mt-4 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="border border-gray-100 rounded-2xl p-2 h-16 w-16 mx-auto mb-3 flex items-center justify-center shadow-sm">
            <img
              src={logoSrc}
              alt={store?.store_name}
              className="h-full w-full object-contain"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
          <p className="font-black text-gray-800 text-base mb-1">{store?.store_name}</p>
          <p className="text-gray-400 text-xs mb-5">الدفع عند الاستلام · توصيل لجميع ولايات الجزائر</p>
          <div className="flex justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5" style={{ color: primary }}><Banknote size={13} /><span className="text-gray-500">COD فقط</span></span>
            <span className="flex items-center gap-1.5" style={{ color: primary }}><Truck size={13} /><span className="text-gray-500">توصيل سريع</span></span>
            <span className="flex items-center gap-1.5" style={{ color: primary }}><ShieldCheck size={13} /><span className="text-gray-500">ضمان الجودة</span></span>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp FAB (mobile only) ── */}
      {store?.whatsapp_number && (
        <a
          href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="sm:hidden fixed bottom-6 left-4 bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:bg-green-700 z-40 transition"
        >
          <MessageCircle size={24} />
        </a>
      )}

      {cartOpen && (
        <CartDrawer
          items={items}
          total={total}
          primaryColor={primary}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeItem}
        />
      )}
    </div>
  )
}
