// Polished 2-step sign-in: enter email → app finds your account → shows your
// avatar + name + role pill → asks for password.
//
// Handles BOTH shopper and business accounts identically — the role is on the
// stored account record, not chosen during sign-in. We surface it visually
// (SELLER badge + business name) so users know which account they're signing
// into when they have both.
//
// Also includes: SSO buttons (Apple/Google), Remember me, Forgot password
// modal flow (email → 6-digit code → new password).

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { AppleLogo, GoogleLogo } from '@/components/BrandIcon';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/state/AuthContext';
import { useExtras } from '@/state/AppExtras';
import { useGoogleAuth, signInWithAppleNative, appleConfigured } from '@/lib/oauth';
import { t as tr, isRTL } from '@/i18n';
import { tap } from '@/lib/haptics';

type AccountSummary = NonNullable<Awaited<ReturnType<ReturnType<typeof useAuth>['lookupAccount']>>>;

export function SignInScreen({
  onBack,
  onWantSignUp,
}: {
  onBack: () => void;
  onWantSignUp: () => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { signInEmail, signInWithProvider, beginProviderAuth, lookupAccount } = useAuth();
  const { preferences } = useExtras();
  const google = useGoogleAuth();

  // Step 0 = email entry; Step 1 = password (after account found)
  const [step, setStep] = useState<0 | 1>(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [found, setFound] = useState<AccountSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const handledGoogleToken = useRef<string | null>(null);

  async function finishProviderSignIn(
    provider: 'google' | 'apple',
    credential: string,
    names?: { firstName?: string; lastName?: string },
  ) {
    const result = await beginProviderAuth(provider, credential, names);
    if (result.requiresRegistration) {
      Alert.alert(
        'Complete your account',
        'This verified identity is new to LIVA. Tap Create account and choose the same provider to add your phone, country, and account type.',
      );
      onWantSignUp();
    }
  }

  useEffect(() => {
    if (google.response?.type !== 'success') return;
    const accessToken = (google.response as any).authentication?.accessToken;
    if (!accessToken || handledGoogleToken.current === accessToken) return;
    handledGoogleToken.current = accessToken;
    setBusy(true);
    finishProviderSignIn('google', accessToken)
      .catch((error) => Alert.alert('Sign in', String(error?.message || error)))
      .finally(() => setBusy(false));
  }, [google.response]);

  // ── Step 0 → 1: look up account ──────────────────────────────────────────
  async function lookup() {
    if (!email.trim()) return Alert.alert('Email', 'Enter your email.');
    setBusy(true);
    try {
      const acc = await lookupAccount(email.trim().toLowerCase());
      // A new device has no local profile cache. Continue with a neutral
      // account summary and let the backend validate the credentials; this
      // also avoids exposing whether an email is registered.
      const account = acc || {
        name: 'LIVA member',
        email: email.trim().toLowerCase(),
        avatarSeed: `user-${email.trim().toLowerCase()}`,
        role: 'shopper' as const,
        provider: 'email' as const,
      };
      // If it's an SSO-only account, tell the user to use that provider
      if (account.provider !== 'email') {
        Alert.alert(
          'Use ' + account.provider,
          `This account was created with ${account.provider}. Tap "Continue with ${account.provider}" to sign in.`
        );
        return;
      }
      tap('light', preferences.haptics);
      setFound(account);
      setStep(1);
    } catch (e: any) {
      Alert.alert('Sign in', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // ── Step 1 submit: actual sign-in ────────────────────────────────────────
  async function submit() {
    if (!password) return;
    setBusy(true);
    try {
      await signInEmail(email.trim().toLowerCase(), password);
      tap('success', preferences.haptics);
      // user state updates → App.tsx auth gate routes to Home automatically
    } catch (e: any) {
      tap('error', preferences.haptics);
      Alert.alert('Sign in', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // ── SSO ──────────────────────────────────────────────────────────────────
  async function ssoSignIn(provider: 'google' | 'apple') {
    setBusy(true);
    try {
      if (provider === 'google' && google.ready) {
        await google.promptGoogle();
        // Resolution is handled by the effect above.
        return;
      }
      if (provider === 'apple' && appleConfigured) {
        const apple = await signInWithAppleNative();
        if (apple?.identityToken) {
          await finishProviderSignIn('apple', apple.identityToken, {
            firstName: apple.firstName,
            lastName: apple.lastName,
          });
          return;
        }
        return;
      }
      // Demo fallback
      await signInWithProvider(provider, 'shopper');
    } catch (e: any) {
      Alert.alert('Sign in', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // Role-aware welcome line
  const welcomeLine = found
    ? (found.role === 'business' && found.businessName)
      ? `${found.businessName}`
      : `${found.firstName ?? found.name}`
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={step === 1 ? () => { setStep(0); setFound(null); setPassword(''); } : onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>L</Text>
          </LinearGradient>
          <Text style={{ fontWeight: '800', fontSize: 16, color: t.text }}>LIVA</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          /* ─── Step 0: email ─────────────────────────────────────────── */
          <>
            <Text style={{ fontSize: 28, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>Sign in</Text>
            <Text style={{ fontSize: 14, color: t.textDim, marginTop: 6, marginBottom: 26, lineHeight: 20 }}>
              Use your LIVA account to continue. Shopper or seller — same sign-in.
            </Text>

            {/* SSO buttons at top */}
            <View style={{ gap: 10, marginBottom: 18 }}>
              <Pressable
                disabled={busy}
                onPress={() => ssoSignIn('apple')}
                style={{ height: 50, borderRadius: t.radius, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
              >
                <AppleLogo size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('continueApple')}</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => ssoSignIn('google')}
                style={{ height: 50, borderRadius: t.radius, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: t.border }}
              >
                <GoogleLogo size={18} />
                <Text style={{ color: '#1f1f1f', fontSize: 14, fontWeight: '700' }}>{tr('continueGoogle')}</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
              <Text style={{ color: t.textDim, fontSize: 11.5, fontWeight: '700' }}>OR SIGN IN WITH EMAIL</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
            </View>

            <Field
              label={tr('emailField')}
              value={email}
              onChange={setEmail}
              icon="bell"
              autoCap="none"
              keyboard="email-address"
              placeholder="you@example.com"
              onSubmitEditing={lookup}
            />

            <BuyBtn full onPress={lookup} style={{ height: 52, marginTop: 8 }}>
              {busy ? <ActivityIndicator color="#04210f" /> : 'Continue'}
            </BuyBtn>

            <Pressable onPress={onWantSignUp} style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: t.textDim, fontSize: 13 }}>
                {tr('noAccount')}{' '}
                <Text style={{ color: t.accent1, fontWeight: '700' }}>{tr('createAccount')}</Text>
              </Text>
            </Pressable>
          </>
        ) : (
          /* ─── Step 1: password (account found) ──────────────────────── */
          <>
            {/* Found account card */}
            {found && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, marginBottom: 22 }}>
                <Avatar seed={found.avatarSeed} size={56} verified={found.role === 'business'} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: t.text }}>{welcomeLine}</Text>
                    {found.role === 'business' && <Badge kind="ai">SELLER</Badge>}
                  </View>
                  <Text style={{ fontSize: 12.5, color: t.textDim, marginTop: 3 }}>{found.email}</Text>
                </View>
                <Pressable onPress={() => { setStep(0); setFound(null); setPassword(''); }}>
                  <Text style={{ fontSize: 12, color: t.accent1, fontWeight: '700' }}>Not you?</Text>
                </Pressable>
              </View>
            )}

            <Text style={{ fontSize: 26, fontWeight: '800', color: t.text, letterSpacing: -0.4 }}>
              {found?.role === 'business' ? 'Welcome back to your store' : `Welcome back`}
            </Text>
            <Text style={{ fontSize: 14, color: t.textDim, marginTop: 6, marginBottom: 22, lineHeight: 20 }}>
              Enter your password to continue.
            </Text>

            <Field
              label={tr('passwordField')}
              value={password}
              onChange={setPassword}
              icon="shield"
              secure
              autoCap="none"
              placeholder="••••••••"
              onSubmitEditing={submit}
              autoFocus
            />

            {/* Remember me + Forgot */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 18 }}>
              <Pressable onPress={() => setRemember((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: remember ? t.accent1 : t.border, backgroundColor: remember ? t.accent1 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {remember && <Icon name="check" size={12} color="#fff" stroke={3} />}
                </View>
                <Text style={{ fontSize: 13, color: t.text, fontWeight: '600' }}>Remember me</Text>
              </Pressable>
              <Pressable onPress={() => setForgotOpen(true)}>
                <Text style={{ color: t.accent1, fontSize: 13, fontWeight: '700' }}>{tr('forgotPassword')}</Text>
              </Pressable>
            </View>

            <BuyBtn full onPress={submit} style={{ height: 52 }}>
              {busy ? <ActivityIndicator color="#04210f" /> : tr('signIn')}
            </BuyBtn>

            {/* Hint that takes user to a different account */}
            <Pressable onPress={onWantSignUp} style={{ alignItems: 'center', marginTop: 18 }}>
              <Text style={{ color: t.textDim, fontSize: 12.5 }}>
                Want a different account? <Text style={{ color: t.accent1, fontWeight: '700' }}>Create one</Text>
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <ForgotPasswordFlow
        open={forgotOpen}
        defaultEmail={email}
        onClose={() => setForgotOpen(false)}
      />
    </View>
  );
}

// ── Forgot password modal: email → code → new password ──────────────────────
function ForgotPasswordFlow({ open, defaultEmail, onClose }: { open: boolean; defaultEmail: string; onClose: () => void }) {
  const { t } = useTheme();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (open) { setStep(0); setEmail(defaultEmail); setCode(''); setDemoCode(''); setNewPwd(''); setConfirmPwd(''); }
  }, [open, defaultEmail]);

  async function sendCode() {
    setBusy(true);
    try {
      const r = await requestPasswordReset(email.trim().toLowerCase());
      setDemoCode(r.codeForDemo || '');
      setStep(1);
    } catch (e: any) {
      Alert.alert('Reset password', String(e?.message || e));
    } finally { setBusy(false); }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) return Alert.alert('Code', 'Enter the 6-digit code from your email.');
    if (demoCode && code !== demoCode) return Alert.alert('Code', 'That preview code does not match.');
    setStep(2);
  }

  async function finalize() {
    if (newPwd !== confirmPwd) return Alert.alert('Password', "Passwords don't match.");
    setBusy(true);
    try {
      await resetPassword(email.trim().toLowerCase(), code, newPwd);
      Alert.alert('Password updated', 'You can now sign in with your new password.');
      onClose();
    } catch (e: any) {
      Alert.alert('Reset', String(e?.message || e));
    } finally { setBusy(false); }
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 32, gap: 14 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 8 }} />

        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 5, marginBottom: 4 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: i <= step ? t.accent1 : t.surface2 }} />
          ))}
        </View>

        {step === 0 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>Forgot password</Text>
            <Text style={{ fontSize: 13, color: t.textDim, lineHeight: 18 }}>
              Enter your email and we'll send a 6-digit code to reset your password.
            </Text>
            <Field label={tr('emailField')} value={email} onChange={setEmail} icon="bell" autoCap="none" keyboard="email-address" />
            <BuyBtn full onPress={sendCode} style={{ height: 50, marginTop: 6 }}>
              {busy ? <ActivityIndicator color="#04210f" /> : 'Send code'}
            </BuyBtn>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>Enter the 6-digit code</Text>
            <Text style={{ fontSize: 13, color: t.textDim, lineHeight: 18 }}>
              Sent to {email}. Check spam if you don't see it.
            </Text>
            {/* Demo hint — in production this code lives only on the server */}
            {demoCode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' }}>
                <Icon name="check" size={14} color={t.buy} stroke={2.5} />
                <Text style={{ fontSize: 12, color: t.buy, flex: 1 }}>
                  Local preview code: <Text style={{ fontWeight: '800' }}>{demoCode}</Text>
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, backgroundColor: 'rgba(25,198,230,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(25,198,230,0.28)' }}>
                <Icon name="bell" size={14} color={t.accent2} />
                <Text style={{ fontSize: 12, color: t.text, flex: 1 }}>Check your inbox. The code expires in 10 minutes.</Text>
              </View>
            )}
            <Field label="6-digit code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} icon="ticket" keyboard="number-pad" placeholder="123456" />
            <BuyBtn full onPress={verifyCode} style={{ height: 50, marginTop: 6 }}>Verify</BuyBtn>
            <Pressable onPress={sendCode} style={{ alignSelf: 'center', marginTop: 4 }}>
              <Text style={{ color: t.accent1, fontSize: 12, fontWeight: '700' }}>Resend code</Text>
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>Set a new password</Text>
            <Field label="New password" value={newPwd} onChange={setNewPwd} icon="shield" secure placeholder="At least 8 characters" />
            <Field label="Confirm password" value={confirmPwd} onChange={setConfirmPwd} icon="shield" secure />
            <BuyBtn full onPress={finalize} style={{ height: 50, marginTop: 6 }}>
              {busy ? <ActivityIndicator color="#04210f" /> : 'Update password'}
            </BuyBtn>
          </>
        )}
      </View>
    </Modal>
  );
}

// ── Field helper ───────────────────────────────────────────────────────────
function Field({
  label, value, onChange, icon, secure, autoCap = 'sentences', keyboard, placeholder, onSubmitEditing, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void; icon: string;
  secure?: boolean; placeholder?: string;
  autoCap?: 'none' | 'words' | 'sentences';
  keyboard?: 'default' | 'email-address' | 'number-pad';
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11.5, fontWeight: '800', color: t.textDim, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface2, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          autoCapitalize={autoCap}
          keyboardType={keyboard}
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={t.textDim}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          returnKeyType="next"
          style={{ flex: 1, color: t.text, fontSize: 15 }}
        />
      </View>
    </View>
  );
}

function btn(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
