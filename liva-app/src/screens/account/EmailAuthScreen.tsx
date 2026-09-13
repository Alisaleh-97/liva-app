// Email sign-in only. Sign-up moved to RegistrationFlow.
// Kept the `mode` prop for compat but only 'in' is actually used now.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/state/AuthContext';
import { t as tr, isRTL } from '@/i18n';

export function EmailAuthScreen({
  mode = 'in',
  onBack,
  onClose,
}: {
  mode?: 'in' | 'up';
  onBack: () => void;
  onClose?: () => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { signInEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      await signInEmail(email, password);
    } catch (e: any) {
      Alert.alert(tr('signIn'), String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={onBack}
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
        >
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        {onClose && (
          <Pressable
            onPress={onClose}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}
          >
            <Icon name="close" size={18} color={t.text} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>{tr('welcomeBack')}</Text>
        <Text style={{ fontSize: 14, color: t.textDim, marginTop: 6, marginBottom: 28, lineHeight: 20 }}>{tr('signInSub')}</Text>

        <Field label={tr('emailField')} value={email} onChange={setEmail} icon="bell" autoCap="none" keyboard="email-address" />
        <Field label={tr('passwordField')} value={password} onChange={setPassword} icon="shield" secure />

        <Pressable style={{ alignSelf: 'flex-end', marginTop: 4, marginBottom: 14 }}>
          <Text style={{ color: t.accent1, fontSize: 13, fontWeight: '600' }}>{tr('forgotPassword')}</Text>
        </Pressable>

        <BuyBtn full onPress={submit} style={{ height: 52 }}>
          {busy ? <ActivityIndicator color="#04210f" /> : tr('signIn')}
        </BuyBtn>

        <Pressable onPress={onBack} style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={{ color: t.textDim, fontSize: 13 }}>
            {tr('noAccount')} <Text style={{ color: t.accent1, fontWeight: '700' }}>{tr('createAccount')}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  label, value, onChange, icon, secure, autoCap = 'sentences', keyboard,
}: {
  label: string; value: string; onChange: (v: string) => void; icon: string;
  secure?: boolean;
  autoCap?: 'none' | 'words' | 'sentences';
  keyboard?: 'default' | 'email-address';
}) {
  const { t } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: t.textDim, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          autoCapitalize={autoCap}
          keyboardType={keyboard}
          autoCorrect={false}
          style={{ flex: 1, color: t.text, fontSize: 15 }}
          placeholderTextColor={t.textDim}
        />
      </View>
    </View>
  );
}
