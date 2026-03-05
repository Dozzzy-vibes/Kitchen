-- ============================================================
-- Ada's Kitchen Essentials — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL CHECK (category IN ('cookware','appliances','utensils','storage')),
  price       numeric(10,2) NOT NULL,
  badge       text,
  description text,
  specs       text[],
  img         text,
  in_stock    boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Public read, no public writes
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products"  ON products FOR SELECT USING (true);
CREATE POLICY "Service role can modify"   ON products FOR ALL USING (auth.role() = 'service_role');

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items       jsonb NOT NULL,
  subtotal    numeric(10,2) NOT NULL,
  shipping    numeric(10,2) NOT NULL DEFAULT 0,
  total       numeric(10,2) NOT NULL,
  delivery    jsonb NOT NULL,
  status      text NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- Authenticated users can see their own orders
CREATE POLICY "Users see own orders" ON orders FOR SELECT
  USING (auth.uid() = user_id);
-- Anyone (guest or auth) can insert
CREATE POLICY "Anyone can place orders" ON orders FOR INSERT
  WITH CHECK (true);
-- Only service role can update or delete
CREATE POLICY "Service role manages orders" ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- ── Seed products ─────────────────────────────────────────────
INSERT INTO products (name, category, price, badge, description, specs, img) VALUES
(
  'Copper Core Sauté Pan', 'cookware', 289, 'Bestseller',
  'Five layers of bonded metal — stainless steel, aluminium, and a pure copper core — deliver unmatched heat responsiveness across any cooktop, including induction. The polished stainless interior is non-reactive and easy to clean.',
  ARRAY['28 cm diameter','5-ply construction','Oven-safe to 260 °C','Induction compatible','Lifetime warranty'],
  'https://placehold.co/720x720/DDD0C4/8A6850?text=Sauté+Pan'
),
(
  'Enameled Cast Iron Dutch Oven', 'cookware', 340, 'New',
  'Heirloom-quality enameled cast iron for braises, soups, and slow cooking. Even heat distribution and a tight-fitting lid seal in flavour.',
  ARRAY['5.5 qt capacity','Enameled interior','All cooktops','Dishwasher safe','Available in 4 colours'],
  'https://placehold.co/720x720/D4C8BC/7A6458?text=Dutch+Oven'
),
(
  'Precision Espresso Machine', 'appliances', 899, NULL,
  'Barista-grade extraction with 15-bar pressure and a PID temperature controller. Steam wand for silky microfoam.',
  ARRAY['15-bar pressure','PID temperature control','Steam wand','1.8 L water tank','60-second warm-up'],
  'https://placehold.co/720x720/D0D4D8/506070?text=Espresso+Machine'
),
(
  'Variable Speed Immersion Blender', 'appliances', 175, NULL,
  'Twelve-speed immersion blender with a titanium-reinforced blade. Blend soups, sauces, and smoothies directly in the pot.',
  ARRAY['12 speed settings','Titanium blade','Dishwasher-safe shaft','Turbo boost','500 W motor'],
  'https://placehold.co/720x720/D8D6D4/6A6460?text=Blender'
),
(
  'Japanese Chef''s Knife Set', 'utensils', 420, 'Premium',
  'Handcrafted in Seki, Japan. High-carbon VG-10 steel core with 67-layer Damascus cladding. Walnut handle, hand-finished and perfectly balanced.',
  ARRAY['VG-10 steel core','67-layer Damascus','Walnut handle','Set of 3 knives','Includes knife roll'],
  'https://placehold.co/720x720/D8D4C8/6A6455?text=Knife+Set'
),
(
  'Pro Mandoline Slicer', 'utensils', 128, NULL,
  'Ultra-sharp Japanese blade with five thickness settings. Foldable design stores compactly. Includes a cut-resistant glove and three interchangeable inserts.',
  ARRAY['5 thickness settings','Japanese blade','Foldable design','Cut-resistant glove','3 blade inserts'],
  'https://placehold.co/720x720/D0D4CC/5A6455?text=Mandoline'
),
(
  'Glass Storage Collection', 'storage', 95, 'Set of 8',
  'Airtight borosilicate glass containers with bamboo lids. Freezer, microwave, and oven-safe up to 300 °C.',
  ARRAY['Borosilicate glass','Bamboo lids','Airtight seal','8-piece set','Oven-safe to 300 °C'],
  'https://placehold.co/720x720/C8D4CC/4A6858?text=Storage+Set'
),
(
  'Modular Pantry System', 'storage', 210, 'Exclusive',
  'Customisable drawer and shelf inserts for a perfectly organised pantry. Solid beechwood with a food-safe lacquer finish.',
  ARRAY['Solid beechwood','Modular design','Food-safe finish','Customisable layout','6 modules included'],
  'https://placehold.co/720x720/D0CCC4/6A6050?text=Pantry+System'
);

-- ── Make a user admin ─────────────────────────────────────────
-- After creating a user via the app, run this to grant admin role:
-- UPDATE auth.users
--   SET app_metadata = app_metadata || '{"role": "admin"}'
--   WHERE email = 'your-admin@example.com';
