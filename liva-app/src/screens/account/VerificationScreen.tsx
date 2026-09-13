// KYC / store verification — 3 steps, demo "submit for review" then auto-approves
// the user after a short delay.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/state/AuthContext';
import { t as tr, isRTL } from '@/i18n';

interface DocState { uploaded: boolean }

export function VerificationScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const [id, setId] = useState<DocState>({ uploaded: false });
  const [biz, setBiz] = useState<DocState>({ uploaded: false });
  const [bank, setBank] = useState<DocState>({ uploaded: false });
  const [submitting, setSubmitting] = useState(false);

  const allReady = id.uploaded && biz.uploaded && bank.uploaded;

  function submit() {
    if (!allReady) return;
    setSubmitting(true);
    // Demo flow — auto-approve after 2.5s
    setTimeout(() => {
      updateProfile({ verified: true });
      setSubmitting(false);
      Alert.alert(tr('verified'), tr('verifySentSub'));
    }, 2500);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('verifyTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 16 }}>
        {/* Status banner */}
        <LinearGradient
          colors={user?.verified ? ['rgba(34,197,94,0.2)', 'rgba(34,197,94,0.08)'] : ['rgba(139,92,246,0.22)', 'rgba(236,72,153,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16, borderRadius: t.radius, borderWidth: 1, borderColor: user?.verified ? 'rgba(34,197,94,0.4)' : 'rgba(139,92,246,0.35)', flexDirection: 'row', gap: 12, alignItems: 'center' }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: user?.verified ? 'rgba(34,197,94,0.25)' : 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={user?.verified ? 'verified' : 'shield'} size={22} color={user?.verified ? t.buy : t.accent1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>
              {user?.verified ? tr('verified') : (allReady ? tr('verifyPending') : tr('verifyNot'))}
            </Text>
            <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2, lineHeight: 17 }}>{tr('verifyBlurb')}</Text>
          </View>
        </LinearGradient>

        {/* Steps */}
        <DocStep
          n={1}
          title={tr('verifyDocId')}
          hint={tr('verifyIdHint')}
          state={id}
          onUpload={() => setId({ uploaded: true })}
          locked={!!user?.verified}
        />
        <DocStep
          n={2}
          title={tr('verifyDocBiz')}
          hint={tr('verifyBizHint')}
          state={biz}
          onUpload={() => setBiz({ uploaded: true })}
          locked={!!user?.verified}
        />
        <DocStep
          n={3}
          title={tr('verifyDocBank')}
          hint={tr('verifyBankHint')}
          state={bank}
          onUpload={() => setBank({ uploaded: true })}
          locked={!!user?.verified}
        />

        {!user?.verified && (
          <BuyBtn full onPress={submit} style={{ height: 52, marginTop: 6, opacity: allReady ? 1 : 0.5 }}>
            {submitting ? 'Submitting…' : tr('submitVerify')}
          </BuyBtn>
        )}
      </ScrollView>
    </View>
  );
}

function DocStep({ n, title, hint, state, onUpload, locked }: {
  n: number; title: string; hint: string; state: DocState; onUpload: () => void; locked: boolean;
}) {
  const { t } = useTheme();
  return (
    <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: state.uploaded ? 'rgba(34,197,94,0.4)' : t.border, borderRadius: t.radius }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: state.uploaded ? t.buy : t.surface2, alignItems: 'center', justifyContent: 'center' }}>
          {state.uploaded ? <Icon name="check" size={16} color="#04210f" stroke={3} /> : <Text style={{ color: t.text, fontWeight: '800' }}>{n}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{title}</Text>
          <Text style={{ fontSize: 12, color: t.textDim, marginTop: 3, lineHeight: 17 }}>{hint}</Text>
          {!locked && (
            <Pressable
              onPress={onUpload}
              style={{
                alignSelf: 'flex-start', marginTop: 10,
                flexDirection: 'row', gap: 6, alignItems: 'center',
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                backgroundColor: state.uploaded ? t.surface2 : 'rgba(139,92,246,0.15)',
                borderWidth: 1, borderColor: state.uploaded ? t.border : 'rgba(139,92,246,0.3)',
              }}
            >
              <Icon name={state.uploaded ? 'check' : 'plus'} size={12} color={state.uploaded ? t.buy : t.accent1} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: state.uploaded ? t.text : t.accent1 }}>
                {state.uploaded ? tr('viewDoc') : tr('uploadDoc')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
