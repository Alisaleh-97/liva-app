// Orders list — hydrated from the backend (/api/orders/mine) when a JWT is
// present, falling back to the AsyncStorage-cached orders that were placed
// while offline. The two lists are merged by id so a server-persisted order
// doesn't render twice.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp, Order } from '@/state/AppContext';
import { apiMyOrders } from '@/lib/api';
import { getSecure, SECURE_KEYS } from '@/lib/secureStorage';
import { PRODUCTS, byId } from '@/data';
import { t as tr, price, pname, isRTL } from '@/i18n';

const STATUSES = ['Processing', 'Confirmed', 'Shipped', 'Out for delivery', 'Delivered'] as const;
function pseudoStatus(o: Order): string {
  if (o.status) {
    return ({
      confirmed: 'Confirmed',
      packed: 'Packed',
      shipped: 'Shipped',
      ofd: 'Out for delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    } as const)[o.status];
  }
  // Move along the status track based on age. For demo only.
  const hours = (Date.now() - o.placedAt) / 3_600_000;
  const idx = Math.min(STATUSES.length - 1, Math.floor(hours));
  return STATUSES[idx];
}

export function OrdersScreen({ onBack, onTrack }: { onBack: () => void; onTrack: (o: Order) => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders: localOrders, extras } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);

  async function loadRemote() {
    const token = await getSecure(SECURE_KEYS.authToken).catch(() => null);
    if (!token) { setRemoteOrders([]); return; }
    try {
      const res = await apiMyOrders(token);
      // Adapt server orders into the local Order shape the UI already renders
      const adapted: Order[] = res.orders.map((o) => {
        const seedProduct = o.product
          ? { ...(o.product as any), price: o.product.price, was: (o.product as any).was ?? undefined, images: (o.product as any).imageUrls ? [] : undefined }
          : null;
        const catalogMatch = seedProduct
          ? [...PRODUCTS, ...extras].find((p) => p.seed === seedProduct.seed) || byId[o.productId]
          : null;
        return {
          id: o.id,
          product: (catalogMatch || seedProduct) as any,
          qty: o.qty,
          total: o.total,
          placedAt: new Date(o.placedAt).getTime(),
          status: o.status,
          paymentStatus: o.paymentStatus,
        };
      });
      setRemoteOrders(adapted);
    } catch {
      setRemoteOrders([]);
    }
  }

  useEffect(() => { loadRemote(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadRemote();
    setTimeout(() => setRefreshing(false), 400);
  }

  // Merge remote first, then local orders whose ids don't already appear
  // remotely. This way a successful backend order isn't duplicated by the
  // local mirror that CheckoutSheet also writes.
  const orders: Order[] = [
    ...remoteOrders,
    ...localOrders.filter((lo) => !remoteOrders.some((ro) => ro.id === lo.id)),
  ].sort((a, b) => b.placedAt - a.placedAt);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('ordersTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cart" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr('noOrdersYet')}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center' }}>{tr('noOrdersSub')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 50 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent1} />}
        >
          {orders.map((o) => {
            const status = pseudoStatus(o);
            const delivered = status === 'Delivered';
            return (
              <View
                key={o.id}
                style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {tr('orderOn')} {new Date(o.placedAt).toLocaleDateString()}
                  </Text>
                  <Badge kind={delivered ? 'deal' : 'ai'}>{status}</Badge>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 64, height: 64, borderRadius: t.radius * 0.75, overflow: 'hidden' }}>
                    <Thumb seed={o.product.seed} style={{ width: '100%', height: '100%' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{pname(o.product)}</Text>
                    <Text style={{ fontSize: 12, color: t.textDim, marginTop: 3 }}>{tr('qty')}: {o.qty}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: t.text, marginTop: 4 }}>{price(o.total)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
                  <BuyBtn small style={{ flex: 1 }} onPress={() => onTrack(o)}>
                    {tr('trackOrder')}
                  </BuyBtn>
                  <Pressable onPress={() => onTrack(o)} style={{ flex: 1, paddingVertical: 8, borderRadius: t.radius * 0.85, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>{tr('viewDetails')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
