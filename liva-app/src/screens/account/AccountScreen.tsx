// Account hub — profile header + drill-down menu.
// Business users see an extra "Business" section above Settings.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PressScale } from '@/components/PressScale';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/state/AuthContext';
import { useApp } from '@/state/AppContext';
import { useExtras } from '@/state/AppExtras';
import { t as tr, price, isRTL } from '@/i18n';

export type AccountSubpage =
  | 'home' | 'orders' | 'settings' | 'support'
  | 'addresses' | 'paymentMethods' | 'wishlist' | 'loyalty'
  | 'dashboard' | 'myProducts' | 'addProduct' | 'editProduct' | 'goLive'
  | 'promotions' | 'payouts' | 'audience' | 'verification'
  | 'sellerOrders' | 'affiliate' | 'academy' | 'tracking' | 'integrations' | 'about'
  | 'notifications' | 'messages' | 'pastLives' | 'replay' | 'editProfile'
  | 'sellerProfile' | 'following' | 'savedSearches' | 'chatRooms';

export function AccountScreen({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (page: AccountSubpage) => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { orders, wishlist, sellerProducts, loyalty } = useApp();
  const { unreadCount, conversations, streak } = useExtras();
  const totalUnreadMessages = conversations.reduce((s, c) => s + c.unread, 0);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  function handleSignOut() {
    setConfirmSignOut(true);
  }
  async function confirmAndSignOut() {
    setConfirmSignOut(false);
    await signOut();
    // signOut sets user to null → App.tsx auth gate renders AuthScreen automatically
    onClose();
  }

  function offerSellerRegistration() {
    Alert.alert(tr('roleBusiness'), 'Seller accounts use a separate paid setup so store, payout and tax details stay verified.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start registration', onPress: async () => { await signOut(); onClose(); } },
    ]);
  }

  if (!user) return null;
  const isBusiness = user.role === 'business';

  const personalMenu: MenuItem[] = [
    { icon: 'bell', label: 'Notifications', sub: unreadCount > 0 ? `${unreadCount} unread` : 'All caught up', action: () => onNavigate('notifications'), badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { icon: 'truck', label: tr('myAddresses'), sub: 'Manage shipping addresses', action: () => onNavigate('addresses') },
    { icon: 'wallet', label: tr('myPayments'), sub: 'Cards & payment methods', action: () => onNavigate('paymentMethods') },
    { icon: 'link', label: tr('affiliateTitle'), sub: tr('affiliateSub'), action: () => onNavigate('affiliate') },
    { icon: 'users', label: 'Following', sub: 'Sellers you follow', action: () => onNavigate('following') },
    { icon: 'search', label: 'Saved searches', sub: 'Get notified when matches land', action: () => onNavigate('savedSearches') },
  ];

  const businessMenu = [
    { icon: 'trend', label: tr('dashboard'), sub: 'Sales · growth · breakdown', action: () => onNavigate('dashboard') },
    { icon: 'shop', label: tr('myProducts'), sub: `${sellerProducts.length} listed`, action: () => onNavigate('myProducts') },
    { icon: 'cart', label: tr('sellerOrdersTitle'), sub: `${orders.length} ${tr('statsOrders')}`, action: () => onNavigate('sellerOrders') },
    { icon: 'live', label: tr('goLiveTitle'), sub: 'Stream now or schedule', action: () => onNavigate('goLive') },
    { icon: 'play', label: 'Past Lives', sub: 'Replays, stats & chat highlights', action: () => onNavigate('pastLives') },
    { icon: 'bolt', label: tr('promotions'), sub: 'Discount codes & flash sales', action: () => onNavigate('promotions') },
    { icon: 'wallet', label: tr('payouts'), sub: 'Withdraw your earnings', action: () => onNavigate('payouts') },
    { icon: 'users', label: tr('audience'), sub: 'Followers & insights', action: () => onNavigate('audience') },
    { icon: 'verified', label: tr('verification'), sub: user.verified ? tr('verified') : tr('verifyNot'), action: () => onNavigate('verification') },
    { icon: 'headset', label: tr('academyTitle'), sub: tr('academySub'), action: () => onNavigate('academy') },
  ];

  const accountMenu = [
    { icon: 'filter', label: tr('settings'), sub: '', action: () => onNavigate('settings') },
    { icon: 'bolt', label: 'Integrations', sub: 'Stripe · Cloudinary · Supabase · Push · OAuth', action: () => onNavigate('integrations') },
    { icon: 'headset', label: tr('supportHelp'), sub: '', action: () => onNavigate('support') },
    { icon: 'shield', label: tr('about'), sub: 'The story · what we believe · team', action: () => onNavigate('about') },
  ];

  const quickActions: MenuItem[] = [
    { icon: 'cart', label: tr('myOrders'), sub: String(orders.length), color: '#19C6E6', action: () => onNavigate('orders') },
    { icon: 'heart', label: tr('myWishlist'), sub: String(wishlist.size), color: '#FF3D71', action: () => onNavigate('wishlist') },
    { icon: 'comment', label: 'Messages', sub: String(totalUnreadMessages), color: '#B85CFF', action: () => onNavigate('messages') },
    { icon: 'gift', label: 'Coins', sub: loyalty.coins.toLocaleString(), color: '#FFB020', action: () => onNavigate('loyalty') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onClose} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('accountTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Profile card */}
        <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
          <LinearGradient
            colors={['rgba(99,91,255,0.28)', 'rgba(25,198,230,0.13)', 'rgba(255,61,113,0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, padding: 18, borderWidth: 1, borderColor: 'rgba(99,91,255,0.34)', overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 70, right: -42, top: -46, backgroundColor: 'rgba(25,198,230,0.12)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar seed={user.avatarSeed} size={62} verified={user.verified} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{user.name}</Text>
                  {isBusiness && <Badge kind="ai">SELLER</Badge>}
                </View>
                {isBusiness && user.businessName && (
                  <Text style={{ fontSize: 12, color: t.accent2, fontWeight: '700', marginTop: 2 }}>{user.businessName}</Text>
                )}
                <Text style={{ fontSize: 13, color: t.textDim, marginTop: 2 }}>{user.email}</Text>
                <Text style={{ fontSize: 11, color: t.accent1, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {user.provider === 'email' ? 'Email account' : `${user.provider} account`}
                </Text>
              </View>
              <Pressable onPress={() => onNavigate('editProfile')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="filter" size={16} color={t.accent1} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
              <Stat label={tr('statsOrders')} value={String(orders.length)} />
              <Stat label={tr('statsSaved')} value={String(wishlist.size)} />
              <Stat label={tr('statsBalance')} value={price(1256.75, { dec: 0 })} />
            </View>
          </LinearGradient>
        </View>

        <View style={{ paddingHorizontal: 18, flexDirection: 'row', gap: 9, marginBottom: 10 }}>
          {quickActions.map((item) => (
            <PressScale key={item.label} onPress={item.action} scaleTo={0.9} style={{ flex: 1, minHeight: 88, paddingVertical: 12, paddingHorizontal: 7, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: `${item.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={item.icon} size={18} color={item.color} />
              </View>
              <Text numberOfLines={1} style={{ color: t.text, fontSize: 10.5, fontWeight: '900', marginTop: 7 }}>{item.label}</Text>
              <Text style={{ color: item.color, fontSize: 10, fontWeight: '800', marginTop: 1 }}>{item.sub}</Text>
            </PressScale>
          ))}
        </View>

        {/* Business section (only for business users) */}
        {isBusiness && (
          <>
            <SectionTitle title={tr('businessSection')} />
            <MenuList items={businessMenu} />
          </>
        )}

        {/* Personal section */}
        <SectionTitle title="Your activity" />
        <MenuList items={personalMenu} />

        {/* Account / settings */}
        <SectionTitle title={tr('settings')} />
        <MenuList items={accountMenu} />

        {/* Become a seller — only for shoppers */}
        {!isBusiness && (
          <View style={{ marginHorizontal: 18, marginTop: 18, borderRadius: t.radius, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(34,197,94,0.18)', 'rgba(139,92,246,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="trend" size={20} color={t.buy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>Start selling on LIVA</Text>
                  <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>Live shopping, AI co-pilot, 0% setup fees</Text>
                </View>
              </View>
              <Pressable onPress={offerSellerRegistration} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: t.buy }}>
                <Icon name="arrowUR" size={13} color="#04210f" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#04210f' }}>Switch to seller</Text>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* Sign out */}
        <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
              backgroundColor: 'rgba(255,59,92,0.08)', borderWidth: 1, borderColor: 'rgba(255,59,92,0.25)', borderRadius: t.radius,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,59,92,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color={t.live} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: t.live }}>{tr('signOut')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmSignOut}
        title={tr('signOut')}
        message={`You will need to sign in again to access your account.`}
        confirmLabel={tr('signOut')}
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmAndSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { t } = useTheme();
  return (
    <View style={{ marginTop: 16, marginBottom: 9, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: t.accent2 }} />
      <Text style={{ fontSize: 11, fontWeight: '900', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.7 }}>{title}</Text>
    </View>
  );
}

interface MenuItem { icon: string; label: string; sub: string; action: () => void; badge?: string; color?: string }

function MenuList({ items }: { items: MenuItem[] }) {
  const { t } = useTheme();
  return (
    <View style={{ paddingHorizontal: 18, gap: 10 }}>
      {items.map((item, i) => {
        const color = item.color || ['#635BFF', '#19C6E6', '#FF3D71', '#2DE2A6', '#FFB020', '#B85CFF'][i % 6];
        return (
        <PressScale
          key={i}
          onPress={item.action}
          scaleTo={0.975}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
            backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: `${color}1E`, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={item.icon} size={18} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{item.label}</Text>
            {item.sub ? <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{item.sub}</Text> : null}
          </View>
          {item.badge ? (
            <View style={{ minWidth: 24, paddingHorizontal: 7, height: 24, borderRadius: 12, backgroundColor: t.live, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800' }}>{item.badge}</Text>
            </View>
          ) : null}
          <Icon name={isRTL() ? 'chevL' : 'chevR'} size={18} color={t.textDim} />
        </PressScale>
      )})}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: t.radius * 0.7, alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: t.textDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
