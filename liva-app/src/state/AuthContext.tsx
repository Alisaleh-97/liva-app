// Auth state — supports email/password sign-up + sign-in stored locally in
// AsyncStorage, plus "demo" Apple/Google buttons that simulate SSO for the
// preview. Swap simulateSSO with real expo-auth-session calls when you have
// OAuth client IDs.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { load, save } from '@/lib/storage';
import { registerForPushNotifications } from '@/lib/notifications';
import { passwordIssues, normalizePhone } from '@/lib/password';
import {
  apiRegister, apiLogin, apiMe, apiRequestPasswordReset, apiResetPassword,
  apiOAuthStart, apiOAuthComplete, apiDemoSignIn,
  ApiError, AuthUser, OAuthStartResponse,
} from '@/lib/api';
import { setSecure, getSecure, deleteSecure, SECURE_KEYS } from '@/lib/secureStorage';
import { track, identify, resetAnalytics } from '@/lib/analytics';
import { setErrorUser } from '@/lib/errorReporting';

const USER_KEY = '@liva/auth/currentUser';
const ACCOUNTS_KEY = '@liva/auth/accounts'; // local email/password store (DEMO ONLY)
const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true'
  || (typeof __DEV__ !== 'undefined' && __DEV__ && process.env.EXPO_PUBLIC_DEMO_MODE !== 'false');

export type AuthProvider = 'email' | 'google' | 'apple';
export type UserRole = 'shopper' | 'business';
export type Plan = 'starter' | 'growth' | 'pro';
export type Billing = 'monthly' | 'yearly';

export interface User {
  id: string;
  // Personal — firstName/lastName are required for new accounts but legacy
  // accounts created before the registration overhaul may only have `name`.
  firstName?: string;
  lastName?: string;
  name: string; // always populated
  email: string;
  phone?: string;
  country?: string;
  dob?: string;
  provider: AuthProvider;
  avatarSeed: string;
  role: UserRole;
  // Business
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
  taxId?: string;
  plan?: Plan;
  billing?: Billing;
  planRenewsAt?: number;
  cardLast4?: string;
  planPaymentId?: string;
  verified?: boolean;
  createdAt: number;
}

export interface RegistrationData {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  dob?: string;
  // business only
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
  taxId?: string;
  plan?: Plan;
  billing?: Billing;
  cardLast4?: string;
  planPaymentId?: string;
  provider?: AuthProvider; // 'email' default; 'google'|'apple' from SSO path
  oauthRegistrationToken?: string;
}

interface StoredAccount extends User {
  // for demo email accounts we store a base64'd password — NOT real hashing.
  // Real auth would route through the backend.
  passwordDemo?: string;
}

