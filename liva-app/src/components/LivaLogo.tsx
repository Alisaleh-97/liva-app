// LIVA Pulse identity: a live-play mark orbiting a marketplace loop.
// The mark floats, the orbit rotates and the coral live bead breathes. All
// motion is disabled when Reduce Motion is enabled in Settings.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useExtras } from '@/state/AppExtras';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  size?: number;
  showWordmark?: boolean;
  liveDot?: boolean;
  static?: boolean;
}

export function LivaLogo({ size = 38, showWordmark = false, liveDot = true, static: staticMode = false }: Props) {
  const { t } = useTheme();
  const { preferences } = useExtras();
  const enabled = !staticMode && !preferences.reducedMotion;
  const orbit = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;
    const animation = Animated.parallel([
      Animated.loop(Animated.timing(orbit, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      })),
      Animated.loop(Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 520, useNativeDriver: true }),
      ])),
    ]);
    animation.start();
    return () => animation.stop();
  }, [enabled, float, orbit, pulse]);

  const rotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const lift = float.interpolate({ inputRange: [0, 1], outputRange: [0, -2.5] });
  const markScale = float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.2] });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Animated.View style={{ width: size, height: size, transform: enabled ? [{ translateY: lift }, { scale: markScale }] : undefined }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <SvgGradient id="pulseBody" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#786CFF" />
              <Stop offset="0.48" stopColor="#5267FF" />
              <Stop offset="1" stopColor="#19C6E6" />
            </SvgGradient>
            <SvgGradient id="pulseGloss" x1="0" y1="0" x2="0.9" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.48" />
              <Stop offset="0.52" stopColor="#FFFFFF" stopOpacity="0" />
            </SvgGradient>
          </Defs>
          <Rect x="10" y="10" width="80" height="80" rx="28" fill="url(#pulseBody)" />
          <Path d="M10 38Q48 9 90 32V10H10Z" fill="url(#pulseGloss)" opacity="0.72" />
          <Path d="M30 58c0-14 8-24 21-24 10 0 18 6 20 15" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
          <Path d="M31 57c3 9 11 14 21 14 8 0 15-4 19-11" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity="0.92" />
          <Path d="m49 44 16 10-16 10Z" fill="#FFFFFF" />
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: -3, left: -3, width: size + 6, height: size + 6, transform: enabled ? [{ rotate: rotation }] : undefined }}
        >
          <Svg width={size + 6} height={size + 6} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="47" fill="none" stroke="#2DE2A6" strokeWidth="3" strokeDasharray="9 16" strokeLinecap="round" opacity="0.72" />
          </Svg>
        </Animated.View>

        {liveDot && (
          <Animated.View
            style={{
              position: 'absolute', right: -2, bottom: 1,
              width: Math.max(10, size * 0.27), height: Math.max(10, size * 0.27),
              borderRadius: 999, backgroundColor: '#FF3D71', borderWidth: 2, borderColor: t.bg,
              transform: enabled ? [{ scale: dotScale }] : undefined,
              shadowColor: '#FF3D71', shadowOpacity: 0.75, shadowRadius: 7,
            }}
          />
        )}
      </Animated.View>

      {showWordmark && (
        <View>
          <Text style={{ fontSize: Math.round(size * 0.66), lineHeight: Math.round(size * 0.68), fontWeight: '900', color: t.text, letterSpacing: -1 }}>
            LIVA
          </Text>
          {size >= 36 && <Text style={{ fontSize: 7.5, color: t.textDim, fontWeight: '800', letterSpacing: 1.65 }}>LIVE MARKET</Text>}
        </View>
      )}
    </View>
  );
}

export function LivaWordmark({ size = 22 }: { size?: number }) {
  return (
    <LinearGradient
      colors={['#635BFF', '#19C6E6', '#2DE2A6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999 }}
    >
      <Text style={{ fontSize: size, fontWeight: '900', color: '#fff', letterSpacing: -0.6 }}>LIVA</Text>
    </LinearGradient>
  );
}
