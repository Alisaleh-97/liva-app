// data.jsx — LIVA marketplace data v2. Exports to window: LIVA_DATA

// colour swatches reused across variants
const C = {
  black: '#1b1b1f', white: '#ECECEE', sand: '#D9C7A8', stone: '#9AA0A6', rose: '#E5A6B0',
  navy: '#2A3550', olive: '#6B7150', clay: '#C08457', lilac: '#B7A6E0', gold: '#D9B25A',
  teal: '#3E8E8A', cherry: '#C0414B', sky: '#8FB4D9',
};

// Home quick-category row (audience + type) — t() keys resolve the label
const CATEGORIES = [
  { id: 'women', key: 'cat_women', seed: 'cat-women' },
  { id: 'men', key: 'cat_men', seed: 'cat-men' },
  { id: 'kids', key: 'cat_kids', seed: 'cat-kids' },
  { id: 'clothing', key: 'cat_clothing', seed: 'cat-cloth' },
  { id: 'accessories', key: 'cat_accessories', seed: 'cat-acc' },
  { id: 'electronics', key: 'cat_electronics', seed: 'cat-tech' },
  { id: 'beauty', key: 'cat_beauty', seed: 'cat-beauty' },
  { id: 'home', key: 'cat_home', seed: 'cat-home' },
];

// Shop top-level filter chips (by t-key)
const SHOP_FILTERS = [
  { id: 'ai', key: 'aiRecommended', icon: 'ai' },
  { id: 'trending', key: 'trending', icon: 'flame' },
  { id: 'all', key: 'cat_all', icon: null },
  { id: 'women', key: 'cat_women', icon: null },
  { id: 'men', key: 'cat_men', icon: null },
  { id: 'kids', key: 'cat_kids', icon: null },
  { id: 'clothing', key: 'cat_clothing', icon: null },
  { id: 'accessories', key: 'cat_accessories', icon: null },
  { id: 'electronics', key: 'cat_electronics', icon: null },
  { id: 'beauty', key: 'cat_beauty', icon: null },
  { id: 'home', key: 'cat_home', icon: null },
];

const SIZES_APPAREL = ['XS', 'S', 'M', 'L', 'XL'];
const SIZES_SHOE = ['38', '39', '40', '41', '42', '43'];