interface AuthCtx {
  user: User | null;
  hydrated: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  /** Returns the stored public profile for an email (no password match) — used
   *  in the 2-step Sign-In to show "Welcome back, [Name]" before asking for
   *  the password. Returns null if no account exists. */
  lookupAccount: (email: string) => Promise<Pick<User, 'firstName' | 'lastName' | 'name' | 'email' | 'avatarSeed' | 'role' | 'businessName' | 'provider'> | null>;
  /** Demo password reset: emits a 6-digit code that the user enters back.
   *  In production this would go through a real email service. */
  requestPasswordReset: (email: string) => Promise<{ codeForDemo?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  /** Full multi-step registration. */
  register: (data: RegistrationData) => Promise<void>;
  signInWithProvider: (p: 'google' | 'apple', role?: UserRole) => Promise<void>;
  beginProviderAuth: (p: 'google' | 'apple', credential: string, names?: { firstName?: string; lastName?: string }) => Promise<OAuthStartResponse>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'firstName' | 'lastName' | 'name' | 'avatarSeed' | 'businessName' | 'businessCategory' | 'verified' | 'plan' | 'billing'>>) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function rid() { return 'u' + Date.now() + Math.random().toString(36).slice(2, 6); }
function emailValid(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function timeValue(value: string | number | undefined, fallback?: number): number | undefined {
  if (typeof value === 'number') return value;
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function serverProfile(srv: AuthUser, cached?: Partial<User>): User {
  return {
    ...(cached || {}),
    id: srv.id,
    email: srv.email,
    firstName: srv.firstName,
    lastName: srv.lastName,
    name: cached?.name || `${srv.firstName} ${srv.lastName}`.trim(),
    phone: srv.phone,
    country: srv.country || cached?.country,
    dob: srv.dob || cached?.dob,
    role: srv.role,
    provider: srv.provider,
    avatarSeed: cached?.avatarSeed || `user-${srv.email}`,
    businessName: srv.businessName || cached?.businessName,
    businessCategory: srv.businessCategory || cached?.businessCategory,
    businessAddress: srv.businessAddress || cached?.businessAddress,
    taxId: srv.taxId || cached?.taxId,
    plan: srv.plan || cached?.plan,
    billing: srv.billing || cached?.billing,
    planRenewsAt: timeValue(srv.planRenewsAt) ?? cached?.planRenewsAt,
    verified: srv.verified ?? cached?.verified ?? false,
    createdAt: timeValue(srv.createdAt, Date.now())!,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const localResetCodes = useRef(new Map<string, { code: string; expiresAt: number }>());

  useEffect(() => {
    (async () => {
      // Prefer the local cached user for instant startup, then refresh from
      // the backend in the background if we have a stored token. If /me
      // succeeds we merge the server truth; if it fails we keep local state
      // (either the server is offline or the token expired — either way
      // the user can keep browsing until they try a protected action).
      const cached = await load<User | null>(USER_KEY, null);
      setUser(cached);
      setHydrated(true);

      const token = await getSecure(SECURE_KEYS.authToken);
      if (token) {
        try {
          const { user: srv } = await apiMe(token);
          const merged = serverProfile(srv, cached || undefined);
          setUser(merged);
          await save(USER_KEY, merged);
        } catch (error) {
          // Delete only a token the server explicitly rejected. A temporary
          // network outage must not sign the user out or destroy credentials.
          if (error instanceof ApiError && error.status === 401) {
            await deleteSecure(SECURE_KEYS.authToken).catch(() => {});
          }
        }
      } else if (cached && cached.provider !== 'email' && DEMO_MODE) {
        // Upgrade demo identities created by older builds to a real local JWT
        // so auctions, chat and checkout work immediately after hot reload.
        try {
          const response = await apiDemoSignIn(cached.provider, cached.role || 'shopper');
          await setSecure(SECURE_KEYS.authToken, response.token);
          const upgraded = serverProfile(response.user, cached);
          setUser(upgraded);
          await save(USER_KEY, upgraded);
        } catch {
          // Keep the offline demo profile until the local server is reachable.
        }
      }
    })();
  }, []);

  // Once a user is signed in, fire-and-forget register a push token. Safe on web
  // (no-ops there) and on native it routes through Expo's push relay.
  useEffect(() => {
    if (user) registerForPushNotifications().catch(() => {});
  }, [user?.id]);

  const persist = useCallback(async (u: User | null) => {
    setUser(u);
    await save(USER_KEY, u);
  }, []);

  const register = useCallback(async (d: RegistrationData) => {
    if (!d.firstName?.trim()) throw new Error('First name is required.');
    if (!d.lastName?.trim()) throw new Error('Last name is required.');
    if (!emailValid(d.email)) throw new Error('That email looks invalid.');

    // OAuth identities have already been cryptographically verified by the
    // server and do not create a password. Email accounts still require one.
    if (!d.oauthRegistrationToken) {
      const issues = passwordIssues(d.password);
      if (issues.length > 0) {
        throw new Error('Password must include: ' + issues.map((i) => i.label.toLowerCase()).join(', ') + '.');
      }
    }

    if (!d.phone?.trim()) throw new Error('Phone number is required.');
    const phoneNorm = normalizePhone(d.phone);
    if (phoneNorm.replace('+', '').length < 7) throw new Error('Phone number looks too short.');

    if (!d.country?.trim()) throw new Error('Please choose your country.');
    if (d.role === 'business') {
      if (!d.businessName?.trim()) throw new Error('Business name is required.');
      if (!d.businessCategory?.trim()) throw new Error('Business category is required.');
      if (!d.businessAddress?.trim()) throw new Error('Business address is required.');
      if (!d.plan) throw new Error('Choose a plan.');
      if (!d.planPaymentId) throw new Error('Complete the secure plan payment first.');
    }
    const accounts = await load<StoredAccount[]>(ACCOUNTS_KEY, []);
    if (accounts.some((a) => a.email.toLowerCase() === d.email.toLowerCase())) {
      throw new Error('An account with this email already exists. Sign in instead, or use a different email.');
    }
    // Phone uniqueness — one phone, one account (across all providers).
    if (accounts.some((a) => normalizePhone(a.phone || '') === phoneNorm)) {
      throw new Error('This phone number is already linked to another account.');
    }

    // Try the real backend first — if it succeeds the server is authoritative
    // (bcrypt-hashed password + JWT). If the server is unreachable we fall
    // back to the local demo store so the app still works offline.
    let srv: AuthUser | null = null;
    if (d.oauthRegistrationToken) {
      const response = await apiOAuthComplete({
        registrationToken: d.oauthRegistrationToken,
        firstName: d.firstName,
        lastName: d.lastName,
        phone: phoneNorm,
        country: d.country,
        dob: d.dob,
        role: d.role,
        businessName: d.businessName,
        businessCategory: d.businessCategory,
        businessAddress: d.businessAddress,
        taxId: d.taxId,
        plan: d.plan,
        billing: d.billing,
        planPaymentId: d.planPaymentId,
      });
      srv = response.user;
      await setSecure(SECURE_KEYS.authToken, response.token);
    } else if ((d.provider || 'email') === 'email') {
      try {
        const response = await apiRegister({
          email: d.email,
          password: d.password,
          firstName: d.firstName,
          lastName: d.lastName,
          phone: phoneNorm,
          country: d.country,
          dob: d.dob,
          role: d.role,
          provider: 'email',
          businessName: d.businessName,
          businessCategory: d.businessCategory,
          businessAddress: d.businessAddress,
          taxId: d.taxId,
          plan: d.plan,
          billing: d.billing,
          planPaymentId: d.planPaymentId,
        });
        srv = response.user;
        await setSecure(SECURE_KEYS.authToken, response.token);
      } catch (err: any) {
        const msg = String(err?.message || '');
        // Surface real duplicate/validation errors from the server; only
        // swallow network / offline failures so the local demo path runs.
        const isNetwork = /network|fetch|failed to fetch|timeout/i.test(msg);
        if (!isNetwork || !DEMO_MODE) throw err;
      }
    }
    const fullName = `${d.firstName.trim()} ${d.lastName.trim()}`;
    const newAcc: StoredAccount = {
      id: srv?.id || rid(),
      firstName: d.firstName.trim(),
      lastName: d.lastName.trim(),
      name: fullName,
      email: d.email.trim().toLowerCase(),
      phone: phoneNorm,
      country: d.country,
      dob: d.dob,
      provider: d.provider || 'email',
      avatarSeed: 'user-' + d.email.toLowerCase(),
      role: d.role,
      businessName: d.businessName?.trim(),
      businessCategory: d.businessCategory,
      businessAddress: d.businessAddress?.trim(),
      taxId: d.taxId?.trim(),
      plan: d.plan,
      billing: d.billing,
      cardLast4: d.cardLast4,
      planRenewsAt: d.plan ? Date.now() + (d.billing === 'yearly' ? 365 : 30) * 24 * 3600 * 1000 : undefined,
      verified: false,
      createdAt: srv ? timeValue(srv.createdAt, Date.now())! : Date.now(),
      // Never copy a real server password into local storage. The base64
      // fallback exists only for an explicitly enabled development preview.
      passwordDemo: !srv && DEMO_MODE
        ? (typeof btoa !== 'undefined' ? btoa(d.password) : d.password)
        : undefined,
    };
    await save(ACCOUNTS_KEY, [...accounts, newAcc]);
    const { passwordDemo, ...pub } = newAcc;
    await persist(pub);
    // Analytics + error-reporting identity
    identify(pub.id, { email: pub.email, role: pub.role });
    setErrorUser({ id: pub.id, email: pub.email });
    track('sign_up', { role: pub.role, provider: pub.provider });
  }, [persist]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!emailValid(email)) throw new Error('That email looks invalid.');
    // Try backend first — real bcrypt check + JWT
    try {
      const { token, user: srv } = await apiLogin(email, password);
      await setSecure(SECURE_KEYS.authToken, token);
      // Merge with any existing local profile fields (avatar seed, country, etc.)
      const accounts = await load<StoredAccount[]>(ACCOUNTS_KEY, []);
      const cached = accounts.find((a) => a.email.toLowerCase() === srv.email);
      const pub = serverProfile(srv, cached);
      await persist(pub);
      identify(pub.id, { email: pub.email, role: pub.role });
      setErrorUser({ id: pub.id, email: pub.email });
      track('sign_in', { provider: 'email' });
      return;
    } catch (err: any) {
      const msg = String(err?.message || '');
      const isNetwork = /network|fetch|failed to fetch|timeout/i.test(msg);
      // Real credential error from the server → surface it directly.
      if (!isNetwork || !DEMO_MODE) throw err;
      // Otherwise fall through to the local demo store below.
    }

    // Local fallback — for offline demo usage only.
    const accounts = await load<StoredAccount[]>(ACCOUNTS_KEY, []);
    const acc = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.provider === 'email');
    if (!acc) throw new Error('No account found for that email.');
    const expected = typeof btoa !== 'undefined' ? btoa(password) : password;
    if (acc.passwordDemo !== expected) throw new Error('Incorrect password.');
    const { passwordDemo, ...pub } = acc;
    // Backfill role for legacy accounts pre-dating the role field — spread
    // pub first so its explicit role wins when present, else default.
    await persist({ ...pub, role: pub.role ?? 'shopper' });
  }, [persist]);

  const lookupAccount = useCallback(async (email: string) => {
    if (!emailValid(email)) return null;
    const accounts = await load<StoredAccount[]>(ACCOUNTS_KEY, []);
    const acc = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!acc) return null;
    return {
      firstName: acc.firstName,
      lastName: acc.lastName,
      name: acc.name,
      email: acc.email,
      avatarSeed: acc.avatarSeed,
      role: acc.role,
      businessName: acc.businessName,
      provider: acc.provider,
    };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!emailValid(email)) throw new Error('Enter a valid email.');
    try {
      const response = await apiRequestPasswordReset(email.trim().toLowerCase());
      return { codeForDemo: response.devCode };
    } catch (error: any) {
      const msg = String(error?.message || '');
      const isNetwork = /network|fetch|failed to fetch|timeout/i.test(msg);
      if (!isNetwork || !DEMO_MODE) throw error;
    }

    const accounts = await load<StoredAccount[]>(ACCOUNTS_KEY, []);
    const acc = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.provider === 'email');
    if (!acc) throw new Error('No account found for that email.');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    localResetCodes.current.set(email.trim().toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    return { codeForDemo: code };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    if (!emailValid(email)) throw new Error('Enter a valid email.');
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit code.');
    const issues = passwordIssues(newPassword);
    if (issues.length) throw new Error('Password must include: ' + issues.map((i) => i.label.toLowerCase()).join(', ') + '.');
    try {
      await apiResetPassword(email.trim().toLowerCase(), code, newPassword);
      return;
    } catch (error: any) {
      const msg = String(error?.message || '');
      const isNetwork = /network|fetch|failed to fetch|timeout/i.test(msg);
      if (!isNetwork || !DEMO_MODE) throw error;
    }

    const pending = localResetCodes.current.get(email.trim().toLowerCase());
    if (!pending || pending.expiresAt < Date.now() || pending.code !== code) {
      throw new Error('The code is invalid or expired.');
    }
    const accounts = await load<StoredAccount[]>(ACCOUNTS_KEY, []);
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === email.toLowerCase() && a.provider === 'email');
    if (idx < 0) throw new Error('Account not found.');
    accounts[idx] = {
      ...accounts[idx],
      passwordDemo: typeof btoa !== 'undefined' ? btoa(newPassword) : newPassword,
    };
    await save(ACCOUNTS_KEY, accounts);
    localResetCodes.current.delete(email.trim().toLowerCase());
  }, []);

  const beginProviderAuth = useCallback(async (
    p: 'google' | 'apple',
    credential: string,
    names?: { firstName?: string; lastName?: string },
  ) => {
    const response = await apiOAuthStart(p, credential, names);
    if (!response.requiresRegistration && response.token && response.user) {
      await setSecure(SECURE_KEYS.authToken, response.token);
      const pub = serverProfile(response.user);
      await persist(pub);
      identify(pub.id, { email: pub.email, role: pub.role });
      setErrorUser({ id: pub.id, email: pub.email });
      track('sign_in', { provider: p });
    }
    return response;
  }, [persist]);

  const signInWithProvider = useCallback(async (p: 'google' | 'apple', role: UserRole = 'shopper') => {
    if (!DEMO_MODE) throw new Error(`${p === 'google' ? 'Google' : 'Apple'} sign-in is not configured on this build.`);
    try {
      const response = await apiDemoSignIn(p, role);
      await setSecure(SECURE_KEYS.authToken, response.token);
      const pub = serverProfile(response.user);
      await persist(pub);
      identify(pub.id, { email: pub.email, role: pub.role });
      setErrorUser({ id: pub.id, email: pub.email });
      track('sign_in', { provider: p });
      return;
    } catch (error: any) {
      const isNetwork = /network|fetch|failed to fetch|timeout/i.test(String(error?.message || ''));
      if (!isNetwork) throw error;
    }

    // Offline-only preview fallback. Protected features remain unavailable
    // until the development server is reachable again.
    const profile = p === 'google'
      ? { name: 'Ava Garcia', email: 'demo-shopper-google@liva.local' }
      : { name: 'Ava Apple', email: 'demo-shopper-apple@liva.local' };
    const [firstName, ...rest] = profile.name.split(' ');
    await persist({
      id: rid(), firstName, lastName: rest.join(' '), name: profile.name,
      email: profile.email, provider: p, avatarSeed: `${p}-${profile.email}`,
      role, verified: false, createdAt: Date.now(),
    });
  }, [persist]);

  const switchRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    await persist({ ...user, role });
  }, [persist, user]);

  const signOut = useCallback(async () => {
    // Clear both the JWT and the cached user profile — a fresh sign-in will
    // hit the backend again.
    await deleteSecure(SECURE_KEYS.authToken).catch(() => {});
    await persist(null);
    setErrorUser(null);
    resetAnalytics();
  }, [persist]);

  const updateProfile = useCallback(async (patch: Partial<Pick<User, 'firstName' | 'lastName' | 'name' | 'avatarSeed' | 'businessName' | 'businessCategory' | 'verified' | 'plan' | 'billing'>>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    await persist(next);
  }, [persist, user]);

  return (
    <Ctx.Provider value={{ user, hydrated, signInEmail, lookupAccount, requestPasswordReset, resetPassword, register, signInWithProvider, beginProviderAuth, signOut, updateProfile, switchRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
