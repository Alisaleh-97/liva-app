import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Share, Platform } from 'react-native';
import { useToast } from '@/components/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { byId, PRODUCTS, Product } from '@/data';
import { t as tr, isRTL } from '@/i18n';

export function WishlistScreen({
  onBack, onOpen, onBuy,
}: { onBack: () => void; onOpen: (p: Product) => void; onBuy: (p: Product) => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { wishlist, extras } = useApp();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [priceAlertsOn, setPriceAlertsOn] = useState(true);
  function onRefresh() { setRefreshing(true); setTimeout(() => setRefreshing(false), 700); }
  const all = [...PRODUCTS, ...extras];
  const items = [...wishlist].map((id) => all.find((p) => p.id === id) || byId[id]).filter(Boolean) as Product[];

  async function shareWishlist() {
    const summary = items.slice(0, 5).map((p) => `• ${p.name} — $${p.price}`).join('\n');
    const message = `My LIVA wishlist${items.length > 5 ? ` (top 5 of ${items.length})` : ''}:\n\n${summary}\n\nShop on LIVA →`;
    try {
      if (Platform.OS === 'web') {
        // web share API if available; else copy to clipboard fallback
        if ((navigator as any).share) await (navigator as any).share({ title: 'My LIVA wishlist', text: message });
        else await (navigator as any).clipboard?.writeText?.(message);
        toast.show('Wishlist copied — share with friends!', { icon: 'share', kind: 'success' });
      } else {
        await Share.share({ message });
      }
    } catch {
      toast.show('Could not share right now', { kind: 'info' });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('wishlist')}</Text>
        {items.length > 0 ? (
          <Pressable onPress={shareWishlist} style={btnStyle(t)}>
            <Icon name="share" size={18} color={t.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {items.length > 0 && (
        <View style={{ marginHorizontal: 18, marginBottom: 12, padding: 12, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: priceAlertsOn ? 'rgba(255,42,157,0.16)' : t.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>Price drop alerts</Text>
            <Text style={{ fontSize: 11, color: t.textDim }}>{priceAlertsOn ? 'You will be notified when any wishlist item drops in price' : 'Turned off — you will miss deals'}</Text>
          </View>
          <Pressable
            onPress={() => { setPriceAlertsOn((v) => !v); toast.show(priceAlertsOn ? 'Alerts off' : 'Alerts on', { kind: 'success' }); }}
            style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: priceAlertsOn ? t.accent2 : t.surface2, padding: 3, justifyContent: 'center' }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: priceAlertsOn ? 'flex-end' : 'flex-start' }} />
          </Pressable>
        </View>
      )}

      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="heart" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr('emptyWishlist')}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>{tr('emptyWishlistSub')}</Text>
          <Pressable onPress={onBack} style={{ marginTop: 8, borderRadius: t.radius, overflow: 'hidden' }}>
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 18, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('browseShop')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent1} />}
        >
          <Text style={{ fontSize: 13, color: t.textDim, marginBottom: 14 }}>{items.length} {tr('saved')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {items.map((p) => (
              <View key={p.id} style={{ width: '48%' }}>
                <ProductCard p={p} onOpen={onOpen} onBuy={onBuy} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
