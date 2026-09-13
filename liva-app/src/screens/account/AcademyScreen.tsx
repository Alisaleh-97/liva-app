// Seller academy — list of bite-size lessons with progress + a per-lesson view.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { t as tr, isRTL } from '@/i18n';

interface Lesson {
  id: string;
  title: string;
  blurb: string;
  minutes: number;
  body: string;
  icon: string;
}

const LESSONS: Lesson[] = [
  { id: 'l1', icon: 'live', minutes: 8, title: 'Live shopping fundamentals',
    blurb: 'How to plan, host, and convert during a live stream.',
    body: 'A great LIVA live is 60% energy, 30% product knowledge, 10% deal pressure. Open with a hook (the day\'s flash discount). Pin your hero product. Restate the deal every 5 minutes for late joiners. End with one urgent CTA.' },
  { id: 'l2', icon: 'ai', minutes: 6, title: 'Using AI to find what to sell',
    blurb: 'Let the LIVA assistant surface trends + price recommendations.',
    body: 'Open the AI tab daily. Ask "what should I promote this week?" — the AI cross-references your audience signals with regional trend data. Apply its pricing suggestions on Wednesday for a 2.3× weekend conversion lift.' },
  { id: 'l3', icon: 'tag', minutes: 5, title: 'Pricing for live streams',
    blurb: 'Why live-exclusive discounts outperform discount codes.',
    body: 'Limit-time, audience-visible discounts beat static codes by ~40%. Use Flash Sale promo (Promotions screen) to drop a price for 60 minutes during your live — viewers commit faster.' },
  { id: 'l4', icon: 'star', minutes: 4, title: 'Getting your first 100 followers',
    blurb: 'A repeatable 7-day playbook to break out of cold start.',
    body: 'Day 1: complete your profile + post 3 products. Day 2: go live for 30 min (set reminder). Day 3-4: comment helpfully on 10 lives. Day 5: collab with a similar-sized seller. Day 6-7: post a recap + flash sale.' },
  { id: 'l5', icon: 'flame', minutes: 7, title: 'Mastering flash sales',
    blurb: 'When, why, and how big to discount.',
    body: 'Flash sale = 60-min discount of 15-30%. Optimal day: Thursday 7-9 PM. Set in the Promotions screen, pick Flash sale type. Announce 10 min before going live for biggest spike.' },
  { id: 'l6', icon: 'truck', minutes: 6, title: 'Shipping that delights buyers',
    blurb: 'Same-day pack rules + unboxing impact.',
    body: 'Ship within 24h of order. Include a hand-written thank-you note (boosts review rate by 4×). Use LIVA branded packing for legitimacy. Use the Seller orders screen to track and mark shipped on time.' },
  { id: 'l7', icon: 'shield', minutes: 5, title: 'Building buyer trust',
    blurb: 'KYC verification, return policy, response time.',
    body: 'Complete KYC (Verification screen) for the blue badge — it boosts conversion by ~25%. Set a 14-day return policy. Reply to messages within 2 hours during business days.' },
  { id: 'l8', icon: 'trend', minutes: 6, title: 'Reading your dashboard',
    blurb: 'Which numbers matter and which are noise.',
    body: 'Focus on: conversion rate (>4% is good), repeat-buyer % (>30% is sticky), and live-attendance retention (>60% means your content is gripping). Ignore raw follower count if engagement is dead.' },
  { id: 'l9', icon: 'gift', minutes: 4, title: 'Loyalty + bundles that work',
    blurb: 'Get them buying their 2nd, 3rd, 4th time.',
    body: 'Offer a "second-item-50% off" promo (Promotions → Bundle). Award LIVA Coins for reviews. Send a thank-you DM with a 10% code after every order — 1 in 6 repeats within a week.' },
  { id: 'l10', icon: 'users', minutes: 7, title: 'Affiliate + creator partnerships',
    blurb: 'Turn buyers into your sales force.',
    body: 'Open Affiliate screen → create a public link. Offer 10% commission. DM your top 5 buyers and ask them to share. Most won\'t — but the 1 who does brings 8 new customers.' },
  { id: 'l11', icon: 'eye', minutes: 5, title: 'Audience insights deep dive',
    blurb: 'Demographics, top buyers, what to do with the data.',
    body: 'In the Audience screen check which country drives most sales — localize captions/prices for them. The top-buyer leaderboard? DM #1 with an exclusive thank-you offer. They become your superfan.' },
  { id: 'l12', icon: 'verified', minutes: 4, title: 'Avoiding common pitfalls',
    blurb: 'The 5 mistakes most new sellers make.',
    body: '1. Going live without a plan. 2. Discounting too aggressively early. 3. Ignoring chat. 4. Slow shipping. 5. Generic product photos. Fix all 5 and you\'re ahead of 80% of new sellers.' },
];

export function AcademyScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { completedLessons, markLessonComplete, awardCoins } = useApp();
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);

  const completionPct = (completedLessons.length / LESSONS.length) * 100;

  if (openLesson) {
    const isDone = completedLessons.includes(openLesson.id);
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => setOpenLesson(null)} style={btnStyle(t)}>
            <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
          </Pressable>
          <Text style={{ fontSize: 13, color: t.textDim, fontWeight: '700' }}>{openLesson.minutes} {tr('minRead')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60 }}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name={openLesson.icon} size={28} color="#fff" />
          </LinearGradient>
          <Text style={{ fontSize: 26, fontWeight: '800', color: t.text, letterSpacing: -0.4 }}>{openLesson.title}</Text>
          <Text style={{ fontSize: 14, color: t.textDim, marginTop: 6, marginBottom: 22 }}>{openLesson.blurb}</Text>
          <Text style={{ fontSize: 15, color: t.text, lineHeight: 24 }}>{openLesson.body}</Text>
          {!isDone ? (
            <BuyBtn full onPress={() => { markLessonComplete(openLesson.id); awardCoins('Completed: ' + openLesson.title, 50); setOpenLesson(null); }} style={{ height: 52, marginTop: 30 }}>
              {`I've finished · +50 coins`}
            </BuyBtn>
          ) : (
            <View style={{ marginTop: 30, padding: 14, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: t.radius, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Icon name="check" size={18} color={t.buy} stroke={2.5} />
              <Text style={{ color: t.buy, fontSize: 13, fontWeight: '800' }}>{tr('lessonCompleted')}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('academyTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
        <Text style={{ fontSize: 14, color: t.textDim, lineHeight: 20, marginBottom: 16 }}>{tr('academySub')}</Text>

        {/* Progress bar */}
        <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>{tr('courseProgress')}</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: t.accent1 }}>{completedLessons.length} / {LESSONS.length}</Text>
          </View>
          <View style={{ height: 6, borderRadius: 99, backgroundColor: t.surface2, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${completionPct}%`, backgroundColor: t.accent1, borderRadius: 99 }} />
          </View>
        </View>

        {/* Lessons */}
        <View style={{ gap: 10 }}>
          {LESSONS.map((l) => {
            const done = completedLessons.includes(l.id);
            return (
              <Pressable
                key={l.id}
                onPress={() => setOpenLesson(l)}
                style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: done ? 'rgba(34,197,94,0.4)' : t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: done ? 'rgba(34,197,94,0.15)' : 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={done ? 'check' : l.icon} size={18} color={done ? t.buy : t.accent1} stroke={done ? 2.5 : 1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{l.title}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{l.blurb}</Text>
                  <Text style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>{l.minutes} {tr('minRead')}</Text>
                </View>
                <Icon name={isRTL() ? 'chevL' : 'chevR'} size={16} color={t.textDim} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
