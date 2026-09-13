// Audience insights — followers stat, demographics, top countries, top buyers.
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { Sparkline } from '@/components/Sparkline';
import { useTheme } from '@/theme/ThemeContext';
import { t as tr, fmtK, price, isRTL } from '@/i18n';

const COUNTRIES = [
  { name: 'UAE', flag: '🇦🇪', pct: 38 },
  { name: 'Saudi Arabia', flag: '🇸🇦', pct: 24 },
  { name: 'Egypt', flag: '🇪🇬', pct: 16 },
  { name: 'Kuwait', flag: '🇰🇼', pct: 8 },
  { name: 'Qatar', flag: '🇶🇦', pct: 6 },
];

const AGES = [
  { range: '18–24', pct: 22 },
  { range: '25–34', pct: 41 },
  { range: '35–44', pct: 23 },
  { range: '45–54', pct: 9 },
  { range: '55+', pct: 5 },
];

const TOP_BUYERS = [
  { name: 'Layla A.', seed: 'buyer-layla', orders: 18, spend: 1280, lives: 24 },
  { name: 'Omar K.', seed: 'buyer-omar', orders: 14, spend: 940, lives: 16 },
  { name: 'Sara M.', seed: 'buyer-sara', orders: 12, spend: 870, lives: 22 },
  { name: 'Noor R.', seed: 'buyer-noor', orders: 9, spend: 640, lives: 11 },
];

const FOLLOWER_SERIES = [1850, 1880, 1940, 1990, 2090, 2150, 2240, 2310, 2380, 2410, 2440, 2480];

export function AudienceScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('audienceTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* KPIs */}
        <View style={{ paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 8 }}>
          <Kpi label={tr('audienceFollowers')} value={fmtK(2480)} accent />
          <Kpi label={tr('audienceConversion')} value="6.2%" />
          <Kpi label={tr('audienceRepeat')} value="38%" />
          <Kpi label={tr('audienceLTV')} value={price(184, { dec: 0 })} />
        </View>

        {/* Follower growth */}
        <View style={{ margin: 18, padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: t.text }}>{tr('audienceFollowers')}</Text>
            <Text style={{ fontSize: 12, color: t.buy, fontWeight: '800' }}>+34% / 90d</Text>
          </View>
          <Sparkline data={FOLLOWER_SERIES} height={84} />
        </View>

        {/* Top countries */}
        <Text style={sectionTitleStyle(t)}>{tr('topCountries')}</Text>
        <View style={{ paddingHorizontal: 18, gap: 10 }}>
          {COUNTRIES.map((c) => (
            <View key={c.name} style={{ padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: t.text }}>{c.name}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: t.accent1 }}>{c.pct}%</Text>
              </View>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: t.surface2, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${c.pct * 2.5}%`, backgroundColor: t.accent1, borderRadius: 99 }} />
              </View>
            </View>
          ))}
        </View>

        {/* Age groups */}
        <Text style={sectionTitleStyle(t)}>{tr('ageGroups')}</Text>
        <View style={{ marginHorizontal: 18, padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 11 }}>
          {AGES.map((a) => (
            <View key={a.range}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{a.range}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>{a.pct}%</Text>
              </View>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: t.surface2, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${a.pct * 2}%`, backgroundColor: t.accent2, borderRadius: 99 }} />
              </View>
            </View>
          ))}
        </View>

        {/* Top buyers */}
        <Text style={sectionTitleStyle(t)}>{tr('topBuyersList')}</Text>
        <View style={{ marginHorizontal: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 12 }}>
          {TOP_BUYERS.map((b, i) => (
            <View key={b.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: i < TOP_BUYERS.length - 1 ? 12 : 0, borderBottomWidth: i < TOP_BUYERS.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
              <Avatar seed={b.seed} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{b.name}</Text>
                <Text style={{ fontSize: 11.5, color: t.textDim }}>{b.orders} orders · {b.lives} {tr('livesAttended')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{price(b.spend, { dec: 0 })}</Text>
                <Text style={{ fontSize: 10, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>total spend</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{
      width: '48%', padding: 14, borderRadius: t.radius,
      backgroundColor: accent ? 'rgba(139,92,246,0.12)' : t.surface,
      borderWidth: 1, borderColor: accent ? 'rgba(139,92,246,0.3)' : t.border,
    }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: accent ? t.accent1 : t.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.textDim, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function sectionTitleStyle(t: any) {
  return {
    marginTop: 14, marginBottom: 10, paddingHorizontal: 22,
    fontSize: 11, fontWeight: '800' as const, color: t.textDim,
    textTransform: 'uppercase' as const, letterSpacing: 0.6,
  };
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
