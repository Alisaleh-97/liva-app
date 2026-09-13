import React from 'react';
import { Text, View } from 'react-native';
import { Thumb } from './Thumb';
import { Badge } from './Badge';
import { PressScale } from './PressScale';
import { Product } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { price, pname } from '@/i18n';

export function FlashCard({ p, onOpen }: { p: Product; onOpen?: (p: Product) => void }) {
  const { t } = useTheme();
  const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
  return (
    <PressScale onPress={() => onOpen?.(p)} style={{ width: 132 }}>
      <View style={{
        aspectRatio: 1, borderRadius: t.radius, overflow: 'hidden', borderWidth: 0.5, borderColor: t.border, position: 'relative',
        shadowColor: '#000', shadowOpacity: t.mode === 'dark' ? 0.3 : 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
      }}>
        <Thumb seed={p.seed} imageUrl={p.images?.[0]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {off > 0 && <Badge kind="live" style={{ position: 'absolute', top: 8, left: 8 }}>-{off}%</Badge>}
      </View>
      <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '600', color: t.text, marginTop: 8, letterSpacing: -0.1 }}>{pname(p)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: t.buy, letterSpacing: -0.2 }}>{price(p.price)}</Text>
        {p.was && <Text style={{ fontSize: 10.5, color: t.textDim, textDecorationLine: 'line-through' }}>{price(p.was)}</Text>}
      </View>
    </PressScale>
  );
}
