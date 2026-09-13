// Header icon button — spring scale on press, brief color pulse on release,
// and optional haptic feedback. Wraps the Icon component so any header icon
// (heart, bell, search, etc.) can feel physically responsive with one line.

import React, { useRef } from 'react';
import { Animated, Pressable, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';
import { tap } from '@/lib/haptics';

interface Props {
  name: string;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  pulseColor?: string;        // Color to flash to on press (defaults to accent1)
  hapticKind?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select';
  badge?: React.ReactNode;    // Small overlay (e.g. a red dot / count pill)
  chrome?: boolean;           // Wrap in the surface-with-border pill (default true)
  /** Screen-reader description. Falls back to the icon name capitalized. */
  accessibilityLabel?: string;
  /** Extra hint read after the label (e.g. "Opens your saved items"). */
  accessibilityHint?: string;
}

export function TappableIcon({
  name, size = 20, color, onPress, style, pulseColor, hapticKind = 'light', badge, chrome = true,
  accessibilityLabel, accessibilityHint,
}: Props) {
  const { t } = useTheme();
  const { preferences } = useExtras();
  const scale = useRef(new Animated.Value(1)).current;
  const colorMix = useRef(new Animated.Value(0)).current;

  const iconColor = color ?? t.text;
  const flashTo = pulseColor ?? t.accent1;

  const reduce = preferences.reducedMotion;
  const pressIn = () => {
    if (!reduce) {
      Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 60, bounciness: 4 }).start();
      Animated.timing(colorMix, { toValue: 1, duration: 90, useNativeDriver: false }).start();
    }
  };
  const pressOut = () => {
    if (!reduce) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
      Animated.timing(colorMix, { toValue: 0, duration: 260, useNativeDriver: false }).start();
    }
    tap(hapticKind, preferences.haptics);
  };

  const bg = chrome ? t.surface : 'transparent';
  const border = chrome ? t.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name.charAt(0).toUpperCase() + name.slice(1)}
      accessibilityHint={accessibilityHint}
      // Ensure the tap target is at least 44×44 per WCAG / iOS HIG
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          {
            width: 40, height: 40, borderRadius: 20,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: bg,
            borderWidth: chrome ? 1 : 0,
            borderColor: border,
            transform: [{ scale }],
            position: 'relative',
          },
          style,
        ]}
      >
        <Animated.View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 20,
            backgroundColor: flashTo,
            opacity: colorMix.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }),
          }}
        />
        <Icon name={name} size={size} color={iconColor} />
        {badge && <View style={{ position: 'absolute', top: 2, right: 2 }}>{badge}</View>}
      </Animated.View>
    </Pressable>
  );
}
