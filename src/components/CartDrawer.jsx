import { useNavigate } from 'react-router-dom'
import { X, ShoppingCart, Plus, Minus, ShoppingBag } from 'lucide-react'

export default function CartDrawer({ items, onClose, onUpdateQty, onRemove, total, primaryColor }) {
  const navigate = useNavigate()

  return (
    <div dir="rtl" className="font-arabic fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <ShoppingBag size={20} />
            سلة الطلبات
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
            <ShoppingCart size={64} strokeWidth={1} />
            <p className="text-sm text-gray-400 font-bold">سلتك فارغة</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 px-5 py-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag size={24} /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm font-black" style={{ color: primaryColor }}>{Number(item.price).toLocaleString('ar-DZ')} دج</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onUpdateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-black w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-400 self-start transition-colors p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-5 border-t space-y-3">
              <div className="flex justify-between font-black text-lg">
                <span style={{ color: primaryColor }}>{total.toLocaleString('ar-DZ')} دج</span>
                <span className="text-gray-800">الإجمالي</span>
              </div>
              <button
                onClick={() => { onClose(); navigate('/checkout', { state: { items, total } }) }}
                className="w-full py-3.5 text-white font-black rounded-xl hover:opacity-90 transition-opacity shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                إتمام الطلب
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
