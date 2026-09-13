// LIVA Rewards — tier progression, LIVA Coins balance, earn-more guide,
// redeem options, transaction history.
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useApp, tierForLifetime, LoyaltyTier } from '@/state/AppContext';
import { useExtras } from '@/state/AppExtras';
import { t as tr, isRTL } from '@/i18n';

const TIER_INFO: Record<LoyaltyTier, { color: string; bgFrom: string; bgTo: string; threshold: number; nameKey: string }> = {
  bronze:  { color: '#CD7F32', bgFrom: '#3A2814', bgTo: '#5C3A1F', threshold: 500,  nameKey: 'bronzeTier' },
  silver:  { color: '#C0C0C0', bgFrom: '#2A2D33', bgTo: '#4A4F58', threshold: 2000, nameKey: 'silverTier' },
  gold:    { color: '#FFD700', bgFrom: '#3A2F08', bgTo: '#6B5A1A', threshold: 5000, nameKey: 'goldTier' },
  diamond: { color: '#B9F2FF', bgFrom: '#0E2A38', bgTo: '#1F5A75', threshold: 5000, nameKey: 'diamondTier' },
};

const EARN_ACTIONS = [
  { icon: 'cart', key: 'earnPurchase' },
  { icon: 'live', key: 'earnLive' },
  { icon: 'star', key: 'earnReview' },
  { icon: 'users', key: 'earnRefer' },
];

// Achievement definitions — each checks against loyalty state + streak.
// The badge grid shows all of them, unlocked ones brighter with a gold ring.
// Achievement checks read the coins `lifetime` counter and current streak.
// Descriptions match what the check actually measures — if you add a real
// orders/live-watch counter later, split the checks accordingly.
const ACHIEVEMENTS: { id: string; icon: string; title: string; desc: string; check: (loyalty: any, streak: number) => boolean }[] = [
  { id: 'first',   icon: '🎉', title: 'Getting started', desc: 'Earn your first coin', check: (l) => l.lifetime >= 1 },
  { id: 'ten',     icon: '🛍️', title: 'Big spender',    desc: 'Earn 500 coins',       check: (l) => l.lifetime >= 500 },
  { id: 'live',    icon: '📺', title: 'Live watcher',   desc: 'Earn 20 coins',         check: (l) => l.lifetime >= 20 },
  { id: 'streak3', icon: '🔥', title: '3-day streak',   desc: 'Check in 3 days',       check: (_l, s) => s >= 3 },
  { id: 'streak7', icon: '⚡', title: 'Week warrior',   desc: 'Check in 7 days',       check: (_l, s) => s >= 7 },
  { id: 'social',  icon: '💌', title: 'Growing wallet', desc: 'Earn 100 coins',        check: (l) => l.lifetime >= 100 },
];

const REDEEM_OPTIONS = [
  { id: 'free-ship', icon: 'truck', cost: 200, key: 'redeemFreeShip' },
  { id: '5off', icon: 'tag', cost: 500, key: 'redeem5' },
  { id: 'early', icon: 'bolt', cost: 1000, key: 'redeemEarly' },
  { id: '15off', icon: 'tag', cost: 1500, key: 'redeem15' },
];

