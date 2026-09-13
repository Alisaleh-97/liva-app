// One-shot seed script — loads the demo products from the mobile app's seed
// catalog into the DB so /api/products and /api/search have real data on
// first boot. Idempotent: skips rows that already exist by their seed key.
//
// Run:  npm run seed
//
// A real production DB would import the seller's own catalog instead; this
// exists so the dev environment feels alive out of the box.

import { prisma } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

// Slim mirror of the mobile app's PRODUCTS array — kept flat here so the
// seed doesn't need to reach across into the RN project's TypeScript.
const PRODUCTS = [
  { name: 'Aura Smartwatch S9',         nameAr: 'ساعة أورا الذكية S9',    brand: 'Aura',      audience: 'unisex', type: 'electronics', sub: 'Watches',   price: 49.99, was: 89.99, rating: 4.8, reviews: 1240, seed: 'watch-steel',     badge: 'AI Pick',    stock: 23, shipFrom: 2, shipTo: 4 },
  { name: 'Pulse Pro Earbuds',          nameAr: 'سماعات بَلس برو',           brand: 'Pulse',     audience: 'unisex', type: 'electronics', sub: 'Audio',     price: 29.99, was: 45.99, rating: 4.7, reviews: 980,  seed: 'earbuds-jet',     badge: 'Trending',   stock: 64, shipFrom: 2, shipTo: 3 },
  { name: 'Velvet Rose Eau de Parfum',  nameAr: 'عطر فيلفيت روز',            brand: 'Velvet',    audience: 'women',  type: 'beauty',      sub: 'Fragrance', price: 39.99, was: 57.0,  rating: 4.8, reviews: 256,  seed: 'perfume-rose',    badge: 'Hot',        stock: 12, shipFrom: 1, shipTo: 3 },
  { name: 'Halo Ring Light 18"',        nameAr: 'إضاءة هالو الحلقية',        brand: 'Halo',      audience: 'unisex', type: 'electronics', sub: 'Studio',    price: 34.5,  was: 59.0,  rating: 4.6, reviews: 612,  seed: 'ringlight',       badge: null,         stock: 40, shipFrom: 3, shipTo: 5 },
  { name: 'Cloudstep Runners',          nameAr: 'حذاء كلاودستيب',             brand: 'Cloudstep', audience: 'unisex', type: 'sport',       sub: 'Footwear',  price: 62.0,  was: 99.0,  rating: 4.9, reviews: 2010, seed: 'sneaker-run',     badge: 'Trending',   stock: 31, shipFrom: 2, shipTo: 4 },
  { name: 'Lumen Silk Serum',           nameAr: 'سيروم لومن الحريري',        brand: 'Lumen',     audience: 'women',  type: 'beauty',      sub: 'Skincare',  price: 24.0,  was: 38.0,  rating: 4.7, reviews: 430,  seed: 'serum-glow',      badge: 'AI Pick',    stock: 55, shipFrom: 1, shipTo: 3 },
  { name: 'Nordic Knit Overshirt',      nameAr: 'قميص نورديك الصوفي',         brand: 'Nordic',    audience: 'men',    type: 'clothing',    sub: 'Jackets',   price: 45.0,  was: 70.0,  rating: 4.5, reviews: 188,  seed: 'knit-stone',      badge: null,         stock: 18, shipFrom: 3, shipTo: 6 },
  { name: 'Terra Ceramic Mug Set',      nameAr: 'طقم أكواب تيرا',            brand: 'Terra',     audience: 'unisex', type: 'home',        sub: 'Kitchen',   price: 28.0,  was: 40.0,  rating: 4.8, reviews: 320,  seed: 'mug-clay',        badge: null,         stock: 47, shipFrom: 3, shipTo: 5 },
  { name: 'Flux 65W GaN Charger',       nameAr: 'شاحن فلكس 65 واط',           brand: 'Flux',      audience: 'unisex', type: 'electronics', sub: 'Power',     price: 19.99, was: 32.0,  rating: 4.9, reviews: 1500, seed: 'charger-flux',    badge: 'Price drop', stock: 120,shipFrom: 2, shipTo: 4 },
  { name: 'Mirae Gloss Tint Trio',      nameAr: 'ثلاثية ميراي للشفاه',       brand: 'Mirae',     audience: 'women',  type: 'beauty',      sub: 'Makeup',    price: 21.0,  was: 33.0,  rating: 4.6, reviews: 274,  seed: 'gloss-trio',      badge: null,         stock: 38, shipFrom: 1, shipTo: 3 },
  { name: 'Drift Linen Tote',           nameAr: 'حقيبة دريفت الكتانية',      brand: 'Drift',     audience: 'women',  type: 'accessories', sub: 'Bags',      price: 33.0,  was: 49.0,  rating: 4.7, reviews: 142,  seed: 'tote-linen',      badge: 'Trending',   stock: 26, shipFrom: 3, shipTo: 5 },
  { name: 'Orbit Smart Bottle',         nameAr: 'زجاجة أوربت الذكية',        brand: 'Orbit',     audience: 'unisex', type: 'home',        sub: 'Fitness',   price: 26.5,  was: 39.0,  rating: 4.5, reviews: 388,  seed: 'bottle-orbit',    badge: null,         stock: 52, shipFrom: 2, shipTo: 4 },
  { name: 'Aurora Wrap Dress',          nameAr: 'فستان أورورا',              brand: 'Aurora',    audience: 'women',  type: 'clothing',    sub: 'Dresses',   price: 52.0,  was: 84.0,  rating: 4.8, reviews: 364,  seed: 'dress-aurora',    badge: 'Hot',        stock: 15, shipFrom: 3, shipTo: 6 },
  { name: 'Eclipse Polarized Sunglasses', nameAr: 'نظارة إكليبس الشمسية',    brand: 'Eclipse',   audience: 'unisex', type: 'accessories', sub: 'Sunglasses',price: 27.0,  was: 45.0,  rating: 4.6, reviews: 210,  seed: 'sunnies-eclipse', badge: null,         stock: 33, shipFrom: 2, shipTo: 4 },
  { name: 'Mira Gold Hoop Earrings',    nameAr: 'أقراط ميرا الذهبية',        brand: 'Mira',      audience: 'women',  type: 'accessories', sub: 'Jewelry',   price: 35.0,  was: 58.0,  rating: 4.9, reviews: 489,  seed: 'hoops-gold',      badge: 'AI Pick',    stock: 21, shipFrom: 2, shipTo: 5 },
  { name: 'Coastal Everyday Tee',       nameAr: 'تيشيرت كوستال',             brand: 'Coastal',   audience: 'men',    type: 'clothing',    sub: 'T-shirts',  price: 18.0,  was: 28.0,  rating: 4.5, reviews: 612,  seed: 'tee-coastal',     badge: null,         stock: 88, shipFrom: 2, shipTo: 4 },
  { name: 'Rainbow Kids Hoodie',        nameAr: 'هودي الأطفال راينبو',        brand: 'Cubby',     audience: 'kids',   type: 'clothing',    sub: 'Hoodies',   price: 22.0,  was: 34.0,  rating: 4.8, reviews: 158,  seed: 'hoodie-kids',     badge: 'Trending',   stock: 29, shipFrom: 3, shipTo: 5 },
  { name: 'Trail Sportswear Set',       nameAr: 'طقم ترِيل الرياضي',          brand: 'Trail',     audience: 'women',  type: 'sport',       sub: 'Sportswear',price: 44.0,  was: 68.0,  rating: 4.7, reviews: 276,  seed: 'sportset-trail',  badge: null,         stock: 24, shipFrom: 3, shipTo: 6 },
];

async function ensureDemoSeller() {
  const email = 'demo-seller@liva.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('DemoSeed!Pass1', 12),
      firstName: 'Demo',
      lastName: 'Seller',
      phone: '+9710000000000',
      role: 'business',
      provider: 'email',
      businessName: 'LIVA Demo Store',
      verified: true,
    },
  });
}

async function main() {
  const seller = await ensureDemoSeller();

  let inserted = 0, skipped = 0;
  for (const p of PRODUCTS) {
    const already = await prisma.product.findFirst({ where: { seed: p.seed } });
    if (already) { skipped++; continue; }
    await prisma.product.create({
      data: { ...p, imageUrls: JSON.stringify([]), sellerId: seller.id },
    });
    inserted++;
  }
  console.log(`[seed] seller ${seller.email} · inserted ${inserted} products, skipped ${skipped} existing`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
