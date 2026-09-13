import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export function LiveDot({ size = 6, color }: { size?: number; color?: string }) {
  const { t } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || t.live,
        opacity,
      }}
    />
  );
}
