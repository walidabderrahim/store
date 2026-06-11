import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'

export default function OrderConfirm() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { store } = useStore()
  const primaryColor = store?.primary_color || '#111827'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm p-10 max-w-md w-full text-center space-y-6">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-800">Commande confirmée !</h1>
        <p className="text-gray-500">
          Merci {state?.customerName && <strong>{state.customerName}</strong>},<br />
          votre commande a bien été reçue. Nous vous contacterons bientôt pour confirmer la livraison.
        </p>

        {store?.whatsapp_number && (
          <a
            href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}?text=Bonjour, j'ai passé une commande (réf: ${state?.orderId?.slice(0,8)})`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
          >
            💬 Contacter via WhatsApp
          </a>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Continuer mes achats
        </button>
      </div>
    </div>
  )
}
