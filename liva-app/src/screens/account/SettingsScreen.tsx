// Settings — theme, language, currency, notifications. All live-applies.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';
import { Lang, Currency, t as tr, isRTL } from '@/i18n';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { t, mode, lang, ccy, autoTheme, setMode, setLang, setCcy, setAutoTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { preferences, setPreference } = useExtras();
  const [push, setPush] = useState(true);
  const [emailOk, setEmailOk] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('settingsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 24 }}>
        {/* Appearance */}
        <Section title={tr('appearance')}>
          <Segmented
            label={tr('themeLabel')}
            options={[
              { v: 'dark', label: tr('themeDark') },
              { v: 'light', label: tr('themeLight') },
            ]}
            value={mode}
            onChange={(v) => setMode(v as 'dark' | 'light')}
          />
        </Section>

        {/* Language & region */}
        <Section title={tr('langRegion')}>
          <Segmented
            label={tr('languageLabel')}
            options={[
              { v: 'en', label: 'English' },
              { v: 'ar', label: 'العربية' },
            ]}
            value={lang}
            onChange={(v) => setLang(v as Lang)}
          />
          <Segmented
            label={tr('currencyLabel')}
            options={[
              { v: 'USD', label: 'USD $' },
              { v: 'AED', label: 'AED د.إ' },
            ]}
            value={ccy}
            onChange={(v) => setCcy(v as Currency)}
          />
          {/* Live FX indicator — shows current pair with a green dot to signal
              rate freshness. Rates would come from a real backend endpoint. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,230,114,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16 }}>💱</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>1 USD = 3.673 AED</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
                <Text style={{ fontSize: 10.5, color: t.textDim }}>Live rate · updated 12s ago</Text>
              </View>
            </View>
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#22C55E' }}>+0.02%</Text>
          </View>
        </Section>

        {/* Notifications */}
        <Section title={tr('notifSection')}>
          <ToggleRow
            icon="bell"
            label={tr('notifPush')}
            sub={tr('notifPushSub')}
            value={push}
            onChange={setPush}
          />
          <ToggleRow
            icon="send"
            label={tr('notifEmail')}
            sub={tr('notifEmailSub')}
            value={emailOk}
            onChange={setEmailOk}
          />
        </Section>

        {/* Experience */}
        <Section title="Experience">
          <ToggleRow icon="bolt" label="Haptic feedback" sub="Subtle taps on key actions" value={preferences.haptics} onChange={(v) => setPreference('haptics', v)} />
          <ToggleRow icon="mic" label="Sound effects" sub="Sale chime, success ping" value={preferences.sounds} onChange={(v) => setPreference('sounds', v)} />
          <ToggleRow icon="eye" label="Reduce motion" sub="Minimize animations" value={preferences.reducedMotion} onChange={(v) => setPreference('reducedMotion', v)} />
          <ToggleRow icon="shield" label="Auto theme" sub="Follow system dark/light" value={autoTheme} onChange={(v) => { setAutoTheme(v); setPreference('autoTheme', v); }} />
        </Section>

        {/* Privacy */}
        <Section title={tr('privacy')}>
          <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield" size={18} color={t.accent1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{tr('dataPrefs')}</Text>
              <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{tr('dataPrefsSub')}</Text>
            </View>
            <Icon name={isRTL() ? 'chevL' : 'chevR'} size={18} color={t.textDim} />
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 4 }}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { t } = useTheme();
  return (
    <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 10 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.surface2, borderRadius: 999, padding: 3 }}>
        {options.map((opt) => {
          const active = opt.v === value;
          return (
            <Pressable
              key={opt.v}
              onPress={() => onChange(opt.v)}
              style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}
            >
              {active ? (
                <LinearGradient
                  colors={t.accentGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 9, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{opt.label}</Text>
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 9, alignItems: 'center' }}>
                  <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '700' }}>{opt.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  icon, label, sub, value, onChange,
}: { icon: string; label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useTheme();
  return (
    <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.accent1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: t.surface2, true: t.accent1 }}
        thumbColor="#fff"
      />
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
