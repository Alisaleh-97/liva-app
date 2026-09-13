// Compare context — lightweight in-memory queue of products the shopper
// has flagged to compare. Max 4 items. Accessed via useCompare().

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Product } from '@/data';

interface CompareCtx {
  items: Product[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const Ctx = createContext<CompareCtx | null>(null);
const MAX = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  const add = useCallback((p: Product) => {
    setItems((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev;
      return prev.length >= MAX ? [...prev.slice(1), p] : [...prev, p];
    });
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id: string) => items.some((x) => x.id === id), [items]);

  const value = useMemo(() => ({ items, add, remove, clear, has }), [items, add, remove, clear, has]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare(): CompareCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCompare must be inside CompareProvider');
  return v;
}
