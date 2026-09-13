// Support & Help — searchable FAQ with expandable items + contact options.
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeContext';
import { t as tr, isRTL } from '@/i18n';

const FAQ_KEYS: Array<{ q: string; a: string }> = [
  { q: 'helpOrderTrack', a: 'helpOrderTrackA' },
  { q: 'helpReturn', a: 'helpReturnA' },
  { q: 'helpAIPicks', a: 'helpAIPicksA' },
  { q: 'helpPayMonthly', a: 'helpPayMonthlyA' },
  { q: 'helpLanguage', a: 'helpLanguageA' },
  { q: 'helpLiveStream', a: 'helpLiveStreamA' },
];

export function SupportScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(FAQ_KEYS[0].q);

  const faqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_KEYS;
    return FAQ_KEYS.filter((f) => tr(f.q).toLowerCase().includes(q) || tr(f.a).toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('supportTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 22 }}>
        {/* Hero */}
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.text, letterSpacing: -0.4, marginBottom: 12 }}>{tr('supportHowHelp')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
            <Icon name="search" size={18} color={t.textDim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={tr('supportSearchPh')}
              placeholderTextColor={t.textDim}
              style={{ flex: 1, color: t.text, fontSize: 14 }}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Contact cards */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, paddingHorizontal: 4 }}>
            {tr('contactTitle')}
          </Text>
          <View style={{ gap: 10 }}>
            <ContactRow icon="comment" label={tr('liveChat')} sub={tr('liveChatSub')} accent />
            <ContactRow icon="send" label={tr('emailUs')} sub={tr('emailUsSub')} />
            <ContactRow icon="headset" label={tr('callUs')} sub={tr('callUsSub')} />
          </View>
        </View>

        {/* FAQ */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, paddingHorizontal: 4 }}>
            {tr('faqTitle')}
          </Text>
          <View style={{ gap: 10 }}>
            {faqs.length === 0 ? (
              <Text style={{ color: t.textDim, fontSize: 13, padding: 14, textAlign: 'center' }}>
                {tr('noResults')}
              </Text>
            ) : faqs.map((f) => {
              const expanded = open === f.q;
              return (
                <Pressable
                  key={f.q}
                  onPress={() => setOpen(expanded ? null : f.q)}
                  style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: expanded ? 'rgba(139,92,246,0.4)' : t.border, borderRadius: t.radius }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: t.text }}>{tr(f.q)}</Text>
                    <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                      <Icon name="chevR" size={16} color={t.textDim} stroke={2} />
                    </View>
                  </View>
                  {expanded && (
                    <Text style={{ marginTop: 10, fontSize: 13, lineHeight: 19, color: t.textDim }}>{tr(f.a)}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ContactRow({ icon, label, sub, accent }: { icon: string; label: string; sub: string; accent?: boolean }) {
  const { t } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, backgroundColor: t.surface, borderWidth: 1,
        borderColor: accent ? 'rgba(139,92,246,0.35)' : t.border,
        borderRadius: t.radius, opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.accent1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{sub}</Text>
      </View>
      <Icon name={isRTL() ? 'chevL' : 'chevR'} size={18} color={t.textDim} />
    </Pressable>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
