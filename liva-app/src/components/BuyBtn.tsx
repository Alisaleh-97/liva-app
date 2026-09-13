import React, { useRef } from 'react';
import { Animated, Pressable, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';

// iOS-style pill button. Springs on press. Uses a green gradient to feel more
// alive than a flat fill, matching the vibe of the App Store "GET" button
// paired with Apple Pay's confidence.
export function BuyBtn({
  children = 'Buy',
  onPress,
  full,
  small,
  style,
  disabled = false,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  full?: boolean;
  small?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const { t } = useTheme();
  const { preferences } = useExtras();
  const scale = useRef(new Animated.Value(1)).current;
  const reduce = preferences.reducedMotion;
  const pressIn = () => { if (!reduce) Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 4 }).start(); };
  const pressOut = () => { if (!reduce) Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start(); };

  const radius = small ? t.radius * 0.65 : t.radius * 0.85;
  const padV = small ? 8 : 13;
  const padH = small ? 14 : 22;

  return (
    <Pressable disabled={disabled} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={{ alignSelf: full ? 'stretch' : 'flex-start', opacity: disabled ? 0.6 : 1 }}>
      <Animated.View style={[{ transform: [{ scale }], borderRadius: radius, overflow: 'hidden',
        shadowColor: t.buy, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, style]}>
        <LinearGradient
          colors={['#4AF0BB', '#20C997']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ paddingVertical: padV, paddingHorizontal: padH, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#06362A', fontWeight: '900', fontSize: small ? 13 : 15, letterSpacing: 0.1 }}>{children}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}