// audience: women|men|kids|unisex ; type: clothing|accessories|electronics|beauty|home|sport
const PRODUCTS = [
  { id: 'p1', name: 'Aura Smartwatch S9', nameAr: 'ساعة أورا الذكية S9', brand: 'Aura', audience: 'unisex', type: 'electronics', sub: 'Watches',
    price: 49.99, was: 89.99, rating: 4.8, reviews: 1240, seed: 'watch-steel', badge: 'AI Pick',
    colors: [{ n: 'Graphite', hex: C.black }, { n: 'Silver', hex: C.stone }, { n: 'Gold', hex: C.gold }], sizes: [], stock: 23, ship: [2, 4], install: true },
  { id: 'p2', name: 'Pulse Pro Earbuds', nameAr: 'سماعات بَلس برو', brand: 'Pulse', audience: 'unisex', type: 'electronics', sub: 'Audio',
    price: 29.99, was: 45.99, rating: 4.7, reviews: 980, seed: 'earbuds-jet', badge: 'Trending',
    colors: [{ n: 'Jet', hex: C.black }, { n: 'Cloud', hex: C.white }], sizes: [], stock: 64, ship: [2, 3], install: true },
  { id: 'p3', name: 'Velvet Rose Eau de Parfum', nameAr: 'عطر فيلفيت روز', brand: 'Velvet', audience: 'women', type: 'beauty', sub: 'Fragrance',
    price: 39.99, was: 57.0, rating: 4.8, reviews: 256, seed: 'perfume-rose', badge: 'Hot',
    colors: [{ n: '50ml', hex: C.rose }, { n: '100ml', hex: C.clay }], sizes: [], stock: 12, ship: [1, 3], install: false },
  { id: 'p4', name: 'Halo Ring Light 18"', nameAr: 'إضاءة هالو الحلقية', brand: 'Halo', audience: 'unisex', type: 'electronics', sub: 'Studio',
    price: 34.5, was: 59.0, rating: 4.6, reviews: 612, seed: 'ringlight', badge: null,
    colors: [{ n: 'White', hex: C.white }], sizes: [], stock: 40, ship: [3, 5], install: true },
  { id: 'p5', name: 'Cloudstep Runners', nameAr: 'حذاء كلاودستيب', brand: 'Cloudstep', audience: 'unisex', type: 'sport', sub: 'Footwear',
    price: 62.0, was: 99.0, rating: 4.9, reviews: 2010, seed: 'sneaker-run', badge: 'Trending',
    colors: [{ n: 'Storm', hex: C.navy }, { n: 'Sand', hex: C.sand }, { n: 'Cherry', hex: C.cherry }], sizes: SIZES_SHOE, stock: 31, ship: [2, 4], install: true },
  { id: 'p6', name: 'Lumen Silk Serum', nameAr: 'سيروم لومن الحريري', brand: 'Lumen', audience: 'women', type: 'beauty', sub: 'Skincare',
    price: 24.0, was: 38.0, rating: 4.7, reviews: 430, seed: 'serum-glow', badge: 'AI Pick',
    colors: [{ n: '30ml', hex: C.gold }], sizes: [], stock: 55, ship: [1, 3], install: false },
  { id: 'p7', name: 'Nordic Knit Overshirt', nameAr: 'قميص نورديك الصوفي', brand: 'Nordic', audience: 'men', type: 'clothing', sub: 'Jackets',
    price: 45.0, was: 70.0, rating: 4.5, reviews: 188, seed: 'knit-stone', badge: null,
    colors: [{ n: 'Stone', hex: C.stone }, { n: 'Olive', hex: C.olive }, { n: 'Navy', hex: C.navy }], sizes: SIZES_APPAREL, stock: 18, ship: [3, 6], install: false },
  { id: 'p8', name: 'Terra Ceramic Mug Set', nameAr: 'طقم أكواب تيرا', brand: 'Terra', audience: 'unisex', type: 'home', sub: 'Kitchen',
    price: 28.0, was: 40.0, rating: 4.8, reviews: 320, seed: 'mug-clay', badge: null,
    colors: [{ n: 'Clay', hex: C.clay }, { n: 'Sage', hex: C.olive }], sizes: [], stock: 47, ship: [3, 5], install: false },
  { id: 'p9', name: 'Flux 65W GaN Charger', nameAr: 'شاحن فلكس 65 واط', brand: 'Flux', audience: 'unisex', type: 'electronics', sub: 'Power',
    price: 19.99, was: 32.0, rating: 4.9, reviews: 1500, seed: 'charger-flux', badge: 'Price drop',
    colors: [{ n: 'White', hex: C.white }, { n: 'Black', hex: C.black }], sizes: [], stock: 120, ship: [2, 4], install: false },
  { id: 'p10', name: 'Mirae Gloss Tint Trio', nameAr: 'ثلاثية ميراي للشفاه', brand: 'Mirae', audience: 'women', type: 'beauty', sub: 'Makeup',
    price: 21.0, was: 33.0, rating: 4.6, reviews: 274, seed: 'gloss-trio', badge: null,
    colors: [{ n: 'Rosewood', hex: C.rose }, { n: 'Cherry', hex: C.cherry }], sizes: [], stock: 38, ship: [1, 3], install: false },
  { id: 'p11', name: 'Drift Linen Tote', nameAr: 'حقيبة دريفت الكتانية', brand: 'Drift', audience: 'women', type: 'accessories', sub: 'Bags',
    price: 33.0, was: 49.0, rating: 4.7, reviews: 142, seed: 'tote-linen', badge: 'Trending',
    colors: [{ n: 'Natural', hex: C.sand }, { n: 'Black', hex: C.black }], sizes: [], stock: 26, ship: [3, 5], install: false },
  { id: 'p12', name: 'Orbit Smart Bottle', nameAr: 'زجاجة أوربت الذكية', brand: 'Orbit', audience: 'unisex', type: 'home', sub: 'Fitness',
    price: 26.5, was: 39.0, rating: 4.5, reviews: 388, seed: 'bottle-orbit', badge: null,
    colors: [{ n: 'Mist', hex: C.sky }, { n: 'Teal', hex: C.teal }], sizes: [], stock: 52, ship: [2, 4], install: false },
  { id: 'p13', name: 'Aurora Wrap Dress', nameAr: 'فستان أورورا', brand: 'Aurora', audience: 'women', type: 'clothing', sub: 'Dresses',
    price: 52.0, was: 84.0, rating: 4.8, reviews: 364, seed: 'dress-aurora', badge: 'Hot',
    colors: [{ n: 'Lilac', hex: C.lilac }, { n: 'Navy', hex: C.navy }, { n: 'Cherry', hex: C.cherry }], sizes: SIZES_APPAREL, stock: 15, ship: [3, 6], install: true },
  { id: 'p14', name: 'Eclipse Polarized Sunglasses', nameAr: 'نظارة إكليبس الشمسية', brand: 'Eclipse', audience: 'unisex', type: 'accessories', sub: 'Sunglasses',
    price: 27.0, was: 45.0, rating: 4.6, reviews: 210, seed: 'sunnies-eclipse', badge: null,
    colors: [{ n: 'Black', hex: C.black }, { n: 'Tortoise', hex: C.clay }], sizes: [], stock: 33, ship: [2, 4], install: false },
  { id: 'p15', name: 'Mira Gold Hoop Earrings', nameAr: 'أقراط ميرا الذهبية', brand: 'Mira', audience: 'women', type: 'accessories', sub: 'Jewelry',
    price: 35.0, was: 58.0, rating: 4.9, reviews: 489, seed: 'hoops-gold', badge: 'AI Pick',
    colors: [{ n: 'Gold', hex: C.gold }, { n: 'Silver', hex: C.stone }], sizes: [], stock: 21, ship: [2, 5], install: false },
  { id: 'p16', name: 'Coastal Everyday Tee', nameAr: 'تيشيرت كوستال', brand: 'Coastal', audience: 'men', type: 'clothing', sub: 'T-shirts',
    price: 18.0, was: 28.0, rating: 4.5, reviews: 612, seed: 'tee-coastal', badge: null,
    colors: [{ n: 'White', hex: C.white }, { n: 'Sky', hex: C.sky }, { n: 'Black', hex: C.black }], sizes: SIZES_APPAREL, stock: 88, ship: [2, 4], install: false },
  { id: 'p17', name: 'Rainbow Kids Hoodie', nameAr: 'هودي الأطفال راينبو', brand: 'Cubby', audience: 'kids', type: 'clothing', sub: 'Hoodies',
    price: 22.0, was: 34.0, rating: 4.8, reviews: 158, seed: 'hoodie-kids', badge: 'Trending',
    colors: [{ n: 'Sunny', hex: C.gold }, { n: 'Sky', hex: C.sky }, { n: 'Rose', hex: C.rose }], sizes: ['2-3y', '4-5y', '6-7y', '8-9y'], stock: 29, ship: [3, 5], install: false },
  { id: 'p18', name: 'Trail Sportswear Set', nameAr: 'طقم ترِيل الرياضي', brand: 'Trail', audience: 'women', type: 'sport', sub: 'Sportswear',
    price: 44.0, was: 68.0, rating: 4.7, reviews: 276, seed: 'sportset-trail', badge: null,
    colors: [{ n: 'Sage', hex: C.olive }, { n: 'Black', hex: C.black }, { n: 'Lilac', hex: C.lilac }], sizes: SIZES_APPAREL, stock: 24, ship: [3, 6], install: true },
];

