import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Thumb } from './Thumb';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Icon } from './Icon';
import { SELLERS, byId, Stream } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { price, pname, fmtK, isRTL } from '@/i18n';

export function StreamCard({ stream, onJoin }: { stream: Stream; onJoin?: (s: Stream) => void }) {
  const { t } = useTheme();
  const seller = SELLERS.find((s) => s.id === stream.host)!;
  const prod = byId[stream.product];
  const title = isRTL() && stream.titleAr && !stream.titleAr.includes('?') ? stream.titleAr : stream.title;
  return (
    <Pressable
      onPress={() => onJoin?.(stream)}
      style={{
        width: 220,
        aspectRatio: 3 / 4,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: t.border,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Thumb seed={stream.id + seller.seed} vivid style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <LinearGradient
        colors={['rgba(8,5,16,0.45)', 'transparent', 'rgba(8,5,16,0.9)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Badge kind="live">Live</Badge>
        <Badge kind="glass">{`${fmtK(stream.viewers)} watching`}</Badge>
      </View>
      <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <Avatar seed={seller.seed} size={26} verified={seller.verified} />
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{seller.name}</Text>
        </View>
        <Text numberOfLines={2} style={{ color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 16, marginBottom: 9 }}>{title}</Text>
        {prod && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(4,10,18,0.62)', borderRadius: 15, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <View style={{ width: 30, height: 30, borderRadius: 6, overflow: 'hidden' }}>
              <Thumb seed={prod.seed} style={{ width: '100%', height: '100%' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{pname(prod)}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.buy }}>{price(prod.price)}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
