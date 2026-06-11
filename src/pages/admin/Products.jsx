import { useState, useEffect, useRef } from 'react'
import { supabase, STORE_ID } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'
import { Package, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'

const EMPTY_FORM = {
  name: '', description: '', price: '', stock: '', category: '', images: [], is_active: true,
}

export default function Products() {
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editId, setEditId]         = useState(null)
  const [saving, setSaving]         = useState(false)
  const [imgUploading, setImgUploading] = useState(false)
  const fileRef = useRef()

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', STORE_ID)
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || '',
      price: p.price, stock: p.stock, category: p.category || '',
      images: p.images?.length > 0 ? p.images : p.image_url ? [p.image_url] : [],
      is_active: p.is_active,
    })
    setEditId(p.id)
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImgUploading(true)
    const uploaded = []
    for (const file of files) {
      const ext  = file.name.split('.').pop()
      const path = `${STORE_ID}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('store-assets').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('store-assets').getPublicUrl(path)
        uploaded.push(data.publicUrl)
      }
    }
    setForm((f) => ({ ...f, images: [...(f.images || []), ...uploaded] }))
    setImgUploading(false)
    e.target.value = ''
  }

  const removeImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const images  = form.images || []
    const payload = {
      name: form.name, description: form.description, category: form.category, is_active: form.is_active,
      price: Number(form.price), stock: Number(form.stock),
      images,
      image_url: images[0] || '',
      store_id: STORE_ID,
    }
    if (editId) {
      await supabase.from('products').update(payload).eq('id', editId)
    } else {
      await supabase.from('products').insert([payload])
    }
    setSaving(false)
    setShowModal(false)
    fetchProducts()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const toggleActive = async (p) => {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    fetchProducts()
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <button
            onClick={openNew}
            className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800"
          >
            + Ajouter
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package size={40} className="mx-auto mb-4 text-gray-200" />
            <p>Aucun produit. Commencez par en ajouter un !</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Mobile: card list */}
            <div className="md:hidden divide-y">
              {products.map((p) => (
                <div key={p.id} className="p-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {(p.images?.[0] || p.image_url)
                      ? <img src={p.images?.[0] || p.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={22} className="text-gray-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category || '—'}</p>
                    <p className="text-sm font-semibold mt-0.5">{Number(p.price).toLocaleString('fr-DZ')} DA</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <table className="hidden md:table w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Photo</th>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-left">Prix</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-4 py-3">
                      {p.image_url
                        ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-300" /></div>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category || '—'}</td>
                    <td className="px-4 py-3 font-semibold">{Number(p.price).toLocaleString('fr-DZ')} DA</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : 'text-gray-700'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(p)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-lg hover:bg-red-100">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">{editId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Photos
                  <span className="text-gray-400 font-normal ml-1">(vous pouvez en ajouter plusieurs)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(form.images || []).map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold leading-none hover:bg-red-600"
                      >
                        ×
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/50 text-white rounded-b-xl py-0.5">
                          Principale
                        </span>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={imgUploading}
                    className="w-16 h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 disabled:opacity-60 shrink-0"
                  >
                    {imgUploading
                      ? <Loader2 size={18} className="animate-spin text-gray-400" />
                      : <Plus size={18} className="text-gray-400" />
                    }
                    {!imgUploading && <span className="text-[10px] text-gray-400">Ajouter</span>}
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </div>

              {[
                { name: 'name',     label: 'Nom du produit', required: true },
                { name: 'category', label: 'Catégorie' },
              ].map(({ name, label, required }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    required={required}
                    value={form[name]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'price', label: 'Prix (DA)', type: 'number', min: 0, required: true },
                  { name: 'stock', label: 'Stock',     type: 'number', min: 0, required: true },
                ].map(({ name, label, type, min, required }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      min={min}
                      required={required}
                      value={form[name]}
                      onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Produit visible sur la boutique</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
