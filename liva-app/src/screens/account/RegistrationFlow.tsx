// Multi-step registration. Shopper path: role → personal → done.
// Business path: role → personal → business → plan → payment → done.
//
// State lives at the top; each step is a sub-component that receives the
// current draft + a setter + back/next callbacks. We keep one file so the
// step transitions and validation are easy to reason about.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { LivaLogo } from '@/components/LivaLogo';
import { BuyBtn } from '@/components/BuyBtn';
import { Badge } from '@/components/Badge';
import { AppleLogo, GoogleLogo } from '@/components/BrandIcon';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth, RegistrationData, UserRole, Plan, Billing } from '@/state/AuthContext';
import { PLANS, planById, effectiveMonthly, chargedToday, COUNTRIES, BUSINESS_CATEGORIES } from '@/data/plans';
import { useGoogleAuth, signInWithAppleNative, googleConfigured, appleConfigured } from '@/lib/oauth';
import { passwordIssues, passwordStrength, normalizePhone } from '@/lib/password';
import { payBusinessPlan } from '@/lib/payments';
import { t as tr, price, isRTL } from '@/i18n';

type Draft = Partial<RegistrationData> & {
  passwordConfirm?: string;
  termsOk?: boolean;
};

export function RegistrationFlow({ onWantSignIn }: { onWantSignIn: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { register, signInWithProvider, beginProviderAuth } = useAuth();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    role: 'shopper',
    billing: 'monthly',
    plan: 'growth',
  });
  const [busy, setBusy] = useState(false);
  const google = useGoogleAuth();
  const handledGoogleToken = useRef<string | null>(null);

  async function handleVerifiedProvider(
    provider: 'google' | 'apple',
    credential: string,
    names?: { firstName?: string; lastName?: string },
  ) {
    const result = await beginProviderAuth(provider, credential, names);
    if (!result.requiresRegistration) return;
    if (!result.registrationToken || !result.profile?.email) throw new Error('The provider profile could not be prepared.');
    setDraft((current) => ({
      ...current,
      provider,
      oauthRegistrationToken: result.registrationToken,
      email: result.profile!.email,
      firstName: result.profile!.firstName || names?.firstName || '',
      lastName: result.profile!.lastName || names?.lastName || '',
      password: '',
      passwordConfirm: '',
    }));
    setStep(1);
  }

  // The access token is verified by the Express backend before an account is
  // resumed or the remaining profile fields are requested.
  useEffect(() => {
    if (google.response?.type === 'success') {
      const accessToken = (google.response as any).authentication?.accessToken;
      if (accessToken && handledGoogleToken.current !== accessToken) {
        handledGoogleToken.current = accessToken;
        setBusy(true);
        handleVerifiedProvider('google', accessToken)
          .catch((e) => Alert.alert('Sign-up', String(e?.message || e)))
          .finally(() => setBusy(false));
      }
    }
  }, [google.response]);

  // Total steps depends on role. Shopper: pick → personal → done = 3.
  // Business: pick → personal → biz → plan → payment → done = 6.
  const isBiz = draft.role === 'business';
  const totalSteps = isBiz ? 6 : 3;

  function update(patch: Partial<Draft>) { setDraft((d) => ({ ...d, ...patch })); }
  function next() { setStep((s) => Math.min(s + 1, totalSteps - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function finalize() {
    try {
      setBusy(true);
      const data: RegistrationData = {
        role: draft.role!,
        firstName: draft.firstName!,
        lastName: draft.lastName!,
        email: draft.email!,
        password: draft.password || '',
        phone: draft.phone!,
        country: draft.country!,
        dob: draft.dob,
        businessName: draft.businessName,
        businessCategory: draft.businessCategory,
        businessAddress: draft.businessAddress,
        taxId: draft.taxId,
        plan: isBiz ? draft.plan : undefined,
        billing: isBiz ? draft.billing : undefined,
        cardLast4: isBiz ? draft.cardLast4 : undefined,
        planPaymentId: isBiz ? draft.planPaymentId : undefined,
        provider: draft.provider || 'email',
        oauthRegistrationToken: draft.oauthRegistrationToken,
      };
      await register(data);
      // user is now set on context → parent's auth gate will unmount this screen
    } catch (e: any) {
      Alert.alert('Registration', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function ssoSignUp(provider: 'google' | 'apple') {
    try {
      setBusy(true);
      if (provider === 'google' && google.ready) {
        await google.promptGoogle();
        // Resolution handled by the useEffect above (response will fire)
        return;
      }
      if (provider === 'apple' && appleConfigured) {
        const apple = await signInWithAppleNative();
        if (apple?.identityToken) {
          await handleVerifiedProvider('apple', apple.identityToken, {
            firstName: apple.firstName,
            lastName: apple.lastName,
          });
          return;
        }
      }
      // Fallback to demo flow (still useful for previewing without OAuth setup)
      await signInWithProvider(provider, draft.role || 'shopper');
    } catch (e: any) {
      Alert.alert('Sign-up', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <Header step={step} totalSteps={totalSteps} onBack={step > 0 ? back : undefined} onSignIn={onWantSignIn} />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 40 }}>
        {step === 0 && <StepRolePick draft={draft} update={update} onNext={next} onSSO={ssoSignUp} busy={busy} />}
        {step === 1 && <StepPersonal draft={draft} update={update} onNext={next} />}
        {step === 2 && isBiz && <StepBusiness draft={draft} update={update} onNext={next} />}
        {step === 2 && !isBiz && <StepDone draft={draft} onFinish={finalize} busy={busy} />}
        {step === 3 && <StepPlan draft={draft} update={update} onNext={next} />}
        {step === 4 && <StepPayment draft={draft} update={update} onNext={next} />}
        {step === 5 && <StepDone draft={draft} onFinish={finalize} busy={busy} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Shared header ───────────────────────────────────────────────────────────
function Header({
  step, totalSteps, onBack, onSignIn,
}: { step: number; totalSteps: number; onBack?: () => void; onSignIn: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        {onBack ? (
          <Pressable onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
            <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
          </Pressable>
        ) : (
          <LivaLogo size={30} showWordmark liveDot={false} />
        )}
        <Text style={{ fontSize: 12, color: t.textDim, fontWeight: '700' }}>{tr('step')} {step + 1} {tr('of')} {totalSteps}</Text>
        <Pressable onPress={onSignIn}>
          <Text style={{ color: t.accent1, fontSize: 13, fontWeight: '700' }}>{tr('signIn')}</Text>
        </Pressable>
      </View>
      {/* Progress dashes */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= step ? t.accent1 : t.surface2 }} />
        ))}
      </View>
    </View>
  );
}

// ── Step 0: role pick ───────────────────────────────────────────────────────
function StepRolePick({
  draft, update, onNext, onSSO, busy,
}: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void; onSSO: (p: 'google' | 'apple') => void; busy: boolean }) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>{tr('regHeader')}</Text>
      <Text style={{ fontSize: 14, color: t.textDim, marginTop: 6, marginBottom: 22, lineHeight: 20 }}>{tr('regSub')}</Text>

      <Text style={lbl(t)}>{tr('pickAccountType')}</Text>
      <View style={{ gap: 10, marginBottom: 22 }}>
        <RoleCard
          active={draft.role === 'shopper'}
          icon="cart"
          title={tr('typeShopper')}
          sub={tr('typeShopperD')}
          pill="FREE"
          pillColor="#22C55E"
          onPress={() => update({ role: 'shopper' })}
        />
        <RoleCard
          active={draft.role === 'business'}
          icon="shop"
          title={tr('typeBusiness')}
          sub={tr('typeBusinessD')}
          pill="FROM $19/MO"
          pillColor={t.accent1}
          onPress={() => update({ role: 'business' })}
        />
      </View>

      <BuyBtn full onPress={onNext} style={{ height: 52, marginBottom: 20 }}>
        {tr('continueBtn')}
      </BuyBtn>

      {/* SSO short-cut */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
        <Text style={{ fontSize: 11, color: t.textDim, fontWeight: '700' }}>{tr('orRegisterWith')}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Pressable
          disabled={busy}
          onPress={() => onSSO('apple')}
          style={{ flex: 1, height: 48, borderRadius: t.radius, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <AppleLogo size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Apple</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => onSSO('google')}
          style={{ flex: 1, height: 48, borderRadius: t.radius, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: t.border }}
        >
          {busy ? <ActivityIndicator color="#333" /> : <GoogleLogo size={18} />}
          <Text style={{ color: '#1f1f1f', fontSize: 13, fontWeight: '700' }}>Google</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RoleCard({
  active, icon, title, sub, pill, pillColor, onPress,
}: { active: boolean; icon: string; title: string; sub: string; pill: string; pillColor: string; onPress: () => void }) {
  const { t } = useTheme();
  const inner = (
    <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: active ? 'rgba(139,92,246,0.25)' : t.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={active ? t.accent1 : t.textDim} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: t.text }}>{title}</Text>
          <View style={{ backgroundColor: pillColor, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#fff', letterSpacing: 0.4 }}>{pill}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12.5, color: t.textDim }}>{sub}</Text>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: active ? t.accent1 : t.border, alignItems: 'center', justifyContent: 'center' }}>
        {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent1 }} />}
      </View>
    </View>
  );
  if (active) {
    return (
      <Pressable onPress={onPress} style={{ borderRadius: t.radius, overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(139,92,246,0.22)', 'rgba(236,72,153,0.12)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderWidth: 1.5, borderColor: t.accent1, borderRadius: t.radius }}>
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
      {inner}
    </Pressable>
  );
}

// ── Step 1: personal info ───────────────────────────────────────────────────
function StepPersonal({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  const { t } = useTheme();
  const [countryOpen, setCountryOpen] = useState(false);
  const oauth = !!draft.oauthRegistrationToken;

  function validate(): string | null {
    if (!draft.firstName?.trim()) return tr('firstName') + ' required';
    if (!draft.lastName?.trim()) return tr('lastName') + ' required';
    if (!draft.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) return 'Invalid email';
    if (!oauth) {
      const pwIssues = passwordIssues(draft.password || '');
      if (pwIssues.length > 0) return 'Password needs: ' + pwIssues.map((i) => i.label.toLowerCase()).join(', ');
      if (draft.password !== draft.passwordConfirm) return tr('passwordsDontMatch');
    }
    const phoneDigits = normalizePhone(draft.phone || '').replace('+', '');
    if (phoneDigits.length < 7) return 'Phone number looks too short';
    if (!draft.country) return 'Country required';
    if (!draft.termsOk) return tr('mustAcceptTerms');
    return null;
  }

  const strength = passwordStrength(draft.password || '');
  const pwIssues = passwordIssues(draft.password || '');

  function go() {
    const err = validate();
    if (err) return Alert.alert('Check fields', err);
    onNext();
  }

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: t.text }}>{tr('personalInfo')}</Text>
      <Text style={{ fontSize: 13, color: t.textDim, marginTop: 6, marginBottom: 20, lineHeight: 19 }}>{tr('personalSub')}</Text>

      {oauth && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 15, marginBottom: 16, backgroundColor: 'rgba(45,226,166,0.11)', borderWidth: 1, borderColor: 'rgba(45,226,166,0.28)' }}>
          <Icon name="check" size={17} color={t.buy} stroke={2.6} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '800' }}>{draft.provider === 'apple' ? 'Apple' : 'Google'} identity verified</Text>
            <Text style={{ color: t.textDim, fontSize: 11, marginTop: 2 }}>Complete your phone and country. No LIVA password is needed.</Text>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label={tr('firstName')} value={draft.firstName} onChange={(v) => update({ firstName: v })} icon="users" autoCap="words" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={tr('lastName')} value={draft.lastName} onChange={(v) => update({ lastName: v })} icon="users" autoCap="words" />
        </View>
      </View>
      <Field label={tr('emailField')} value={draft.email} onChange={(v) => update({ email: v })} icon="bell" autoCap="none" keyboard="email-address" editable={!oauth} />
      {!oauth && (
        <>
          <Field label={tr('passwordField')} value={draft.password} onChange={(v) => update({ password: v })} icon="shield" secure placeholder={tr('passwordHint')} />

          {/* Password strength meter — appears once user starts typing */}
          {(draft.password?.length ?? 0) > 0 && (
        <View style={{ marginTop: -8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= strength.score ? strength.color : t.surface2 }} />
            ))}
          </View>
          <Text style={{ fontSize: 11.5, color: strength.color, fontWeight: '800', marginBottom: pwIssues.length > 0 ? 6 : 0 }}>
            {strength.label}
          </Text>
          {pwIssues.length > 0 && (
            <View style={{ gap: 3 }}>
              {pwIssues.map((i) => (
                <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: t.textDim }} />
                  <Text style={{ fontSize: 11, color: t.textDim }}>{i.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
          )}

          <Field label={tr('confirmPassword')} value={draft.passwordConfirm} onChange={(v) => update({ passwordConfirm: v })} icon="shield" secure />
          {(draft.passwordConfirm?.length ?? 0) > 0 && draft.password !== draft.passwordConfirm && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 12 }}>
          <Icon name="close" size={12} color={t.live} stroke={2.5} />
          <Text style={{ fontSize: 11.5, color: t.live, fontWeight: '700' }}>Passwords don't match</Text>
        </View>
          )}
        </>
      )}
      <Field label={tr('phoneField')} value={draft.phone} onChange={(v) => update({ phone: v })} icon="headset" keyboard="phone-pad" placeholder={tr('phoneHint')} />

      <View style={{ marginBottom: 14 }}>
        <Text style={lbl(t)}>{tr('countryField')}</Text>
        <Pressable
          onPress={() => setCountryOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}
        >
          <Icon name="globe" size={18} color={t.textDim} />
          <Text style={{ flex: 1, color: draft.country ? t.text : t.textDim, fontSize: 15 }}>
            {draft.country ? tr(COUNTRIES.find((c) => c.code === draft.country)?.key || 'countryOther') : tr('pickCountry')}
          </Text>
          <Icon name="chevD" size={16} color={t.textDim} />
        </Pressable>
      </View>

      <Field label={tr('dobField')} value={draft.dob} onChange={(v) => update({ dob: v })} icon="clock" placeholder={tr('dobHint')} keyboard="numbers-and-punctuation" />

      <Pressable
        onPress={() => update({ termsOk: !draft.termsOk })}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4, marginBottom: 20 }}
      >
        <View style={{
          width: 22, height: 22, borderRadius: 6,
          borderWidth: 2, borderColor: draft.termsOk ? t.accent1 : t.border,
          backgroundColor: draft.termsOk ? t.accent1 : 'transparent',
          alignItems: 'center', justifyContent: 'center', marginTop: 1,
        }}>
          {draft.termsOk && <Icon name="check" size={14} color="#fff" stroke={3} />}
        </View>
        <Text style={{ flex: 1, fontSize: 12.5, color: t.textDim, lineHeight: 17 }}>
          {tr('iAgree')} <Text style={{ color: t.accent1, fontWeight: '700' }}>{tr('terms')}</Text> {tr('and')} <Text style={{ color: t.accent1, fontWeight: '700' }}>{tr('privacyPolicy')}</Text>.
        </Text>
      </Pressable>

      <BuyBtn full onPress={go} style={{ height: 52 }}>{tr('continueBtn')}</BuyBtn>

      <CountryPicker
        open={countryOpen}
        onClose={() => setCountryOpen(false)}
        onPick={(code) => { update({ country: code }); setCountryOpen(false); }}
      />
    </View>
  );
}

function CountryPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (code: string) => void }) {
  const { t } = useTheme();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 36, maxHeight: '70%' }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 14 }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.text, marginBottom: 12 }}>{tr('pickCountry')}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => onPick(c.code)}
              style={{ paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={{ fontSize: 15, color: t.text }}>{tr(c.key)}</Text>
              <Text style={{ fontSize: 12, color: t.textDim, fontWeight: '600' }}>{c.code}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Step 2 (business): business info ────────────────────────────────────────
function StepBusiness({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  const { t } = useTheme();
  function go() {
    if (!draft.businessName?.trim()) return Alert.alert('Required', tr('bizName'));
    if (!draft.businessCategory) return Alert.alert('Required', tr('bizCat'));
    if (!draft.businessAddress?.trim()) return Alert.alert('Required', tr('bizAddress'));
    onNext();
  }
  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: t.text }}>{tr('businessInfo')}</Text>
      <Text style={{ fontSize: 13, color: t.textDim, marginTop: 6, marginBottom: 20, lineHeight: 19 }}>{tr('businessInfoSub')}</Text>

      <Field label={tr('bizName')} value={draft.businessName} onChange={(v) => update({ businessName: v })} icon="shop" placeholder={tr('bizNameHint')} autoCap="words" />

      <View style={{ marginBottom: 14 }}>
        <Text style={lbl(t)}>{tr('bizCat')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {BUSINESS_CATEGORIES.map((c) => {
            const active = draft.businessCategory === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => update({ businessCategory: c.id })}
                style={{
                  paddingHorizontal: 14, paddingVertical: 9,
                  borderRadius: 999, borderWidth: 1.5,
                  borderColor: active ? t.accent1 : t.border,
                  backgroundColor: active ? 'rgba(139,92,246,0.12)' : t.surface,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? t.accent1 : t.text }}>{tr(c.key)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ marginBottom: 14 }}>
        <Text style={lbl(t)}>{tr('bizAddress')}</Text>
        <TextInput
          value={draft.businessAddress}
          onChangeText={(v) => update({ businessAddress: v })}
          placeholder={tr('bizAddressHint')}
          placeholderTextColor={t.textDim}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, color: t.text, fontSize: 15, textAlignVertical: 'top' }}
        />
      </View>

      <Field label={tr('taxIdField')} value={draft.taxId} onChange={(v) => update({ taxId: v })} icon="ticket" />

      <BuyBtn full onPress={go} style={{ height: 52, marginTop: 6 }}>{tr('continueBtn')}</BuyBtn>
    </View>
  );
}

