// App-wide persistent state. Everything here syncs to AsyncStorage automatically
// after first hydration.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { load, save, KEYS } from '@/lib/storage';
import { Product } from '@/data';

// ── Orders ─────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  product: Product;
  qty: number;
  total: number;
  placedAt: number;
  status?: 'confirmed' | 'packed' | 'shipped' | 'ofd' | 'delivered' | 'cancelled';
  paymentStatus?: 'paid' | 'cod_pending' | 'refunded';
}

// ── Promotions ─────────────────────────────────────────────────────────────
export type PromoKind = 'percent' | 'fixed' | 'flash' | 'bundle';
export interface Promotion {
  id: string;
  name: string;
  code: string;
  kind: PromoKind;
  value: number;          // percent off (1-100) or fixed USD
  active: boolean;
  productId?: string;     // empty = catalog-wide
  startsAt?: number;
  endsAt?: number;
  redemptions: number;
  createdAt: number;
}

// ── Payouts ────────────────────────────────────────────────────────────────
export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'bank' | 'wallet';
  requestedAt: number;
  completedAt?: number;
  bankLast4?: string;
}

// ── Addresses ──────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  label: string;                   // Home, Work, Storefront, etc.
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

// ── Loyalty (LIVA Coins) ───────────────────────────────────────────────────
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export interface LoyaltyTxn { id: string; reason: string; amount: number; at: number; }
export interface LoyaltyState { coins: number; lifetime: number; txns: LoyaltyTxn[]; }

export function tierForLifetime(lifetime: number): LoyaltyTier {
  if (lifetime >= 5000) return 'diamond';
  if (lifetime >= 2000) return 'gold';
  if (lifetime >= 500) return 'silver';
  return 'bronze';
}

export interface AffiliateLink {
  id: string;
  productId?: string;     // empty = whole store
  code: string;           // user-facing share code
  clicks: number;
  conversions: number;
  earnings: number;       // USD
  createdAt: number;
}

// ── Payment methods ────────────────────────────────────────────────────────
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'card';
export interface PaymentMethod {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
  isDefault: boolean;
}

