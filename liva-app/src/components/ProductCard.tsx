import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ProductActionSheet } from './ProductActionSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Thumb } from './Thumb';
import { Badge } from './Badge';
import { Stars } from './Stars';
import { BuyBtn } from './BuyBtn';
import { Icon } from './Icon';
import { PressScale } from './PressScale';
import { Product } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { useExtras } from '@/state/AppExtras';
import { useToast } from '@/components/Toast';
import { tap } from '@/lib/haptics';
import { price, pname } from '@/i18n';

function discount(p: Product) {
  return p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
}

export function ProductCard({ p, onOpen, onBuy }: { p: Product; onOpen?: (p: Product) => void; onBuy?: (p: Product) => void }) {
  const { t } = useTheme();
  const { wishlist, toggleWish } = useApp();
  const { preferences } = useExtras();
  const toast = useToast();
  const off = discount(p);
  const wished = wishlist.has(p.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  function onHeartTap() {
    const newState = !wished;
    toggleWish(p.id);
    tap(newState ? 'success' : 'light', preferences.haptics);
    toast.show(newState ? 'Saved to wishlist' : 'Removed from wishlist', { icon: newState ? 'heart' : 'close', kind: newState ? 'success' : 'info' });
  }

  return (
    <PressScale
      onPress={() => onOpen?.(p)}
      onLongPress={() => setSheetOpen(true)}
      delayLongPress={350}
      style={{
        backgroundColor: t.surface,
        borderRadius: t.radius,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: t.border,
        // iOS App Store card shadow — subtle, cool
        shadowColor: '#000',
        shadowOpacity: t.mode === 'dark' ? 0.35 : 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View style={{ aspectRatio: 1, position: 'relative' }}>
        <Thumb seed={p.seed} imageUrl={p.images?.[0]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {/* Subtle top-to-bottom gradient for legibility of badges */}
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent', 'transparent', 'rgba(0,0,0,0.35)']}
          locations={[0, 0.25, 0.65, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        />
        {off > 0 && <Badge kind="live" style={{ position: 'absolute', top: 9, left: 9 }}>-{off}%</Badge>}
        {p.badge && (
          <Badge kind={p.badge === 'AI Pick' ? 'ai' : 'hot'} style={{ position: 'absolute', top: 9, right: 9 }}>
            {p.badge}
          </Badge>
        )}
        {/* Deterministic per-product group/bundle deal flags — pins them to a
            fixed subset so they don't flicker between re-renders */}
        {(() => {
          const isGroup = p.rating >= 4.7 && p.reviews > 300;
          const isBundle = p.stock > 50;
          if (!isGroup && !isBundle) return null;
          return (
            <View style={{ position: 'absolute', bottom: 9, left: 9, flexDirection: 'row', gap: 5 }}>
              {isGroup && (
                <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,42,157,0.85)', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800', letterSpacing: 0.3 }}>GROUP · -20%</Text>
                </View>
              )}
              {isBundle && !isGroup && (
                <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(0,230,114,0.85)' }}>
                  <Text style={{ fontSize: 9, color: '#06362A', fontWeight: '800', letterSpacing: 0.3 }}>3 FOR 2</Text>
                </View>
              )}
            </View>
          );
        })()}
        {/* Heart with iOS-glass background */}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onHeartTap(); }}
          accessibilityRole="button"
          accessibilityLabel={wished ? `Remove ${pname(p)} from wishlist` : `Save ${pname(p)} to wishlist`}
          accessibilityState={{ selected: wished }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: 'absolute', bottom: 9, right: 9, width: 34, height: 34, borderRadius: 17,
            backgroundColor: 'rgba(255,255,255,0.22)',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.4)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="heart" size={17} color={wished ? t.live : '#fff'} fill={wished ? t.live : 'none'} />
        </Pressable>
      </View>
      <View style={{ padding: 12, paddingTop: 11 }}>
        <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '900', color: t.accent2, letterSpacing: 0.75, marginBottom: 4 }}>{p.brand.toUpperCase()}</Text>
        <Text numberOfLines={2} style={{ fontSize: 13.5, fontWeight: '600', color: t.text, lineHeight: 17, minHeight: 34, letterSpacing: -0.1 }}>
          {pname(p)}
        </Text>
        <View style={{ marginTop: 6 }}>
          <Stars rating={p.rating} reviews={p.reviews} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontSize: 16.5, fontWeight: '900', color: t.text, letterSpacing: -0.3 }}>{price(p.price)}</Text>
            {p.was && <Text style={{ fontSize: 11.5, color: t.textDim, textDecorationLine: 'line-through' }}>{price(p.was)}</Text>}
          </View>
          <BuyBtn small onPress={() => onBuy?.(p)}>Buy</BuyBtn>
        </View>
        {/* BNPL — 4 interest-free installments for anything $20+ */}
        {p.price >= 20 && (
          <View style={{ marginTop: 8, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(0,230,114,0.09)', borderWidth: 0.5, borderColor: 'rgba(0,230,114,0.28)' }}>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: t.buy, letterSpacing: 0.1 }}>
              4 × {price(p.price / 4)} · 0% interest
            </Text>
          </View>
        )}
      </View>
      <ProductActionSheet
        visible={sheetOpen}
        product={p}
        onClose={() => setSheetOpen(false)}
        onOpen={() => onOpen?.(p)}
      />
    </PressScale>
  );
}
