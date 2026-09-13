// Checkout — 3-step bottom sheet: confirm → payment → success.
// The server resolves the product price, issues a one-time checkout token and
// verifies Stripe before it creates the order. Web development uses the same
// server flow with a clearly-labelled mock intent.
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { BuyBtn } from '@/components/BuyBtn';
import { Product } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { useApp, Order } from '@/state/AppContext';
import { OrderPaymentResult, payForOrder, stripeConfigured } from '@/lib/payments';
import { apiCreateOrder } from '@/lib/api';
import { getSecure, SECURE_KEYS } from '@/lib/secureStorage';
import { track } from '@/lib/analytics';
import { t as tr, price, pname } from '@/i18n';

// Delivery slot options — 4 windows presented in checkout so the shopper
// commits to a delivery window at purchase time.
const DELIVERY_SLOTS = [
  { id: 'same_day',    icon: '⚡', label: 'Same day',       time: 'By 9 PM tonight' },
  { id: 'morning',     icon: '🌅', label: 'Tomorrow AM',    time: '9 AM – 12 PM' },
  { id: 'evening',     icon: '🌆', label: 'Tomorrow PM',    time: '2 PM – 8 PM' },
  { id: 'weekend',     icon: '📅', label: 'This weekend',   time: 'Sat 10 AM – 6 PM' },
];

