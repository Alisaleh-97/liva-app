// Product Detail Page — port of pdp.jsx (without 360°/zoom/review-distribution
// for the MVP; sticky buy bar, gallery, variants, trust rows, top reviews).
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Dimensions, Share, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Stars } from '@/components/Stars';
import { BuyBtn } from '@/components/BuyBtn';
import { SizeAssistantModal } from '@/components/SizeAssistantModal';
import { ARTryOnModal } from '@/components/ARTryOnModal';
import { track } from '@/lib/analytics';
import { Product, sellerFor } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { useExtras } from '@/state/AppExtras';
import { useToast } from '@/components/Toast';
import { tap } from '@/lib/haptics';
import { t as tr, price, pname, isRTL } from '@/i18n';

export function PDPScreen({
  product,
  onClose,
  onBuy,
}: {
  product: Product;
  onClose: () => void;
  onBuy: (p: Product) => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { wishlist, toggleWish } = useApp();
  const { preferences, pushRecentlyViewed } = useExtras();
  const toast = useToast();
  const wished = wishlist.has(product.id);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [sizeAssistOpen, setSizeAssistOpen] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  // Fire product_view exactly once per open — repeated re-renders don't double-count
  useEffect(() => {
    track('product_view', { productId: product.id, type: product.type, price: product.price });
  }, [product.id, product.type, product.price]);
  const [galleryPage, setGalleryPage] = useState(0);

  // Mark as recently viewed when opened
  useEffect(() => { pushRecentlyViewed(product.id); }, [product.id]);

  function onHeart() {
    const newState = !wished;
    toggleWish(product.id);
    tap(newState ? 'success' : 'light', preferences.haptics);
    toast.show(newState ? 'Saved to wishlist' : 'Removed from wishlist', { icon: newState ? 'heart' : 'close', kind: newState ? 'success' : 'info' });
  }

  async function onShare() {
    try {
      await Share?.share?.({
        message: `Check out ${product.name} on LIVA — ${price(product.price)}`,
        title: product.name,
      });
    } catch {}
  }

  function onGalleryScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const w = e.nativeEvent.layoutMeasurement.width;
    const page = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, w));
    setGalleryPage(page);
  }

  const seller = sellerFor(product);
  const off = product.was ? Math.round((1 - product.price / product.was) * 100) : 0;
  const monthly = product.price / 6;
  const W = Dimensions.get('window').width;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg }}>
      {/* Floating top controls */}
      <View style={{ position: 'absolute', top: insets.top + 4, left: 12, right: 12, zIndex: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onClose} style={circStyle}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          <Pressable onPress={onShare} style={circStyle}>
            <Icon name="share" size={18} color="#fff" />
          </Pressable>
          <Pressable onPress={onHeart} style={circStyle}>
            <Icon name="heart" size={19} color={wished ? t.live : '#fff'} fill={wished ? t.live : 'none'} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Gallery */}
        <View style={{ position: 'relative' }}>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={{ width: W, height: W }}
            onScroll={onGalleryScroll}
            scrollEventThrottle={32}
          >
            {product.images.map((s, i) => (
              <View key={i} style={{ width: W, height: W }}>
                <Thumb seed={s} imageUrl={i === 0 ? product.images?.[0] : undefined} style={{ width: '100%', height: '100%' }} />
              </View>
            ))}
          </ScrollView>
          {/* Page dots */}
          <View style={{ position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
            {product.images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === galleryPage ? 18 : 6, height: 6, borderRadius: 99,
                  backgroundColor: i === galleryPage ? '#fff' : 'rgba(255,255,255,0.55)',
                }}
              />
            ))}
          </View>
          {/* Counter pill */}
          <View style={{ position: 'absolute', top: insets.top + 4, right: 12, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700' }}>{galleryPage + 1} / {product.images.length}</Text>
          </View>
        </View>

        <View style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.accent1, textTransform: 'uppercase', letterSpacing: 0.6 }}>{product.brand}</Text>
            {off > 0 && <Badge kind="hot">-{off}%</Badge>}
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.3, lineHeight: 27 }}>{pname(product)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
            <Stars rating={product.rating} reviews={product.reviews} size={14} />
            <Text style={{ color: product.stock > 10 ? t.buy : t.live, fontWeight: '600', fontSize: 12 }}>
              {product.stock > 10 ? tr('inStock') : tr('lowStock', { n: product.stock })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: t.text }}>{price(product.price)}</Text>
            {product.was && <Text style={{ fontSize: 15, color: t.textDim, textDecorationLine: 'line-through' }}>{price(product.was)}</Text>}
          </View>

          {/* AR try-on CTA — available for wearables (clothing, accessories, jewelry, beauty) */}
          {['clothing', 'accessories', 'beauty', 'sport'].includes(product.type) && (
            <Pressable onPress={() => setArOpen(true)} style={{ marginTop: 12, alignSelf: 'stretch' }}>
              <LinearGradient colors={[t.accent1, t.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 12, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22 }}>👓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Try it on with AR</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}>See how it looks on you before buying</Text>
                </View>
                <Icon name="chevR" size={16} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}

          {product.install && (
            <View style={{ marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 11, borderRadius: t.radius * 0.8, backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' }}>
              <Icon name="ticket" size={15} color={t.accent1} />
              <Text style={{ fontSize: 12, color: t.text }}>
                {tr('orPay', { n: price(monthly) })} · <Text style={{ color: t.accent1, fontWeight: '700' }}>{tr('interestFree')}</Text>
              </Text>
            </View>
          )}

          {/* Colors */}
          {product.colors.length > 1 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 9 }}>
                {tr('color')}: <Text style={{ color: t.textDim, fontWeight: '500' }}>{product.colors[colorIdx]?.n}</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {product.colors.map((c, k) => (
                  <Pressable
                    key={k}
                    onPress={() => setColorIdx(k)}
                    style={{
                      width: 38, height: 38, borderRadius: 19, backgroundColor: c.hex,
                      borderWidth: 2, borderColor: colorIdx === k ? t.accent1 : t.border,
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>{tr('size')}</Text>
                <Pressable onPress={() => setSizeAssistOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(168,85,247,0.14)' }}>
                  <Text style={{ fontSize: 13 }}>📏</Text>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: t.accent1 }}>Find my size</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {product.sizes.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSize(s)}
                    style={{
                      minWidth: 46, height: 42, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center',
                      borderRadius: t.radius * 0.8, borderWidth: 1.5,
                      borderColor: size === s ? t.accent1 : t.border,
                      backgroundColor: size === s ? 'rgba(139,92,246,0.12)' : t.surface,
                    }}
                  >
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: size === s ? t.accent1 : t.text }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Video reviews — mock reviewers with playable thumbnails */}
          <View style={{ marginTop: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: t.text }}>📹 Video reviews</Text>
              <Text style={{ fontSize: 11.5, color: t.textDim }}>{[42, 18, 7, 3][product.id.length % 4]} videos</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {[
                { name: 'Layla', seed: 'rev-layla', rating: 5 },
                { name: 'Ahmad', seed: 'rev-ahmad', rating: 4 },
                { name: 'Sara',  seed: 'rev-sara',  rating: 5 },
                { name: 'Omar',  seed: 'rev-omar',  rating: 4 },
              ].map((r) => (
                <View key={r.name} style={{ width: 110 }}>
                  <View style={{ width: 110, height: 150, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.surface2 }} />
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
                    <View style={{ position: 'absolute', top: 6, left: 6 }}>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: t.live }}>
                        <Text style={{ fontSize: 8, color: '#fff', fontWeight: '800' }}>0:15</Text>
                      </View>
                    </View>
                    <View style={{ position: 'absolute', top: 55, left: 40, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="play" size={14} color="#000" />
                    </View>
                    <View style={{ position: 'absolute', bottom: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Avatar seed={r.seed} size={22} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>{r.name}</Text>
                        <Text style={{ fontSize: 9, color: '#FFD700' }}>{'★'.repeat(r.rating)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Trust rows */}
          <View style={{ marginTop: 22, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <Avatar seed={seller.seed} size={36} verified={seller.verified} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: t.text }}>{seller.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="verified" size={12} color={t.buy} />
                  <Text style={{ fontSize: 11.5, color: t.buy }}>{tr('verifiedSeller')}</Text>
                </View>
              </View>
              <Stars rating={seller.rating} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <Icon name="truck" size={18} color={t.accent1} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: t.text }}>{tr('delivery')}</Text>
              <Text style={{ fontSize: 12, color: t.textDim }}>{tr('arriving', { a: product.ship[0], b: product.ship[1] })}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 }}>
              <Icon name="shield" size={18} color={t.accent1} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: t.text }}>{tr('returns')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky buy bar */}
      <View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12) + 6,
          backgroundColor: t.bg,
          borderTopWidth: 1, borderTopColor: t.border,
          flexDirection: 'row', alignItems: 'center', gap: 11,
        }}
      >
        <Pressable onPress={onHeart} style={{ width: 52, height: 52, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="heart" size={22} color={wished ? t.live : t.text} fill={wished ? t.live : 'none'} />
        </Pressable>
        <BuyBtn full onPress={() => onBuy(product)} style={{ height: 52 }}>
          {`${tr('buyNow')} · ${price(product.price)}`}
        </BuyBtn>
      </View>

      <SizeAssistantModal visible={sizeAssistOpen} onClose={() => setSizeAssistOpen(false)} product={product} />
      <ARTryOnModal visible={arOpen} onClose={() => setArOpen(false)} product={product} onBuy={onBuy} />
    </View>
  );
}

const circStyle = {
  width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center' as const, justifyContent: 'center' as const,
};
