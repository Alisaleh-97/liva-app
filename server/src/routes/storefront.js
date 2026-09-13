// Public web storefronts — each seller gets a shareable URL: /store/:handle
// Renders a responsive HTML page (no JS framework needed) so buyers can browse
// without installing the app. Deep links into Expo Go when "Open in LIVA" tapped.
import { Router } from 'express';
import { PRODUCTS } from '../catalog.js';

const router = Router();

// Demo: real implementation would look up seller by handle in DB
const DEMO_STORES = {
  'ava-boutique': {
    handle: 'ava-boutique',
    name: "Ava's Boutique",
    bio: 'Curated beauty, fashion, and lifestyle. Live every Thursday 8 PM.',
    accentFrom: '#8B5CF6',
    accentTo: '#EC4899',
    productIds: ['p3', 'p10', 'p6', 'p13', 'p15', 'p11'],
    followers: 2480,
    rating: 4.8,
    verified: true,
  },
  'tech-world': {
    handle: 'tech-world',
    name: 'Tech World',
    bio: 'Latest gadgets at unbeatable live prices.',
    accentFrom: '#6366F1',
    accentTo: '#22D3EE',
    productIds: ['p1', 'p2', 'p4', 'p9'],
    followers: 25300,
    rating: 4.9,
    verified: true,
  },
};

function escape(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function productCard(p, store) {
  return `<div class="card">
    <div class="thumb" style="background:linear-gradient(135deg, ${store.accentFrom}, ${store.accentTo})"></div>
    <div class="body">
      <div class="brand">${escape(p.brand)}</div>
      <div class="name">${escape(p.name)}</div>
      <div class="row">
        <span class="price">$${p.price.toFixed(2)}</span>
        <a class="buy" href="liva://product/${p.id}">Buy</a>
      </div>
    </div>
  </div>`;
}

router.get('/:handle', (req, res) => {
  const store = DEMO_STORES[req.params.handle];
  if (!store) return res.status(404).send('<h1>Store not found</h1>');
  const products = store.productIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(store.name)} on LIVA</title>
<meta property="og:title" content="${escape(store.name)} on LIVA" />
<meta property="og:description" content="${escape(store.bio)}" />
<style>
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #0D0A16; color: #F4F1F8; min-height: 100vh; }
.hero {
  background: linear-gradient(135deg, ${store.accentFrom}, ${store.accentTo});
  padding: 48px 24px 64px;
  text-align: center;
  color: #fff;
}
.logo { font-weight: 800; font-size: 13px; letter-spacing: 4px; opacity: .8; margin-bottom: 12px; }
.hero h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
.bio { opacity: .9; max-width: 540px; margin: 0 auto 18px; font-size: 14px; line-height: 1.5; }
.stats { display: inline-flex; gap: 18px; padding: 10px 18px; background: rgba(0,0,0,.25); border-radius: 999px; font-size: 13px; }
.stats b { font-weight: 800; }
.verified { display: inline-block; background: rgba(255,255,255,.2); padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-left: 8px; }
.section-title { padding: 32px 24px 16px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: rgba(244,241,248,.55); text-transform: uppercase; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 18px 24px; max-width: 880px; margin: 0 auto; }
@media (min-width: 720px) { .grid { grid-template-columns: repeat(4, 1fr); } }
.card { background: #171221; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; overflow: hidden; }
.thumb { aspect-ratio: 1/1; }
.body { padding: 12px; }
.brand { font-size: 10.5px; font-weight: 700; color: ${store.accentFrom}; text-transform: uppercase; letter-spacing: .5px; }
.name { font-size: 13.5px; font-weight: 600; margin: 4px 0 8px; line-height: 1.35; }
.row { display: flex; align-items: center; justify-content: space-between; }
.price { font-weight: 800; font-size: 15px; }
.buy { background: #22C55E; color: #04210f; padding: 6px 14px; border-radius: 999px; text-decoration: none; font-weight: 800; font-size: 12px; }
.cta { display: block; max-width: 280px; margin: 32px auto 48px; text-align: center; padding: 14px 22px; background: linear-gradient(135deg, ${store.accentFrom}, ${store.accentTo}); color: #fff; text-decoration: none; font-weight: 800; border-radius: 16px; }
footer { padding: 24px; text-align: center; font-size: 11px; color: rgba(244,241,248,.4); }
</style>
</head>
<body>
  <header class="hero">
    <div class="logo">LIVA · LIVE · SHOP · EARN</div>
    <h1>${escape(store.name)}${store.verified ? '<span class="verified">VERIFIED</span>' : ''}</h1>
    <p class="bio">${escape(store.bio)}</p>
    <div class="stats">
      <span><b>${store.followers.toLocaleString()}</b> followers</span>
      <span><b>★ ${store.rating}</b></span>
      <span><b>${products.length}</b> products</span>
    </div>
  </header>
  <div class="section-title">Featured products</div>
  <div class="grid">
    ${products.map((p) => productCard(p, store)).join('')}
  </div>
  <a class="cta" href="liva://store/${store.handle}">Open in LIVA</a>
  <footer>© LIVA. Live shopping for the next billion buyers.</footer>
</body>
</html>`;
  res.set('Content-Type', 'text/html').send(html);
});

router.get('/', (_req, res) => {
  const list = Object.values(DEMO_STORES).map((s) => `<li><a href="/store/${s.handle}">${escape(s.name)}</a></li>`).join('');
  res.set('Content-Type', 'text/html').send(`<!doctype html><html><body style="font-family:sans-serif;padding:32px"><h1>LIVA Stores</h1><ul>${list}</ul></body></html>`);
});

export default router;
