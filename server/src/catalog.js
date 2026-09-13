// Mirror of the mobile app's product catalog so we can ground the AI's
// recommendations in real product IDs from the same dataset.
// Keep this in sync with liva-app/src/data/index.ts.

export const PRODUCTS = [
  { id: 'p1',  name: 'Aura Smartwatch S9',        brand: 'Aura',      type: 'electronics', price: 49.99,  rating: 4.8, badge: 'AI Pick' },
  { id: 'p2',  name: 'Pulse Pro Earbuds',         brand: 'Pulse',     type: 'electronics', price: 29.99,  rating: 4.7, badge: 'Trending' },
  { id: 'p3',  name: 'Velvet Rose Eau de Parfum', brand: 'Velvet',    type: 'beauty',      price: 39.99,  rating: 4.8, badge: 'Hot' },
  { id: 'p4',  name: 'Halo Ring Light 18"',       brand: 'Halo',      type: 'electronics', price: 34.50 },
  { id: 'p5',  name: 'Cloudstep Runners',         brand: 'Cloudstep', type: 'sport',       price: 62.00,  rating: 4.9, badge: 'Trending' },
  { id: 'p6',  name: 'Lumen Silk Serum',          brand: 'Lumen',     type: 'beauty',      price: 24.00,  rating: 4.7, badge: 'AI Pick' },
  { id: 'p7',  name: 'Nordic Knit Overshirt',     brand: 'Nordic',    type: 'clothing',    price: 45.00 },
  { id: 'p8',  name: 'Terra Ceramic Mug Set',     brand: 'Terra',     type: 'home',        price: 28.00 },
  { id: 'p9',  name: 'Flux 65W GaN Charger',      brand: 'Flux',      type: 'electronics', price: 19.99,  rating: 4.9, badge: 'Price drop' },
  { id: 'p10', name: 'Mirae Gloss Tint Trio',     brand: 'Mirae',     type: 'beauty',      price: 21.00 },
  { id: 'p11', name: 'Drift Linen Tote',          brand: 'Drift',     type: 'accessories', price: 33.00,  badge: 'Trending' },
  { id: 'p12', name: 'Orbit Smart Bottle',        brand: 'Orbit',     type: 'home',        price: 26.50 },
  { id: 'p13', name: 'Aurora Wrap Dress',         brand: 'Aurora',    type: 'clothing',    price: 52.00,  badge: 'Hot' },
  { id: 'p14', name: 'Eclipse Polarized Sunglasses', brand: 'Eclipse', type: 'accessories', price: 27.00 },
  { id: 'p15', name: 'Mira Gold Hoop Earrings',   brand: 'Mira',      type: 'accessories', price: 35.00,  badge: 'AI Pick' },
  { id: 'p16', name: 'Coastal Everyday Tee',      brand: 'Coastal',   type: 'clothing',    price: 18.00 },
  { id: 'p17', name: 'Rainbow Kids Hoodie',       brand: 'Cubby',     type: 'clothing',    price: 22.00,  badge: 'Trending' },
  { id: 'p18', name: 'Trail Sportswear Set',      brand: 'Trail',     type: 'sport',       price: 44.00 },
];

export function catalogSummary() {
  return PRODUCTS.map((p) => `- ${p.id}: ${p.name} (${p.brand}, ${p.type}, $${p.price}${p.badge ? ', ' + p.badge : ''})`).join('\n');
}