export function CheckoutSheet({
  product,
  onClose,
  onComplete,
}: {
  product: Product | null;
  onClose: () => void;
  onComplete: (o: Order) => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { addOrder, addresses } = useApp();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [qty, setQty] = useState(1);
  const [deliverySlot, setDeliverySlot] = useState<string>('same_day');
  const [pay, setPay] = useState<'stripe' | 'cod'>('stripe');
  const [addressLine, setAddressLine] = useState('');
  const [preparedPayment, setPreparedPayment] = useState<OrderPaymentResult | null>(null);
  const [paying, setPaying] = useState(false);

  const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
  const formatAddress = (address: typeof defaultAddress) => address
    ? [address.recipient, address.line1, address.line2, address.city, address.state, address.zip, address.country]
      .filter(Boolean)
      .join(', ')
    : '';

  useEffect(() => {
    if (product) {
      setStep(0);
      setQty(1);
      setPay('stripe');
      setAddressLine(formatAddress(defaultAddress));
      setPreparedPayment(null);
      setPaying(false);
    }
  }, [product]);

  if (!product) return null;
  const total = product.price * qty;

  const methods = [
    { id: 'stripe' as const, label: 'Secure card or wallet', sub: 'Cards · Apple Pay · Google Pay', icon: 'shield' },
    { id: 'cod' as const, label: tr('cod'), sub: tr('codSub'), icon: 'truck' },
  ] as const;

  async function placeOrder() {
    // Modal is gated on `visible={!!product}`, but TS can't narrow across
    // this closure — guard so callers of pname/apiCreateOrder see a real value.
    if (!product) return;
    try {
      setPaying(true);
      const token = await getSecure(SECURE_KEYS.authToken).catch(() => null);
      if (!token) throw new Error('Please sign in again before checking out.');
      if (addressLine.trim().length < 5) throw new Error('Add a valid delivery address.');

      let payment = preparedPayment;
      if (!payment) {
        payment = await payForOrder({
          productId: product.id,
          productSeed: product.seed,
          qty,
          paymentMethod: pay,
        });
        // Keep this token if finalisation loses network. Retrying completes the
        // same paid checkout instead of creating a second charge.
        setPreparedPayment(payment);
      }
      const response = await apiCreateOrder(token, {
        checkoutId: payment.checkoutId,
        addressLine: addressLine.trim(),
        deliverySlot: deliverySlot as 'same_day' | 'morning' | 'evening' | 'weekend',
      });
      const o = addOrder({
        id: response.order.id,
        product,
        qty: response.order.qty,
        total: response.order.total,
        placedAt: new Date(response.order.placedAt).getTime(),
        status: response.order.status,
        paymentStatus: response.order.paymentStatus,
      });
      setPreparedPayment(null);
      track('purchase', { productId: product.id, total: response.order.total, qty: response.order.qty });
      setStep(2);
      setTimeout(() => onComplete(o), 0);
    } catch (e: any) {
      Alert.alert(preparedPayment ? 'Order needs attention' : 'Checkout failed', String(e?.message || e));
    } finally {
      setPaying(false);
    }
  }

  return (
    <Modal visible={!!product} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.6)' }} />
      <View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          backgroundColor: t.surface,
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          borderTopWidth: 1, borderColor: t.border,
          padding: 18,
          paddingBottom: Math.max(insets.bottom, 18) + 18,
          maxHeight: '88%',
        }}
      >
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 14 }} />
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: i <= step ? t.accent1 : t.surface2 }}
            />
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 14 }}>{tr('confirmOrder')}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                <View style={{ width: 64, height: 64, borderRadius: t.radius, overflow: 'hidden' }}>
                  <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: t.text }}>{pname(product)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{price(product.price)}</Text>
                    {product.was && <Text style={{ fontSize: 12, color: t.textDim, textDecorationLine: 'line-through' }}>{price(product.was)}</Text>}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 36, alignSelf: 'center', backgroundColor: t.surface2, borderRadius: 999 }}>
                  <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 32, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>−</Text>
                  </Pressable>
                  <Text style={{ width: 26, textAlign: 'center', color: t.text, fontWeight: '700' }}>{qty}</Text>
                  <Pressable onPress={() => setQty((q) => q + 1)} style={{ width: 32, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>+</Text>
                  </Pressable>
                </View>
              </View>
              <Row label={tr('subtotal')} value={price(total)} />
              <Row label={tr('shipping')} value={tr('free')} green />
              <View style={{ height: 1, backgroundColor: t.border, marginVertical: 12 }} />
              <Row label={tr('total')} value={price(total)} big />

              <View style={{ marginTop: 18 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: t.text, marginBottom: 10 }}>📍 Delivery address</Text>
                {addresses.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 9 }}>
                    {addresses.slice(0, 4).map((address) => {
                      const value = formatAddress(address);
                      const active = value === addressLine;
                      return (
                        <Pressable
                          key={address.id}
                          onPress={() => setAddressLine(value)}
                          style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? t.accent1 : t.surface2, borderWidth: 1, borderColor: active ? t.accent1 : t.border }}
                        >
                          <Text style={{ color: active ? '#fff' : t.text, fontSize: 11.5, fontWeight: '800' }}>{address.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                <View style={{ minHeight: 54, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: t.surface2, borderWidth: 1, borderColor: addressLine.trim().length >= 5 ? t.border : 'rgba(255,61,113,0.5)', flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Icon name="pin" size={18} color={t.accent1} />
                  <TextInput
                    value={addressLine}
                    onChangeText={setAddressLine}
                    placeholder="Recipient, building, street, city"
                    placeholderTextColor={t.textDim}
                    multiline
                    style={{ flex: 1, color: t.text, fontSize: 12.5, lineHeight: 18, paddingVertical: 0 }}
                  />
                </View>
              </View>

              {/* Delivery slot picker — 4 windows, choose one */}
              <View style={{ marginTop: 18 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: t.text, marginBottom: 10 }}>📅 Choose delivery slot</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {DELIVERY_SLOTS.map((s) => {
                    const active = deliverySlot === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setDeliverySlot(s.id)}
                        style={{
                          flex: 1, minWidth: '46%',
                          paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
                          backgroundColor: active ? t.accent1 : t.surface2,
                          borderWidth: 1, borderColor: active ? t.accent1 : 'transparent',
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#fff' : t.text }}>{s.label}</Text>
                          <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.85)' : t.textDim }}>{s.time}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <BuyBtn full onPress={() => addressLine.trim().length >= 5 ? setStep(1) : Alert.alert('Delivery address', 'Add a valid delivery address before continuing.')} style={{ marginTop: 18 }}>
                {`${tr('continue')} · ${price(total)}`}
              </BuyBtn>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Icon name="shield" size={13} color={t.textDim} />
                <Text style={{ color: t.textDim, fontSize: 11.5 }}>{tr('secureReturns')}</Text>
              </View>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 14 }}>{tr('payment')}</Text>

              <View style={{ gap: 10, marginBottom: 18 }}>
                {methods.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => { if (!preparedPayment) setPay(m.id); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      padding: 14, borderRadius: t.radius,
                      borderWidth: 1.5, borderColor: pay === m.id ? t.accent1 : t.border,
                      backgroundColor: pay === m.id ? 'rgba(139,92,246,0.1)' : t.surface2,
                      opacity: preparedPayment && pay !== m.id ? 0.45 : 1,
                    }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={m.icon} size={18} color={t.accent1} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{m.label}</Text>
                      <Text style={{ fontSize: 11.5, color: t.textDim }}>{m.sub}</Text>
                    </View>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: pay === m.id ? t.accent1 : t.border, alignItems: 'center', justifyContent: 'center' }}>
                      {pay === m.id && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent1 }} />}
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, padding: 11, borderRadius: 14, backgroundColor: t.surface2, marginBottom: 12 }}>
                <Icon name="shield" size={16} color={t.buy} />
                <Text style={{ flex: 1, color: t.textDim, fontSize: 11.5, lineHeight: 16 }}>The server verifies the product, stock and final amount before creating your order.</Text>
              </View>

              <BuyBtn full onPress={placeOrder}>
                {paying
                  ? <ActivityIndicator color="#04210f" />
                  : preparedPayment
                    ? 'Retry order confirmation'
                    : pay === 'cod'
                      ? `Place order · ${price(total)}`
                      : `${tr('pay')} ${price(total)}`}
              </BuyBtn>
              {!stripeConfigured && pay === 'stripe' && (
                <Text style={{ marginTop: 10, fontSize: 11, color: t.textDim, textAlign: 'center' }}>
                  Local test mode — no card is charged until Stripe keys are configured.
                </Text>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={{ alignItems: 'center', paddingVertical: 14 }}>
              <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: t.buy, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon name="check" size={40} color="#04210f" stroke={3} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 6 }}>{tr('orderPlaced')}</Text>
              <Text style={{ color: t.textDim, fontSize: 13.5, textAlign: 'center', marginBottom: 20 }}>
                {qty} × {pname(product)}
                {'\n'}
                {tr('arriving', { a: product.ship[0], b: product.ship[1] })}
              </Text>
              {/* Primary CTA: track the order. onComplete passes the order up so
                  the host can route to OrderTrackingScreen. */}
              <Pressable onPress={onClose} style={{ width: '100%', height: 50, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>{tr('done')}</Text>
              </Pressable>
              <BuyBtn full onPress={onClose} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Icon name="truck" size={16} color="#04210f" />
                  <Text style={{ color: '#04210f', fontSize: 14.5, fontWeight: '800' }}>{tr('trackOrder')}</Text>
                </View>
              </BuyBtn>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({ label, value, big, green }: { label: string; value: string; big?: boolean; green?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: big ? 15 : 13.5, fontWeight: big ? '800' : '500', color: big ? t.text : t.textDim }}>{label}</Text>
      <Text style={{ fontSize: big ? 18 : 13.5, fontWeight: big ? '800' : '600', color: green ? t.buy : t.text }}>{value}</Text>
    </View>
  );
}
