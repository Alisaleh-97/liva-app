// About LIVA — brand intro, story, principles, stats, team, links.
import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/theme/ThemeContext';
import { isRTL } from '@/i18n';

const PRINCIPLES = [
  { icon: 'live', title: 'Live is the new feed', body: 'Static product photos are dying. Buyers want to see, ask, and watch in real time before they tap Buy.' },
  { icon: 'ai',   title: 'AI on the seller\'s side', body: 'We put the algorithm in the seller\'s pocket — when to live, what to drop, how to price, who to message.' },
  { icon: 'shield', title: 'Trust built into the rails', body: 'Verified stores, escrow, secure payouts, anti-counterfeit checks — so first-time buyers feel safe enough to tap Buy.' },
  { icon: 'globe', title: 'Born global, designed local', body: 'RTL Arabic on day one. USD and AED. Hindi, Urdu, Tagalog next. Every market deserves the same caliber.' },
  { icon: 'gift', title: 'Creators eat first', body: 'Lower fees on Pro tier than any U.S. marketplace. Same-day payouts. Affiliate revenue share. You build, you earn.' },
  { icon: 'flame', title: 'Speed beats polish', body: 'Better to ship a working flash sale today than a perfect promotion engine next quarter. We move.' },
];

const STATS = [
  { value: '4', label: 'minutes to your first stream' },
  { value: '0%', label: 'setup fees, ever' },
  { value: '24/7', label: 'support in 4 languages' },
];

const TEAM = [
  { name: 'You + LIVA', seed: 'founder', role: 'Founder, building this with Claude' },
  { name: 'The AI', seed: 'liva-ai', role: 'Always-on co-pilot for every seller' },
];

export function AboutScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>About LIVA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={t.accentGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 38, alignItems: 'center' }}
        >
          <View style={{ width: 90, height: 90, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 50, letterSpacing: -2 }}>L</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }}>LIVA</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700', letterSpacing: 3, marginTop: 4 }}>LIVE · SHOP · EARN</Text>
          <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14.5, marginTop: 14, lineHeight: 22, textAlign: 'center', maxWidth: 320 }}>
            The live-commerce marketplace built for the next billion buyers and sellers — AI on your side, payouts in your pocket.
          </Text>
        </LinearGradient>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 18, marginTop: -22, gap: 10 }}>
          {STATS.map((s) => (
            <View key={s.label} style={{ flex: 1, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: t.accent1 }}>{s.value}</Text>
              <Text numberOfLines={2} style={{ fontSize: 10.5, color: t.textDim, marginTop: 4, textAlign: 'center', lineHeight: 14 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* The story */}
        <Text style={sectionStyle(t)}>The story</Text>
        <View style={{ marginHorizontal: 18, padding: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <Text style={{ color: t.text, fontSize: 14.5, lineHeight: 22 }}>
            LIVA started with a simple question:{' '}
            <Text style={{ fontWeight: '800', color: t.accent1 }}>why is it easier to film a TikTok than to run a real store?</Text>
            {'\n\n'}
            Modern marketplaces are built for catalogs. But the next billion shoppers grew up on live video, voice notes, and quick replies — and they buy from people, not pages.
            {'\n\n'}
            We're building the rails for that: live broadcast rooms with one-tap buy, an AI co-pilot that tells sellers what to drop and when to go live, secure rails for payouts, and language + currency support for markets the big platforms ignore.
            {'\n\n'}
            <Text style={{ fontWeight: '800' }}>One seller. Ten minutes. First sale.</Text>{' '}
            That's the target.
          </Text>
        </View>

        {/* Principles */}
        <Text style={sectionStyle(t)}>What we believe</Text>
        <View style={{ marginHorizontal: 18, gap: 10 }}>
          {PRINCIPLES.map((p) => (
            <View key={p.title} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={p.icon} size={18} color={t.accent1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: t.text }}>{p.title}</Text>
                <Text style={{ fontSize: 13, color: t.textDim, marginTop: 4, lineHeight: 19 }}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Team */}
        <Text style={sectionStyle(t)}>Team</Text>
        <View style={{ marginHorizontal: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 14 }}>
          {TEAM.map((m, i) => (
            <View key={m.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: i < TEAM.length - 1 ? 14 : 0, borderBottomWidth: i < TEAM.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
              <Avatar seed={m.seed} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: t.text }}>{m.name}</Text>
                <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{m.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Links */}
        <Text style={sectionStyle(t)}>Resources</Text>
        <View style={{ marginHorizontal: 18, gap: 10 }}>
          <LinkRow icon="globe" label="Website" sub="liva.app" onPress={() => Linking.openURL('https://liva.app').catch(() => {})} />
          <LinkRow icon="comment" label="Help center" sub="help.liva.app" onPress={() => Linking.openURL('https://help.liva.app').catch(() => {})} />
          <LinkRow icon="shield" label="Privacy policy" sub="liva.app/privacy" onPress={() => Linking.openURL('https://liva.app/privacy').catch(() => {})} />
          <LinkRow icon="ticket" label="Terms of service" sub="liva.app/terms" onPress={() => Linking.openURL('https://liva.app/terms').catch(() => {})} />
        </View>

        {/* Version footer */}
        <View style={{ alignItems: 'center', marginTop: 28, paddingHorizontal: 18 }}>
          <Text style={{ fontSize: 11.5, color: t.textDim, fontWeight: '600' }}>LIVA v0.1.0 · built with React Native + Expo</Text>
          <Text style={{ fontSize: 10.5, color: t.textDim, marginTop: 6, textAlign: 'center', maxWidth: 280 }}>
            © 2026 LIVA. Live shopping for the next billion. Made with care for sellers everywhere.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function LinkRow({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color={t.accent1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{sub}</Text>
      </View>
      <Icon name="arrowUR" size={16} color={t.textDim} />
    </Pressable>
  );
}

function sectionStyle(t: any) {
  return {
    marginTop: 24, marginBottom: 10, paddingHorizontal: 22,
    fontSize: 11, fontWeight: '800' as const, color: t.textDim,
    textTransform: 'uppercase' as const, letterSpacing: 0.6,
  };
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
