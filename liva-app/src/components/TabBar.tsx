// LIVA Pulse navigation dock. Five clear destinations keep the marketplace
// fast to scan; Live and Auctions receive equal-size animated action buttons.

import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';
import { t as tr } from '@/i18n';

export type TabId = 'home' | 'shop' | 'auctions' | 'live' | 'earn' | 'ai';

interface Tab {
  id: TabId;
  icon: string;
  key: string;
  action?: boolean;
  colors?: [string, string];
}

const TABS: Tab[] = [
  { id: 'home', icon: 'home', key: 'home' },
  { id: 'shop', icon: 'compass', key: 'shop' },
  { id: 'live', icon: 'live', key: 'live', action: true, colors: ['#FF3D71', '#FF7A5C'] },
  { id: 'auctions', icon: 'hammer', key: 'auctions', action: true, colors: ['#FFB020', '#FF6B35'] },
  { id: 'ai', icon: 'ai', key: 'ai' },
];

export function TabBar({ active, onTab }: { active: TabId; onTab: (id: TabId) => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = t.mode === 'dark' ? 'rgba(10,25,41,0.97)' : 'rgba(255,255,255,0.97)';

  return (
    <View style={{ backgroundColor: t.bg, paddingHorizontal: 10, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 7) }}>
      <View
        style={{
          height: 66,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 5,
          borderRadius: 25,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: '#06101D',
          shadowOpacity: t.mode === 'dark' ? 0.5 : 0.13,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        {TABS.map((tab) => (
          <TabItem key={tab.id} tab={tab} active={active === tab.id} onPress={() => onTab(tab.id)} />
        ))}
      </View>
    </View>
  );
}

function TabItem({ tab, active, onPress }: { tab: Tab; active: boolean; onPress: () => void }) {
  const { t } = useTheme();
  const { preferences } = useExtras();
  const scale = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(activeAnim, { toValue: active ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 5 }).start();
  }, [active, activeAnim]);

  useEffect(() => {
    if (!tab.action || preferences.reducedMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [breathe, preferences.reducedMotion, tab.action]);

  const pressIn = () => {
    if (!preferences.reducedMotion) Animated.spring(scale, { toValue: 0.84, useNativeDriver: true, speed: 55, bounciness: 3 }).start();
  };
  const pressOut = () => {
    if (!preferences.reducedMotion) Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 11 }).start();
  };

  if (tab.action) {
    const haloScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.16] });
    const haloOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] });
    return (
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="tab"
        accessibilityLabel={tr(tab.key)}
        accessibilityState={{ selected: active }}
        style={{ flex: 1, minWidth: 58, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
          <View style={{ width: 47, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                position: 'absolute', width: 43, height: 43, borderRadius: 16,
                backgroundColor: tab.colors![0], opacity: preferences.reducedMotion ? 0 : haloOpacity,
                transform: [{ scale: preferences.reducedMotion ? 1 : haloScale }],
              }}
            />
            <LinearGradient
              colors={tab.colors!}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                borderWidth: active ? 2 : 0, borderColor: 'rgba(255,255,255,0.9)',
                shadowColor: tab.colors![0], shadowOpacity: 0.42, shadowRadius: 9, shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Icon name={tab.icon} size={20} color="#fff" stroke={2.2} />
            </LinearGradient>
          </View>
          <Text numberOfLines={1} style={{ marginTop: 1, fontSize: 9.5, fontWeight: '800', color: active ? tab.colors![0] : t.textDim }}>
            {tr(tab.key)}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="tab"
      accessibilityLabel={tr(tab.key)}
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minWidth: 52, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <View style={{ width: 42, height: 34, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute', width: 42, height: 32, borderRadius: 12, backgroundColor: t.surface2,
              opacity: activeAnim,
              transform: [{ scale: activeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.74, 1] }) }],
            }}
          />
          <Icon name={tab.icon} size={21} color={active ? t.accent1 : t.textDim} stroke={active ? 2.25 : 1.8} />
        </View>
        <Text numberOfLines={1} style={{ fontSize: 9.5, fontWeight: active ? '800' : '600', color: active ? t.text : t.textDim }}>
          {tr(tab.key)}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