// images = 4 derived seeds per product so the gallery shows varied angles
PRODUCTS.forEach(p => { p.images = [p.seed, p.seed + '-2', p.seed + '-3', p.seed + '-4']; });
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

const BRANDS = [...new Set(PRODUCTS.map(p => p.brand))];

// ── Reviews ──────────────────────────────────────────────────────────
const REVIEW_POOL = [
  { user: 'Layla',  seed: 'rev-layla',  rating: 5, text: 'Exactly as shown in the live. Quality is better than I expected.', textAr: 'تماماً كما ظهر في البث. الجودة أفضل مما توقعت.', verified: true, photo: true, helpful: 42 },
  { user: 'Omar',   seed: 'rev-omar',   rating: 5, text: 'Fast delivery to Dubai, arrived in 2 days. Highly recommend.', textAr: 'توصيل سريع إلى دبي، وصل خلال يومين. أنصح به بشدة.', verified: true, photo: false, helpful: 28 },
  { user: 'Sara',   seed: 'rev-sara',   rating: 4, text: 'Love it overall — runs slightly small, size up if unsure.', textAr: 'أحببته عموماً — المقاس صغير قليلاً، اختر مقاساً أكبر.', verified: true, photo: true, helpful: 19 },
  { user: 'Hana',   seed: 'rev-hana',   rating: 5, text: 'Worth every dirham. Bought a second one as a gift.', textAr: 'يستحق كل درهم. اشتريت واحدة أخرى كهدية.', verified: true, photo: false, helpful: 15 },
  { user: 'Yousef', seed: 'rev-yousef', rating: 4, text: 'Good value. Packaging could be a bit better but product is great.', textAr: 'قيمة جيدة. التغليف يمكن تحسينه لكن المنتج ممتاز.', verified: false, photo: false, helpful: 9 },
  { user: 'Noor',   seed: 'rev-noor',   rating: 5, text: 'Colour is true to the photos. Seller answered my questions on chat.', textAr: 'اللون مطابق للصور. ردّ البائع على أسئلتي في الدردشة.', verified: true, photo: true, helpful: 23 },
];
// deterministic 4–5 reviews + rating distribution per product
function reviewsFor(id) {
  const p = byId[id];
  const n = (p.id.charCodeAt(1) % 3) + 4; // 4..6
  const list = [];
  for (let i = 0; i < n; i++) list.push({ ...REVIEW_POOL[(p.id.length + i * 2 + id.charCodeAt(id.length - 1)) % REVIEW_POOL.length], id: id + '-r' + i });
  // mark first as most-helpful
  list.sort((a, b) => b.helpful - a.helpful);
  return list;
}

