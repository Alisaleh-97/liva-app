import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { ProductCard } from '@/components/ProductCard';
import { useTheme } from '@/theme/ThemeContext';
import { SHOP_FILTERS, Product } from '@/data';
import { useApp } from '@/state/AppContext';
import { useProducts } from '@/state/ProductsContext';
import { t as tr } from '@/i18n';

const AUDIENCE = ['women', 'men', 'kids'];

// Smart filter definitions — stackable AND filters that narrow the primary
// category selection. Colored when active for glanceable status.
const SMART_FILTERS = [
  { id: 'under25',     icon: 'wallet', label: 'Under $25', color: '#2DE2A6' },
  { id: 'under50',     icon: 'tag', label: 'Under $50', color: '#19C6E6' },
  { id: 'rated',       icon: 'star', label: 'Top rated', color: '#FFB020' },
  { id: 'bigDiscount', icon: 'bolt', label: '30%+ off', color: '#FF3D71' },
  { id: 'freeShip',    icon: 'truck', label: 'Fast ship', color: '#1676E8' },
  { id: 'inStock',     icon: 'box', label: 'In stock', color: '#B85CFF' },
];

export function ShopScreen({
  onOpen,
  onBuy,
  onSearch,
  initial = 'ai',
}: {
  onOpen: (p: Product) => void;
  onBuy: (p: Product) => void;
  onSearch: () => void;
  initial?: string;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { extras } = useApp();
  const { products, source, reloading, reload } = useProducts();
  const [filter, setFilter] = useState(initial);
  // Smart filter chips — quick toggles that stack on top of the category
  // filter to narrow results (price, rating, discount, free shipping).
  const [smartFilters, setSmartFilters] = useState<Set<string>>(new Set());
  const toggleSmart = (id: string) => setSmartFilters((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const chipScrollRef = useRef<ScrollView>(null);
  const chipPositions = useRef<Record<string, number>>({});

  // Auto-scroll the filter row to keep the active chip in view
  useEffect(() => {
    const x = chipPositions.current[filter];
    if (x != null && chipScrollRef.current) {
      chipScrollRef.current.scrollTo({ x: Math.max(0, x - 80), animated: true });
    }
  }, [filter]);

  // merge extracted/added products in front of the static catalog
  let list: Product[] = [...extras, ...products].filter((product, index, all) => all.findIndex((item) => item.id === product.id) === index);
  if (filter === 'ai') {
    list = list.filter((p) => p.badge === 'AI Pick' || p.rating >= 4.7);
    list.sort((a, b) => b.rating - a.rating);
  } else if (filter === 'trending') {
    list = list.filter((p) => ['Trending', 'Hot', 'Price drop'].includes(p.badge || ''));
  } else if (AUDIENCE.includes(filter)) {
    list = list.filter((p) => p.audience === filter || p.audience === 'unisex');
  } else if (filter !== 'all') {
    list = list.filter((p) => p.type === filter);
  }
  // Apply smart filters as an AND stack on top of the primary filter above
  if (smartFilters.has('under25')) list = list.filter((p) => p.price < 25);
  if (smartFilters.has('under50')) list = list.filter((p) => p.price < 50);
  if (smartFilters.has('rated')) list = list.filter((p) => p.rating >= 4.7);
  if (smartFilters.has('bigDiscount')) list = list.filter((p) => p.was && (1 - p.price / p.was) >= 0.3);
  if (smartFilters.has('freeShip')) list = list.filter((p) => p.ship[0] <= 2);
  if (smartFilters.has('inStock')) list = list.filter((p) => p.stock > 15);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={reloading} onRefresh={reload} tintColor={t.accent1} />}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: t.text, letterSpacing: -0.6 }}>{tr('shopTitle')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
            <Icon name="ai" size={15} color={t.accent1} />
            <Text style={{ color: source === 'server' ? t.buy : t.accent1, fontSize: 12.5, fontWeight: '700' }}>
              {source === 'server' ? 'Live catalog' : tr('rerank')}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onSearch}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}
        >
          <Icon name="search" size={17} color={t.textDim} />
          <Text style={{ flex: 1, color: t.textDim, fontSize: 13.5 }}>{tr('searchMarket')}</Text>
        </Pressable>
      </View>

      <ScrollView ref={chipScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 9, paddingBottom: 16 }}>
        {SHOP_FILTERS.map((f) => (
          <View
            key={f.id}
            onLayout={(e) => { chipPositions.current[f.id] = e.nativeEvent.layout.x; }}
          >
            <Chip active={filter === f.id} icon={f.icon} onPress={() => setFilter(f.id)}>
              {tr(f.key)}
            </Chip>
          </View>
        ))}
      </ScrollView>

      {/* Smart filter chips — stackable narrowing filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingBottom: 14 }}>
        {SMART_FILTERS.map((sf) => {
          const active = smartFilters.has(sf.id);
          return (
            <Pressable key={sf.id} onPress={() => toggleSmart(sf.id)} style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
              backgroundColor: active ? sf.color : t.surface,
              borderWidth: 1, borderColor: active ? sf.color : t.border,
            }}>
              <Icon name={sf.icon} size={14} color={active ? '#fff' : sf.color} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : t.text }}>{sf.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filter === 'ai' && (
        <View style={{ marginHorizontal: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: t.radius, borderWidth: 1, borderColor: 'rgba(139,92,246,0.28)' }}>
          <Icon name="ai" size={17} color={t.accent1} />
          <Text style={{ flex: 1, fontSize: 12, color: t.text, lineHeight: 16 }}>{tr('rankedBlurb')}</Text>
        </View>
      )}

      <View style={{ paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 30 }}>
        {list.map((p) => (
          <View key={p.id} style={{ width: '48%' }}>
            <ProductCard p={p} onOpen={onOpen} onBuy={onBuy} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
