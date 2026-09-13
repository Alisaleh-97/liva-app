// Seller-side incoming orders inbox.
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { t as tr, price, pname, isRTL } from '@/i18n';

const STATUSES = ['new', 'packed', 'shipped', 'delivered'] as const;
type Status = typeof STATUSES[number];

export function SellerOrdersScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders } = useApp();
  const [overrides, setOverrides] = useState<Record<string, Status>>({});

  function statusOf(orderId: string, idx: number): Status {
    if (overrides[orderId]) return overrides[orderId];
    // pseudo-progress from age
    const o = orders[idx];
    const h = (Date.now() - o.placedAt) / 3_600_000;
    if (h >= 48) return 'delivered';
    if (h >= 18) return 'shipped';
    if (h >= 3) return 'packed';
    return 'new';
  }
  function advance(orderId: string, current: Status) {
    const next = STATUSES[STATUSES.indexOf(current) + 1] || 'delivered';
    setOverrides((p) => ({ ...p, [orderId]: next }));
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('sellerOrdersTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cart" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr('noSellerOrders')}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>{tr('noSellerOrdersSub')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 60 }}>
          {orders.map((o, i) => {
            const status = statusOf(o.id, i);
            const isNew = status === 'new';
            const canAdvance = status !== 'delivered';
            const nextLabel = status === 'new' ? tr('markPacked') :
                              status === 'packed' ? tr('markShipped') :
                              status === 'shipped' ? tr('markDelivered') : '';
            return (
              <View key={o.id} style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: isNew ? t.accent1 : t.border, borderRadius: t.radius }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{o.id}</Text>
                  <Badge kind={status === 'delivered' ? 'deal' : status === 'new' ? 'hot' : 'ai'}>
                    {status === 'new' ? tr('newOrder') :
                     status === 'packed' ? tr('stepPacked') :
                     status === 'shipped' ? tr('stepShipped') : tr('stepDelivered')}
                  </Badge>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 60, height: 60, borderRadius: t.radius * 0.75, overflow: 'hidden' }}>
                    <Thumb seed={o.product.seed} style={{ width: '100%', height: '100%' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{pname(o.product)}</Text>
                    <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{tr('qty')}: {o.qty}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: t.text, marginTop: 3 }}>{price(o.total)}</Text>
                  </View>
                </View>
                {canAdvance && (
                  <Pressable
                    onPress={() => advance(o.id, status)}
                    style={{ marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' }}
                  >
                    <Icon name="check" size={13} color={t.buy} stroke={2.5} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: t.buy }}>{nextLabel}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
