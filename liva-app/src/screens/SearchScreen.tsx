// Full search experience — recent searches, trending, results, filters.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { useProducts } from '@/state/ProductsContext';
import { Product } from '@/data';
import { apiSearchProducts } from '@/lib/api';
import { track } from '@/lib/analytics';
import { t as tr, price, isRTL } from '@/i18n';

const TRENDING = ['Smartwatch', 'Perfume', 'Runners', 'Tote bag', 'Earbuds', 'Wrap dress', 'Gold hoops'];
const RATING_OPTS = [4.0, 4.3, 4.5, 4.7];

export function SearchScreen({
  onClose, onOpen, onBuy,
}: { onClose: () => void; onOpen: (p: Product) => void; onBuy: (p: Product) => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { extras, recentSearches, pushRecentSearch } = useApp();
  const { products } = useProducts();
  const [q, setQ] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(999);
  const [minRating, setMinRating] = useState<number | null>(null);
  // Server search results — updated by a debounced effect below. When the
  // server responds we use its ranking; when it doesn't we fall through to
  // the local filter so the UI never freezes on a slow network.
  const [serverHits, setServerHits] = useState<Product[] | null>(null);
  const [serverSearched, setServerSearched] = useState('');
  // True while a debounced request is in flight — drives the skeleton
  // placeholders so the user sees "the network is working" during the
  // debounce + round-trip window (~300–500 ms typically).
  const [searching, setSearching] = useState(false);

  const catalog = useMemo(() => [...products, ...extras], [products, extras]);

  // Debounced remote search — 300ms after the user stops typing
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setServerHits(null); setSearching(false); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiSearchProducts(query);
        // Merge with local catalog by seed so we get the rich fields (sizes/colors)
        const hits: Product[] = res.items.map((s) => {
          const local = catalog.find((p) => p.seed === s.seed || p.id === s.id);
          return local
            ? { ...local, id: s.id, price: s.price, was: s.was ?? undefined, rating: s.rating, reviews: s.reviews, stock: s.stock }
            : {
                id: s.id, name: s.name, nameAr: s.nameAr || s.name, brand: s.brand || '',
                audience: s.audience as Product['audience'], type: s.type as Product['type'], sub: s.sub || '',
                price: s.price, was: s.was, rating: s.rating, reviews: s.reviews, seed: s.seed,
                images: s.imageUrls, badge: s.badge as Product['badge'] ?? null,
                colors: [], sizes: [], stock: s.stock, ship: [s.shipFrom, s.shipTo] as [number, number], install: s.install,
              };
        });
        setServerHits(hits);
        setServerSearched(query);
        track('search', { q: query, results: hits.length });
      } catch {
        setServerHits(null); // fall back to local filter silently
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, catalog]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    // Prefer server hits when they match the current query and filters are default
    const base = serverHits && serverSearched === q.trim() && minPrice === 0 && maxPrice === 999 && minRating == null
      ? serverHits
      : catalog.filter((p) => {
          if (query) {
            const hay = `${p.name} ${p.brand} ${p.sub} ${p.type}`.toLowerCase();
            if (!hay.includes(query)) return false;
          }
          if (p.price < minPrice || p.price > maxPrice) return false;
          if (minRating != null && p.rating < minRating) return false;
          return true;
        });
    // Apply price/rating filters on top of server hits too
    return base.filter((p) => {
      if (p.price < minPrice || p.price > maxPrice) return false;
      if (minRating != null && p.rating < minRating) return false;
      return true;
    });
  }, [catalog, q, minPrice, maxPrice, minRating, serverHits, serverSearched]);

  function submit(text: string) {
    setQ(text);
    pushRecentSearch(text);
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg, zIndex: 90 }}>
      {/* Header search bar */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={onClose} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <Icon name="search" size={17} color={t.textDim} />
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => submit(q)}
            placeholder={tr('searchHint')}
            placeholderTextColor={t.textDim}
            style={{ flex: 1, color: t.text, fontSize: 14 }}
            autoFocus
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')}>
              <Icon name="close" size={16} color={t.textDim} />
            </Pressable>
          )}
          {/* Voice search — simulates a listening state, then fills a demo query */}
          <Pressable
            onPress={() => {
              setListening(true);
              setTimeout(() => {
                setListening(false);
                const demos = ['wireless earbuds under $50', 'trending sneakers', 'gift ideas for mom', 'red dress'];
                setQ(demos[Math.floor(Math.random() * demos.length)]);
              }, 1400);
            }}
            style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: listening ? t.live : 'transparent' }}
          >
            <Icon name="mic" size={17} color={listening ? '#fff' : t.accent1} />
          </Pressable>
        </View>
        <Pressable onPress={() => setFiltersOpen((v) => !v)} style={btnStyle(t)}>
          <Icon name="filter" size={20} color={(minRating != null || minPrice > 0 || maxPrice < 999) ? t.accent1 : t.text} />
        </Pressable>
      </View>

      {/* Voice search overlay — pulsing indicator while "listening" */}
      {listening && (
        <View style={{ paddingHorizontal: 18, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: 'rgba(255,23,68,0.14)', borderRadius: t.radius, borderWidth: 1, borderColor: 'rgba(255,23,68,0.35)' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.live }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: t.live }}>Listening… speak now</Text>
          </View>
        </View>
      )}

      {/* Filters panel */}
      {filtersOpen && (
        <View style={{ marginHorizontal: 18, marginBottom: 10, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 14 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{tr('priceRange')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[[0, 999], [0, 30], [30, 60], [60, 100], [100, 999]].map(([lo, hi]) => {
                const active = minPrice === lo && maxPrice === hi;
                return (
                  <Pressable key={`${lo}-${hi}`} onPress={() => { setMinPrice(lo); setMaxPrice(hi); }}>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: active ? t.accent1 : t.border, backgroundColor: active ? 'rgba(139,92,246,0.12)' : t.surface2 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? t.accent1 : t.text }}>
                        {hi === 999 ? `${price(lo, { dec: 0 })}+` : `${price(lo, { dec: 0 })}–${price(hi, { dec: 0 })}`}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{tr('minRating')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => setMinRating(null)}>
                <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: minRating == null ? t.accent1 : t.border, backgroundColor: minRating == null ? 'rgba(139,92,246,0.12)' : t.surface2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: minRating == null ? t.accent1 : t.text }}>Any</Text>
                </View>
              </Pressable>
              {RATING_OPTS.map((r) => {
                const active = minRating === r;
                return (
                  <Pressable key={r} onPress={() => setMinRating(r)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: active ? t.accent1 : t.border, backgroundColor: active ? 'rgba(139,92,246,0.12)' : t.surface2 }}>
                      <Icon name="star" size={11} color="#FFB339" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? t.accent1 : t.text }}>{r}+</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable onPress={() => { setMinPrice(0); setMaxPrice(999); setMinRating(null); }} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ color: t.accent1, fontSize: 13, fontWeight: '700' }}>{tr('resetFilters')}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {q.length === 0 ? (
          <>
            {recentSearches.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 10, marginTop: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>{tr('recentSearches')}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}>
                  {recentSearches.map((r) => (
                    <Chip key={r} icon="clock" onPress={() => submit(r)}>{r}</Chip>
                  ))}
                </ScrollView>
              </View>
            )}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 22, marginTop: 20, marginBottom: 10 }}>{tr('trendingSearches')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}>
                {TRENDING.map((s) => (
                  <Chip key={s} icon="flame" onPress={() => submit(s)}>{s}</Chip>
                ))}
              </ScrollView>
            </View>
          </>
        ) : (
          <View style={{ padding: 18 }}>
            <Text style={{ fontSize: 13, color: t.textDim, marginBottom: 14 }}>
              {searching ? 'Searching…' : `${results.length} ${tr('results')}`}
            </Text>
            {searching && results.length === 0 ? (
              // Skeleton grid while the first response is still in flight
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} accessibilityLabel="Loading results">
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ width: '48%' }}>
                    <ProductSkeleton />
                  </View>
                ))}
              </View>
            ) : results.length === 0 ? (
              <Text style={{ fontSize: 14, color: t.textDim, textAlign: 'center', marginTop: 40 }}>
                {tr('noSearchResults')} "{q}"
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {results.map((p) => (
                  <View key={p.id} style={{ width: '48%' }}>
                    <ProductCard p={p} onOpen={onOpen} onBuy={onBuy} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
