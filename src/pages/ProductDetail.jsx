import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight, ShoppingCart, ChevronRight, ChevronLeft,
  User, Phone, MapPin, Home, Building2,
  Plus, Minus, Truck, Loader2, CheckCircle,
  MessageCircle, Package, Banknote, ShieldCheck, RefreshCw
} from 'lucide-react'
import { supabase, STORE_ID } from '../lib/supabase'
import { useStore } from '../hooks/useStore'
import { usePixel } from '../hooks/usePixel'
import { useTikTokPixel } from '../hooks/useTikTokPixel'
import { useCart } from '../hooks/useCart'
import { WILAYA_NAMES, getCommunes } from '../data/wilayas'

const phoneRegex = /^(05|06|07)\d{8}$/

export default function ProductDetail() {
  const { id }    = useParams()
  const { state } = useLocation()
  const navigate  = useNavigate()
  const { store } = useStore()
  const { track }   = usePixel(store?.pixel_id)
  const { track: trackTT } = useTikTokPixel(store?.tiktok_pixel_id)
  const { count } = useCart()

  const primary  = store?.primary_color || '#EA580C'
  const logoSrc  = store?.logo_url || '/logo.png'

  const [product, setProduct] = useState(state?.product || null)
  const [imgIdx, setImgIdx]   = useState(0)
  const formRef        = useRef(null)
  const abandonedIdRef = useRef(null)

  useEffect(() => {
    if (!product && id && !id.startsWith('d')) {
      supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setProduct(data)
      })
    }
    if (product) {
      track('ViewContent', { content_name: product.name, value: product.price, currency: 'DZD' })
      trackTT('ViewContent', { content_id: product.id, content_name: product.name, value: product.price, currency: 'DZD' })
      if (product.quantity_offers?.enabled && product.quantity_offers?.tiers?.length > 0) {
        const first = product.quantity_offers.tiers[0]
        setQty(first.qty)
        setSelectedTierPrice(first.price)
      }
    }
  }, [id])

  const [selectedColor, setColor] = useState(null)
  const [selectedSize, setSize]   = useState(null)
  const [qty, setQty]             = useState(1)
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '',
    customer_wilaya: '', customer_commune: '',
    delivery_type: '',
  })
  const [errors, setErrors]       = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [orderResult, setOrderResult]       = useState(null)
  const [selectedTierPrice, setSelectedTierPrice] = useState(null)

  // Capture abandoned order when phone becomes valid
  useEffect(() => {
    if (!product || !phoneRegex.test(form.customer_phone)) return
    if (abandonedIdRef.current) return
    supabase.from('abandoned_orders').insert([{
      store_id: STORE_ID,
      product_id: product.id?.startsWith('d') ? null : product.id,
      product_name: product.name,
      customer_phone: form.customer_phone,
      customer_name: form.customer_name || null,
    }]).select().single().then(({ data }) => {
      if (data) abandonedIdRef.current = data.id
    })
  }, [form.customer_phone])

  const wilayaOverride = form.customer_wilaya ? (store?.wilaya_prices || {})[form.customer_wilaya] : null
  const shippingHome   = wilayaOverride?.home ?? store?.shipping_home ?? 700
  const shippingDesk   = wilayaOverride?.desk ?? store?.shipping_desk ?? 400

  const hasOffers = product?.quantity_offers?.enabled && (product?.quantity_offers?.tiers?.length ?? 0) > 0

  const communes      = getCommunes(form.customer_wilaya)
  const shippingPrice = form.delivery_type === 'domicile' ? shippingHome
    : form.delivery_type === 'bureau' ? shippingDesk : null
  const subtotal = hasOffers && selectedTierPrice !== null
    ? selectedTierPrice
    : (product ? product.price * qty : 0)
  const total    = shippingPrice !== null ? subtotal + shippingPrice : subtotal

  const images    = product?.images?.length > 0 ? product.images : product?.image_url ? [product.image_url] : []
  const hasColors = product?.variants?.colors?.length > 0
  const hasSizes  = product?.variants?.sizes?.length > 0
  const discount  = product?.compare_price > product?.price
    ? Math.round((1 - product.price / product.compare_price) * 100) : null

  const validate = () => {
    const e = {}
    if (!form.customer_name.trim())            e.customer_name    = 'يرجى إدخال الاسم الكامل'
    if (!phoneRegex.test(form.customer_phone)) e.customer_phone   = 'أدخل رقم هاتف صالح (05/06/07)'
    if (!form.customer_wilaya)                 e.customer_wilaya  = 'يرجى اختيار الولاية'
    if (!form.customer_commune)                e.customer_commune = 'يرجى اختيار البلدية'
    if (!form.delivery_type)                   e.delivery_type    = 'اختر طريقة التوصيل'
    if (hasColors && !selectedColor)           e.color            = 'يرجى اختيار اللون'
    if (hasSizes && !selectedSize)             e.size             = 'يرجى اختيار المقاس'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setSubmitted(true)
    if (!validate()) return
    setLoading(true)
    track('InitiateCheckout', { value: total, currency: 'DZD' })
    trackTT('InitiateCheckout', { value: total, currency: 'DZD' })

    const notes = [
      selectedColor ? `اللون: ${selectedColor}` : '',
      selectedSize  ? `المقاس: ${selectedSize}` : '',
    ].filter(Boolean).join(' | ')

    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        store_id: STORE_ID,
        customer_name:    form.customer_name,
        customer_phone:   form.customer_phone,
        customer_wilaya:  form.customer_wilaya,
        customer_address: `${form.customer_commune} — ${form.delivery_type === 'domicile' ? 'توصيل للمنزل' : 'مكتب توصيل'}`,
        total,
        notes,
      }])
      .select()
      .single()

    if (!error && order) {
      await supabase.from('order_items').insert([{
        order_id:   order.id,
        product_id: product.id.startsWith('d') ? null : product.id,
        quantity:   qty,
        unit_price: hasOffers ? Math.round(subtotal / qty) : product.price,
      }])
      track('Purchase', { value: total, currency: 'DZD' })
      trackTT('PlaceAnOrder', { value: total, currency: 'DZD' })
      if (abandonedIdRef.current) {
        supabase.from('abandoned_orders').delete().eq('id', abandonedIdRef.current)
        abandonedIdRef.current = null
      }
      setOrderResult(order)
    } else {
      setOrderResult({ id: 'DEMO', demo: true })
    }
    setLoading(false)
  }

  // ── Order confirmed ──────────────────────────────────────────
  if (orderResult) return (
    <div dir="rtl" className="font-arabic min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-5">
        <div className="text-center space-y-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
            style={{ background: `linear-gradient(135deg, ${primary}, #A78BFA)` }}
          >
            <CheckCircle size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">تم استلام طلبيتك!</h2>
          <p className="text-gray-500 text-sm">سيتم التواصل معكم لتأكيد الطلب عبر الرقم المدخل</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ backgroundColor: primary + '12' }}>
            <h3 className="font-black text-gray-800 text-sm">ملخص الطلبية</h3>
          </div>
          <div className="divide-y text-sm px-5">
            <div className="flex justify-between py-3">
              <span className="font-bold text-gray-800">{subtotal.toLocaleString('ar-DZ')} دج</span>
              <span className="text-gray-500">سعر المنتج × {qty}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-bold text-gray-800">
                {shippingPrice !== null ? `${shippingPrice.toLocaleString('ar-DZ')} دج` : '—'}
              </span>
              <span className="text-gray-500">الشحن</span>
            </div>
            <div className="flex justify-between py-3 font-black text-base">
              <span style={{ color: primary }}>{total.toLocaleString('ar-DZ')} دج</span>
              <span>الإجمالي</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: Banknote,   label: 'الدفع عند الاستلام' },
            { Icon: Truck,      label: 'توصيل سريع' },
            { Icon: ShieldCheck, label: 'ضمان الجودة' },
          ].map(({ Icon, label }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
              <Icon size={22} className="mx-auto mb-1.5" style={{ color: primary }} />
              <p className="text-[11px] font-bold text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {store?.whatsapp_number && (
            <a
              href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}?text=مرحبا، أريد تأكيد طلبيتي`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white font-black rounded-2xl shadow hover:bg-green-700 transition"
            >
              <MessageCircle size={18} />
              تواصل عبر واتساب
            </a>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 text-white font-black rounded-2xl shadow transition hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${primary}, #A78BFA)` }}
          >
            متابعة التسوق
          </button>
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={36} className="animate-spin" style={{ color: primary }} />
    </div>
  )

  // ── Main product page ────────────────────────────────────────
  return (
    <div dir="rtl" className="font-arabic min-h-screen bg-gray-50 pb-28 lg:pb-8">

      {/* ── Header with logo ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition text-sm font-bold"
          >
            <ArrowRight size={20} />
            <span className="hidden sm:inline">رجوع</span>
          </button>

          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="border border-gray-100 rounded-xl p-1 h-9 w-9 flex items-center justify-center shadow-sm">
              <img
                src={logoSrc}
                alt={store?.store_name}
                className="h-full w-full object-contain"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
            <span className="text-gray-800 font-bold text-sm hidden sm:block max-w-[130px] truncate">
              {store?.store_name}
            </span>
          </div>

          <button onClick={() => navigate('/')} className="relative text-gray-500 hover:text-violet-600 transition p-1">
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
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-4 lg:space-y-0">

          {/* ── LEFT: Product visuals ── */}
          <div className="space-y-4">

            {/* Image carousel */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-square">
                {images.length > 0
                  ? <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200"><Package size={72} strokeWidth={1} /></div>
                }
                {discount && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-sm font-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
                    -{discount}%
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex justify-center gap-2 p-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className="w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
                      style={{ borderColor: imgIdx === i ? primary : '#e5e7eb', opacity: imgIdx === i ? 1 : 0.6 }}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h2 className="text-xl font-black text-gray-800 text-right leading-snug">{product.name}</h2>
              <div className="flex items-baseline justify-end gap-3">
                <span className="text-3xl font-black" style={{ color: primary }}>
                  {Number(product.price).toLocaleString('ar-DZ')} دج
                </span>
                {discount && (
                  <span className="text-base text-gray-400 line-through">
                    {Number(product.compare_price).toLocaleString('ar-DZ')} دج
                  </span>
                )}
              </div>
              {product.description && (
                <p className="text-sm text-gray-500 text-right leading-relaxed border-t pt-3">{product.description}</p>
              )}
            </div>

            {/* Color selector */}
            {hasColors && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <p className="text-sm font-black text-gray-700 text-right">اللون</p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {product.variants.colors.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm font-bold transition-all"
                      style={selectedColor === c.name
                        ? { borderColor: primary, backgroundColor: primary + '12' }
                        : { borderColor: '#e5e7eb' }}
                    >
                      <span className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
                {submitted && errors.color && <p className="text-red-500 text-xs text-right">{errors.color}</p>}
              </div>
            )}

            {/* Size selector */}
            {hasSizes && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <p className="text-sm font-black text-gray-700 text-right">المقاس</p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {product.variants.sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className="min-w-[44px] h-10 px-3 rounded-xl border-2 text-sm font-black transition-all"
                      style={selectedSize === s
                        ? { backgroundColor: primary, borderColor: primary, color: '#fff' }
                        : { borderColor: '#e5e7eb', color: '#374151' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {submitted && errors.size && <p className="text-red-500 text-xs text-right">{errors.size}</p>}
              </div>
            )}

            {/* Trust badges (desktop left column) */}
            <div className="hidden lg:grid grid-cols-3 gap-2">
              {[
                { Icon: Banknote,   label: 'الدفع عند الاستلام' },
                { Icon: Truck,      label: 'توصيل سريع' },
                { Icon: ShieldCheck, label: 'ضمان الجودة' },
              ].map(({ Icon, label }) => (
                <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <Icon size={18} className="mx-auto mb-1.5" style={{ color: primary }} />
                  <p className="text-[11px] font-bold text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Order form (single card) ── */}
          <div ref={formRef}>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2" style={{ borderColor: primary + '40' }}>

              {/* 1. Contact info */}
              <div className="p-5 space-y-4">
                <SectionHeader Icon={User} title="معلومات الاتصال" primary={primary} />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="رقم الهاتف"
                    placeholder="0X XX XX XX XX"
                    type="tel"
                    Icon={Phone}
                    value={form.customer_phone}
                    onChange={v => setForm(f => ({ ...f, customer_phone: v }))}
                    error={submitted && errors.customer_phone}
                    primary={primary}
                  />
                  <Field
                    label="الاسم الكامل"
                    placeholder="الاسم واللقب"
                    Icon={User}
                    value={form.customer_name}
                    onChange={v => setForm(f => ({ ...f, customer_name: v }))}
                    error={submitted && errors.customer_name}
                    primary={primary}
                  />
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: primary + '20' }} />

              {/* 2. Address */}
              <div className="p-5 space-y-4">
                <SectionHeader Icon={MapPin} title="عنوان التوصيل" primary={primary} />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="الولاية"
                    placeholder="اختر الولاية"
                    value={form.customer_wilaya}
                    onChange={v => setForm(f => ({ ...f, customer_wilaya: v, customer_commune: '' }))}
                    options={WILAYA_NAMES.map(w => ({ value: w, label: w }))}
                    error={submitted && errors.customer_wilaya}
                  />
                  <SelectField
                    label="البلدية"
                    placeholder="اختر البلدية"
                    value={form.customer_commune}
                    onChange={v => setForm(f => ({ ...f, customer_commune: v }))}
                    options={communes.map(c => ({ value: c, label: c }))}
                    disabled={!form.customer_wilaya}
                    error={submitted && errors.customer_commune}
                  />
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: primary + '20' }} />

              {/* 3. Delivery type */}
              <div className="p-5 space-y-3">
                <SectionHeader Icon={Truck} title="طريقة التوصيل" primary={primary} />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setForm(f => ({ ...f, delivery_type: 'domicile' }))}
                    className="p-4 rounded-xl border-2 text-center transition-all"
                    style={form.delivery_type === 'domicile'
                      ? { borderColor: primary, backgroundColor: primary + '08' }
                      : { borderColor: '#e5e7eb' }}
                  >
                    <Home size={24} className="mx-auto mb-2" style={{ color: form.delivery_type === 'domicile' ? primary : '#9ca3af' }} />
                    <p className="text-xs font-black text-gray-800">للمنزل</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: primary }}>{shippingHome.toLocaleString('ar-DZ')} دج</p>
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, delivery_type: 'bureau' }))}
                    className="p-4 rounded-xl border-2 text-center transition-all"
                    style={form.delivery_type === 'bureau'
                      ? { borderColor: '#16a34a', backgroundColor: '#f0fdf4' }
                      : { borderColor: '#e5e7eb' }}
                  >
                    <Building2 size={24} className="mx-auto mb-2" style={{ color: form.delivery_type === 'bureau' ? '#16a34a' : '#9ca3af' }} />
                    <p className="text-xs font-black text-gray-800">مكتب توصيل</p>
                    <p className="text-xs font-bold text-green-600 mt-0.5">{shippingDesk.toLocaleString('ar-DZ')} دج</p>
                  </button>
                </div>
                {submitted && errors.delivery_type && (
                  <p className="text-red-500 text-xs text-right">{errors.delivery_type}</p>
                )}
              </div>

              <div className="h-px" style={{ backgroundColor: primary + '20' }} />

              {/* 4. Quantity */}
              <div className="p-5 space-y-4">
                <SectionHeader Icon={ShoppingCart} title="الكمية" primary={primary} />
                {hasOffers ? (
                  <div className="space-y-2">
                    {product.quantity_offers.tiers.map((tier) => {
                      const isSelected = qty === tier.qty && selectedTierPrice === tier.price
                      const saving = product.price * tier.qty - tier.price
                      return (
                        <button
                          key={tier.qty}
                          type="button"
                          onClick={() => { setQty(tier.qty); setSelectedTierPrice(tier.price) }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all"
                          style={isSelected ? { borderColor: primary, backgroundColor: primary + '0d' } : { borderColor: '#e5e7eb' }}
                        >
                          <span className="font-bold text-gray-700 text-sm">{tier.qty} {tier.qty === 1 ? 'قطعة' : 'قطع'}</span>
                          <div className="text-left">
                            <p className="font-black text-base" style={{ color: isSelected ? primary : '#111827' }}>
                              {Number(tier.price).toLocaleString('ar-DZ')} دج
                            </p>
                            {saving > 0 && (
                              <p className="text-xs text-green-600">وفر {Number(saving).toLocaleString('ar-DZ')} دج</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-5">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-sm hover:opacity-90 transition"
                      style={{ backgroundColor: primary }}
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-3xl font-black text-gray-800 w-12 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(q => q + 1)}
                      className="w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-sm hover:opacity-90 transition"
                      style={{ backgroundColor: primary }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px" style={{ backgroundColor: primary + '20' }} />

              {/* 5. Summary + Submit (at the bottom) */}
              <div className="p-5 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-bold">{subtotal.toLocaleString('ar-DZ')} دج</span>
                    <span>{hasOffers ? `${qty} ${qty === 1 ? 'قطعة' : 'قطع'}` : `سعر المنتج × ${qty}`}</span>
                  </div>
                  {shippingPrice !== null && (
                    <div className="flex justify-between text-gray-600">
                      <span className="font-bold">{shippingPrice.toLocaleString('ar-DZ')} دج</span>
                      <span>الشحن</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base border-t pt-2">
                    <span style={{ color: primary }}>{total.toLocaleString('ar-DZ')} دج</span>
                    <span className="text-gray-800">الإجمالي</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-gray-600 bg-gray-50">
                  <Banknote size={15} style={{ color: primary }} />
                  الدفع عند الاستلام
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || product.stock === 0}
                  className="w-full py-4 text-white font-black text-lg rounded-2xl shadow-lg disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${primary}, #A78BFA)` }}
                >
                  {loading
                    ? <><Loader2 size={20} className="animate-spin" /> جاري الإرسال...</>
                    : product.stock === 0 ? 'نفدت الكمية'
                    : <><CheckCircle size={20} /> تأكيد الطلب</>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom CTA (mobile only) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-400">الإجمالي</p>
            <p className="text-lg font-black text-gray-800 leading-tight">
              {total.toLocaleString('ar-DZ')} <span className="text-sm text-gray-500">دج</span>
            </p>
          </div>
          <button
            onClick={() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              handleSubmit()
            }}
            disabled={loading || product.stock === 0}
            className="flex-1 py-3.5 text-white font-black text-base rounded-2xl shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${primary}, #A78BFA)` }}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> جاري الإرسال...</>
              : <><CheckCircle size={18} /> تأكيد الطلب</>
            }
          </button>
        </div>
      </div>

      {/* WhatsApp FAB */}
      {store?.whatsapp_number && (
        <a
          href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 lg:bottom-6 left-4 bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl z-40 hover:bg-green-700 transition"
        >
          <MessageCircle size={22} />
        </a>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────
function SectionHeader({ Icon, title, primary }) {
  return (
    <div className="flex items-center justify-end gap-2 pb-2 border-b-2" style={{ borderColor: primary + '50' }}>
      <span className="text-sm font-black text-gray-800">{title}</span>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary + '18', boxShadow: `0 0 0 3px ${primary}18` }}>
        <Icon size={14} style={{ color: primary }} />
      </div>
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text', error, Icon, primary }) {
  return (
    <div>
      {label && <label className="block text-xs font-bold text-gray-500 mb-1.5 text-right">{label}</label>}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl pr-9 pl-3 py-3 text-sm text-right bg-white border-2 focus:outline-none transition-all ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-violet-500'
          }`}
        />
        {Icon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={15} />
          </span>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 text-right">{error}</p>}
    </div>
  )
}

function SelectField({ label, placeholder, value, onChange, options, disabled, error }) {
  return (
    <div>
      {label && <label className="block text-xs font-bold text-gray-500 mb-1.5 text-right">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-xl px-3 py-3 text-sm text-right bg-white border-2 focus:outline-none transition-all appearance-none ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-violet-500'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${!value ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1 text-right">{error}</p>}
    </div>
  )
}