// ── Context ────────────────────────────────────────────────────────────────
interface AppCtxValue {
  // Shopper
  wishlist: Set<string>;
  toggleWish: (id: string) => void;
  orders: Order[];
  addOrder: (o: Omit<Order, 'id' | 'placedAt'> & Partial<Pick<Order, 'id' | 'placedAt'>>) => Order;
  extras: Product[];
  addExtra: (p: Product) => void;
  // Seller inventory
  sellerProducts: Product[];
  addSellerProduct: (p: Product) => void;
  updateSellerProduct: (id: string, patch: Partial<Product>) => void;
  removeSellerProduct: (id: string) => void;
  // Promotions
  promotions: Promotion[];
  addPromotion: (p: Omit<Promotion, 'id' | 'createdAt' | 'redemptions'>) => Promotion;
  togglePromotion: (id: string) => void;
  removePromotion: (id: string) => void;
  // Payouts
  payouts: Payout[];
  requestPayout: (amount: number, method: 'bank' | 'wallet', bankLast4?: string) => Payout;
  // Addresses
  addresses: Address[];
  addAddress: (a: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) => Address;
  updateAddress: (id: string, patch: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  // Payment methods
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (m: Omit<PaymentMethod, 'id' | 'isDefault'> & { isDefault?: boolean }) => PaymentMethod;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  // Loyalty
  loyalty: LoyaltyState;
  awardCoins: (reason: string, amount: number) => void;
  redeemCoins: (reason: string, amount: number) => boolean;
  // Affiliate
  affiliateLinks: AffiliateLink[];
  createAffiliateLink: (productId?: string) => AffiliateLink;
  // Academy
  completedLessons: string[];
  markLessonComplete: (id: string) => void;
  // Recent searches
  recentSearches: string[];
  pushRecentSearch: (q: string) => void;
}

const Ctx = createContext<AppCtxValue | null>(null);
const rid = () => 't' + Date.now() + Math.random().toString(36).slice(2, 6);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set(['p5', 'p9']));
  const [orders, setOrders] = useState<Order[]>([]);
  const [extras, setExtras] = useState<Product[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyState>({ coins: 240, lifetime: 240, txns: [{ id: 'init', reason: 'Welcome bonus', amount: 240, at: Date.now() }] });
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [w, o, e, sp, pr, po, ad, pm, ly, af, ac, rs] = await Promise.all([
        load<string[]>(KEYS.wishlist, ['p5', 'p9']),
        load<Order[]>(KEYS.orders, []),
        load<Product[]>(KEYS.extras, []),
        load<Product[]>(KEYS.sellerProducts, []),
        load<Promotion[]>(KEYS.promotions, []),
        load<Payout[]>(KEYS.payouts, []),
        load<Address[]>(KEYS.addresses, []),
        load<PaymentMethod[]>(KEYS.paymentMethods, []),
        load<LoyaltyState>(KEYS.loyalty, { coins: 240, lifetime: 240, txns: [{ id: 'init', reason: 'Welcome bonus', amount: 240, at: Date.now() }] }),
        load<AffiliateLink[]>(KEYS.affiliate, []),
        load<string[]>(KEYS.academyProgress, []),
        load<string[]>(KEYS.recentSearches, []),
      ]);
      setWishlist(new Set(w));
      setOrders(o);
      setExtras(e);
      setSellerProducts(sp);
      setPromotions(pr);
      setPayouts(po);
      setAddresses(ad);
      setPaymentMethods(pm);
      setLoyalty(ly);
      setAffiliateLinks(af);
      setCompletedLessons(ac);
      setRecentSearches(rs);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => { if (hydrated) save(KEYS.wishlist, [...wishlist]); }, [wishlist, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.orders, orders); }, [orders, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.extras, extras); }, [extras, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.sellerProducts, sellerProducts); }, [sellerProducts, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.promotions, promotions); }, [promotions, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.payouts, payouts); }, [payouts, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.addresses, addresses); }, [addresses, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.paymentMethods, paymentMethods); }, [paymentMethods, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.loyalty, loyalty); }, [loyalty, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.affiliate, affiliateLinks); }, [affiliateLinks, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.academyProgress, completedLessons); }, [completedLessons, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.recentSearches, recentSearches); }, [recentSearches, hydrated]);

  const toggleWish = useCallback((id: string) => {
    setWishlist((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const addOrder = useCallback((o: Omit<Order, 'id' | 'placedAt'> & Partial<Pick<Order, 'id' | 'placedAt'>>) => {
    const order: Order = { ...o, id: o.id || 'o' + Date.now(), placedAt: o.placedAt || Date.now() };
    setOrders((p) => [order, ...p]);
    return order;
  }, []);
  const addExtra = useCallback((p: Product) => {
    setExtras((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
  }, []);
  const addSellerProduct = useCallback((p: Product) => {
    setSellerProducts((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
  }, []);
  const updateSellerProduct = useCallback((id: string, patch: Partial<Product>) => {
    setSellerProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);
  const removeSellerProduct = useCallback((id: string) => {
    setSellerProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addPromotion = useCallback((p: Omit<Promotion, 'id' | 'createdAt' | 'redemptions'>) => {
    const promo: Promotion = { ...p, id: rid(), createdAt: Date.now(), redemptions: 0 };
    setPromotions((prev) => [promo, ...prev]);
    return promo;
  }, []);
  const togglePromotion = useCallback((id: string) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }, []);
  const removePromotion = useCallback((id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const requestPayout = useCallback((amount: number, method: 'bank' | 'wallet', bankLast4?: string) => {
    const payout: Payout = {
      id: rid(), amount, method, status: 'processing', requestedAt: Date.now(), bankLast4,
    };
    setPayouts((prev) => [payout, ...prev]);
    // simulate completion after 2.5s
    setTimeout(() => {
      setPayouts((prev) => prev.map((x) => x.id === payout.id ? { ...x, status: 'completed', completedAt: Date.now() } : x));
    }, 2500);
    return payout;
  }, []);

  const addAddress = useCallback((a: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) => {
    setAddresses((prev) => {
      const isDefault = a.isDefault ?? prev.length === 0;
      const next: Address = { ...a, id: rid(), isDefault };
      return isDefault ? [next, ...prev.map((p) => ({ ...p, isDefault: false }))] : [...prev, next];
    });
    return { ...a, id: rid(), isDefault: a.isDefault ?? false } as Address;
  }, []);
  const updateAddress = useCallback((id: string, patch: Partial<Address>) => {
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);
  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      // promote first to default if we removed the default
      const removedDefault = prev.find((a) => a.id === id)?.isDefault;
      if (removedDefault && filtered.length) filtered[0] = { ...filtered[0], isDefault: true };
      return filtered;
    });
  }, []);
  const setDefaultAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const addPaymentMethod = useCallback((m: Omit<PaymentMethod, 'id' | 'isDefault'> & { isDefault?: boolean }) => {
    setPaymentMethods((prev) => {
      const isDefault = m.isDefault ?? prev.length === 0;
      const next: PaymentMethod = { ...m, id: rid(), isDefault };
      return isDefault ? [next, ...prev.map((p) => ({ ...p, isDefault: false }))] : [...prev, next];
    });
    return { ...m, id: rid(), isDefault: m.isDefault ?? false } as PaymentMethod;
  }, []);
  const removePaymentMethod = useCallback((id: string) => {
    setPaymentMethods((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      const removedDefault = prev.find((p) => p.id === id)?.isDefault;
      if (removedDefault && filtered.length) filtered[0] = { ...filtered[0], isDefault: true };
      return filtered;
    });
  }, []);
  const setDefaultPaymentMethod = useCallback((id: string) => {
    setPaymentMethods((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
  }, []);

  const awardCoins = useCallback((reason: string, amount: number) => {
    setLoyalty((s) => ({
      coins: s.coins + amount,
      lifetime: s.lifetime + amount,
      txns: [{ id: rid(), reason, amount, at: Date.now() }, ...s.txns].slice(0, 50),
    }));
  }, []);
  const redeemCoins = useCallback((reason: string, amount: number) => {
    let ok = false;
    setLoyalty((s) => {
      if (s.coins < amount) return s;
      ok = true;
      return {
        ...s,
        coins: s.coins - amount,
        txns: [{ id: rid(), reason, amount: -amount, at: Date.now() }, ...s.txns].slice(0, 50),
      };
    });
    return ok;
  }, []);

  const createAffiliateLink = useCallback((productId?: string) => {
    const link: AffiliateLink = {
      id: rid(),
      productId,
      code: 'AVA' + Math.random().toString(36).slice(2, 7).toUpperCase(),
      clicks: 0, conversions: 0, earnings: 0,
      createdAt: Date.now(),
    };
    setAffiliateLinks((prev) => [link, ...prev]);
    return link;
  }, []);

  const markLessonComplete = useCallback((id: string) => {
    setCompletedLessons((prev) => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const pushRecentSearch = useCallback((q: string) => {
    const v = q.trim();
    if (!v) return;
    setRecentSearches((prev) => [v, ...prev.filter((p) => p.toLowerCase() !== v.toLowerCase())].slice(0, 12));
  }, []);

  return (
    <Ctx.Provider value={{
      wishlist, toggleWish,
      orders, addOrder,
      extras, addExtra,
      sellerProducts, addSellerProduct, updateSellerProduct, removeSellerProduct,
      promotions, addPromotion, togglePromotion, removePromotion,
      payouts, requestPayout,
      addresses, addAddress, updateAddress, removeAddress, setDefaultAddress,
      paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod,
      loyalty, awardCoins, redeemCoins,
      affiliateLinks, createAffiliateLink,
      completedLessons, markLessonComplete,
      recentSearches, pushRecentSearch,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtxValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
