// Products state — backend-first with seed fallback.
//
// On mount we paint the local seed catalog immediately (instant startup)
// then hit /api/products in the background. If the backend answers we
// replace the visible list; if it fails we keep the seed showing. This
// keeps offline demos working while giving the real product catalog
// authority whenever the server is up.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PRODUCTS as SEED_PRODUCTS, Product } from '@/data';
import { apiListProducts, ServerProduct } from '@/lib/api';

// Adapter — the server Product shape → the mobile Product shape used by the
// UI. Fills seed-only fields (sizes/colors) from the local catalog when the
// server row shares a `seed` key with a known local product.
function toLocal(server: ServerProduct): Product {
  const seedMatch = SEED_PRODUCTS.find((p) => p.seed === server.seed);
  return {
    id: server.id,
    name: server.name,
    nameAr: server.nameAr || seedMatch?.nameAr || server.name,
    brand: server.brand || seedMatch?.brand || '',
    audience: (server.audience as Product['audience']) || 'unisex',
    type: (server.type as Product['type']) || 'electronics',
    sub: server.sub || seedMatch?.sub || '',
    price: server.price,
    was: server.was,
    rating: server.rating,
    reviews: server.reviews,
    seed: server.seed,
    images: (server.imageUrls.length ? server.imageUrls : seedMatch?.images) ?? [],
    badge: (server.badge as Product['badge']) ?? seedMatch?.badge ?? null,
    colors: seedMatch?.colors || [],
    sizes: seedMatch?.sizes || [],
    stock: server.stock,
    ship: [server.shipFrom, server.shipTo] as [number, number],
    install: server.install,
  };
}

interface ProductsCtx {
  products: Product[];
  source: 'seed' | 'server';
  reloading: boolean;
  reload: () => Promise<void>;
}

const Ctx = createContext<ProductsCtx | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [source, setSource] = useState<'seed' | 'server'>('seed');
  const [reloading, setReloading] = useState(false);

  const reload = useCallback(async () => {
    setReloading(true);
    try {
      const res = await apiListProducts({ take: 100 });
      if (res.items.length > 0) {
        setProducts(res.items.map(toLocal));
        setSource('server');
      }
    } catch {
      // Backend offline — keep the seed showing. No toast; this is silent.
    } finally {
      setReloading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => ({ products, source, reloading, reload }), [products, source, reloading, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProducts(): ProductsCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProducts must be inside ProductsProvider');
  return v;
}
