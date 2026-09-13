// Instagram-style stories rail — a horizontally-scrolled row of seller
// avatars ringed with the live-gradient. Tapping one jumps into that
// seller's active stream (or their profile if not currently live).

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import { PressScale } from './PressScale';
import { useTheme } from '@/theme/ThemeContext';
import { SELLERS, STREAMS, Stream } from '@/data';

interface Props {
  onOpenSeller: (sellerId: string) => void;
  onJoinStream: (s: Stream) => void;
}

export function StoriesRail({ onOpenSeller, onJoinStream }: Props) {
  const { t } = useTheme();
  // Sellers that are currently live get a live-ring; others get a soft ring.
  const liveBySeller = new Map(STREAMS.map((s) => [s.host, s]));
  const sortedSellers = [...SELLERS].sort((a, b) => {
    const aLive = liveBySeller.has(a.id) ? 1 : 0;
    const bLive = liveBySeller.has(b.id) ? 1 : 0;
    if (aLive !== bLive) return bLive - aLive;
    return b.sales - a.sales;
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 14, paddingBottom: 18 }}>
      {sortedSellers.slice(0, 12).map((s) => {
        const stream = liveBySeller.get(s.id);
        const isLive = !!stream;
        return (
          <PressScale
            key={s.id}
            onPress={() => (isLive && stream ? onJoinStream(stream) : onOpenSeller(s.id))}
            style={{ alignItems: 'center', gap: 6, width: 68 }}
            scaleTo={0.88}
          >
            <View style={{ position: 'relative' }}>
              {/* Live ring — hot gradient for live, soft for offline */}
              <LinearGradient
                colors={isLive ? ['#FF1744', '#FF6E40', '#FFB339'] : [t.accent1, t.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar seed={s.seed} size={56} verified={s.verified} />
                </View>
              </LinearGradient>
              {isLive && (
                <View style={{
                  position: 'absolute', bottom: -2, alignSelf: 'center',
                  paddingHorizontal: 6, paddingVertical: 1.5,
                  backgroundColor: t.live, borderRadius: 999,
                  borderWidth: 2, borderColor: t.bg,
                  left: 0, right: 0, marginHorizontal: 'auto',
                  minWidth: 32, maxWidth: 40,
                }}>
                  <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: 0.4 }}>LIVE</Text>
                </View>
              )}
            </View>
            <Text numberOfLines={1} style={{ fontSize: 10.5, fontWeight: '600', color: t.text, maxWidth: 74, textAlign: 'center' }}>{s.name}</Text>
          </PressScale>
        );
      })}
    </ScrollView>
  );
}