// ── Step 3 (business): plan picker ──────────────────────────────────────────
function StepPlan({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  const { t } = useTheme();
  const billing: Billing = draft.billing || 'monthly';

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: t.text }}>{tr('pickPlan')}</Text>
      <Text style={{ fontSize: 13, color: t.textDim, marginTop: 6, marginBottom: 18, lineHeight: 19 }}>{tr('pickPlanSub')}</Text>

      {/* Billing toggle */}
      <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.surface2, borderRadius: 999, padding: 3, marginBottom: 18 }}>
        {(['monthly', 'yearly'] as Billing[]).map((b) => {
          const active = billing === b;
          const lbl = b === 'monthly' ? tr('billingMonthly') : `${tr('billingYearly')} · ${tr('yearSave')}`;
          return (
            <Pressable key={b} onPress={() => update({ billing: b })} style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}>
              {active ? (
                <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{lbl}</Text>
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: t.textDim, fontSize: 13, fontWeight: '700' }}>{lbl}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Plan cards */}
      <View style={{ gap: 12 }}>
        {PLANS.map((p) => {
          const active = draft.plan === p.id;
          const monthlyEffective = effectiveMonthly(p, billing);
          return (
            <Pressable
              key={p.id}
              onPress={() => update({ plan: p.id })}
              style={{ borderRadius: t.radius, overflow: 'hidden' }}
            >
              {active ? (
                <LinearGradient colors={['rgba(139,92,246,0.22)', 'rgba(236,72,153,0.12)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, borderWidth: 1.5, borderColor: t.accent1, borderRadius: t.radius }}>
                  <PlanCardBody plan={p} monthlyEffective={monthlyEffective} billing={billing} active />
                </LinearGradient>
              ) : (
                <View style={{ padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
                  <PlanCardBody plan={p} monthlyEffective={monthlyEffective} billing={billing} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <BuyBtn full onPress={onNext} style={{ height: 52, marginTop: 18 }}>{tr('continueBtn')}</BuyBtn>
    </View>
  );
}

function PlanCardBody({
  plan, monthlyEffective, billing, active,
}: { plan: typeof PLANS[number]; monthlyEffective: number; billing: Billing; active?: boolean }) {
  const { t } = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr(plan.nameKey)}</Text>
        {plan.popular && <Badge kind="ai">{tr('mostPopular')}</Badge>}
      </View>
      <Text style={{ fontSize: 12.5, color: t.textDim, marginBottom: 12 }}>{tr(plan.descKey)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: t.text }}>{price(monthlyEffective, { dec: 0 })}</Text>
        <Text style={{ fontSize: 13, color: t.textDim }}>{tr('perMonthSuffix')}</Text>
        {billing === 'yearly' && (
          <Text style={{ fontSize: 11, color: t.accent1, fontWeight: '700', marginLeft: 6 }}>{tr('billedYearly')}</Text>
        )}
      </View>
      <View style={{ gap: 6 }}>
        {plan.featureKeys.map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Icon name="check" size={14} color={t.buy} stroke={2.5} />
            <Text style={{ flex: 1, fontSize: 12.5, color: t.text, lineHeight: 18 }}>{tr(k)}</Text>
          </View>
        ))}
      </View>
      {active && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(139,92,246,0.25)' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.accent1 }}>✓ {tr('selected')}</Text>
        </View>
      )}
    </View>
  );
}

// ── Step 4 (business): payment ──────────────────────────────────────────────
function StepPayment({ draft, update, onNext }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void }) {
  const { t } = useTheme();
  const [paying, setPaying] = useState(false);

  const plan = planById(draft.plan!);
  const billing: Billing = draft.billing || 'monthly';
  const total = chargedToday(plan, billing);

  async function go() {
    if (!draft.email || !draft.plan) return Alert.alert('Payment', 'Your email and plan are required.');
    setPaying(true);
    try {
      const result = await payBusinessPlan(draft.plan, billing, draft.email);
      update({
        planPaymentId: result.paymentIntentId,
        cardLast4: result.mock ? 'TEST' : 'Stripe',
      });
      onNext();
    } catch (error: any) {
      Alert.alert('Secure payment', String(error?.message || error));
    } finally {
      setPaying(false);
    }
  }

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: t.text }}>{tr('paymentTitle')}</Text>
      <Text style={{ fontSize: 13, color: t.textDim, marginTop: 6, marginBottom: 18, lineHeight: 19 }}>{tr('paymentSub')}</Text>

      {/* Order summary */}
      <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, marginBottom: 18 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{tr('orderSummary')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: t.text, fontSize: 14 }}>{tr('planLine')}: {tr(plan.nameKey)} ({billing === 'yearly' ? tr('billingYearly') : tr('billingMonthly')})</Text>
          <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>{price(total)}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: t.border, marginVertical: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '800' }}>{tr('totalLine')}</Text>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }}>{price(total)}</Text>
        </View>
      </View>

      <LinearGradient
        colors={['rgba(99,91,255,0.16)', 'rgba(25,198,230,0.08)']}
        style={{ borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(99,91,255,0.28)', marginBottom: 18 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(45,226,166,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={24} color={t.buy} stroke={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '900' }}>Secure Stripe checkout</Text>
            <Text style={{ color: t.textDim, fontSize: 11.5, lineHeight: 16, marginTop: 3 }}>Card details open in Stripe's protected payment sheet and are never stored by LIVA.</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 15 }}>
          {['Apple Pay', 'Google Pay', 'Cards'].map((method) => (
            <View key={method} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: t.surface }}>
              <Text style={{ color: t.text, fontSize: 10.5, fontWeight: '800' }}>{method}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <BuyBtn full onPress={go} disabled={paying} style={{ height: 52 }}>
        {paying ? <ActivityIndicator color="#06362A" /> : `${tr('payAndCreate')} · ${price(total)}`}
      </BuyBtn>
    </View>
  );
}

// ── Final step: review + finalize ──────────────────────────────────────────
function StepDone({ draft, onFinish, busy }: { draft: Draft; onFinish: () => void; busy: boolean }) {
  const { t } = useTheme();
  const isBiz = draft.role === 'business';
  const plan = isBiz && draft.plan ? planById(draft.plan) : null;

  return (
    <View style={{ paddingTop: 30, alignItems: 'center' }}>
      <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
        <Icon name="check" size={48} color="#fff" stroke={3} />
      </LinearGradient>
      <Text style={{ fontSize: 24, fontWeight: '800', color: t.text, textAlign: 'center', marginBottom: 8 }}>{tr('welcomeAboard')}</Text>
      <Text style={{ fontSize: 14, color: t.textDim, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>{tr('welcomeAboardSub')}</Text>

      <View style={{ width: '100%', padding: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, marginBottom: 20 }}>
        <Row label="Account" value={`${draft.firstName} ${draft.lastName}`} />
        <Row label="Email" value={draft.email || ''} />
        {isBiz && <Row label="Store" value={draft.businessName || ''} />}
        {plan && <Row label="Plan" value={`${tr(plan.nameKey)} · ${tr('activatedPlan')}`} highlight />}
        {draft.planPaymentId && <Row label="Payment" value={draft.cardLast4 === 'TEST' ? 'Local test approved' : 'Verified by Stripe'} />}
      </View>

      <BuyBtn full onPress={onFinish} style={{ height: 52 }}>
        {busy ? <ActivityIndicator color="#04210f" /> : (isBiz ? tr('startSelling') : tr('startShopping'))}
      </BuyBtn>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text style={{ fontSize: 12.5, color: t.textDim }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: highlight ? t.accent1 : t.text, maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

// ── Field helper ───────────────────────────────────────────────────────────
function lbl(t: any) {
  return { fontSize: 12, fontWeight: '700' as const, color: t.textDim, marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
}

function Field({
  label, value, onChange, icon, secure, placeholder, autoCap = 'sentences', keyboard, editable = true,
}: {
  label: string; value?: string; onChange: (v: string) => void; icon: string;
  secure?: boolean; placeholder?: string;
  editable?: boolean;
  autoCap?: 'none' | 'words' | 'sentences';
  keyboard?: 'default' | 'email-address' | 'number-pad' | 'phone-pad' | 'decimal-pad' | 'numbers-and-punctuation';
}) {
  const { t } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={lbl(t)}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput
          value={value || ''}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={t.textDim}
          secureTextEntry={secure}
          autoCapitalize={autoCap}
          keyboardType={keyboard}
          autoCorrect={false}
          editable={editable}
          style={{ flex: 1, color: editable ? t.text : t.textDim, fontSize: 15 }}
        />
      </View>
    </View>
  );
}
