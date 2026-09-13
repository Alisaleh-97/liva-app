// First-launch interactive walkthrough — 4 step swipeable tour overlay.
import React, { useState } from 'react';
import { Modal, View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';

const STEPS = [
  { icon: 'live', title: 'Live shopping, reimagined', body: 'Watch creators go live, ask questions in chat, and buy without leaving the stream — all in one tap.' },
  { icon: 'ai',   title: 'Your AI co-pilot',           body: 'Ask the AI tab what to buy, what trends are hot, or — if you sell — when to go live and what to drop.' },
  { icon: 'shop', title: 'Discover what fits you',    body: 'Categories, flash deals, trending products. Personalized as you browse.' },
  { icon: 'earn', title: 'Sell or earn from anywhere', body: 'Open a store in 4 minutes. AI recommends pricing. Same-day payouts.' },
];

export function OnboardingTour() {
  const { t } = useTheme();
  const { onboardingShown, markOnboardingShown } = useExtras();
  const [step, setStep] = useState(0);
  if (onboardingShown) return null;
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  function next() { if (isLast) markOnboardingShown(); else setStep(step + 1); }
  function skip() { markOnboardingShown(); }

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.92)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: t.surface, borderRadius: 26, padding: 28, borderWidth: 1, borderColor: t.border }}>
          {/* Dots */}
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <View key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 99, backgroundColor: i === step ? t.accent1 : t.surface2 }} />
            ))}
          </View>

          <LinearGradient
            colors={t.accentGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 22 }}
          >
            <Icon name={s.icon} size={40} color="#fff" />
          </LinearGradient>

          <Text style={{ fontSize: 23, fontWeight: '800', color: t.text, textAlign: 'center', letterSpacing: -0.5 }}>{s.title}</Text>
          <Text style={{ fontSize: 14.5, color: t.textDim, textAlign: 'center', lineHeight: 22, marginTop: 12, marginBottom: 28 }}>{s.body}</Text>

          <Pressable onPress={next} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{isLast ? "Let's go" : 'Next'}</Text>
            </LinearGradient>
          </Pressable>

          {!isLast && (
            <Pressable onPress={skip} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: t.textDim, fontSize: 13 }}>Skip tour</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
