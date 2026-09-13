// Affiliate program — generate share links + track clicks/conversions/earnings.
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { t as tr, price, isRTL } from '@/i18n';

export function AffiliateScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { affiliateLinks, createAffiliateLink } = useApp();

  const totalClicks = affiliateLinks.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = affiliateLinks.reduce((s, l) => s + l.conversions, 0);
  const totalEarn = affiliateLinks.reduce((s, l) => s + l.earnings, 0);

  function makeNew() {
    const link = createAffiliateLink();
    // Live URL — your local server actually serves the storefront at this path.
    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    Alert.alert(
      tr('createLink'),
      `Your link:\n${apiBase}/store/ava-boutique?r=${link.code}\n\nOpen this in any browser to see the live storefront. Earnings track to ${link.code}.`,
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('affiliateTitle')}</Text>
        <Pressable onPress={makeNew} style={btnStyle(t)}>
          <Icon name="plus" size={20} color={t.accent1} stroke={2.2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 18 }}>
        {/* Hero stats */}
        <LinearGradient
          colors={['rgba(34,197,94,0.18)', 'rgba(139,92,246,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16, borderRadius: t.radius * 1.2, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' }}
        >
          <Text style={{ fontSize: 13, color: t.textDim }}>{tr('affiliateSub')}</Text>
          <View style={{ flexDirection: 'row', marginTop: 14, gap: 12 }}>
            <Stat label={tr('linkClicks')} value={totalClicks.toLocaleString()} />
            <Stat label={tr('linkConversions')} value={totalConversions.toLocaleString()} />
            <Stat label={tr('linkEarn')} value={price(totalEarn, { dec: 0 })} accent />
          </View>
        </LinearGradient>

        {/* Links list */}
        <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {tr('yourLinks')}
        </Text>

        {affiliateLinks.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="link" size={28} color={t.textDim} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: t.text }}>{tr('noLinks')}</Text>
            <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 260 }}>{tr('noLinksSub')}</Text>
            <Pressable onPress={makeNew} style={{ marginTop: 4, borderRadius: t.radius, overflow: 'hidden' }}>
              <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 }}>
                <Icon name="plus" size={16} color="#fff" stroke={2.2} />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('createLink')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {affiliateLinks.map((l) => (
              <View key={l.id} style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="link" size={18} color={t.accent1} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: t.textDim }}>{l.productId ? `Product ${l.productId}` : 'Store-wide'}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: t.accent1, letterSpacing: 0.5 }}>liva.shop/r/{l.code}</Text>
                  </View>
                  <Pressable onPress={() => Alert.alert(tr('shareLink'), `liva.shop/r/${l.code}`)} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: t.surface2 }}>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.text }}>{tr('shareLink')}</Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <MicroStat label={tr('linkClicks')} value={String(l.clicks)} />
                  <MicroStat label={tr('linkConversions')} value={String(l.conversions)} />
                  <MicroStat label={tr('linkEarn')} value={price(l.earnings, { dec: 0 })} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: accent ? t.buy : t.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1, padding: 8, backgroundColor: t.surface2, borderRadius: 9, alignItems: 'center' }}>
      <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{value}</Text>
      <Text style={{ fontSize: 9.5, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
