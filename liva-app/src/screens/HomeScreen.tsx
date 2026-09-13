import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { DailySpinModal } from '@/components/DailySpinModal';
import { Icon } from '@/components/Icon';
import { LivaLogo } from '@/components/LivaLogo';
import { PressScale } from '@/components/PressScale';
import { ProductCard } from '@/components/ProductCard';
import { SectionHead } from '@/components/SectionHead';
import { SparkleRefresh } from '@/components/SparkleRefresh';
import { StreamCard } from '@/components/StreamCard';
import { TappableIcon } from '@/components/TappableIcon';
import { Thumb } from '@/components/Thumb';
import { TabId } from '@/components/TabBar';
import { BannerType, BANNERS, CATEGORIES, Product, PRODUCTS, SELLERS, Stream, STREAMS, byId } from '@/data';
import { useAuth } from '@/state/AuthContext';
import { useExtras } from '@/state/AppExtras';
import { useProducts } from '@/state/ProductsContext';
import { useTheme } from '@/theme/ThemeContext';
import { fmtK, isRTL, pname, price, t as tr } from '@/i18n';

interface Props {
  onOpen: (product: Product) => void;
  onBuy: (product: Product) => void;
  onGoTab: (id: TabId) => void;
  onCategory: (id: string) => void;
  onSearch: () => void;
  onWishlist: () => void;
  onJoin: (stream: Stream) => void;
  onAccount: () => void;
  onBanner: (type: BannerType) => void;
  onNotifications: () => void;
  onScan: () => void;
  onOpenSeller: (sellerId: string) => void;
  onOpenAuctions: () => void;
  onOpenChatRooms: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  women: 'dress', men: 'shirt', kids: 'sparkle', clothing: 'shirt', shoes: 'shoe',
  accessories: 'bag', jewelry: 'gem', electronics: 'phone', beauty: 'sparkle', health: 'medical',
  home: 'sofa', sport: 'ball', food: 'utensils', toys: 'blocks', books: 'book',
  pets: 'paw', animal: 'paw', baby: 'baby', garden: 'leaf',
};

const ACTIONS = [
  { id: 'shop', icon: 'compass', en: 'Discover', ar: 'اكتشف', subEn: 'Made for you', subAr: 'مختار لك', colors: ['#635BFF', '#8B78FF'] as [string, string] },
  { id: 'live', icon: 'live', en: 'Live', ar: 'لايف', subEn: 'Watch & buy', subAr: 'شاهد واشترِ', colors: ['#FF3D71', '#FF7A5C'] as [string, string] },
  { id: 'auction', icon: 'hammer', en: 'Auctions', ar: 'المزادات', subEn: 'Bid to win', subAr: 'زايد واربح', colors: ['#FFB020', '#FF6B35'] as [string, string] },
  { id: 'rewards', icon: 'gift', en: 'Rewards', ar: 'المكافآت', subEn: 'Coins & perks', subAr: 'نقاط ومزايا', colors: ['#2DE2A6', '#11A985'] as [string, string] },
  { id: 'spin', icon: 'sparkle', en: 'Lucky drop', ar: 'حظك اليوم', subEn: 'Win coins', subAr: 'اربح نقاطاً', colors: ['#B85CFF', '#635BFF'] as [string, string] },
  { id: 'chat', icon: 'comment', en: 'Community', ar: 'المجتمع', subEn: 'Shop together', subAr: 'تسوقوا معاً', colors: ['#19C6E6', '#1676E8'] as [string, string] },
];

function greeting(ar: boolean) {
  const hour = new Date().getHours();
  if (ar) return hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'أهلاً بعودتك';
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Welcome back';
}

