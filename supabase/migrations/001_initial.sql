-- ============================================================
-- ECOMWEB — Migration initiale
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE : stores
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email     text NOT NULL UNIQUE,
  store_name      text NOT NULL,
  logo_url        text,
  primary_color   text DEFAULT '#000000',
  whatsapp_number text,
  pixel_id        text,
  delivery_text   text,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- TABLE : products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid REFERENCES stores(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  price       numeric NOT NULL,
  stock       integer DEFAULT 0,
  image_url   text,
  category    text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- TABLE : orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid REFERENCES stores(id) ON DELETE CASCADE,
  customer_name    text NOT NULL,
  customer_phone   text NOT NULL,
  customer_wilaya  text NOT NULL,
  customer_address text NOT NULL,
  total            numeric NOT NULL,
  status           text DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes            text,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- TABLE : order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id),
  quantity    integer NOT NULL,
  unit_price  numeric NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- products : lecture publique pour la vitrine
CREATE POLICY "public read active products"
  ON products FOR SELECT
  USING (is_active = true);

-- products : le propriétaire gère ses produits
CREATE POLICY "store owner manage products"
  ON products FOR ALL
  USING (
    store_id = (SELECT id FROM stores WHERE owner_email = auth.email())
  )
  WITH CHECK (
    store_id = (SELECT id FROM stores WHERE owner_email = auth.email())
  );

-- orders : insertion publique (passage de commande sans compte)
CREATE POLICY "public insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- orders : lecture/mise à jour réservées au propriétaire
CREATE POLICY "store owner manage orders"
  ON orders FOR SELECT
  USING (
    store_id = (SELECT id FROM stores WHERE owner_email = auth.email())
  );

CREATE POLICY "store owner update orders"
  ON orders FOR UPDATE
  USING (
    store_id = (SELECT id FROM stores WHERE owner_email = auth.email())
  );

-- order_items : insertion publique
CREATE POLICY "public insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- order_items : lecture réservée au propriétaire (via order)
CREATE POLICY "store owner read order_items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE store_id = (SELECT id FROM stores WHERE owner_email = auth.email())
    )
  );

-- ============================================================
-- STORAGE BUCKET (à créer depuis le dashboard Supabase)
-- Bucket name : store-assets   (public: true)
-- ============================================================
