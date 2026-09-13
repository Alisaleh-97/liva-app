// Live order tracking with status timeline.
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { Order } from '@/state/AppContext';
import { t as tr, price, pname, isRTL } from '@/i18n';

const STEPS = [
  { key: 'stepConfirmed', icon: 'check', delta: 0 },
  { key: 'stepPacked', icon: 'cart', delta: 3 },
  { key: 'stepShipped', icon: 'truck', delta: 18 },
  { key: 'stepOFD', icon: 'bolt', delta: 48 },
  { key: 'stepDelivered', icon: 'verified', delta: 72 },
];

function indexFor(o: Order): number {
  const hours = (Date.now() - o.placedAt) / 3_600_000;
  let i = 0;
  for (let k = 0; k < STEPS.length; k++) if (hours >= STEPS[k].delta) i = k;
  return i;
}

export function OrderTrackingScreen({ order, onBack }: { order: Order; onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const current = indexFor(order);
  const delivered = current === STEPS.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('trackingTitleS')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 18 }}>
        {/* Order summary */}
        <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 70, height: 70, borderRadius: t.radius * 0.75, overflow: 'hidden' }}>
            <Thumb seed={order.product.seed} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {tr('orderId')}: {order.id}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 14.5, fontWeight: '700', color: t.text, marginTop: 3 }}>{pname(order.product)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{price(order.total)}</Text>
              <Text style={{ fontSize: 11.5, color: t.textDim }}>x{order.qty}</Text>
            </View>
          </View>
        </View>

        {/* Live delivery map — shown once the order is out for delivery */}
        {current >= 2 && !delivered && <DeliveryMap progress={(current - 2) / 2} eta={current === 3 ? '15 min' : '2 hours'} />}

        {/* Status hero */}
        <View style={{ padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr('orderProgress')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr(STEPS[current].key)}</Text>
            {delivered && <Badge kind="deal">{tr('stepDelivered')}</Badge>}
          </View>

          {/* Timeline */}
          {STEPS.map((s, i) => {
            const done = i <= current;
            const active = i === current && !delivered;
            return (
              <View key={s.key} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View style={{ alignItems: 'center', width: 30 }}>
                  <View style={{
                    width: 30, height: 30, borderRadius: 15,
                    backgroundColor: done ? t.buy : t.surface2,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: active ? 2 : 0, borderColor: t.accent1,
                  }}>
                    <Icon name={s.icon} size={14} color={done ? '#04210f' : t.textDim} stroke={done ? 2.5 : 1.8} />
                  </View>
                  {i < STEPS.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 28, backgroundColor: i < current ? t.buy : t.surface2 }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 22 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: done ? t.text : t.textDim }}>{tr(s.key)}</Text>
                  {done && (
                    <Text style={{ fontSize: 11.5, color: t.textDim, marginTop: 2 }}>
                      {new Date(order.placedAt + s.delta * 3_600_000).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Courier + tracking #  */}
        <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 10 }}>
          <Row label={tr('courierName')} value="LIVA Express" />
          <Row label={tr('trackingNo')} value={`LX${order.id.slice(1).toUpperCase()}`} mono />
          <Row label={tr('estDelivery')} value={new Date(order.placedAt + (order.product.ship[1] || 5) * 86_400_000).toLocaleDateString()} />
        </View>

        {/* Contact */}
        <BuyBtn full onPress={() => Alert.alert(tr('contactSellerBtn'), 'Chat with the seller — coming soon.')}>
          {tr('contactSellerBtn')}
        </BuyBtn>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 12.5, color: t.textDim }}>{label}</Text>
      <Text style={{ fontSize: 13.5, color: t.text, fontWeight: '700', letterSpacing: mono ? 0.5 : 0 }}>{value}</Text>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}

// Delivery map — stylized mock map with driver marker moving along a route.
// Real app would use react-native-maps + live driver GPS from the backend.
function DeliveryMap({ progress, eta }: { progress: number; eta: string }) {
  const { t } = useTheme();
  const clamp = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>🚚</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>Live delivery tracking</Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,230,114,0.16)' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: t.buy }}>ETA {eta}</Text>
        </View>
      </View>
      {/* Mock map — dark grid with roads and a route arc */}
      <View style={{ height: 180, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0F1A2B', position: 'relative' }}>
        {/* Grid pattern */}
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={'h' + i} style={{ position: 'absolute', left: 0, right: 0, top: (i + 1) * 30, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={'v' + i} style={{ position: 'absolute', top: 0, bottom: 0, left: (i + 1) * 55, width: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        ))}
        {/* Route line */}
        <View style={{ position: 'absolute', top: 90, left: 20, right: 20, height: 4, borderRadius: 2, backgroundColor: 'rgba(168,85,247,0.35)' }} />
        <View style={{ position: 'absolute', top: 90, left: 20, width: `${clamp * 88}%`, height: 4, borderRadius: 2, backgroundColor: t.accent1 }} />
        {/* Warehouse (origin) marker */}
        <View style={{ position: 'absolute', top: 78, left: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.accent1 }}>
          <Text style={{ fontSize: 14 }}>🏬</Text>
        </View>
        {/* Home (destination) marker */}
        <View style={{ position: 'absolute', top: 78, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.buy }}>
          <Text style={{ fontSize: 14 }}>🏠</Text>
        </View>
        {/* Driver marker — animated position along the route */}
        <View style={{ position: 'absolute', top: 66, left: `${20 + clamp * 78}%`, width: 40, height: 40, marginLeft: -20, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: t.live, shadowOpacity: 0.8, shadowRadius: 12 }}>
          <Text style={{ fontSize: 22 }}>🛵</Text>
        </View>
      </View>
      {/* Driver row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>👤</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: t.text }}>Karim · your driver</Text>
          <Text style={{ fontSize: 11, color: t.textDim }}>⭐ 4.9 · Toyota Yaris · ABC-1234</Text>
        </View>
        <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent1, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={17} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
