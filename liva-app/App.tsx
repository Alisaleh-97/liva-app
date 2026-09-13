// Root app shell: theme + state providers, tab routing, overlays.
import React, { useState } from 'react';
import { View, StatusBar, Pressable, ActivityIndicator, Text, TextInput } from 'react-native';
import { FONT_FAMILY } from '@/theme/typography';
import { initErrorReporting } from '@/lib/errorReporting';
import { track } from '@/lib/analytics';

// One-time startup — fire-and-forget so the app boots even if either
// service is misconfigured. Both no-op when their DSN/key isn't set.
initErrorReporting();
track('app_open');

// Apply SF Pro / system font globally so every screen inherits it without
// having to touch individual styles. Runs once at module load.
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: FONT_FAMILY }, (Text as any).defaultProps.style];
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.style = [{ fontFamily: FONT_FAMILY }, (TextInput as any).defaultProps.style];
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { AppProvider } from '@/state/AppContext';
import { AppExtrasProvider } from '@/state/AppExtras';
import { CompareProvider, useCompare } from '@/state/CompareContext';
import { ProductsProvider } from '@/state/ProductsContext';
import { AuthProvider, useAuth } from '@/state/AuthContext';
import { StripeWrapper } from '@/components/StripeWrapper';
import { TabBar, TabId } from '@/components/TabBar';
import { Icon } from '@/components/Icon';
import { HomeScreen } from '@/screens/HomeScreen';
import { ShopScreen } from '@/screens/ShopScreen';
import { AIScreen } from '@/screens/AIScreen';
import { PDPScreen } from '@/screens/PDPScreen';
import { CheckoutSheet } from '@/screens/CheckoutSheet';
import { ComingSoonScreen } from '@/screens/ComingSoonScreen';
import { AuthScreen } from '@/screens/account/AuthScreen';
import { AccountScreen, AccountSubpage } from '@/screens/account/AccountScreen';
import { OrdersScreen } from '@/screens/account/OrdersScreen';
import { SettingsScreen } from '@/screens/account/SettingsScreen';
import { SupportScreen } from '@/screens/account/SupportScreen';
import { BusinessDashboard } from '@/screens/account/BusinessDashboard';
import { MyProductsScreen } from '@/screens/account/MyProductsScreen';
import { AddProductScreen } from '@/screens/account/AddProductScreen';
import { GoLiveSetupScreen } from '@/screens/account/GoLiveSetupScreen';
import { PromotionsScreen } from '@/screens/account/PromotionsScreen';
import { PayoutsScreen } from '@/screens/account/PayoutsScreen';
import { AudienceScreen } from '@/screens/account/AudienceScreen';
import { VerificationScreen } from '@/screens/account/VerificationScreen';
import { AddressesScreen } from '@/screens/account/AddressesScreen';
import { PaymentMethodsScreen } from '@/screens/account/PaymentMethodsScreen';
import { WishlistScreen } from '@/screens/account/WishlistScreen';
import { LoyaltyScreen } from '@/screens/account/LoyaltyScreen';
import { AffiliateScreen } from '@/screens/account/AffiliateScreen';
import { AcademyScreen } from '@/screens/account/AcademyScreen';
import { SellerOrdersScreen } from '@/screens/account/SellerOrdersScreen';
import { OrderTrackingScreen } from '@/screens/account/OrderTrackingScreen';
import { EditProductScreen } from '@/screens/account/EditProductScreen';
import { IntegrationsScreen } from '@/screens/account/IntegrationsScreen';
import { AboutScreen } from '@/screens/account/AboutScreen';
import { NotificationsScreen } from '@/screens/account/NotificationsScreen';
import { MessagesScreen } from '@/screens/account/MessagesScreen';
import { ForYouScreen } from '@/screens/ForYouScreen';
import { OnboardingTour } from '@/components/OnboardingTour';
import { PastLivesScreen } from '@/screens/account/PastLivesScreen';
import { ReplayScreen } from '@/screens/account/ReplayScreen';
import { CollectionScreen } from '@/screens/CollectionScreen';
import { ScanScreen } from '@/screens/ScanScreen';
import { LiveViewerScreen } from '@/screens/LiveViewerScreen';
import { EditProfileScreen } from '@/screens/account/EditProfileScreen';
import { SellerProfileScreen } from '@/screens/account/SellerProfileScreen';
import { FollowingScreen } from '@/screens/account/FollowingScreen';
import { SavedSearchesScreen } from '@/screens/account/SavedSearchesScreen';
import { LiveChatRoomsScreen } from '@/screens/LiveChatRoomsScreen';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ServerStatusBanner } from '@/components/ServerStatusBanner';
import { SavedStream } from '@/state/AppExtras';
import { BannerType, Stream as DataStream } from '@/data';
import { LiveBroadcastRoom } from '@/screens/LiveBroadcastRoom';
import { LiveAuctionScreen } from '@/screens/LiveAuctionScreen';
import { AuctionsListScreen } from '@/screens/AuctionsListScreen';
import { CompareScreen } from '@/screens/CompareScreen';
import { getActiveAuctions, Auction } from '@/data/auctions';
import { SearchScreen } from '@/screens/SearchScreen';
import { Order } from '@/state/AppContext';
import { Product, Stream } from '@/data';

