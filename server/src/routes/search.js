// Search endpoint — case-insensitive substring match across name, brand,
// sub-category, and Arabic name. Ranks by rating desc, then created-desc.
//
// This is a solid v1 that runs on any Prisma-supported DB. To upgrade:
//   • Postgres: swap `contains` for `search:` (Prisma FTS) or hand-write
//     `to_tsquery` in $queryRaw for weighted ranking.
//   • Algolia:  index products on write, replace this handler with a
//     `client.search()` call that returns their ranked hits.

import { Router } from 'express';
import { prisma } from '../lib/db.js';

const router = Router();
const inflate = (p) => ({ ...p, imageUrls: JSON.parse(p.imageUrls || '[]') });

// Common typo suggestions — cheap client-friendly hints for zero-result queries
const SUGGESTIONS = ['sneakers', 'earbuds', 'perfume', 'watch', 'dress', 'sunglasses', 'charger'];

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 1) return res.json({ q, total: 0, items: [], suggestions: SUGGESTIONS });

    const items = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name:   { contains: q } },
          { nameAr: { contains: q } },
          { brand:  { contains: q } },
          { sub:    { contains: q } },
          { type:   { contains: q } },
        ],
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: 40,
    });

    res.json({
      q,
      total: items.length,
      items: items.map(inflate),
      suggestions: items.length === 0 ? SUGGESTIONS : [],
    });
  } catch (err) { next(err); }
});

export default router;
