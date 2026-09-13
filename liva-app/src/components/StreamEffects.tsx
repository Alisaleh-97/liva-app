// Visual effects for live streams — Confetti, EmojiBurst, MilestonePulse,
// FlashDealCountdown, ViralBadge. All use the Animated API (native driver
// where possible) and clean themselves up.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';

// ── Confetti burst ─────────────────────────────────────────────────────────
interface ConfettiProps { trigger: number; pieces?: number }
const CONFETTI_COLORS = ['#8B5CF6', '#EC4899', '#22C55E', '#FFB339', '#3E8E8A'];

export function Confetti({ trigger, pieces = 32 }: ConfettiProps) {
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const lastTrigger = useRef(0);
  const W = Dimensions.get('window').width;

  useEffect(() => {
    if (trigger === lastTrigger.current || trigger === 0) return;
    lastTrigger.current = trigger;
    const newPieces = Array.from({ length: pieces }, (_, i) => ({
      id: trigger * 1000 + i,
      x: Math.random() * W,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 200,
    }));
    setBursts((prev) => [...prev, ...newPieces]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((p) => !newPieces.includes(p)));
    }, 3000);
  }, [trigger, pieces]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bursts.map((p) => <Piece key={p.id} x={p.x} color={p.color} delay={p.delay} />)}
    </View>
  );
}

function Piece({ x, color, delay }: { x: number; color: string; delay: number }) {
  const H = Dimensions.get('window').height;
  const y = useRef(new Animated.Value(-20)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: H + 40, duration: 2400 + Math.random() * 600, delay, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.loop(Animated.timing(rot, { toValue: 1, duration: 800, useNativeDriver: true }), { iterations: 6 }),
      Animated.timing(drift, { toValue: Math.random() * 100 - 50, duration: 2400, delay, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', top: 0, left: x, width: 9, height: 16, borderRadius: 2,
        backgroundColor: color,
        transform: [
          { translateY: y },
          { translateX: drift },
          { rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
        ],
        opacity,
      }}
    />
  );
}

// ── Emoji burst (reactions) ────────────────────────────────────────────────
const REACTION_EMOJI = { heart: '❤️', fire: '🔥', money: '🤑', clap: '👏', laugh: '😂', wow: '🤩' };
export type ReactionKind = keyof typeof REACTION_EMOJI;

interface EmojiBurstProps {
  reactions: Array<{ id: string; kind: ReactionKind; xPercent: number }>;
}

export function EmojiBurst({ reactions }: EmojiBurstProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {reactions.map((r) => <FloatingEmoji key={r.id} emoji={REACTION_EMOJI[r.kind]} xPercent={r.xPercent} />)}
    </View>
  );
}

function FloatingEmoji({ emoji, xPercent }: { emoji: string; xPercent: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const W = Dimensions.get('window').width;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(y, { toValue: -260, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: (Math.random() - 0.5) * 80, duration: 1600, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute', bottom: 130, left: xPercent * (W - 40), fontSize: 30,
        transform: [{ translateY: y }, { translateX: drift }, { scale }],
        opacity,
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// ── Milestone pulse — scaling number with gradient ─────────────────────────
interface MilestonePulseProps { trigger: number; label: string }
export function MilestonePulse({ trigger, label }: MilestonePulseProps) {
  const { t } = useTheme();
  const [visible, setVisible] = useState(false);
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const lastTrigger = useRef(0);

  useEffect(() => {
    if (trigger === lastTrigger.current || trigger === 0) return;
    lastTrigger.current = trigger;
    setVisible(true);
    scale.setValue(0.3); opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.4, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => setVisible(false));
  }, [trigger]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 10 }]}>
      <Animated.View style={{ transform: [{ scale }], opacity, borderRadius: 28, overflow: 'hidden' }}>
        <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 38, paddingVertical: 22, alignItems: 'center', borderRadius: 28 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 2.5 }}>MILESTONE</Text>
          <Text style={{ color: '#fff', fontSize: 42, fontWeight: '800', letterSpacing: -1, marginTop: 4 }}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ── Going viral badge ─────────────────────────────────────────────────────
export function ViralBadge({ visible }: { visible: boolean }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) { scale.setValue(0); return; }
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 56, alignSelf: 'center', transform: [{ scale }], zIndex: 10 }}
    >
      <LinearGradient colors={['#FF3B5C', '#FFB339']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 14 }}>🔥</Text>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }}>GOING VIRAL</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ── Flash-deal countdown overlay ──────────────────────────────────────────
export function FlashDealOverlay({
  active, oldPrice, newPrice, secondsLeft, onExpire,
}: { active: boolean; oldPrice: number; newPrice: number; secondsLeft: number; onExpire: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [active]);
  useEffect(() => { if (secondsLeft <= 0 && active) onExpire(); }, [secondsLeft, active]);
  if (!active) return null;
  const off = Math.round((1 - newPrice / oldPrice) * 100);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 100, alignSelf: 'center', transform: [{ scale: pulse }], zIndex: 8 }}
    >
      <LinearGradient
        colors={['#FF3B5C', '#FFB339']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <Text style={{ fontSize: 22 }}>⚡</Text>
        <View>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>FLASH SALE · {off}% OFF</Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 2 }}>Ends in {mm}:{ss}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ── Tip coin burst ─────────────────────────────────────────────────────────
export function CoinBurst({ trigger }: { trigger: number }) {
  const [coins, setCoins] = useState<Array<{ id: number; x: number; delay: number }>>([]);
  const lastTrigger = useRef(0);
  const W = Dimensions.get('window').width;
  useEffect(() => {
    if (trigger === lastTrigger.current || trigger === 0) return;
    lastTrigger.current = trigger;
    const newCoins = Array.from({ length: 14 }, (_, i) => ({
      id: trigger * 100 + i,
      x: W / 2 + (Math.random() - 0.5) * 200,
      delay: Math.random() * 200,
    }));
    setCoins((prev) => [...prev, ...newCoins]);
    setTimeout(() => setCoins((p) => p.filter((c) => !newCoins.includes(c))), 2500);
  }, [trigger]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {coins.map((c) => <Coin key={c.id} x={c.x} delay={c.delay} />)}
    </View>
  );
}
function Coin({ x, delay }: { x: number; delay: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const H = Dimensions.get('window').height;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, delay, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(y, { toValue: -H * 0.35, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      ]),
      Animated.parallel([
        Animated.timing(y, { toValue: H, duration: 1200, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.loop(Animated.timing(rot, { toValue: 1, duration: 600, useNativeDriver: true })).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute', top: H * 0.55, left: x, width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#FFB339', alignItems: 'center', justifyContent: 'center',
        transform: [{ translateY: y }, { rotateY: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
        opacity,
      }}
    >
      <Text style={{ fontSize: 14 }}>💰</Text>
    </Animated.View>
  );
}
