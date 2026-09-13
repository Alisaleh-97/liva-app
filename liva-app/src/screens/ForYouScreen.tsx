// For You — vertical TikTok-style feed of products + lives with one-tap buy.
// Each card is a "card" (not a true video) for now; in production each is a
// 5-second auto-playing snippet from the seller's recent live.
import React, { useState } from 'react';
import { View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { useExtras } from '@/state/AppExtras';
import { PRODUCTS, SELLERS, STREAMS, Product, byId } from '@/data';
import { t as tr, price, pname, fmtK, isRTL } from '@/i18n';
import { tap } from '@/lib/haptics';

type FeedItem =
  | { type: 'product'; product: Product; sellerId: string }
  | { type: 'live'; stream: typeof STREAMS[number] };

function buildFeed(): FeedItem[] {
  // Interleave products + lives in a feed
  const items: FeedItem[] = [];
  const products = [...PRODUCTS].sort(() => Math.random() - 0.5);
  let prodIdx = 0;
  STREAMS.forEach((s, i) => {
    items.push({ type: 'live', stream: s });
    for (let k = 0; k < 3 && prodIdx < products.length; k++, prodIdx++) {
      items.push({ type: 'product', product: products[prodIdx], sellerId: SELLERS[(prodIdx + i) % SELLERS.length].id });
    }
  });
  while (prodIdx < products.length) {
    items.push({ type: 'product', product: products[prodIdx], sellerId: SELLERS[prodIdx % SELLERS.length].id });
    prodIdx++;
  }
  return items;
}

interface Props {
  onClose: () => void;
  onOpen: (p: Product) => void;
  onBuy: (p: Product) => void;
  onJoinLive: (s: typeof STREAMS[number]) => void;
}

export function ForYouScreen({ onClose, onOpen, onBuy, onJoinLive }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { toggleWish, wishlist } = useApp();
  const { followedSellers, toggleFollow, preferences } = useExtras();
  const W = Dimensions.get('window').width;
  const H = Dimensions.get('window').height;
  const [feed] = useState(() => buildFeed());

  function renderCard({ item }: { item: FeedItem }) {
    if (item.type === 'live') {
      const stream = item.stream;
      const host = SELLERS.find((s) => s.id === stream.host)!;
      const prod = byId[stream.product];
      const isFollowed = followedSellers.includes(host.id);
      return (
        <View style={{ width: W, height: H - 60 - insets.top, position: 'relative' }}>
          <Thumb seed={stream.id + host.seed} vivid style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', gap: 8 }}>
            <Badge kind="live">LIVE</Badge>
            <Badge kind="glass">👁 {fmtK(stream.viewers)}</Badge>
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, paddingBottom: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <Avatar seed={host.seed} size={36} verified={host.verified} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{host.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{fmtK(host.sales)} sales</Text>
              </View>
              <Pressable
                onPress={() => { tap('light', preferences.haptics); toggleFollow(host.id); }}
                style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: isFollowed ? 'rgba(255,255,255,0.18)' : '#fff' }}
              >
                <Text style={{ color: isFollowed ? '#fff' : '#000', fontWeight: '800', fontSize: 12 }}>{isFollowed ? 'Following' : 'Follow'}</Text>
              </Pressable>
            </View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 }}>{stream.title}</Text>
            <Pressable
              onPress={() => { tap('medium', preferences.haptics); onJoinLive(stream); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start' }}
            >
              <Icon name="play" size={16} color="#000" />
              <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>Watch live</Text>
            </Pressable>
            {prod && (
              <Pressable onPress={() => onOpen(prod)} style={{ marginTop: 14, flexDirection: 'row', gap: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden' }}>
                  <Thumb seed={prod.seed} imageUrl={prod.images?.[0]} style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 }}>FEATURED · TAP TO BUY</Text>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>{pname(prod)}</Text>
                  <Text style={{ color: t.buy, fontSize: 14, fontWeight: '800', marginTop: 2 }}>{price(prod.price)}</Text>
                </View>
              </Pressable>
            )}
          </View>
          {/* Right side actions */}
          <View style={{ position: 'absolute', right: 12, bottom: 200, gap: 18, alignItems: 'center' }}>
            <Pressable onPress={() => tap('light', preferences.haptics)} style={{ alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="heart" size={22} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 10.5, marginTop: 4, fontWeight: '700' }}>{fmtK(stream.likes)}</Text>
            </Pressable>
            <Pressable style={{ alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="comment" size={20} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 10.5, marginTop: 4, fontWeight: '700' }}>Chat</Text>
            </Pressable>
            <Pressable style={{ alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="share" size={20} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 10.5, marginTop: 4, fontWeight: '700' }}>Share</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    // Product card
    const p = item.product;
    const seller = SELLERS.find((s) => s.id === item.sellerId)!;
    const wished = wishlist.has(p.id);
    return (
      <View style={{ width: W, height: H - 60 - insets.top, position: 'relative' }}>
        <Thumb seed={p.seed} imageUrl={p.images?.[0]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.85)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', gap: 8 }}>
          {p.badge && <Badge kind={p.badge === 'AI Pick' ? 'ai' : 'hot'}>{p.badge}</Badge>}
        </View>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, paddingBottom: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <Avatar seed={seller.seed} size={32} verified={seller.verified} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{seller.name}</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>{p.brand?.toUpperCase()}</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 10, letterSpacing: -0.4 }} numberOfLines={2}>{pname(p)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9, marginBottom: 14 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{price(p.price)}</Text>
            {p.was && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecorationLine: 'line-through' }}>{price(p.was)}</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <BuyBtn onPress={() => { tap('medium', preferences.haptics); onBuy(p); }} style={{ flex: 1, height: 46 }}>
              {`Buy · ${price(p.price)}`}
            </BuyBtn>
            <Pressable onPress={() => onOpen(p)} style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="eye" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
        {/* Right side actions */}
        <View style={{ position: 'absolute', right: 12, bottom: 220, gap: 18, alignItems: 'center' }}>
          <Pressable onPress={() => { tap('light', preferences.haptics); toggleWish(p.id); }} style={{ alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart" size={22} color={wished ? t.live : '#fff'} fill={wished ? t.live : 'none'} />
            </View>
          </Pressable>
          <Pressable style={{ alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="share" size={20} color="#fff" />
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 95 }}>
      <FlatList
        data={feed}
        renderItem={renderCard}
        keyExtractor={(_, i) => String(i)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={Dimensions.get('window').height - 60 - insets.top}
        decelerationRate="fast"
      />
      {/* Close button */}
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: insets.top + 10, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color="#fff" />
      </Pressable>
      <View style={{ position: 'absolute', top: insets.top + 14, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 }}>For You</Text>
      </View>
    </View>
  );
}
