// Reusable Pressable wrapper that gives its children an iOS-style spring
// scale-down on press. Use in place of a plain Pressable when you want the
// tactile "the tile responds to my touch" feel that iOS 17+ card grids use.
//
// Respects the user's Reduce Motion preference — when it's on, the press
// still fires normally but skips the animation entirely.

import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import { useExtras } from '@/state/AppExtras';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number;   // 0.94 default — how far it shrinks
  duration?: number;  // press animation duration in ms
}

export function PressScale({ style, children, scaleTo = 0.96, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const { preferences } = useExtras();
  const reduce = preferences.reducedMotion;

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        if (!reduce) Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduce) Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
