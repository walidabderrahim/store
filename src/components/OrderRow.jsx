const STATUS_LABELS = {
  pending:   { label: 'En attente',  classes: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmée',   classes: 'bg-blue-100 text-blue-700' },
  shipped:   { label: 'Expédiée',    classes: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Livrée',      classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée',     classes: 'bg-red-100 text-red-700' },
}

const NEXT_STATUS = {
  pending:   'confirmed',
  confirmed: 'shipped',
  shipped:   'delivered',
}

export default function OrderRow({ order, onStatusChange, onClick }) {
  const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending
  const next = NEXT_STATUS[order.status]

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick(order)}
    >
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        {new Date(order.created_at).toLocaleDateString('fr-DZ')}
      </td>
      <td className="px-4 py-3 font-medium text-gray-800">{order.customer_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{order.customer_wilaya}</td>
      <td className="px-4 py-3 text-sm font-semibold">
        {Number(order.total).toLocaleString('fr-DZ')} DA
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.classes}`}>
          {s.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        {next && (
          <button
            onClick={() => onStatusChange(order.id, next)}
            className="text-xs bg-gray-800 text-white px-3 py-1 rounded-lg hover:bg-gray-700 mr-2"
          >
            → {STATUS_LABELS[next].label}
          </button>
        )}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <button
            onClick={() => onStatusChange(order.id, 'cancelled')}
            className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200"
          >
            Annuler
          </button>
        )}
      </td>
    </tr>
  )
}