const SELLERS = [
  { id: 's1', name: 'Tech World', handle: '@techworld', rating: 4.9, sales: 25300, seed: 'tech-world', verified: true },
  { id: 's2', name: 'Beauty Star', handle: '@beautystar', rating: 4.8, sales: 18600, seed: 'beauty-star', verified: true },
  { id: 's3', name: 'Home Pro', handle: '@homepro', rating: 4.7, sales: 14200, seed: 'home-pro', verified: false },
  { id: 's4', name: 'Style Store', handle: '@stylestore', rating: 4.6, sales: 9800, seed: 'style-store', verified: false },
  { id: 's5', name: 'Sara Store', handle: '@sarastore', rating: 4.7, sales: 8400, seed: 'sara-store', verified: true },
];
const sellerFor = (p) => SELLERS[(p.id.charCodeAt(1)) % SELLERS.length];

const STREAMS = [
  { id: 'l1', title: 'Glow Up Friday — perfume drop', titleAr: 'جمعة التألق — إطلاق العطر', host: 's2', viewers: 12500, likes: 25800, product: 'p3', tags: ['Beauty', 'Flash sale'], hot: true },
  { id: 'l2', title: 'Gadget speed-run: 12 deals', titleAr: 'جولة سريعة: ١٢ عرضاً تقنياً', host: 's1', viewers: 8800, likes: 14200, product: 'p1', tags: ['Tech'], hot: true },
  { id: 'l3', title: 'Cozy home restyle', titleAr: 'تجديد إطلالة المنزل', host: 's3', viewers: 3200, likes: 6100, product: 'p8', tags: ['Home'], hot: false },
  { id: 'l4', title: 'Run club fit check', titleAr: 'إطلالات نادي الجري', host: 's4', viewers: 5400, likes: 9300, product: 'p5', tags: ['Sport'], hot: false },
];

const AI_PICKS = [
  { product: 'p9', reason: 'Price drop detected — 38% under 30-day avg', confidence: 'High' },
  { product: 'p5', reason: 'Trending in your region this week', confidence: 'High' },
  { product: 'p15', reason: 'Pairs with items in your wishlist', confidence: 'Med' },
  { product: 'p1', reason: 'High conversion rate in live sessions', confidence: 'Med' },
];