interface LiveSession { title: string; product: Product; salesGoal: number }

function AccountStack({
  onClose,
  onLaunchLive,
  onOpenPDP,
  onOpenCheckout,
  initialPage = 'home',
  initialSellerId,
}: {
  onClose: () => void;
  onLaunchLive: (s: LiveSession) => void;
  onOpenPDP: (p: Product) => void;
  onOpenCheckout: (p: Product) => void;
  initialPage?: AccountSubpage;
  initialSellerId?: string | null;
}) {
  const [page, setPage] = useState<AccountSubpage>(initialPage);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [openReplay, setOpenReplay] = useState<SavedStream | null>(null);
  const [openSellerId, setOpenSellerId] = useState<string | null>(initialSellerId ?? null);
  const back = () => setPage('home');
  if (page === 'orders') return <OrdersScreen onBack={back} onTrack={(o) => { setTrackingOrder(o); setPage('tracking'); }} />;
  if (page === 'settings') return <SettingsScreen onBack={back} />;
  if (page === 'support') return <SupportScreen onBack={back} />;
  if (page === 'addresses') return <AddressesScreen onBack={back} />;
  if (page === 'paymentMethods') return <PaymentMethodsScreen onBack={back} />;
  if (page === 'wishlist') return <WishlistScreen onBack={back} onOpen={(p) => { onClose(); onOpenPDP(p); }} onBuy={(p) => { onClose(); onOpenCheckout(p); }} />;
  if (page === 'loyalty') return <LoyaltyScreen onBack={back} />;
  if (page === 'affiliate') return <AffiliateScreen onBack={back} />;
  if (page === 'academy') return <AcademyScreen onBack={back} />;
  if (page === 'sellerOrders') return <SellerOrdersScreen onBack={back} />;
  if (page === 'tracking' && trackingOrder) return <OrderTrackingScreen order={trackingOrder} onBack={() => setPage('orders')} />;
  if (page === 'dashboard') return <BusinessDashboard onBack={back} onGoLive={() => setPage('goLive')} onPayouts={() => setPage('payouts')} onProducts={() => setPage('myProducts')} />;
  if (page === 'myProducts') return <MyProductsScreen onBack={back} onAddNew={() => setPage('addProduct')} onEdit={(p) => { setEditingProduct(p); setPage('editProduct'); }} />;
  if (page === 'addProduct') return <AddProductScreen onBack={() => setPage('myProducts')} onSaved={() => setPage('myProducts')} />;
  if (page === 'editProduct' && editingProduct) return <EditProductScreen product={editingProduct} onBack={() => setPage('myProducts')} />;
  if (page === 'goLive') return <GoLiveSetupScreen onBack={back} onStartLive={(title, product, salesGoal) => { onLaunchLive({ title, product, salesGoal }); }} />;
  if (page === 'promotions') return <PromotionsScreen onBack={back} />;
  if (page === 'payouts') return <PayoutsScreen onBack={back} />;
  if (page === 'audience') return <AudienceScreen onBack={back} />;
  if (page === 'verification') return <VerificationScreen onBack={back} />;
  if (page === 'integrations') return <IntegrationsScreen onBack={back} />;
  if (page === 'about') return <AboutScreen onBack={back} />;
  if (page === 'notifications') return <NotificationsScreen onBack={back} />;
  if (page === 'messages') return <MessagesScreen onBack={back} />;
  if (page === 'pastLives') return <PastLivesScreen onBack={back} onOpen={(s) => { setOpenReplay(s); setPage('replay'); }} />;
  if (page === 'replay' && openReplay) return <ReplayScreen stream={openReplay} onBack={() => setPage('pastLives')} />;
  if (page === 'editProfile') return <EditProfileScreen onBack={back} />;
  if (page === 'following') return <FollowingScreen onBack={back} onOpenSeller={(id) => { setOpenSellerId(id); setPage('sellerProfile'); }} />;
  if (page === 'savedSearches') return <SavedSearchesScreen onBack={back} onRunSearch={() => back()} />;
  if (page === 'chatRooms') return <LiveChatRoomsScreen onBack={back} />;
  if (page === 'sellerProfile' && openSellerId) return (
    <SellerProfileScreen
      sellerId={openSellerId}
      onBack={() => setPage(followedSellerReturnTo(openSellerId!))}
      onOpen={(p) => { onClose(); onOpenPDP(p); }}
      onBuy={(p) => { onClose(); onOpenCheckout(p); }}
      onMessage={() => setPage('messages')}
    />
  );
  return <AccountScreen onClose={onClose} onNavigate={setPage} />;
}

