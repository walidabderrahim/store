import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Package } from 'lucide-react'

export default function ProductCard({ product, primaryColor, onAddToCart }) {
  const navigate = useNavigate()

  const discount = product.compare_price > product.price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null

  const goToProduct = () => navigate(`/product/${product.id}`, { state: { product } })

  return (
    <div dir="rtl" className="font-arabic bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative overflow-hidden bg-gray-50" style={{ paddingTop: '100%' }} onClick={goToProduct}>
        <div className="absolute inset-0">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={52} /></div>
          }
        </div>
        {discount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black w-11 h-11 rounded-full flex items-center justify-center leading-none shadow-md">
            -{discount}%
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 gap-2">
        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 text-right leading-snug" onClick={goToProduct}>
          {product.name}
        </h3>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-lg font-black" style={{ color: primaryColor }}>
            {Number(product.price).toLocaleString('ar-DZ')} دج
          </span>
          {discount && (
            <span className="text-xs text-gray-400 line-through">
              {Number(product.compare_price).toLocaleString('ar-DZ')} دج
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={goToProduct}
            disabled={product.stock === 0}
            className="flex-1 py-2 text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {product.stock === 0 ? 'نفدت الكمية' : 'شراء'}
          </button>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 shrink-0 text-gray-600 transition-colors"
          >
            <ShoppingCart size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
