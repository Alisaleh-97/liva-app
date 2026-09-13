import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { PressScale } from '@/components/PressScale';
import { Thumb } from '@/components/Thumb';
import { Auction, getActiveAuctions } from '@/data/auctions';
import { byId, SELLERS } from '@/data';
import { apiListAuctions } from '@/lib/api';
import { useTheme } from '@/theme/ThemeContext';
import { isRTL, pname, price } from '@/i18n';

interface Props {
  onBack: () => void;
  onOpenAuction: (auction: Auction) => void;
}

export function AuctionsListScreen({ onBack, onOpenAuction }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const ar = isRTL();
  const copy = (en: string, arabic: string) => ar ? arabic : en;
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await apiListAuctions();
      setAuctions(response.auctions.filter((auction) => auction.status !== 'ended' && auction.status !== 'cancelled' && auction.endsAt > Date.now()));
      setOffline(false);
    } catch {
      setAuctions((current) => current.length ? current : getActiveAuctions());
      setOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveCount = auctions.filter((auction) => auction.status !== 'ended' && auction.endsAt > now).length;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={onBack} style={{ width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
          <Icon name={ar ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.7 }}>{copy('Live auctions', 'المزادات المباشرة')}</Text>
          <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: offline ? '#FFB020' : '#2DE2A6' }} />
            <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '700' }}>
              {offline ? copy('Preview data · reconnecting', 'بيانات معاينة · جارٍ إعادة الاتصال') : copy(`${liveCount} rooms synced now`, `${liveCount} غرف متصلة الآن`)}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => load(true)} style={{ width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 }}>
          {refreshing ? <ActivityIndicator size="small" color={t.accent1} /> : <Icon name="sparkle" size={19} color={t.accent1} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 38 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.accent1} />}
      >
        <LinearGradient
          colors={['#635BFF', '#376BFF', '#19C6E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 27, padding: 18, marginBottom: 16, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.12)', right: -45, top: -65 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: '#FFCC45' }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.15 }}>{copy('BID TO WIN', 'زايد لتفوز')}</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 26, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8, marginTop: 8, maxWidth: 270 }}>
            {copy('Real people. One live price.', 'أشخاص حقيقيون. سعر مباشر واحد.')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12.5, lineHeight: 18, marginTop: 7, maxWidth: 285 }}>
            {copy('Every bid is verified by LIVA before all connected phones update.', 'يتم التحقق من كل عرض في LIVA قبل تحديث جميع الهواتف المتصلة.')}
          </Text>
        </LinearGradient>

        {loading ? (
          <View style={{ height: 260, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={t.accent1} />
            <Text style={{ color: t.textDim, marginTop: 10, fontSize: 12 }}>{copy('Joining auction rooms…', 'جارٍ دخول غرف المزاد…')}</Text>
          </View>
        ) : auctions.length === 0 ? (
          <View style={{ height: 240, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Icon name="hammer" size={38} color={t.textDim} />
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', marginTop: 12 }}>{copy('No auctions are live', 'لا توجد مزادات مباشرة')}</Text>
            <Text style={{ color: t.textDim, fontSize: 12.5, textAlign: 'center', marginTop: 5 }}>{copy('Pull to refresh for the next drop.', 'اسحب للتحديث وانتظر المزاد القادم.')}</Text>
          </View>
        ) : (
          <>
            {auctions[0] && <AuctionHero auction={auctions[0]} now={now} onOpen={onOpenAuction} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 21, marginBottom: 11 }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>{copy('More live drops', 'مزادات مباشرة أخرى')}</Text>
              <Text style={{ color: t.accent2, fontSize: 11.5, fontWeight: '800' }}>{auctions.length - 1} {copy('rooms', 'غرف')}</Text>
            </View>
            <View style={{ gap: 10 }}>
              {auctions.slice(1).map((auction) => <AuctionRow key={auction.id} auction={auction} now={now} onOpen={onOpenAuction} />)}
            </View>
          </>
        )}

        <View style={{ marginTop: 18, padding: 15, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(45,226,166,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={20} color={t.buy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '900' }}>{copy('Fair-bid protection', 'حماية المزايدة العادلة')}</Text>
            <Text style={{ color: t.textDim, fontSize: 11.5, lineHeight: 17, marginTop: 4 }}>
              {copy('A bid in the final 10 seconds extends the room. You pay only when you win.', 'أي عرض خلال آخر 10 ثوانٍ يمدد المزاد. لا تدفع إلا عند الفوز.')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function AuctionHero({ auction, now, onOpen }: { auction: Auction; now: number; onOpen: (auction: Auction) => void }) {
  const { t } = useTheme();
  const product = byId[auction.productId];
  const seller = SELLERS.find((item) => item.id === auction.sellerId);
  if (!product) return null;
  const timer = formatTimer(auction.endsAt, now);
  return (
    <PressScale onPress={() => onOpen(auction)} scaleTo={0.98} style={{ borderRadius: 27, overflow: 'hidden', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
      <View style={{ height: 218 }}>
        <Thumb seed={`${product.seed}-hero`} imageUrl={product.images?.[0]} vivid style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <LinearGradient colors={['rgba(5,10,18,0.16)', 'rgba(5,10,18,0.1)', 'rgba(5,10,18,0.9)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FF3D71', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: '#fff' }} />
            <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.7 }}>LIVE</Text>
          </View>
          <TimerPill value={timer} urgent={timer.urgent} />
        </View>
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: '900', letterSpacing: 0.9 }}>{product.brand.toUpperCase()}</Text>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.6, marginTop: 3 }}>{pname(product)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.67)', fontSize: 11.5, marginTop: 4 }}>{seller?.name || 'LIVA Seller'}</Text>
        </View>
      </View>
      <View style={{ padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.85 }}>CURRENT BID · {auction.bidCount} BIDS</Text>
          <Text style={{ color: t.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, marginTop: 2 }}>{price(auction.currentBid)}</Text>
          <Text style={{ color: t.textDim, fontSize: 10.5, marginTop: 1 }}>Retail {price(product.price)}</Text>
        </View>
        <LinearGradient colors={['#635BFF', '#19C6E6']} style={{ height: 47, paddingHorizontal: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}>
          <Icon name="hammer" size={17} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '900' }}>Join bid</Text>
        </LinearGradient>
      </View>
    </PressScale>
  );
}

function AuctionRow({ auction, now, onOpen }: { auction: Auction; now: number; onOpen: (auction: Auction) => void }) {
  const { t } = useTheme();
  const product = byId[auction.productId];
  if (!product) return null;
  const timer = formatTimer(auction.endsAt, now);
  return (
    <PressScale onPress={() => onOpen(auction)} scaleTo={0.975} style={{ padding: 10, borderRadius: 21, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <View style={{ width: 82, height: 82, borderRadius: 17, overflow: 'hidden' }}>
        <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.accent2, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.7 }}>{product.brand.toUpperCase()}</Text>
        <Text numberOfLines={1} style={{ color: t.text, fontSize: 14, fontWeight: '900', marginTop: 3 }}>{pname(product)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '900' }}>{price(auction.currentBid)}</Text>
          <Text style={{ color: t.textDim, fontSize: 10.5 }}>{auction.bidCount} bids</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 10 }}>
        <TimerPill value={timer} urgent={timer.urgent} compact />
        <View style={{ width: 30, height: 30, borderRadius: 11, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={isRTL() ? 'chevL' : 'chevR'} size={15} color={t.accent1} />
        </View>
      </View>
    </PressScale>
  );
}

function formatTimer(endsAt: number, now: number) {
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return {
    label: hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`,
    urgent: seconds <= 15,
  };
}

function TimerPill({ value, urgent, compact = false }: { value: { label: string }; urgent: boolean; compact?: boolean }) {
  return (
    <View style={{ paddingHorizontal: compact ? 8 : 10, paddingVertical: compact ? 5 : 6, borderRadius: 10, backgroundColor: urgent ? '#FF3D71' : 'rgba(5,10,18,0.68)', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Icon name="timer" size={compact ? 11 : 12} color="#fff" />
      <Text style={{ color: '#fff', fontSize: compact ? 10.5 : 11.5, fontWeight: '900', letterSpacing: 0.45 }}>{value.label}</Text>
    </View>
  );
}
