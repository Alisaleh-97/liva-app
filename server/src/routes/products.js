// Products REST — public list/read, seller-scoped write.
// GET  /api/products              — filterable list (type, q, min/max price, sort)
// GET  /api/products/:id          — single product
// POST /api/products              — seller-only, create
// PATCH /api/products/:id         — seller-only, update own product
// DELETE /api/products/:id        — seller-only, soft-delete via active=false

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';

const router = Router();

// JSON columns roundtrip helper — SQLite stores our imageUrls as a JSON string
const inflate = (p) => p && ({ ...p, imageUrls: JSON.parse(p.imageUrls || '[]') });

const createSchema = z.object({
  name:      z.string().min(1).max(200),
  nameAr:    z.string().max(200).optional(),
  brand:     z.string().max(80).optional(),
  audience:  z.enum(['women', 'men', 'kids', 'unisex']).default('unisex'),
  type:      z.string().min(1).max(60),
  sub:       z.string().max(60).optional(),
  price:     z.number().nonnegative(),
  was:       z.number().nonnegative().optional(),
  seed:      z.string().min(1).max(60),
  imageUrls: z.array(z.string().url()).default([]),
  badge:     z.string().max(40).optional(),
  stock:     z.number().int().nonnegative().default(0),
  shipFrom:  z.number().int().positive().default(2),
  shipTo:    z.number().int().positive().default(4),
  install:   z.boolean().default(false),
});

router.get('/', async (req, res, next) => {
  try {
    const { type, q, minPrice, maxPrice, sort = 'new', take = '40', skip = '0' } = req.query;
    const where = { active: true };
    if (type) where.type = String(type);
    if (q) where.OR = [
      { name:  { contains: String(q) } },
      { brand: { contains: String(q) } },
      { sub:   { contains: String(q) } },
    ];
    if (minPrice) where.price = { ...(where.price || {}), gte: Number(minPrice) };
    if (maxPrice) where.price = { ...(where.price || {}), lte: Number(maxPrice) };

    const orderBy =
      sort === 'price_asc'  ? { price: 'asc' } :
      sort === 'price_desc' ? { price: 'desc' } :
      sort === 'rating'     ? { rating: 'desc' } :
                              { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, take: Math.min(100, Number(take) || 40), skip: Number(skip) || 0 }),
      prisma.product.count({ where }),
    ]);
    res.json({ total, items: items.map(inflate) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!p || !p.active) return res.status(404).json({ error: 'Not found' });
    res.json({ product: inflate(p) });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'business') return res.status(403).json({ error: 'Sellers only' });
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
    const p = await prisma.product.create({
      data: { ...parsed.data, imageUrls: JSON.stringify(parsed.data.imageUrls), sellerId: req.user.id },
    });
    res.json({ product: inflate(p) });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'business') return res.status(403).json({ error: 'Sellers only' });
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your product' });

    const partial = createSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ error: partial.error.issues[0]?.message || 'Invalid input' });
    const data = { ...partial.data };
    if (partial.data.imageUrls) data.imageUrls = JSON.stringify(partial.data.imageUrls);
    const p = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json({ product: inflate(p) });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'business') return res.status(403).json({ error: 'Sellers only' });
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.sellerId !== req.user.id) return res.status(403).json({ error: 'Not your product' });
    // Soft delete so historical orders keep the reference
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
