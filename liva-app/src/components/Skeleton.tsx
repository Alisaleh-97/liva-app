// Skeleton loader — shimmer placeholder for images / text rows while data
// loads. Uses a continuous animation on opacity to feel like a live pulse
// rather than a static gray block.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: Props) {
  const { t } = useTheme();
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width: width as any, height: height as any, borderRadius: radius, backgroundColor: t.surface2, opacity: pulse },
        style,
      ]}
    />
  );
}

// Convenience: card-shaped skeleton for product-tile grids
export function ProductSkeleton() {
  return (
    <>
      <Skeleton height={160} radius={16} />
      <Skeleton height={12} radius={4} style={{ marginTop: 10 }} />
      <Skeleton height={12} radius={4} style={{ marginTop: 6, width: '60%' }} />
    </>
  );
}
