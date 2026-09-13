// Shared "coming soon" placeholder for the screens we're stubbing in MVP:
// Live, Earn, Search, Wishlist, Tracking.
import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeContext';
import { t as tr } from '@/i18n';

export function ComingSoonScreen({ title, icon = 'ai' }: { title: string; icon?: string }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: insets.top + 60 }}>
      <LinearGradient
        colors={t.accentGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}
      >
        <Icon name={icon} size={42} color="#fff" />
      </LinearGradient>
      <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: t.textDim, textAlign: 'center', lineHeight: 20 }}>
        {tr('comingSoon')} — this screen is part of the LIVA design and will be wired up in the next build pass.
      </Text>
    </View>
  );
}
