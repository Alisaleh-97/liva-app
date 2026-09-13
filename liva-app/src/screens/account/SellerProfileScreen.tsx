// Seller's public profile — bio + stats + product grid + past lives snippet.
// Opened when a user taps a seller name in Live Now cards or Top Sellers rail.
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Stars } from '@/components/Stars';
import { ProductCard } from '@/components/ProductCard';
import { Thumb } from '@/components/Thumb';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';
import { SELLERS, PRODUCTS, Product, Seller } from '@/data';
import { t as tr, fmtK, price, isRTL } from '@/i18n';
import { tap } from '@/lib/haptics';

interface Props {
  sellerId: string;
  onBack: () => void;
  onOpen: (p: Product) => void;
  onBuy: (p: Product) => void;
  onMessage: (seller: Seller) => void;
}

export function SellerProfileScreen({ sellerId, onBack, onOpen, onBuy, onMessage }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { followedSellers, toggleFollow, preferences, savedStreams } = useExtras();
  const seller = SELLERS.find((s) => s.id === sellerId);
  const isFollowed = followedSellers.includes(sellerId);

  // Deterministically pick which catalog products "belong" to this seller
  // so the profile has real content. In production this is a real join.
  const products = useMemo(() => {
    const start = sellerId.charCodeAt(1) % PRODUCTS.length;
    return [...PRODUCTS.slice(start), ...PRODUCTS.slice(0, start)].slice(0, 8);
  }, [sellerId]);

  const pastLives = savedStreams.slice(0, 3);

  if (!seller) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.text }}>Seller not found</Text>
      </View>
    );
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg, zIndex: 94 }}>
      {/* Floating back */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12, zIndex: 3 }}>
        <Pressable onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero */}
        <LinearGradient
          colors={['#171221', '#0D0A16']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ paddingTop: insets.top + 60, paddingHorizontal: 22, paddingBottom: 24, alignItems: 'center' }}
        >
          <Avatar seed={seller.seed} size={92} verified={seller.verified} />
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 14, letterSpacing: -0.4 }}>{seller.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>{seller.handle}</Text>

          <View style={{ marginTop: 10 }}>
            <Stars rating={seller.rating} reviews={seller.sales} size={14} />
          </View>

          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 14, maxWidth: 340 }}>
            Curated {products[0]?.type ?? 'products'} at unbeatable live prices. Live every Thursday 8 PM.
          </Text>

          {/* Stats strip */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <HeroStat label="SALES" value={fmtK(seller.sales)} />
            <HeroStat label="RATING" value={String(seller.rating)} />
            <HeroStat label="FOLLOWERS" value={fmtK(Math.floor(seller.sales * 0.11))} />
          </View>

          {/* Action row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' }}>
            <Pressable
              onPress={() => { tap('light', preferences.haptics); toggleFollow(sellerId); }}
              style={{ flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: isFollowed ? 'rgba(255,255,255,0.15)' : '#fff', flexDirection: 'row', gap: 7 }}
            >
              <Icon name={isFollowed ? 'check' : 'plus'} size={15} color={isFollowed ? '#fff' : '#000'} stroke={2.5} />
              <Text style={{ color: isFollowed ? '#fff' : '#000', fontWeight: '800', fontSize: 14 }}>{isFollowed ? 'Following' : 'Follow'}</Text>
            </Pressable>
            <Pressable
              onPress={() => onMessage(seller)}
              style={{ flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', gap: 7 }}
            >
              <Icon name="comment" size={15} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Message</Text>
            </Pressable>
            <Pressable style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Icon name="share" size={18} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Products grid */}
        <SectionTitle title="Products" trailing={<Text style={{ fontSize: 11, color: t.textDim }}>{products.length}</Text>} />
        <View style={{ paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          {products.map((p) => (
            <View key={p.id} style={{ width: '48%' }}>
              <ProductCard p={p} onOpen={onOpen} onBuy={onBuy} />
            </View>
          ))}
        </View>

        {/* Past lives */}
        {pastLives.length > 0 && (
          <>
            <SectionTitle title="Past lives" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 12, marginBottom: 12 }}>
              {pastLives.map((s) => (
                <View key={s.id} style={{ width: 200, borderRadius: t.radius, overflow: 'hidden', borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}>
                  <View style={{ height: 110, position: 'relative' }}>
                    <Thumb seed={s.thumbnail || s.id} vivid style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 5 }}>
                      <Badge kind="live">REPLAY</Badge>
                      <Badge kind="glass">{fmtK(s.peakViewers)}</Badge>
                    </View>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text numberOfLines={1} style={{ color: t.text, fontWeight: '700', fontSize: 12.5 }}>{s.title}</Text>
                    <Text style={{ color: t.textDim, fontSize: 10.5, marginTop: 2 }}>{s.totalSales} sales · {price(s.salesValue, { dec: 0 })}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Trust rows */}
        <SectionTitle title="Trust & policies" />
        <View style={{ marginHorizontal: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <TrustRow icon="verified" title="Verified seller" sub="KYC-verified store" />
          <TrustRow icon="truck" title="Fast shipping" sub="Same-day pack, 2-4 day delivery" />
          <TrustRow icon="shield" title="Buyer protection" sub="14-day returns · full refund guarantee" last />
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, alignItems: 'center', minWidth: 90 }}>
      <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</Text>
      {trailing}
    </View>
  );
}

function TrustRow({ icon, title, sub, last }: { icon: string; title: string; sub: string; last?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={t.accent1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '700', color: t.text }}>{title}</Text>
        <Text style={{ fontSize: 11.5, color: t.textDim, marginTop: 2 }}>{sub}</Text>
      </View>
    </View>
  );
}
