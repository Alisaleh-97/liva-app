import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Thumb } from './Thumb';
import { BuyBtn } from './BuyBtn';
import { Icon } from './Icon';
import { byId, Product } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { price, pname } from '@/i18n';

export function AIPickCard({
  pick,
  onOpen,
  onBuy,
}: {
  pick: { product: string; reason: string; confidence: string };
  onOpen?: (p: Product) => void;
  onBuy?: (p: Product) => void;
}) {
  const { t } = useTheme();
  const p = byId[pick.product];
  if (!p) return null;
  return (
    <Pressable
      onPress={() => onOpen?.(p)}
      style={{
        width: 250,
        flexDirection: 'row',
        backgroundColor: t.surface,
        borderRadius: t.radius,
        borderWidth: 1,
        borderColor: t.border,
        padding: 12,
        gap: 12,
      }}
    >
      <View style={{ width: 76, height: 76, borderRadius: t.radius * 0.8, overflow: 'hidden' }}>
        <Thumb seed={p.seed} style={{ width: '100%', height: '100%' }} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <Icon name="ai" size={13} color={t.accent1} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: t.accent1, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            AI · {pick.confidence}
          </Text>
        </View>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{pname(p)}</Text>
        <Text numberOfLines={2} style={{ fontSize: 11.5, color: t.textDim, marginTop: 3 }}>{pick.reason}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{price(p.price)}</Text>
          <BuyBtn small onPress={() => onBuy?.(p)}>Buy</BuyBtn>
        </View>
      </View>
    </Pressable>
  );
}
