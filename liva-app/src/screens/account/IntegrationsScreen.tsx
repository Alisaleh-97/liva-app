// Integrations status — shows which backend services are connected.
// Each card explains what's needed to activate the integration if it's off.
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/theme/ThemeContext';
import { cloudinaryConfigured } from '@/lib/cloudinary';
import { stripeConfigured } from '@/lib/payments';
import { supabaseConfigured } from '@/lib/supabase';
import { googleConfigured, appleConfigured } from '@/lib/oauth';
import { API_URL } from '@/lib/api';
import { scheduleLocal, registerForPushNotifications } from '@/lib/notifications';
import { isRTL } from '@/i18n';

interface Integration {
  key: string;
  name: string;
  icon: string;
  configured: boolean;
  desc: string;
  setupHint: string;
}

export function IntegrationsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [openaiConfigured, setOpenaiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((j) => setOpenaiConfigured(!!j.openaiConfigured))
      .catch(() => setOpenaiConfigured(false));
  }, []);

  const integrations: Integration[] = [
    {
      key: 'cloudinary',
      name: 'Cloudinary',
      icon: 'eye',
      configured: cloudinaryConfigured,
      desc: 'Real product photo uploads',
      setupHint: 'Sign up free at cloudinary.com → create an unsigned upload preset → set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in liva-app/.env',
    },
    {
      key: 'stripe',
      name: 'Stripe',
      icon: 'wallet',
      configured: stripeConfigured,
      desc: 'Real card payments on iOS/Android',
      setupHint: 'Get test keys at dashboard.stripe.com → set STRIPE_SECRET_KEY in server/.env and EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in liva-app/.env',
    },
    {
      key: 'supabase',
      name: 'Supabase',
      icon: 'shield',
      configured: supabaseConfigured,
      desc: 'Backend persistence + real-time sync',
      setupHint: 'Create a project at supabase.com → copy the URL + anon key → set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY',
    },
    {
      key: 'google',
      name: 'Google Sign-In',
      icon: 'globe',
      configured: googleConfigured,
      desc: 'Real Google OAuth (vs. demo fallback)',
      setupHint: 'console.cloud.google.com → APIs & Services → OAuth → set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID env vars',
    },
    {
      key: 'apple',
      name: 'Apple Sign-In',
      icon: 'verified',
      configured: appleConfigured,
      desc: 'Real Apple OAuth (iOS only)',
      setupHint: 'developer.apple.com → Identifiers → Services IDs → set EXPO_PUBLIC_APPLE_SERVICE_ID',
    },
    {
      key: 'openai',
      name: 'OpenAI',
      icon: 'ai',
      configured: openaiConfigured ?? false,
      desc: 'AI commerce assistant + URL extraction',
      setupHint: 'platform.openai.com/api-keys → set OPENAI_API_KEY in server/.env',
    },
    {
      key: 'push',
      name: 'Push notifications',
      icon: 'bell',
      configured: true, // Expo's relay works out-of-box on real devices
      desc: 'Order updates, live alerts, price drops',
      setupHint: 'Active on physical iOS/Android devices via Expo push relay.',
    },
  ];

  async function testPush() {
    const token = await registerForPushNotifications();
    if (!token) {
      Alert.alert('Push', 'Push only works on a real device (not in web preview).');
      return;
    }
    await scheduleLocal('LIVA test', 'If you see this, push is wired up. 🎉', 2);
    Alert.alert('Push', `Token registered:\n${token.slice(0, 30)}…\n\nA local test notification will fire in ~2 seconds.`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Integrations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 10 }}>
        <Text style={{ fontSize: 13, color: t.textDim, lineHeight: 19, marginBottom: 6 }}>
          Live status of the infrastructure pieces. Green = active. Each card explains how to flip the switch.
        </Text>

        {integrations.map((i) => (
          <Pressable
            key={i.key}
            onPress={() => {
              if (i.key === 'push') return testPush();
              Alert.alert(i.name, i.configured ? `${i.desc}\n\n✓ Active.` : `${i.desc}\n\nTo enable:\n${i.setupHint}`);
            }}
            style={({ pressed }) => ({
              padding: 14,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: i.configured ? 'rgba(34,197,94,0.4)' : t.border,
              borderRadius: t.radius,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: i.configured ? 'rgba(34,197,94,0.16)' : 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={i.icon} size={18} color={i.configured ? t.buy : t.accent1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: t.text }}>{i.name}</Text>
              <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{i.desc}</Text>
            </View>
            {i.configured ? <Badge kind="deal">CONNECTED</Badge> : <Badge>OFF</Badge>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