function followedSellerReturnTo(_id: string): AccountSubpage {
  return 'following';
}

function Shell() {
  const { t } = useTheme();
  const { user, hydrated } = useAuth();
  const [tab, setTab] = useState<TabId>('home');
  const [shopFilter, setShopFilter] = useState('ai');
  const [pdp, setPdp] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState<Product | null>(null);
  // (no separate liveOpen flag — TabBar highlights "live" when any of
  // forYouOpen / liveViewer / liveSession is active.)
  const [accountOpen, setAccountOpen] = useState<false | AccountSubpage>(false);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [forYouOpen, setForYouOpen] = useState(false);
  const [collection, setCollection] = useState<BannerType | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [liveViewer, setLiveViewer] = useState<DataStream | null>(null);
  const [openSellerId, setOpenSellerId] = useState<string | null>(null);
  const [auctionsListOpen, setAuctionsListOpen] = useState(false);
  const [openAuction, setOpenAuction] = useState<Auction | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const compare = useCompare();

  // Wait for auth hydration so we don't briefly flash the auth screen on reload
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.accent1} />
      </View>
    );
  }

  // Auth gate — if no user, show auth screen exclusively
  if (!user) {
    return <AuthScreen />;
  }

  function goTab(id: TabId) {
    if (id === 'live') {
      // Sellers → open Go Live setup; shoppers → open the For You vertical feed
      if (user?.role === 'business') setAccountOpen('goLive');
      else setForYouOpen(true);
      return;
    }
    if (id === 'auctions') {
      setAuctionsListOpen(true);
      return;
    }
    setTab(id);
  }

  function openCategory(catId: string) {
    setShopFilter(catId);
    setTab('shop');
  }

  function handleJoinStream(s: Stream) {
    setLiveViewer(s);
  }

  let screen: React.ReactNode = null;
  if (tab === 'home') {
    screen = (
      <HomeScreen
        onOpen={setPdp}
        onBuy={setCheckout}
        onGoTab={goTab}
        onCategory={openCategory}
        onSearch={() => setSearchOpen(true)}
        onWishlist={() => setAccountOpen('wishlist')}
        onJoin={handleJoinStream}
        onAccount={() => setAccountOpen('home')}
        onBanner={(t) => setCollection(t)}
        onNotifications={() => setAccountOpen('notifications')}
        onScan={() => setScanOpen(true)}
        onOpenSeller={(id) => { setOpenSellerId(id); setAccountOpen('sellerProfile'); }}
        onOpenAuctions={() => setAuctionsListOpen(true)}
        onOpenChatRooms={() => setAccountOpen('chatRooms')}
      />
    );
  } else if (tab === 'shop') {
    screen = <ShopScreen key={shopFilter} initial={shopFilter} onOpen={setPdp} onBuy={setCheckout} onSearch={() => setSearchOpen(true)} />;
  } else if (tab === 'ai') {
    screen = <AIScreen onBuy={setCheckout} onOpen={setPdp} onGoTab={goTab} />;
  } else if (tab === 'earn') {
    // Sellers → BusinessDashboard. Shoppers → LoyaltyScreen (their LIVA Coins +
    // referral hooks live there). Each gets a back-to-home behavior via the tab.
    if (user?.role === 'business') {
      screen = <BusinessDashboard onBack={() => setTab('home')} onGoLive={() => setAccountOpen('goLive')} onPayouts={() => setAccountOpen('payouts')} onProducts={() => setAccountOpen('myProducts')} />;
    } else {
      screen = <LoyaltyScreen onBack={() => setTab('home')} />;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={t.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <View style={{ flex: 1 }}>{screen}</View>
      <TabBar
        active={
          (forYouOpen || liveViewer || liveSession) ? 'live'
          : (auctionsListOpen || openAuction) ? 'auctions'
          : tab
        }
        onTab={goTab}
      />

      {liveViewer && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }}>
          <LiveViewerScreen
            stream={liveViewer}
            onClose={() => setLiveViewer(null)}
            onBuy={(p) => { setLiveViewer(null); setCheckout(p); }}
          />
        </View>
      )}

      {scanOpen && (
        <ScanScreen
          onClose={() => setScanOpen(false)}
          onOpen={(p) => { setScanOpen(false); setPdp(p); }}
          onBuy={(p) => { setScanOpen(false); setCheckout(p); }}
        />
      )}

      <ServerStatusBanner />

      {pdp && <PDPScreen product={pdp} onClose={() => setPdp(null)} onBuy={(p) => { setPdp(null); setCheckout(p); }} />}

      <CheckoutSheet product={checkout} onClose={() => setCheckout(null)} onComplete={() => {}} />

      {accountOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <AccountStack
            key={accountOpen + (openSellerId ?? '')}
            initialPage={accountOpen}
            initialSellerId={openSellerId}
            onClose={() => { setAccountOpen(false); setOpenSellerId(null); }}
            onLaunchLive={(s) => { setAccountOpen(false); setLiveSession(s); }}
            onOpenPDP={setPdp}
            onOpenCheckout={setCheckout}
          />
        </View>
      )}

      {searchOpen && (
        <SearchScreen
          onClose={() => setSearchOpen(false)}
          onOpen={(p) => { setSearchOpen(false); setPdp(p); }}
          onBuy={(p) => { setSearchOpen(false); setCheckout(p); }}
        />
      )}

      {forYouOpen && (
        <ForYouScreen
          onClose={() => setForYouOpen(false)}
          onOpen={(p) => { setForYouOpen(false); setPdp(p); }}
          onBuy={(p) => { setForYouOpen(false); setCheckout(p); }}
          onJoinLive={(s) => { setForYouOpen(false); setLiveViewer(s); }}
        />
      )}

      {collection && (
        <CollectionScreen
          type={collection}
          onBack={() => setCollection(null)}
          onOpen={(p) => { setCollection(null); setPdp(p); }}
          onBuy={(p) => { setCollection(null); setCheckout(p); }}
        />
      )}

      {liveSession && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110 }}>
          <LiveBroadcastRoom
            title={liveSession.title}
            product={liveSession.product}
            salesGoal={liveSession.salesGoal}
            onClose={() => setLiveSession(null)}
          />
        </View>
      )}

      {/* Floating "Compare" bubble — visible when 2+ products queued */}
      {compare.items.length >= 2 && !compareOpen && !openAuction && !accountOpen && !auctionsListOpen && (
        <View style={{ position: 'absolute', bottom: 100, right: 18, zIndex: 90 }}>
          <Pressable onPress={() => setCompareOpen(true)}>
            <View style={{ paddingVertical: 12, paddingHorizontal: 18, backgroundColor: t.accent2, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: t.accent2, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '800', letterSpacing: -0.1 }}>Compare ({compare.items.length})</Text>
            </View>
          </Pressable>
        </View>
      )}

      {compareOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 95, backgroundColor: t.bg }}>
          <CompareScreen
            onClose={() => setCompareOpen(false)}
            onOpen={(p) => { setCompareOpen(false); setPdp(p); }}
            onBuy={(p) => { setCompareOpen(false); setCheckout(p); }}
          />
        </View>
      )}

      {auctionsListOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 95, backgroundColor: t.bg }}>
          <AuctionsListScreen
            onBack={() => setAuctionsListOpen(false)}
            onOpenAuction={(a) => setOpenAuction(a)}
          />
        </View>
      )}

      {openAuction && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 120,
            elevation: 120,
            backgroundColor: '#050A12',
          }}
        >
          <LiveAuctionScreen
            auction={openAuction}
            onClose={() => setOpenAuction(null)}
            onCheckout={(p, priceWon) => {
              setOpenAuction(null);
              setAuctionsListOpen(false);
              // Clone the product so CheckoutSheet opens at the winning price
              // (retail moves to the strikethrough field).
              setCheckout({ ...p, price: priceWon, was: p.price > priceWon ? p.price : p.was } as Product);
            }}
          />
        </View>
      )}

      <OnboardingTour />
    </View>
  );
}

function CloseBtn({ onPress }: { onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
      <Icon name="close" size={20} color={t.text} />
    </Pressable>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StripeWrapper>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppProvider>
                <AppExtrasProvider>
                  <ProductsProvider>
                    <CompareProvider>
                      <ToastProvider>
                        <Shell />
                      </ToastProvider>
                    </CompareProvider>
                  </ProductsProvider>
                </AppExtrasProvider>
              </AppProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </StripeWrapper>
    </ErrorBoundary>
  );
}
