// Pulsing skeleton placeholder while data loads.
import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export function SkeletonProductCard({ style }: { style?: ViewStyle }) {
  const { t } = useTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View style={[{ backgroundColor: t.surface, borderRadius: t.radius, borderWidth: 1, borderColor: t.border, overflow: 'hidden', opacity }, style]}>
      <View style={{ aspectRatio: 1, backgroundColor: t.surface2 }} />
      <View style={{ padding: 12, gap: 7 }}>
        <View style={{ height: 14, borderRadius: 5, backgroundColor: t.surface2 }} />
        <View style={{ height: 14, borderRadius: 5, backgroundColor: t.surface2, width: '60%' }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <View style={{ width: 70, height: 18, borderRadius: 5, backgroundColor: t.surface2 }} />
          <View style={{ width: 42, height: 24, borderRadius: 12, backgroundColor: t.surface2 }} />
        </View>
      </View>
    </Animated.View>
  );
}
