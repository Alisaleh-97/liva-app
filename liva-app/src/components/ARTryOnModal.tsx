// AR Try-On modal — mocked "camera + AR overlay" experience. Real app would
// use ARKit / ARCore; this demo swaps in a body silhouette with the product
// image placed over the face/torso to convey the concept.

import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { Thumb } from './Thumb';
import { useTheme } from '@/theme/ThemeContext';
import { Product } from '@/data';
import { price, pname } from '@/i18n';

interface Props {
  visible: boolean;
  product: Product;
  onClose: () => void;
  onBuy: (p: Product) => void;
}

export function ARTryOnModal({ visible, product, onClose, onBuy }: Props) {
  const { t } = useTheme();
  const [scanning, setScanning] = useState(true);
  const [confidence, setConfidence] = useState(0);
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setScanning(true);
    setConfidence(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    // Fake scanning progress that "locks on" after 2 seconds
    const tick = setInterval(() => {
      setConfidence((c) => {
        const next = Math.min(100, c + 8);
        if (next >= 100) setScanning(false);
        return next;
      });
    }, 160);
    return () => { loop.stop(); clearInterval(tick); };
  }, [visible, scanY]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Mock camera view — dark body silhouette gradient */}
        <LinearGradient colors={['#1a0a2e', '#0f0322', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        {/* Body silhouette */}
        <View style={{ position: 'absolute', top: '25%', left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ fontSize: 250, opacity: 0.14 }}>🧍</Text>
        </View>

        {/* Product overlay — placed roughly at face/torso */}
        <View style={{ position: 'absolute', top: '32%', left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ width: 160, height: 160, borderRadius: 24, overflow: 'hidden', opacity: scanning ? 0.4 : 0.85, borderWidth: 2, borderColor: scanning ? t.accent2 : t.buy }}>
            <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
          </View>
        </View>

        {/* Scanning line */}
        {scanning && (
          <Animated.View
            style={{
              position: 'absolute', left: 0, right: 0, height: 3,
              backgroundColor: t.accent2, opacity: 0.85,
              shadowColor: t.accent2, shadowOpacity: 0.8, shadowRadius: 20,
              transform: [{ translateY: scanY.interpolate({ inputRange: [0, 1], outputRange: [80, 700] }) }],
            }}
          />
        )}

        {/* Corner brackets — camera framing marks */}
        {[
          { top: 60, left: 20, style: { borderTopWidth: 3, borderLeftWidth: 3 } },
          { top: 60, right: 20, style: { borderTopWidth: 3, borderRightWidth: 3 } },
          { bottom: 220, left: 20, style: { borderBottomWidth: 3, borderLeftWidth: 3 } },
          { bottom: 220, right: 20, style: { borderBottomWidth: 3, borderRightWidth: 3 } },
        ].map((c, i) => (
          <View key={i} style={{ position: 'absolute', width: 32, height: 32, borderColor: scanning ? t.accent2 : t.buy, ...c.style, ...(c as any) }} />
        ))}

        {/* Top bar */}
        <View style={{ position: 'absolute', top: 40, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={20} color="#fff" />
          </Pressable>
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(176,38,255,0.85)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14 }}>👓</Text>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }}>AR TRY-ON</Text>
          </View>
        </View>

        {/* Status pill */}
        <View style={{ position: 'absolute', top: 100, alignSelf: 'center', left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: scanning ? t.accent2 : t.buy, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: scanning ? t.accent2 : t.buy }} />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
              {scanning ? `Scanning your body… ${confidence}%` : '✓ Perfect fit detected'}
            </Text>
          </View>
        </View>

        {/* Bottom sheet — product info + buy CTA */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingBottom: 32, backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.textDim, opacity: 0.35, alignSelf: 'center', marginBottom: 12 }} />
          <Text numberOfLines={1} style={{ fontSize: 17, fontWeight: '800', color: t.text, letterSpacing: -0.3 }}>{pname(product)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: t.text }}>{price(product.price)}</Text>
              {!scanning && (
                <Text style={{ fontSize: 11.5, color: t.buy, fontWeight: '700', marginTop: 2 }}>Looks great on you — recommended size M</Text>
              )}
            </View>
            <Pressable onPress={() => { onClose(); onBuy(product); }} disabled={scanning}>
              <LinearGradient colors={[t.buy, '#065F46']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, opacity: scanning ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Buy now</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
