// Compare screen — side-by-side matrix of the products the shopper has
// added via long-press. Attribute rows highlight the best value per row
// (lowest price wins, highest rating wins, etc.).

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useCompare } from '@/state/CompareContext';
import { Product } from '@/data';
import { price, pname, isRTL } from '@/i18n';

interface Props {
  onClose: () => void;
  onOpen: (p: Product) => void;
  onBuy: (p: Product) => void;
}

export function CompareScreen({ onClose, onOpen, onBuy }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, remove, clear } = useCompare();

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 60 }}>⚖️</Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.text, marginTop: 12 }}>Nothing to compare yet</Text>
        <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', marginTop: 6, maxWidth: 280 }}>Long-press any product card and choose Compare to add it here.</Text>
        <Pressable onPress={onClose} style={{ marginTop: 20, paddingVertical: 12, paddingHorizontal: 22, backgroundColor: t.accent1, borderRadius: 999 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Browse products</Text>
        </Pressable>
      </View>
    );
  }

  // Compute "best" per attribute for highlight
  const lowestPrice = Math.min(...items.map((p) => p.price));
  const highestRating = Math.max(...items.map((p) => p.rating));
  const mostReviews = Math.max(...items.map((p) => p.reviews));
  const fastestShip = Math.min(...items.map((p) => p.ship[0]));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border }}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>⚖️</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text, letterSpacing: -0.3 }}>Compare</Text>
          <Text style={{ fontSize: 13, color: t.textDim }}>({items.length})</Text>
        </View>
        <Pressable onPress={clear} style={{ paddingHorizontal: 10, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, color: t.live, fontWeight: '700' }}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}>
        {/* Attribute label column */}
        <View style={{ width: 100, paddingTop: 190 }}>
          {ROWS.map((r) => (
            <View key={r.key} style={{ height: 52, justifyContent: 'center', paddingLeft: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</Text>
            </View>
          ))}
        </View>

        {items.map((p) => (
          <View key={p.id} style={{ width: 190, padding: 10, marginHorizontal: 4, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: t.radius }}>
            {/* Remove button */}
            <Pressable onPress={() => remove(p.id)} style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={13} color="#fff" />
            </Pressable>
            {/* Product image */}
            <Pressable onPress={() => onOpen(p)}>
              <View style={{ height: 130, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
                <Thumb seed={p.seed} imageUrl={p.images?.[0]} style={{ width: '100%', height: '100%' }} />
              </View>
              <Text numberOfLines={2} style={{ fontSize: 12.5, fontWeight: '700', color: t.text, minHeight: 32, lineHeight: 16 }}>{pname(p)}</Text>
            </Pressable>

            {/* Attribute cells */}
            {ROWS.map((r) => {
              const val = r.value(p);
              const best = r.isBest?.({ p, lowestPrice, highestRating, mostReviews, fastestShip }) ?? false;
              return (
                <View key={r.key} style={{ height: 52, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: best ? '800' : '600', color: best ? t.buy : t.text }}>{val}</Text>
                    {best && <Text style={{ fontSize: 10 }}>✨</Text>}
                  </View>
                </View>
              );
            })}

            <View style={{ marginTop: 8 }}>
              <BuyBtn small full onPress={() => onBuy(p)}>Buy</BuyBtn>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Compare attribute definitions — value: renderer, isBest: highlight rule
const ROWS: Array<{
  key: string;
  label: string;
  value: (p: Product) => string;
  isBest?: (ctx: { p: Product; lowestPrice: number; highestRating: number; mostReviews: number; fastestShip: number }) => boolean;
}> = [
  { key: 'price',  label: 'Price',     value: (p) => price(p.price),         isBest: ({ p, lowestPrice })   => p.price === lowestPrice },
  { key: 'rating', label: 'Rating',    value: (p) => `★ ${p.rating}`,        isBest: ({ p, highestRating }) => p.rating === highestRating },
  { key: 'reviews',label: 'Reviews',   value: (p) => `${p.reviews}`,         isBest: ({ p, mostReviews })   => p.reviews === mostReviews },
  { key: 'ship',   label: 'Ship in',   value: (p) => `${p.ship[0]}–${p.ship[1]} days`, isBest: ({ p, fastestShip }) => p.ship[0] === fastestShip },
  { key: 'stock',  label: 'Stock',     value: (p) => `${p.stock} left` },
  { key: 'brand',  label: 'Brand',     value: (p) => p.brand ?? '—' },
];