// promo banners for the home slider
const BANNERS = [
  { id: 'b1', seed: 'banner-mega', kicker: 'MEGA WEEK', kickerAr: 'أسبوع العروض', title: 'Up to 60% off', titleAr: 'خصومات حتى ٦٠٪', sub: 'Fashion · Beauty · Tech', subAr: 'أزياء · جمال · تقنية', cta: 'Shop deals' },
  { id: 'b2', seed: 'banner-new', kicker: 'NEW IN', kickerAr: 'وصل حديثاً', title: 'Spring drops', titleAr: 'تشكيلة الربيع', sub: 'Fresh fits for the season', subAr: 'إطلالات جديدة للموسم', cta: 'Explore' },
  { id: 'b3', seed: 'banner-pay', kicker: 'PAY MONTHLY', kickerAr: 'قسّط شهرياً', title: 'Split in 3, 6 or 12', titleAr: 'قسّط على ٣ أو ٦ أو ١٢', sub: '0% interest on eligible items', subAr: 'بدون فوائد على المنتجات المؤهلة', cta: 'Learn more' },
];

const CHAT_SEED = [
  { user: 'Noor', seed: 'noor', text: 'this scent is amazing 😍', intent: false },
  { user: 'Ahmad', seed: 'ahmad', text: 'is it long lasting?', intent: false },
  { user: 'Sara', seed: 'sara', text: 'how many left in stock?', intent: true },
  { user: 'Lina', seed: 'lina', text: 'just bought 2! 🛍️', intent: true },
  { user: 'Omar', seed: 'omar', text: 'does it ship today?', intent: false },
  { user: 'Maya', seed: 'maya', text: 'take my money 💳', intent: true },
  { user: 'Yara', seed: 'yara', text: 'gift wrap available?', intent: false },
  { user: 'Zaid', seed: 'zaid', text: 'best deal i\'ve seen all week', intent: false },
  { user: 'Hana', seed: 'hana', text: 'add the travel size pls', intent: true },
  { user: 'Tariq', seed: 'tariq', text: 'joined from the AI feed 👋', intent: false },
];

const EARN = {
  balance: 1256.75, total: 3568.9, growth: 15.6,
  breakdown: [
    { label: 'Live sales', amount: 1840.2, key: 'live' },
    { label: 'Affiliate', amount: 920.5, key: 'affiliate' },
    { label: 'AI boosts', amount: 512.4, key: 'ai' },
    { label: 'Bonuses', amount: 295.8, key: 'bonus' },
  ],
  series: [120, 180, 140, 210, 260, 230, 300, 280, 360, 410, 380, 470, 520, 610],
  referrals: { count: 38, perUser: 12.5, multiplier: 1.4, link: 'liva.live/r/ava92' },
};

const AI_QUICK = [
  { id: 'golive', key: 'goLiveNow', icon: 'live' },
  { id: 'buytrend', key: 'buyTrending', icon: 'flame' },
  { id: 'promote', key: 'promoteProduct', icon: 'trend' },
  { id: 'market', key: 'analyzeMarket', icon: 'ai' },
];
const AI_GREETING = {
  en: "Hey Ava — I track your sales, the market, and what's about to trend. Ask me what to buy, what to sell, or when to go live.",
  ar: 'مرحباً آفا — أتابع مبيعاتك والسوق وما سيصبح رائجاً. اسألني ماذا تشتري أو تبيع أو متى تبثّ مباشرةً.',
};

const TRENDING_SEARCHES = ['Smartwatch', 'Perfume', 'Runners', 'Tote bag', 'Earbuds', 'Wrap dress', 'Gold hoops'];

Object.assign(window, {
  LIVA_DATA: {
    CATEGORIES, SHOP_FILTERS, PRODUCTS, byId, BRANDS, SELLERS, sellerFor, STREAMS, AI_PICKS,
    BANNERS, CHAT_SEED, EARN, AI_QUICK, AI_GREETING, TRENDING_SEARCHES, reviewsFor, COLORS: C,
  },
});