export function HomeScreen(props: Props) {
  const { t } = useTheme();
  const { user } = useAuth();
  const { unreadCount, recentlyViewed } = useExtras();
  const { products, reload: reloadProducts, reloading } = useProducts();
  const insets = useSafeAreaInsets();
  const ar = isRTL();
  const copy = (en: string, arabic: string) => ar ? arabic : en;
  const [refreshing, setRefreshing] = useState(false);
  const [spinOpen, setSpinOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const catalog = products.length ? products : PRODUCTS;
  const deals = useMemo(() => catalog.filter((product) => product.was).slice(0, 7), [catalog]);
  const trending = useMemo(() => catalog.filter((product) => product.rating >= 4.7).slice(0, 6), [catalog]);
  const streamFeatured = useMemo(() => {
    const seeded = byId[STREAMS[0].product];
    return catalog.find((product) => product.seed === seeded?.seed) || seeded;
  }, [catalog]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function refresh() {
    setRefreshing(true);
    try { await reloadProducts(); }
    finally { setRefreshing(false); }
  }

  function triggerAction(id: string) {
    if (id === 'shop') props.onGoTab('shop');
    else if (id === 'live') props.onGoTab('live');
    else if (id === 'auction') props.onOpenAuctions();
    else if (id === 'rewards') props.onGoTab('earn');
    else if (id === 'spin') setSpinOpen(true);
    else if (id === 'chat') props.onOpenChatRooms();
  }

  const viewed = recentlyViewed
    .map((id) => {
      const direct = catalog.find((product) => product.id === id);
      if (direct) return direct;
      const seeded = byId[id] || PRODUCTS.find((product) => product.id === id);
      return catalog.find((product) => product.seed === seeded?.seed) || seeded;
    })
    .filter((product): product is Product => !!product)
    .slice(0, 8);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SparkleRefresh active={refreshing} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.accent1} />}
      >
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <LivaLogo size={39} showWordmark />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <TappableIcon name="heart" onPress={props.onWishlist} pulseColor="#FF3D71" accessibilityLabel={copy('Wishlist', 'المفضلة')} />
              <TappableIcon
                name="bell"
                onPress={props.onNotifications}
                pulseColor="#FFB020"
                accessibilityLabel={copy('Notifications', 'الإشعارات')}
                badge={unreadCount > 0 ? (
                  <View style={{ minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF3D71', borderWidth: 2, borderColor: t.bg }}>
                    <Text style={{ color: '#fff', fontSize: 8.5, fontWeight: '900' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                ) : undefined}
              />
              <PressScale accessibilityRole="button" accessibilityLabel={copy('Account', 'الحساب')} onPress={props.onAccount} scaleTo={0.87} style={{ width: 41, height: 41, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: t.border }}>
                <Avatar seed={user?.avatarSeed || 'liva-user'} size={41} />
              </PressScale>
            </View>
          </View>

          <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700' }}>{greeting(ar)},</Text>
              <Text style={{ color: t.text, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.75, marginTop: 1 }}>
                {user?.firstName || user?.name?.split(' ')[0] || copy('Shopper', 'متسوق')}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(45,226,166,0.12)', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: t.buy }} />
              <Text style={{ color: t.buy, fontSize: 10.5, fontWeight: '900' }}>{copy('Market is live', 'السوق مباشر')}</Text>
            </View>
          </View>

          <PressScale onPress={props.onSearch} scaleTo={0.985} style={{ marginTop: 13, height: 50, paddingHorizontal: 14, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 31, height: 31, borderRadius: 11, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="search" size={16} color={t.accent1} />
            </View>
            <Text style={{ flex: 1, color: t.textDim, fontSize: 13.5 }}>{copy('Search products, sellers and live drops', 'ابحث عن منتج أو بائع أو بث مباشر')}</Text>
            <Pressable onPress={(event) => { event.stopPropagation?.(); props.onScan(); }} style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(25,198,230,0.12)', transform: [{ scale: pressed ? 0.88 : 1 }] })}>
              <Icon name="scan" size={18} color={t.accent2} />
            </Pressable>
          </PressScale>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <PulseHero featured={streamFeatured} onLive={() => props.onJoin(STREAMS[0])} onAuction={props.onOpenAuctions} onProduct={() => props.onOpen(streamFeatured)} />
        </View>

        <MarketTicker />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 22 }}>
          {ACTIONS.map((action) => (
            <PressScale key={action.id} onPress={() => triggerAction(action.id)} scaleTo={0.91} style={{ width: 82, alignItems: 'center' }}>
              <LinearGradient colors={action.colors} style={{ width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: action.colors[0], shadowOpacity: 0.28, shadowRadius: 9, shadowOffset: { width: 0, height: 5 } }}>
                <Icon name={action.icon} size={25} color="#fff" stroke={2.1} />
                <View style={{ position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.9)' }} />
              </LinearGradient>
              <Text numberOfLines={1} style={{ color: t.text, fontSize: 11.5, fontWeight: '900', marginTop: 7 }}>{ar ? action.ar : action.en}</Text>
              <Text numberOfLines={1} style={{ color: t.textDim, fontSize: 8.5, marginTop: 1 }}>{ar ? action.subAr : action.subEn}</Text>
            </PressScale>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 22 }}>
          {BANNERS.map((banner, index) => (
            <CampaignCard key={banner.id} type={banner.type} index={index} onPress={() => props.onBanner(banner.type)} />
          ))}
        </ScrollView>

        <SectionHead title={copy('Shop by world', 'تسوّق حسب العالم')} action={tr('seeAll')} onAction={() => props.onGoTab('shop')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 13, paddingBottom: 25 }}>
          {CATEGORIES.map((category) => (
            <PressScale key={category.id} onPress={() => props.onCategory(category.id)} scaleTo={0.88} style={{ width: 67, alignItems: 'center' }}>
              <LinearGradient
                colors={category.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', shadowColor: category.grad[0], shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
              >
                <View style={{ position: 'absolute', left: 8, top: 7, width: 22, height: 11, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ rotate: '-18deg' }] }} />
                <Icon name={CATEGORY_ICONS[category.id] || 'sparkle'} size={27} color="#fff" stroke={1.9} />
              </LinearGradient>
              <Text numberOfLines={1} style={{ color: t.text, fontSize: 10.5, fontWeight: '800', marginTop: 7, maxWidth: 67, textAlign: 'center' }}>{tr(category.key)}</Text>
            </PressScale>
          ))}
        </ScrollView>

        <View style={{ marginHorizontal: 16, borderRadius: 25, overflow: 'hidden', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginBottom: 24 }}>
          <View style={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,176,32,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bolt" size={20} color="#FFB020" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.35 }}>{copy('Deal dash', 'سباق العروض')}</Text>
              <Text style={{ color: t.textDim, fontSize: 10.5, marginTop: 1 }}>{copy('Fresh prices every hour', 'أسعار جديدة كل ساعة')}</Text>
            </View>
            <DealClock now={now} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 13, gap: 10, paddingBottom: 14 }}>
            {deals.map((product) => <DealCard key={product.id} product={product} onOpen={props.onOpen} onBuy={props.onBuy} />)}
          </ScrollView>
        </View>

        <SectionHead title={copy('Live right now', 'مباشر الآن')} icon="live" iconColor="#FF3D71" action={tr('seeAll')} onAction={() => props.onGoTab('live')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 25 }}>
          {STREAMS.map((stream) => <StreamCard key={stream.id} stream={stream} onJoin={props.onJoin} />)}
        </ScrollView>

        {viewed.length > 0 && (
          <>
            <SectionHead title={copy('Continue your trail', 'أكمل ما شاهدته')} icon="clock" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 11, paddingBottom: 25 }}>
              {viewed.map((product) => <MiniProduct key={product.id} product={product} onOpen={props.onOpen} />)}
            </ScrollView>
          </>
        )}

        <SectionHead title={copy('Trending for you', 'رائج لك')} icon="trend" iconColor={t.accent2} action={tr('seeAll')} onAction={() => props.onGoTab('shop')} />
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 11 }}>
          {trending.map((product) => (
            <View key={product.id} style={{ width: '48%' }}>
              <ProductCard p={product} onOpen={props.onOpen} onBuy={props.onBuy} />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 26 }}>
          <SectionHead title={copy('Creators to watch', 'بائعون يستحقون المتابعة')} icon="users" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 24 }}>
            {[...SELLERS].sort((a, b) => b.sales - a.sales).map((seller, index) => (
              <PressScale key={seller.id} onPress={() => props.onOpenSeller(seller.id)} scaleTo={0.94} style={{ width: 132, padding: 13, borderRadius: 21, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Avatar seed={seller.seed} size={44} verified={seller.verified} />
                  <View style={{ width: 23, height: 23, borderRadius: 9, backgroundColor: index < 3 ? 'rgba(255,176,32,0.14)' : t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: index < 3 ? '#FFB020' : t.textDim, fontSize: 10, fontWeight: '900' }}>{index + 1}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={{ color: t.text, fontSize: 12.5, fontWeight: '900', marginTop: 10 }}>{seller.name}</Text>
                <Text style={{ color: t.textDim, fontSize: 9.5, marginTop: 2 }}>{fmtK(seller.sales)} {copy('sales', 'عملية بيع')}</Text>
              </PressScale>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginHorizontal: 16, padding: 15, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-around' }}>
          {[
            { icon: 'shield', en: 'Buyer protection', ar: 'حماية المشتري', color: '#2DE2A6' },
            { icon: 'truck', en: 'Fast delivery', ar: 'توصيل سريع', color: '#19C6E6' },
            { icon: 'headset', en: 'Always here', ar: 'دعم دائم', color: '#B85CFF' },
          ].map((item) => (
            <View key={item.en} style={{ width: '31%', alignItems: 'center' }}>
              <Icon name={item.icon} size={20} color={item.color} />
              <Text numberOfLines={2} style={{ color: t.textDim, fontSize: 9.5, lineHeight: 13, fontWeight: '700', textAlign: 'center', marginTop: 7 }}>{ar ? item.ar : item.en}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <DailySpinModal visible={spinOpen} onClose={() => setSpinOpen(false)} />
    </View>
  );
}

function PulseHero({ featured, onLive, onAuction, onProduct }: { featured: Product; onLive: () => void; onAuction: () => void; onProduct: () => void }) {
  const { t } = useTheme();
  const { preferences } = useExtras();
  const { width } = useWindowDimensions();
  const ar = isRTL();
  const copy = (en: string, arabic: string) => ar ? arabic : en;
  const move = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (preferences.reducedMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(move, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(move, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [move, preferences.reducedMotion]);

  const translate = move.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <LinearGradient colors={['#7266FF', '#3D6AFF', '#10BFD7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 220, borderRadius: 29, padding: 18, overflow: 'hidden' }}>
      <Animated.View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 90, right: -56, top: -59, backgroundColor: 'rgba(255,255,255,0.13)', transform: [{ translateY: translate }] }} />
      <Animated.View style={{ position: 'absolute', width: 92, height: 92, borderRadius: 48, left: -36, bottom: -36, backgroundColor: 'rgba(45,226,166,0.22)', transform: [{ translateY: Animated.multiply(translate, -0.7) }] }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 7, backgroundColor: '#FFCC45' }} />
        <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.15 }}>{copy('LIVE MARKET PULSE', 'نبض السوق المباشر')}</Text>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ color: '#fff', fontSize: width < 370 ? 25 : 29, lineHeight: width < 370 ? 29 : 33, fontWeight: '900', letterSpacing: -1 }}>
            {copy('Discover it. Watch it. Own it.', 'اكتشفه. شاهده. واقتنه.')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11.5, lineHeight: 17, marginTop: 7, maxWidth: 220 }}>
            {copy('Drops, creators and prices moving with you in real time.', 'منتجات وبائعون وأسعار تتحرك معك لحظة بلحظة.')}
          </Text>
        </View>
        {featured && (
          <PressScale onPress={onProduct} scaleTo={0.93} style={{ width: 91, height: 113, borderRadius: 21, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.38)', transform: [{ rotate: '4deg' }] }}>
            <Thumb seed={featured.seed} imageUrl={featured.images?.[0]} vivid style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
            <LinearGradient colors={['transparent', 'rgba(5,10,18,0.78)']} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
            <View style={{ position: 'absolute', left: 7, right: 7, bottom: 7 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 8.5, fontWeight: '800' }}>{featured.brand}</Text>
              <Text style={{ color: '#FFEA86', fontSize: 12, fontWeight: '900' }}>{price(featured.price)}</Text>
            </View>
          </PressScale>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 15 }}>
        <PressScale onPress={onLive} scaleTo={0.94} style={{ height: 42, paddingHorizontal: 15, borderRadius: 15, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon name="play" size={14} color="#3D5FE8" />
          <Text style={{ color: '#24399A', fontSize: 12, fontWeight: '900' }}>{copy('Watch live', 'شاهد البث')}</Text>
        </PressScale>
        <PressScale onPress={onAuction} scaleTo={0.94} style={{ height: 42, paddingHorizontal: 14, borderRadius: 15, backgroundColor: 'rgba(5,10,18,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon name="hammer" size={15} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{copy('Live bids', 'مزاد مباشر')}</Text>
        </PressScale>
      </View>
    </LinearGradient>
  );
}

function MarketTicker() {
  const { t } = useTheme();
  const { preferences } = useExtras();
  const ar = isRTL();
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (preferences.reducedMotion) return;
    const animation = Animated.loop(Animated.timing(slide, { toValue: 1, duration: 9000, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [preferences.reducedMotion, slide]);
  const x = slide.interpolate({ inputRange: [0, 1], outputRange: [0, ar ? 160 : -160] });
  const message = ar ? 'خصومات مباشرة   •   شحن مجاني اليوم   •   مزادات حقيقية   •   نقاط مضاعفة' : 'LIVE PRICE DROPS   •   FREE SHIPPING TODAY   •   REAL AUCTIONS   •   2X COINS';
  return (
    <View style={{ height: 35, marginVertical: 13, backgroundColor: t.mode === 'dark' ? '#0B2434' : '#E7FAFD', overflow: 'hidden', justifyContent: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.border }}>
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ translateX: x }] }}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginRight: 38 }}>
            <Icon name="bolt" size={13} color="#FFB020" />
            <Text style={{ color: t.text, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.65 }}>{message}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function CampaignCard({ type, index, onPress }: { type: BannerType; index: number; onPress: () => void }) {
  const ar = isRTL();
  const content = {
    mega: { en: 'Mega Week', ar: 'أسبوع التخفيضات', subEn: 'Up to 60% off', subAr: 'خصم حتى 60%', icon: 'bolt', colors: ['#FF3D71', '#FF7A5C'] as [string, string] },
    new: { en: 'Fresh drops', ar: 'وصل حديثاً', subEn: 'See what just landed', subAr: 'شاهد كل جديد', icon: 'sparkle', colors: ['#635BFF', '#B85CFF'] as [string, string] },
    pay: { en: 'Pay your way', ar: 'ادفع بطريقتك', subEn: 'Split in 3, 6 or 12', subAr: 'قسّط على 3 أو 6 أو 12', icon: 'wallet', colors: ['#11B98B', '#19C6E6'] as [string, string] },
  }[type];
  return (
    <PressScale onPress={onPress} scaleTo={0.95} style={{ width: 208, height: 91 }}>
      <LinearGradient colors={content.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 22, padding: 13, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 77, height: 77, right: -20, top: -26, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.14)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{ width: 34, height: 34, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={content.icon} size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>{ar ? content.ar : content.en}</Text>
            <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 }}>{ar ? content.subAr : content.subEn}</Text>
          </View>
          <Icon name={ar ? 'chevL' : 'chevR'} size={15} color="#fff" />
        </View>
        <View style={{ position: 'absolute', bottom: 8, right: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '900' }}>0{index + 1}</Text>
        </View>
      </LinearGradient>
    </PressScale>
  );
}

function DealClock({ now }: { now: number }) {
  const { t } = useTheme();
  const date = new Date(now);
  const left = 3599 - (date.getMinutes() * 60 + date.getSeconds());
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {['00', mm, ss].map((value, index) => (
        <React.Fragment key={`${value}-${index}`}>
          <View style={{ minWidth: 28, height: 28, paddingHorizontal: 5, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: index === 2 ? '#FF3D71' : t.surface2 }}>
            <Text style={{ color: index === 2 ? '#fff' : t.text, fontSize: 10.5, fontWeight: '900' }}>{value}</Text>
          </View>
          {index < 2 && <Text style={{ color: t.textDim, fontSize: 10, fontWeight: '900' }}>:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

function DealCard({ product, onOpen, onBuy }: { product: Product; onOpen: (product: Product) => void; onBuy: (product: Product) => void }) {
  const { t } = useTheme();
  const off = product.was ? Math.round((1 - product.price / product.was) * 100) : 0;
  return (
    <PressScale onPress={() => onOpen(product)} scaleTo={0.95} style={{ width: 135, borderRadius: 18, overflow: 'hidden', backgroundColor: t.surface2 }}>
      <View style={{ height: 111 }}>
        <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ position: 'absolute', left: 7, top: 7, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FF3D71' }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>-{off}%</Text>
        </View>
      </View>
      <View style={{ padding: 9 }}>
        <Text numberOfLines={1} style={{ color: t.text, fontSize: 11.5, fontWeight: '800' }}>{pname(product)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }}>
          <Text style={{ color: t.text, fontSize: 14.5, fontWeight: '900' }}>{price(product.price)}</Text>
          <Pressable onPress={(event) => { event.stopPropagation?.(); onBuy(product); }} style={({ pressed }) => ({ width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.buy, transform: [{ scale: pressed ? 0.86 : 1 }] })}>
            <Icon name="plus" size={15} color="#06362A" stroke={2.5} />
          </Pressable>
        </View>
      </View>
    </PressScale>
  );
}

function MiniProduct({ product, onOpen }: { product: Product; onOpen: (product: Product) => void }) {
  const { t } = useTheme();
  return (
    <PressScale onPress={() => onOpen(product)} scaleTo={0.94} style={{ width: 191, padding: 9, borderRadius: 19, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <View style={{ width: 55, height: 55, borderRadius: 14, overflow: 'hidden' }}>
        <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: t.text, fontSize: 11.5, fontWeight: '800' }}>{pname(product)}</Text>
        <Text style={{ color: t.accent2, fontSize: 13, fontWeight: '900', marginTop: 4 }}>{price(product.price)}</Text>
      </View>
      <Icon name={isRTL() ? 'chevL' : 'chevR'} size={14} color={t.textDim} />
    </PressScale>
  );
}
