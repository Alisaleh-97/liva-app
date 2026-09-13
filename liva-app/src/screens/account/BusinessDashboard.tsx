// Business Dashboard — port of earn.jsx. Balance hero, AI tip, performance
// chart with range toggle, revenue breakdown, referrals.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Sparkline } from '@/components/Sparkline';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/state/AuthContext';
import { useApp } from '@/state/AppContext';
import { t as tr, price, fmtK, isRTL } from '@/i18n';

// Demo data — would come from a real seller-side service in production.
const EARN = {
  balance: 1256.75,
  total: 3568.9,
  growth: 15.6,
  breakdown: [
    { key: 'live',      label: 'liveSales',    amount: 1840.2, color: '#8B5CF6' },
    { key: 'affiliate', label: 'affiliateInc', amount: 920.5,  color: '#EC4899' },
    { key: 'ai',        label: 'aiBoosts',     amount: 512.4,  color: '#22C55E' },
    { key: 'bonus',     label: 'bonuses',      amount: 295.8,  color: '#FFB339' },
  ],
  referrals: { count: 38, perUser: 12.5, multiplier: 1.4, link: 'liva.live/r/ava92' },
} as const;

const SERIES = {
  d: [120, 180, 140, 210, 260, 230, 300, 280, 360, 410, 380, 470, 520, 610],
  w: [820, 1100, 960, 1340, 1180, 1520, 1680],
  m: [3200, 4100, 3800, 5200, 4900, 6100],
} as const;

type R = 'd' | 'w' | 'm';

export function BusinessDashboard({
  onBack,
  onGoLive,
  onPayouts,
  onProducts,
}: {
  onBack: () => void;
  onGoLive: () => void;
  onPayouts: () => void;
  onProducts: () => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sellerProducts, orders } = useApp();
  const [range, setRange] = useState<R>('d');
  const max = Math.max(...EARN.breakdown.map((b) => b.amount));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('dashboard')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero balance card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <LinearGradient
            colors={t.accentGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: t.radius * 1.4, padding: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="wallet" size={15} color="rgba(255,255,255,0.9)" />
                <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12.5, fontWeight: '600' }}>
                  {tr('currentBalanceLabel')}
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>USD</Text>
              </View>
            </View>
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 6 }}>
              {price(EARN.balance)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{tr('totalEarnedLabel')}</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{price(EARN.total)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                <Icon name="trend" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800' }}>+{EARN.growth}%</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 9, marginTop: 18 }}>
              <DashAction icon="send" label={tr('withdrawCta')} onPress={onPayouts} />
              <DashAction icon="trend" label={tr('transferCta')} onPress={onPayouts} />
              <DashAction icon="eye" label={tr('detailsCta')} onPress={() => {}} />
            </View>
          </LinearGradient>
        </View>

        {/* AI tip */}
        <View style={{ marginHorizontal: 18, marginTop: 20, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', borderRadius: t.radius, flexDirection: 'row', gap: 11, alignItems: 'center' }}>
          <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(139,92,246,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ai" size={18} color={t.accent1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: t.text }}>{tr('aiTipTitle')}</Text>
            <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2, lineHeight: 17 }}>{tr('aiTip1')}</Text>
          </View>
          <Pressable onPress={onGoLive} style={{ borderRadius: t.radius * 0.8, overflow: 'hidden' }}>
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tr('apply')}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Quick KPIs row */}
        <View style={{ flexDirection: 'row', marginHorizontal: 18, marginTop: 16, gap: 10 }}>
          <Kpi label={tr('myProducts')} value={String(sellerProducts.length)} onPress={onProducts} />
          <Kpi label="Orders" value={String(orders.length)} />
          <Kpi label={tr('followersCount')} value={fmtK(2480)} />
        </View>

        {/* Performance chart */}
        <View style={{ marginHorizontal: 18, marginTop: 20, padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{tr('perfTitle')}</Text>
            <View style={{ flexDirection: 'row', gap: 2, backgroundColor: t.surface2, borderRadius: 999, padding: 3 }}>
              {(['d', 'w', 'm'] as R[]).map((r) => {
                const active = range === r;
                const label = r === 'd' ? tr('range_d') : r === 'w' ? tr('range_w') : tr('range_m');
                return (
                  <Pressable key={r} onPress={() => setRange(r)} style={{ borderRadius: 999, overflow: 'hidden' }}>
                    {active ? (
                      <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 11, paddingVertical: 5 }}>
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#fff' }}>{label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={{ paddingHorizontal: 11, paddingVertical: 5 }}>
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.textDim }}>{label}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Sparkline data={SERIES[range].slice()} height={104} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: t.textDim }}>
              {range === 'd' ? '14d ago' : range === 'w' ? '7w ago' : '6mo ago'}
            </Text>
            <Text style={{ fontSize: 10, color: t.textDim }}>now</Text>
          </View>
        </View>

        {/* Revenue breakdown */}
        <View style={{ marginHorizontal: 18, marginTop: 20, padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{tr('revBreakdown')}</Text>
          <View style={{ marginTop: 14, gap: 14 }}>
            {EARN.breakdown.map((b) => (
              <View key={b.key}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{tr(b.label)}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>{price(b.amount)}</Text>
                </View>
                <View style={{ height: 7, borderRadius: 999, backgroundColor: t.surface2, overflow: 'hidden' }}>
                  <View style={{ height: 7, width: `${(b.amount / max) * 100}%`, backgroundColor: b.color, borderRadius: 999 }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Referrals */}
        <View style={{ marginHorizontal: 18, marginTop: 20, padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="users" size={17} color={t.accent2} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{tr('referralsTitle')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <ReferralStat value={String(EARN.referrals.count)} label={tr('invited')} />
            <ReferralStat value={price(EARN.referrals.perUser, { dec: 0 })} label={tr('perUser')} />
            <ReferralStat value={`${EARN.referrals.multiplier}×`} label={tr('multiplier')} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, backgroundColor: t.surface2, borderRadius: t.radius }}>
            <Icon name="share" size={16} color={t.accent1} />
            <Text style={{ flex: 1, fontSize: 12.5, color: t.text }}>{EARN.referrals.link}</Text>
            <Pressable style={{ height: 46, paddingHorizontal: 18, borderRadius: t.radius, overflow: 'hidden' }}>
              <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{tr('copy')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DashAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)' }}>
      <Icon name={icon} size={15} color="#1a1030" />
      <Text style={{ color: '#1a1030', fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function Kpi({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flex: 1, padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: t.textDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    </Pressable>
  );
}

function ReferralStat({ value, label }: { value: string; label: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 11, backgroundColor: t.surface2, borderRadius: t.radius * 0.85 }}>
      <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: t.textDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
