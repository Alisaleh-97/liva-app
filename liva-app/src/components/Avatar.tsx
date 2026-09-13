import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientFor } from '@/theme/colors';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';

export function Avatar({ seed, size = 40, verified, style }: { seed: string; size?: number; verified?: boolean; style?: ViewStyle }) {
  const [c1, c2] = gradientFor(seed, { vivid: true });
  const { t } = useTheme();
  return (
    <View style={[{ width: size, height: size }, style]}>
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
      {verified && (
        <View style={{ position: 'absolute', right: -2, bottom: -2 }}>
          <Icon name="verified" size={size * 0.42} color={t.accent1} />
        </View>
      )}
    </View>
  );
}
