import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { BuyBtn } from '@/components/BuyBtn';
import { Icon } from '@/components/Icon';
import { Confetti } from '@/components/StreamEffects';
import { Thumb } from '@/components/Thumb';
import { Auction } from '@/data/auctions';
import { byId, Product, SELLERS } from '@/data';
import { useAuctionRoom } from '@/lib/useAuctionRoom';
import { useAuth } from '@/state/AuthContext';
import { useExtras } from '@/state/AppExtras';
import { useTheme } from '@/theme/ThemeContext';
import { fmtK, isRTL, pname, price } from '@/i18n';
import { tap } from '@/lib/haptics';

interface Props {
  auction: Auction;
  onClose: () => void;
  onCheckout: (product: Product, winningPrice: number) => void;
}

export function LiveAuctionScreen({ auction: seed, onClose, onCheckout }: Props) {
  const { t } = useTheme();
  const { user } = useAuth();
  const { preferences } = useExtras();
  const insets = useSafeAreaInsets();
  const room = useAuctionRoom(seed);
  const { auction, bids } = room;
  const product = byId[auction.productId];
  const seller = SELLERS.find((item) => item.id === auction.sellerId);
  const [now, setNow] = useState(Date.now());
  const [customOpen, setCustomOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(0);
  const pricePulse = useRef(new Animated.Value(1)).current;
  const endingSeen = useRef(false);
  const ar = isRTL();
  const copy = (en: string, arabic: string) => ar ? arabic : en;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (preferences.reducedMotion) return;
    pricePulse.setValue(0.9);
    Animated.spring(pricePulse, { toValue: 1, speed: 18, bounciness: 12, useNativeDriver: true }).start();
  }, [auction.currentBid, preferences.reducedMotion, pricePulse]);

  const top = bids[0] || auction.topBidder || null;
  const meIsTop = !!top && top.userId === user?.id;
  const secondsLeft = Math.max(0, Math.ceil((auction.endsAt - now) / 1000));
  const ended = auction.status === 'ended' || secondsLeft <= 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const nextBid = Math.round((auction.currentBid + auction.minIncrement) * 100) / 100;

  useEffect(() => {
    if (ended && meIsTop && !endingSeen.current) {
      endingSeen.current = true;
      setConfetti((value) => value + 1);
      tap('success', preferences.haptics);
    }
  }, [ended, meIsTop, preferences.haptics]);

  const quickBids = useMemo(() => {
    const step = Math.max(auction.minIncrement, 1);
    return [step, step * 2, step * 5].map((delta) => ({ delta, amount: Math.round((auction.currentBid + delta) * 100) / 100 }));
  }, [auction.currentBid, auction.minIncrement]);

  if (!product) {
    return (
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 106, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg, padding: 24 }}>
        <Icon name="hammer" size={34} color={t.live} />
        <Text style={{ marginTop: 12, color: t.text, fontWeight: '800' }}>{copy('Auction product is unavailable.', 'منتج المزاد غير متوفر حالياً.')}</Text>
        <Pressable onPress={onClose} style={{ marginTop: 18, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, backgroundColor: t.surface2 }}>
          <Text style={{ color: t.text, fontWeight: '800' }}>{copy('Go back', 'رجوع')}</Text>
        </Pressable>
      </View>
    );
  }

  async function submitBid(amount: number) {
    if (ended || room.pendingBid) return;
    if (amount < nextBid) {
      setLocalError(copy(`Minimum bid is ${price(nextBid)}.`, `الحد الأدنى للمزايدة هو ${price(nextBid)}.`));
      return;
    }
    setLocalError(null);
    tap('medium', preferences.haptics);
    try { await room.placeBid(amount); }
    catch { /* The hook exposes a friendly server error in the UI. */ }
  }

  function submitCustomBid() {
    const value = Number(customAmount.replace(',', '.'));
    if (!Number.isFinite(value)) {
      setLocalError(copy('Enter a valid amount.', 'أدخل مبلغاً صحيحاً.'));
      return;
    }
    setCustomOpen(false);
    setCustomAmount('');
    submitBid(value);
  }

  if (ended) {
    const won = meIsTop && !!top;
    return (
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 106, backgroundColor: t.bg }}>
        <Confetti trigger={confetti} pieces={64} />
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 54, paddingHorizontal: 20, paddingBottom: 50 }}>
          <LinearGradient
            colors={won ? ['#2DE2A6', '#19C6E6'] : ['#635BFF', '#9D65FF']}
            style={{ alignSelf: 'center', width: 92, height: 92, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
          >
            <Icon name={won ? 'crown' : 'hammer'} size={43} color="#fff" stroke={2.2} />
          </LinearGradient>
          <Text style={{ color: t.text, fontSize: 29, fontWeight: '900', textAlign: 'center', letterSpacing: -0.8 }}>
            {won ? copy('You won the drop!', 'لقد فزت بالمزاد!') : copy('Auction completed', 'انتهى المزاد')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 }}>
            {won
              ? copy('Your item is reserved for 10 minutes. Complete checkout to secure it.', 'تم حجز المنتج لك لمدة 10 دقائق. أكمل الدفع لتأكيده.')
              : top
                ? copy(`${top.userName} placed the winning bid.`, `صاحب العرض الفائز: ${top.userName}.`)
                : copy('The auction closed without a winning bid.', 'أُغلق المزاد دون عرض فائز.')}
          </Text>

          <View style={{ marginTop: 24, padding: 14, borderRadius: 24, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', gap: 13, alignItems: 'center' }}>
            <View style={{ width: 76, height: 76, borderRadius: 19, overflow: 'hidden' }}>
              <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.accent2, fontSize: 10, fontWeight: '900', letterSpacing: 0.9 }}>{product.brand.toUpperCase()}</Text>
              <Text numberOfLines={2} style={{ color: t.text, fontSize: 15, lineHeight: 19, fontWeight: '800', marginTop: 3 }}>{pname(product)}</Text>
              <Text style={{ color: t.textDim, fontSize: 11.5, marginTop: 5 }}>{copy('Retail', 'السعر الأصلي')} {price(product.price)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: t.textDim, fontSize: 9.5, fontWeight: '800' }}>{copy('FINAL', 'النهائي')}</Text>
              <Text style={{ color: t.buy, fontSize: 21, fontWeight: '900' }}>{price(top?.amount || auction.currentBid)}</Text>
            </View>
          </View>

          {won ? (
            <BuyBtn full onPress={() => onCheckout(product, top!.amount)} style={{ height: 54, marginTop: 18 }}>
              {copy(`Checkout ${price(top!.amount)}`, `ادفع ${price(top!.amount)}`)}
            </BuyBtn>
          ) : (
            <Pressable onPress={onClose} style={{ height: 52, marginTop: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 }}>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: '800' }}>{copy('Explore more auctions', 'استكشف مزادات أخرى')}</Text>
            </Pressable>
          )}
        </ScrollView>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: insets.top + 8, left: 14, width: 42, height: 42, borderRadius: 16, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.border }}>
          <Icon name={ar ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
      </View>
    );
  }

  const connectionColor = room.connection === 'live' ? '#2DE2A6' : room.connection === 'offline' ? '#FFB020' : '#19C6E6';
  const connectionText = room.connection === 'live'
    ? copy('Synced live', 'متصل مباشر')
    : room.connection === 'offline'
      ? copy('REST fallback', 'اتصال احتياطي')
      : copy('Connecting', 'جارٍ الاتصال');
  const message = localError || room.error;

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 106, backgroundColor: '#050A12' }}>
      <Thumb seed={`${product.seed}-auction`} imageUrl={product.images?.[0]} vivid style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <LinearGradient
        colors={['rgba(4,9,18,0.7)', 'rgba(4,9,18,0.1)', 'rgba(4,9,18,0.76)', '#050A12']}
        locations={[0, 0.28, 0.61, 0.93]}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 4 }}>
        <Pressable onPress={onClose} style={{ width: 40, height: 40, borderRadius: 15, backgroundColor: 'rgba(5,10,18,0.68)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' }}>
          <Icon name={ar ? 'chevR' : 'chevL'} size={19} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(5,10,18,0.68)', padding: 5, paddingRight: 11, borderRadius: 16 }}>
          <Avatar seed={seller?.seed || `seller-${auction.sellerId}`} size={29} verified={seller?.verified} />
          <Text numberOfLines={1} style={{ color: '#fff', maxWidth: 104, fontSize: 11.5, fontWeight: '800' }}>{seller?.name || copy('LIVA seller', 'بائع LIVA')}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(5,10,18,0.68)' }}>
          <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: connectionColor }} />
          <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{connectionText}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: '#FF3D71' }}>
            <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 }}>LIVE AUCTION</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: 'rgba(5,10,18,0.58)' }}>
            <Icon name="users" size={11} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{fmtK(room.viewers)}</Text>
          </View>
        </View>
        <Text style={{ color: '#fff', fontSize: 23, fontWeight: '900', letterSpacing: -0.6, marginTop: 9 }} numberOfLines={2}>{pname(product)}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.67)', fontSize: 11.5, marginTop: 4 }}>
          {product.brand} · {copy('Retail', 'السعر الأصلي')} {price(product.price)}
        </Text>
      </View>

      <View style={{ marginTop: 28, alignItems: 'center', paddingHorizontal: 18 }}>
        <Text style={{ color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>{copy('CURRENT BID', 'العرض الحالي')}</Text>
        <Animated.Text style={{ color: meIsTop ? '#2DE2A6' : '#fff', fontSize: 54, fontWeight: '900', letterSpacing: -1.8, marginTop: 3, transform: [{ scale: pricePulse }] }}>
          {price(auction.currentBid)}
        </Animated.Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 13, backgroundColor: meIsTop ? 'rgba(45,226,166,0.18)' : 'rgba(255,255,255,0.11)' }}>
            <Icon name={meIsTop ? 'crown' : 'users'} size={14} color={meIsTop ? '#2DE2A6' : '#fff'} />
            <Text style={{ color: meIsTop ? '#2DE2A6' : '#fff', fontSize: 11.5, fontWeight: '800' }}>
              {meIsTop
                ? copy('You are leading', 'أنت صاحب أعلى عرض')
                : top
                  ? top.userName
                  : auction.bidCount > 0
                    ? copy(`${auction.bidCount} verified bids`, `${auction.bidCount} عروض موثّقة`)
                    : copy('Be the first bidder', 'كن أول مزايد')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 13, backgroundColor: secondsLeft <= 10 ? '#FF3D71' : 'rgba(255,176,32,0.2)' }}>
            <Icon name="timer" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.7 }}>{mm}:{ss}</Text>
          </View>
        </View>
      </View>

      {message && (
        <Pressable onPress={() => { setLocalError(null); room.clearError(); }} style={{ marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13, backgroundColor: 'rgba(255,61,113,0.2)', borderWidth: 1, borderColor: 'rgba(255,61,113,0.38)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="close" size={13} color="#FF7A9C" />
          <Text style={{ flex: 1, color: '#FFD8E3', fontSize: 11.5, fontWeight: '700' }}>{message}</Text>
        </Pressable>
      )}

      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: insets.bottom + 18 }}>
        <View style={{ maxHeight: 142, marginBottom: 12 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6, justifyContent: 'flex-end' }}>
            {bids.length === 0 ? (
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(5,10,18,0.62)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11.5 }}>
                  {auction.bidCount > 0
                    ? copy('Previous bids verified · new activity appears here live.', 'العروض السابقة موثّقة · يظهر النشاط الجديد هنا مباشرةً.')
                    : copy('No bids yet — make the first move.', 'لا توجد عروض بعد — ابدأ أنت.')}
                </Text>
              </View>
            ) : bids.slice(0, 10).map((bid, index) => {
              const mine = bid.userId === user?.id;
              return (
                <View key={bid.id} style={{ alignSelf: 'flex-start', maxWidth: '90%', flexDirection: 'row', alignItems: 'center', gap: 7, padding: 5, paddingRight: 11, borderRadius: 16, backgroundColor: mine ? 'rgba(45,226,166,0.24)' : index === 0 ? 'rgba(99,91,255,0.32)' : 'rgba(5,10,18,0.62)' }}>
                  <Avatar seed={bid.avatarSeed || `bidder-${bid.userId}`} size={25} />
                  <Text numberOfLines={1} style={{ maxWidth: 105, color: '#fff', fontSize: 11, fontWeight: '800' }}>{mine ? copy('You', 'أنت') : bid.userName}</Text>
                  <Text style={{ color: mine ? '#2DE2A6' : '#fff', fontSize: 12, fontWeight: '900' }}>{price(bid.amount)}</Text>
                  {index === 0 && <Icon name="crown" size={11} color="#FFCC45" />}
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 9 }}>
          {quickBids.map(({ delta, amount }) => (
            <Pressable
              key={delta}
              onPress={() => submitBid(amount)}
              disabled={room.pendingBid}
              style={({ pressed }) => ({ flex: 1, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', opacity: pressed || room.pendingBid ? 0.65 : 1 })}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>+{price(delta)}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setCustomOpen(true)} style={{ width: 44, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
            <Icon name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        <Pressable disabled={room.pendingBid} onPress={() => submitBid(nextBid)} style={({ pressed }) => ({ borderRadius: 19, overflow: 'hidden', opacity: pressed || room.pendingBid ? 0.76 : 1 })}>
          <LinearGradient colors={['#635BFF', '#19C6E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            {room.pendingBid ? <ActivityIndicator color="#fff" /> : <Icon name="hammer" size={21} color="#fff" stroke={2.2} />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              {room.pendingBid ? copy('Confirming bid…', 'جارٍ تأكيد العرض…') : copy(`Bid ${price(nextBid)}`, `زايد بـ ${price(nextBid)}`)}
            </Text>
          </LinearGradient>
        </Pressable>
        <Text style={{ color: 'rgba(255,255,255,0.48)', textAlign: 'center', fontSize: 9.5, marginTop: 7 }}>
          {copy('Server verified · +10s anti-sniping protection', 'موثّق من الخادم · تمديد 10 ثوانٍ لمنع الخطف')}
        </Text>
      </View>

      <Modal visible={customOpen} transparent animationType="slide" onRequestClose={() => setCustomOpen(false)}>
        <Pressable onPress={() => setCustomOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(2,7,14,0.7)' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: Math.max(insets.bottom, 18) + 18, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: t.surface }}>
          <View style={{ alignSelf: 'center', width: 42, height: 4, borderRadius: 9, backgroundColor: t.border, marginBottom: 19 }} />
          <Text style={{ color: t.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.5 }}>{copy('Set your bid', 'حدد عرضك')}</Text>
          <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 5 }}>{copy(`Minimum ${price(nextBid)}`, `الحد الأدنى ${price(nextBid)}`)}</Text>
          <View style={{ height: 56, borderRadius: 18, paddingHorizontal: 15, marginTop: 16, backgroundColor: t.surface2, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: t.border }}>
            <Icon name="wallet" size={19} color={t.accent1} />
            <TextInput
              value={customAmount}
              onChangeText={setCustomAmount}
              autoFocus
              keyboardType="decimal-pad"
              placeholder={String(nextBid)}
              placeholderTextColor={t.textDim}
              style={{ flex: 1, color: t.text, fontSize: 18, fontWeight: '800', textAlign: ar ? 'right' : 'left' }}
            />
          </View>
          <BuyBtn full onPress={submitCustomBid} style={{ height: 54, marginTop: 14 }}>{copy('Confirm live bid', 'تأكيد العرض المباشر')}</BuyBtn>
        </View>
      </Modal>
    </View>
  );
}
