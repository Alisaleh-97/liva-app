import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { fmtK } from '@/i18n';

export function Stars({ rating, reviews, size = 12 }: { rating: number; reviews?: number; size?: number }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name="star" size={size} color="#FFB339" />
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 11.5 }}>{rating}</Text>
      {reviews != null && (
        <Text style={{ color: t.textDim, fontSize: 11.5 }}> ({fmtK(reviews)})</Text>
      )}
    </View>
  );
}
