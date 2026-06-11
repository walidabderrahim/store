import { useState } from 'react'

export function useCart() {
  const [items, setItems] = useState([])

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId))
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeItem(productId)
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, qty } : i))
    )
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return { items, addItem, removeItem, updateQty, clearCart, total, count }
}
