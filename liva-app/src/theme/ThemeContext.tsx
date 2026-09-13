import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCENT_DEFAULT, tokens, ThemeMode, ThemeTokens } from './colors';
import { setLocale, Lang, Currency } from '@/i18n';

interface ThemeState {
  mode: ThemeMode;
  autoTheme: boolean;
  accent: [string, string];
  lang: Lang;
  ccy: Currency;
  radius: number;
}

interface ThemeCtx extends ThemeState {
  t: ThemeTokens;
  effectiveMode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  setAutoTheme: (v: boolean) => void;
  setLang: (l: Lang) => void;
  setCcy: (c: Currency) => void;
  setAccent: (a: [string, string]) => void;
}

const DEFAULTS: ThemeState = {
  mode: 'dark',
  autoTheme: false,
  accent: ACCENT_DEFAULT,
  lang: 'en',
  ccy: 'USD',
  radius: 22,
};

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = '@liva/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<ThemeState>(DEFAULTS);

  // hydrate from AsyncStorage once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<ThemeState>;
          // One-time palette migration: users who never selected a custom
          // accent should receive the new Pulse identity automatically.
          const wasLegacyDefault = stored.accent?.[0] === '#FF2442' && stored.accent?.[1] === '#FF7A00';
          setS({ ...DEFAULTS, ...stored, accent: wasLegacyDefault ? ACCENT_DEFAULT : (stored.accent || ACCENT_DEFAULT) });
        }
      } catch {
        // ignore — first run
      }
    })();
  }, []);

  // persist + propagate language to i18n module
  useEffect(() => {
    setLocale(s.lang, s.ccy);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});
  }, [s]);

  // When autoTheme is on, follow the system color scheme; otherwise use the
  // user's explicit choice.
  const system = useColorScheme();
  const effectiveMode: ThemeMode = s.autoTheme ? (system === 'light' ? 'light' : 'dark') : s.mode;
  const t = useMemo(() => tokens(effectiveMode, s.accent, s.radius), [effectiveMode, s.accent, s.radius]);

  const value: ThemeCtx = {
    ...s,
    t,
    effectiveMode,
    setMode: (mode) => setS((p) => ({ ...p, mode, autoTheme: false })),
    setAutoTheme: (autoTheme) => setS((p) => ({ ...p, autoTheme })),
    setLang: (lang) => setS((p) => ({ ...p, lang })),
    setCcy: (ccy) => setS((p) => ({ ...p, ccy })),
    setAccent: (accent) => setS((p) => ({ ...p, accent })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
