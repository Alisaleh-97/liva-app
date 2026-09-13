// Daily Spin-to-Win — a self-contained modal with a spinning wheel of 8
// prize slots. Persists "already spun today" in AsyncStorage so users get
// exactly one attempt per calendar day, awarding LIVA coins as the payout.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { load, save } from '@/lib/storage';
import { tap } from '@/lib/haptics';
import { useToast } from '@/components/Toast';

const KEY = '@liva/dailySpin';

interface SpinRecord { lastDate: string; lastReward: number }

const SLOTS: { label: string; coins: number; color: string }[] = [
  { label: '10',   coins: 10,   color: '#8B5CF6' },
  { label: '25',   coins: 25,   color: '#EC4899' },
  { label: '50',   coins: 50,   color: '#F97316' },
  { label: '5',    coins: 5,    color: '#22D3EE' },
  { label: '100',  coins: 100,  color: '#FBBF24' },
  { label: '15',   coins: 15,   color: '#A855F7' },
  { label: '200',  coins: 200,  color: '#00E672' },
  { label: '20',   coins: 20,   color: '#FF2A9D' },
];

function todayISO() { return new Date().toISOString().slice(0, 10); }

export function DailySpinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTheme();
  const toast = useToast();
  const rotate = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const [alreadySpun, setAlreadySpun] = useState(false);
  const [reward, setReward] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    load<SpinRecord | null>(KEY, null).then((r) => {
      if (r && r.lastDate === todayISO()) {
        setAlreadySpun(true);
        setReward(r.lastReward);
      } else {
        setAlreadySpun(false);
        setReward(null);
        rotate.setValue(0);
      }
    });
  }, [visible, rotate]);

  const spin = () => {
    if (spinning || alreadySpun) return;
    setSpinning(true);
    // Random slot 0-7
    const idx = Math.floor(Math.random() * SLOTS.length);
    const win = SLOTS[idx];
    // Rotate to land on this slot (each slot = 45deg, plus 5 full turns for drama)
    const sliceDeg = 360 / SLOTS.length;
    const targetDeg = 360 * 5 + (360 - idx * sliceDeg - sliceDeg / 2);
    Animated.timing(rotate, {
      toValue: targetDeg,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setReward(win.coins);
      setAlreadySpun(true);
      save(KEY, { lastDate: todayISO(), lastReward: win.coins }).catch(() => {});
      tap('success', true);
      toast.show(`🎉 You won ${win.coins} LIVA Coins!`, { kind: 'success' });
    });
  };

  const rotationStyle = { transform: [{ rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: t.surface, borderRadius: t.radius * 1.4, padding: 22, width: '100%', maxWidth: 380, borderWidth: 0.5, borderColor: t.border, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.4 }}>Daily Spin</Text>
              <Text style={{ fontSize: 12.5, color: t.textDim, marginTop: 3 }}>One free spin per day · win up to 200 coins</Text>
            </View>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 }}>
              <Icon name="close" size={18} color={t.text} />
            </Pressable>
          </View>

          {/* Wheel */}
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 22 }}>
            <View style={{ position: 'relative' }}>
              <Animated.View style={rotationStyle}>
                <Wheel size={260} />
              </Animated.View>
              {/* Center hub */}
              <View style={{ position: 'absolute', top: 100, left: 100, width: 60, height: 60, borderRadius: 30, backgroundColor: t.surface, borderWidth: 3, borderColor: t.accent1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>🎁</Text>
              </View>
              {/* Top pointer */}
              <View style={{ position: 'absolute', top: -8, left: 130 - 10, width: 0, height: 0,
                borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 20,
                borderLeftColor: 'transparent', borderRightColor: 'transparent',
                borderTopColor: t.live }} />
            </View>
          </View>

          {alreadySpun && reward != null ? (
            <View style={{ padding: 14, backgroundColor: t.surface2, borderRadius: t.radius, alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 12.5, color: t.textDim, fontWeight: '700' }}>TODAY'S REWARD</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: t.buy, letterSpacing: -0.4 }}>+{reward} coins</Text>
              <Text style={{ fontSize: 11.5, color: t.textDim, marginTop: 3 }}>Come back tomorrow for another spin!</Text>
            </View>
          ) : (
            <Pressable onPress={spin} disabled={spinning}>
              <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, borderRadius: t.radius, alignItems: 'center', opacity: spinning ? 0.7 : 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 }}>{spinning ? 'Spinning…' : 'SPIN THE WHEEL'}</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── SVG wheel with 8 colored slices ─────────────────────────────────────
function Wheel({ size }: { size: number }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const slices = SLOTS.length;
  const sliceDeg = 360 / slices;
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r - 2} fill="#0F0328" stroke="#FFF" strokeWidth={2} />
      {SLOTS.map((slot, i) => {
        const startA = (i * sliceDeg - 90) * (Math.PI / 180);
        const endA = ((i + 1) * sliceDeg - 90) * (Math.PI / 180);
        const x1 = cx + (r - 4) * Math.cos(startA);
        const y1 = cy + (r - 4) * Math.sin(startA);
        const x2 = cx + (r - 4) * Math.cos(endA);
        const y2 = cy + (r - 4) * Math.sin(endA);
        const large = sliceDeg > 180 ? 1 : 0;
        const d = `M ${cx},${cy} L ${x1},${y1} A ${r - 4},${r - 4} 0 ${large} 1 ${x2},${y2} Z`;
        // Label placement — midway along the slice, ~70% radius
        const midA = (startA + endA) / 2;
        const tx = cx + (r - 4) * 0.68 * Math.cos(midA);
        const ty = cy + (r - 4) * 0.68 * Math.sin(midA);
        return (
          <G key={i}>
            <Path d={d} fill={slot.color} stroke="#0F0328" strokeWidth={1.5} />
            <SvgText x={tx} y={ty + 6} fontSize="18" fontWeight="800" fill="#fff" textAnchor="middle">{slot.label}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
