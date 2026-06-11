import { useState, useEffect, useRef } from 'react'
import { supabase, STORE_ID } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { Home, Building2, Search } from 'lucide-react'
import { WILAYA_NAMES } from '../../data/wilayas'

export default function Settings() {
  const [form, setForm] = useState({
    store_name: '',
    logo_url: '',
    primary_color: '#111827',
    whatsapp_number: '',
    pixel_id: '',
    delivery_text: '',
    shipping_home: 700,
    shipping_desk: 400,
  })
  const [wilayaPrices, setWilayaPrices]   = useState({})
  const [wilayaSearch, setWilayaSearch]   = useState('')
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [saved, setSaved]                 = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    supabase
      .from('stores')
      .select('store_name, logo_url, primary_color, whatsapp_number, pixel_id, delivery_text, shipping_home, shipping_desk, wilaya_prices')
      .eq('id', STORE_ID)
      .single()
      .then(({ data }) => {
        if (data) {
          const { wilaya_prices, ...rest } = data
          setForm((f) => ({ ...f, ...rest }))
          setWilayaPrices(wilaya_prices || {})
        }
        setLoading(false)
      })
  }, [])

  const filteredWilayas = WILAYA_NAMES.filter((w) =>
    w.toLowerCase().includes(wilayaSearch.toLowerCase())
  )

  const updateWilayaPrice = (wilaya, field, raw) => {
    const value = raw === '' ? undefined : Number(raw)
    setWilayaPrices((prev) => {
      const updated = { ...prev, [wilaya]: { ...prev[wilaya], [field]: value } }
      if (updated[wilaya].home === undefined && updated[wilaya].desk === undefined) {
        const { [wilaya]: _removed, ...rest } = updated
        return rest
      }
      return updated
    })
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const path = `${STORE_ID}/logo.${file.name.split('.').pop()}`
    await supabase.storage.from('store-assets').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('store-assets').getPublicUrl(path)
    setForm((f) => ({ ...f, logo_url: data.publicUrl }))
    setLogoUploading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('stores').update({ ...form, wilaya_prices: wilayaPrices }).eq('id', STORE_ID)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres de la boutique</h1>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Identité visuelle */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">Identité visuelle</h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-contain bg-gray-50 border" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">🏪</div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={logoUploading}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-60"
                >
                  {logoUploading ? 'Upload…' : 'Changer le logo'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nom de la boutique</label>
              <input
                type="text"
                required
                value={form.store_name}
                onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Couleur principale</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="text-sm text-gray-500 font-mono">{form.primary_color}</span>
                <div className="flex-1 h-10 rounded-xl" style={{ backgroundColor: form.primary_color }} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">Contact</h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Numéro WhatsApp
                <span className="text-gray-400 font-normal ml-1">(format : 213XXXXXXXXX)</span>
              </label>
              <input
                type="text"
                value={form.whatsapp_number}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
                placeholder="213XXXXXXXXX"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Texte de livraison</label>
              <input
                type="text"
                value={form.delivery_text}
                onChange={(e) => setForm((f) => ({ ...f, delivery_text: e.target.value }))}
                placeholder="Livraison 2–5 jours, 48 wilayas"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Prix de livraison */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-700">Prix de livraison</h2>

            {/* Tarifs par défaut */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Tarifs par défaut</p>
              <p className="text-xs text-gray-400">Appliqués aux wilayas sans prix spécifique</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                    <Home size={12} />
                    À domicile (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.shipping_home}
                    onChange={(e) => setForm((f) => ({ ...f, shipping_home: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                    <Building2 size={12} />
                    Bureau de livraison (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.shipping_desk}
                    onChange={(e) => setForm((f) => ({ ...f, shipping_desk: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Prix par wilaya */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Prix par wilaya</p>
                <p className="text-xs text-gray-400">Vide = tarif par défaut</p>
              </div>

              <div className="relative mb-3">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={wilayaSearch}
                  onChange={(e) => setWilayaSearch(e.target.value)}
                  placeholder="Rechercher une wilaya…"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr className="text-xs text-gray-500">
                        <th className="px-4 py-2.5 text-left font-medium">Wilaya</th>
                        <th className="px-3 py-2.5 text-center font-medium w-24">
                          <span className="flex items-center justify-center gap-1"><Home size={11} /> Dom.</span>
                        </th>
                        <th className="px-3 py-2.5 text-center font-medium w-24">
                          <span className="flex items-center justify-center gap-1"><Building2 size={11} /> Bur.</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredWilayas.map((w) => (
                        <tr key={w} className={wilayaPrices[w] ? 'bg-violet-50/40' : ''}>
                          <td className="px-4 py-2 text-sm text-gray-700 font-medium">{w}</td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={wilayaPrices[w]?.home ?? ''}
                              placeholder={form.shipping_home}
                              onChange={(e) => updateWilayaPrice(w, 'home', e.target.value)}
                              className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gray-300 bg-white"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={wilayaPrices[w]?.desk ?? ''}
                              placeholder={form.shipping_desk}
                              onChange={(e) => updateWilayaPrice(w, 'desk', e.target.value)}
                              className="w-full border border-gray-100 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gray-300 bg-white"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {Object.keys(wilayaPrices).length > 0 && (
                <p className="text-xs text-violet-600 mt-2">
                  {Object.keys(wilayaPrices).length} wilaya(s) avec prix spéciaux
                </p>
              )}
            </div>
          </div>

          {/* Meta Pixel */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-700">Meta Pixel</h2>
            <p className="text-sm text-gray-400">
              Copiez votre Pixel ID depuis le Gestionnaire d'événements Meta Business.
              Il sera automatiquement injecté sur votre boutique.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Pixel ID</label>
              <input
                type="text"
                value={form.pixel_id}
                onChange={(e) => setForm((f) => ({ ...f, pixel_id: e.target.value }))}
                placeholder="Ex : 1234567890123456"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>
            {form.pixel_id && (
              <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                ✓ Pixel actif — PageView, AddToCart, InitiateCheckout, Purchase seront trackés.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 pb-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
            {saved && (
              <p className="text-green-600 text-sm font-medium">✓ Paramètres sauvegardés</p>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
