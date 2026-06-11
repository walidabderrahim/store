import { useState, useEffect } from 'react'
import { supabase, STORE_ID } from '../lib/supabase'

const DEMO_STORE = {
  id: STORE_ID,
  store_name: 'Store Online',
  logo_url: null,
  primary_color: '#8B5CF6',
  whatsapp_number: '',
  pixel_id: '',
  delivery_text: 'توصيل لجميع ولايات الجزائر',
  shipping_home: 700,
  shipping_desk: 400,
}

export function useStore() {
  const [store, setStore] = useState(DEMO_STORE)

  useEffect(() => {
    supabase
      .from('stores')
      .select('*')
      .eq('id', STORE_ID)
      .single()
      .then(({ data }) => {
        if (data) setStore(data)
      })
  }, [])

  return { store, loading: false }
}
