// Lightweight toast / mini-banner overlay. Use via `useToast().show('Saved!')`.
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';

interface ToastItem { id: number; text: string; icon?: string; kind?: 'success' | 'info' | 'error' }
interface ToastCtx { show: (text: string, opts?: { icon?: string; kind?: 'success' | 'info' | 'error' }) => void; }

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(-30)).current;
  const insets = useSafeAreaInsets();
  const { t } = useTheme();
  const seq = useRef(0);

  const show: ToastCtx['show'] = (text, opts = {}) => {
    seq.current += 1;
    const id = seq.current;
    setToast({ id, text, icon: opts.icon, kind: opts.kind || 'success' });
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      if (seq.current === id) {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.timing(y, { toValue: -30, duration: 280, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }
    }, 2200);
  };

  const accent = toast?.kind === 'error' ? t.live : toast?.kind === 'info' ? t.accent1 : t.buy;

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: insets.top + 8, left: 18, right: 18,
            opacity, transform: [{ translateY: y }], zIndex: 999,
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: t.surface, borderRadius: 99, borderWidth: 1, borderColor: t.border, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={toast.icon || (toast.kind === 'error' ? 'close' : 'check')} size={13} color={accent} stroke={3} />
            </View>
            <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '700' }}>{toast.text}</Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const v = useContext(Ctx);
  if (!v) return { show: () => {} }; // safe fallback if used outside provider
  return v;
}