export function LoyaltyScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { loyalty, redeemCoins, awardCoins } = useApp();
  const { streak, checkInToday } = useExtras();
  const tier = tierForLifetime(loyalty.lifetime);
  const info = TIER_INFO[tier];
  const nextTier: LoyaltyTier | null = tier === 'diamond' ? null : (
    tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : 'diamond'
  );
  const nextThreshold = nextTier ? TIER_INFO[nextTier].threshold : null;
  const progress = nextThreshold ? Math.min(1, loyalty.lifetime / nextThreshold) : 1;

  function handleCheckIn() {
    const r = checkInToday();
    if (r.alreadyDone) {
      Alert.alert(`🔥 ${streak.current}-day streak`, "You've already checked in today. Come back tomorrow!");
      return;
    }
    awardCoins(`Day ${r.newStreak} check-in`, r.rewarded);
    Alert.alert(`🔥 Day ${r.newStreak} streak!`, `+${r.rewarded} coins. Longest: ${Math.max(r.newStreak, streak.longest)} days.`);
  }

  function handleRedeem(id: string, cost: number, label: string) {
    Alert.alert(label, `Redeem ${cost} coins?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Redeem', onPress: () => {
        const ok = redeemCoins(label, cost);
        Alert.alert(ok ? 'Redeemed!' : 'Not enough coins', ok ? 'Look in your inbox for the code.' : '');
      } },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('loyaltyTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Tier hero */}
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <LinearGradient
            colors={[info.bgFrom, info.bgTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: t.radius * 1.4, padding: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="star" size={20} color={info.color} />
              <Text style={{ color: info.color, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>{tr(info.nameKey)}</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1, marginTop: 8 }}>{loyalty.coins.toLocaleString()}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{tr('coinsBalance')}</Text>

            {nextTier && nextThreshold && (
              <>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 14, overflow: 'hidden' }}>
                  <View style={{ height: 6, width: `${progress * 100}%`, backgroundColor: info.color, borderRadius: 99 }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5, marginTop: 7 }}>
                  {(nextThreshold - loyalty.lifetime).toLocaleString()} coins {tr('toNextTier')} {tr(TIER_INFO[nextTier].nameKey)}
                </Text>
              </>
            )}
            {!nextTier && (
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 14 }}>{tr('maxTier')}</Text>
            )}
          </LinearGradient>
        </View>

        {/* Streak multiplier — active if user checked in in the last day */}
        {streak.current > 0 && (
          <View style={{ paddingHorizontal: 18, marginTop: 12 }}>
            <Pressable onPress={handleCheckIn}>
              <LinearGradient
                colors={['#FF6E40', '#FFB339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#FF6E40', shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
              >
                <Text style={{ fontSize: 36 }}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }}>{streak.current}-day streak · {Math.min(3, 1 + Math.floor(streak.current / 7))}× coins</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11.5, marginTop: 2 }}>
                    Check in daily to keep your multiplier. Longest: {streak.longest} days.
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Achievements — earned badges based on lifetime activity */}
        <Text style={sectionStyle(t)}>Achievements</Text>
        <View style={{ paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {ACHIEVEMENTS.map((a) => {
            const earned = a.check(loyalty, streak.current);
            return (
              <View key={a.id} style={{ width: '31%', padding: 12, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: t.radius, alignItems: 'center', opacity: earned ? 1 : 0.4 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: earned ? 'rgba(255,199,44,0.18)' : t.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: earned ? 1 : 0, borderColor: '#FFC72C' }}>
                  <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                </View>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.text, textAlign: 'center' }}>{a.title}</Text>
                <Text style={{ fontSize: 9.5, color: t.textDim, textAlign: 'center', marginTop: 2 }} numberOfLines={2}>{earned ? 'Earned' : a.desc}</Text>
              </View>
            );
          })}
        </View>

        {/* Cashback wallet — 2% of every purchase gets returned as coins */}
        <Text style={sectionStyle(t)}>Cashback wallet</Text>
        <View style={{ marginHorizontal: 18, padding: 16, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,230,114,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>💰</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: t.buy, letterSpacing: -0.3 }}>${(loyalty.lifetime * 0.02).toFixed(2)}</Text>
            <Text style={{ fontSize: 11.5, color: t.textDim }}>Lifetime cashback earned (2% back on every order)</Text>
          </View>
        </View>

        {/* Redeem */}
        <Text style={sectionStyle(t)}>{tr('redeemTitle')}</Text>
        <View style={{ paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {REDEEM_OPTIONS.map((opt) => {
            const can = loyalty.coins >= opt.cost;
            const label = tr(opt.key);
            return (
              <Pressable
                key={opt.id}
                onPress={() => handleRedeem(opt.id, opt.cost, label)}
                disabled={!can}
                style={{ width: '48%', padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: can ? t.border : t.border, borderRadius: t.radius, opacity: can ? 1 : 0.45 }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon name={opt.icon} size={18} color={t.accent1} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }} numberOfLines={2}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Earn more */}
        <Text style={sectionStyle(t)}>{tr('earnMore')}</Text>
        <View style={{ marginHorizontal: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 14 }}>
          {EARN_ACTIONS.map((a) => (
            <View key={a.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.icon} size={18} color={t.buy} />
              </View>
              <Text style={{ flex: 1, fontSize: 13, color: t.text }}>{tr(a.key)}</Text>
            </View>
          ))}
          <Pressable onPress={() => awardCoins('Daily check-in', 20)} style={{ marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.18)' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.buy }}>+ Daily check-in (20 coins)</Text>
          </Pressable>
        </View>

        {/* History */}
        <Text style={sectionStyle(t)}>{tr('historyTitle')}</Text>
        <View style={{ marginHorizontal: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 10 }}>
          {loyalty.txns.slice(0, 8).map((txn) => (
            <View key={txn.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: t.text }}>{txn.reason}</Text>
                <Text style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>{new Date(txn.at).toLocaleDateString()}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: txn.amount > 0 ? t.buy : t.live }}>
                {txn.amount > 0 ? '+' : ''}{txn.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function sectionStyle(t: any) {
  return {
    marginTop: 18, marginBottom: 10, paddingHorizontal: 22,
    fontSize: 11, fontWeight: '800' as const, color: t.textDim,
    textTransform: 'uppercase' as const, letterSpacing: 0.6,
  };
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
