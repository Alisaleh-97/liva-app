// Size Assistant — asks the shopper a few quick questions (height, build,
// fit preference) and recommends a size for the current product. Uses a
// simple deterministic rules table for the demo; a real app would call the
// AI backend with the product's fit metadata.

import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { Product } from '@/data';

interface Props {
  visible: boolean;
  onClose: () => void;
  product: Product;
}

const HEIGHTS = ['<160', '160–170', '170–180', '180–190', '>190'] as const;
const BUILDS = ['Slim', 'Regular', 'Athletic', 'Broad'] as const;
const FITS = ['Snug', 'True to size', 'Relaxed'] as const;

type Height = typeof HEIGHTS[number];
type Build = typeof BUILDS[number];
type Fit = typeof FITS[number];

// Deterministic mapping — pretend "AI" that picks a plausible size letter.
function recommend(h: Height, b: Build, f: Fit, options: string[]): string {
  if (!options.length) return '—';
  const heightIdx = HEIGHTS.indexOf(h);
  const buildIdx = BUILDS.indexOf(b);
  const fitBump = f === 'Relaxed' ? 1 : f === 'Snug' ? -1 : 0;
  const raw = Math.round((heightIdx * 0.5 + buildIdx * 0.9) + options.length / 3 + fitBump);
  const clamped = Math.max(0, Math.min(options.length - 1, raw));
  return options[clamped];
}

export function SizeAssistantModal({ visible, onClose, product }: Props) {
  const { t } = useTheme();
  const [step, setStep] = useState(0);
  const [height, setHeight] = useState<Height | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  function reset() { setStep(0); setHeight(null); setBuild(null); setFit(null); }
  function done() { reset(); onClose(); }

  const canNext = (step === 0 && height) || (step === 1 && build) || (step === 2 && fit);
  const sizes = product.sizes && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL'];
  const recommendedSize = height && build && fit ? recommend(height, build, fit, sizes) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={done}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, maxHeight: '85%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.textDim, opacity: 0.35, alignSelf: 'center', marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 24 }}>📏</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, letterSpacing: -0.4 }}>Size assistant</Text>
            </View>
            <Pressable onPress={done} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={16} color={t.text} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 12, color: t.textDim, marginBottom: 18 }}>3 quick questions to find your fit</Text>

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 22 }}>
            {[0, 1, 2, 3].map((s) => (
              <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: s <= step ? t.accent1 : t.surface2 }} />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {step === 0 && (
              <QuestionRow
                title="What's your height? (cm)"
                options={HEIGHTS as unknown as string[]}
                value={height}
                onSelect={(v) => setHeight(v as Height)}
              />
            )}
            {step === 1 && (
              <QuestionRow
                title="How would you describe your build?"
                options={BUILDS as unknown as string[]}
                value={build}
                onSelect={(v) => setBuild(v as Build)}
              />
            )}
            {step === 2 && (
              <QuestionRow
                title="Preferred fit?"
                options={FITS as unknown as string[]}
                value={fit}
                onSelect={(v) => setFit(v as Fit)}
              />
            )}
            {step === 3 && recommendedSize && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 12.5, color: t.textDim, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Recommended</Text>
                <View style={{ marginTop: 10, marginBottom: 10 }}>
                  <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 100, height: 100, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: t.accent1, shadowOpacity: 0.5, shadowRadius: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: -1 }}>{recommendedSize}</Text>
                  </LinearGradient>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, textAlign: 'center' }}>Best match for your fit</Text>
                <Text style={{ fontSize: 12, color: t.textDim, textAlign: 'center', marginTop: 6, maxWidth: 260, lineHeight: 17 }}>Based on other shoppers with your body type, {recommendedSize} usually feels {fit?.toLowerCase()}.</Text>
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            {step > 0 && step < 3 && (
              <Pressable onPress={() => setStep((s) => s - 1)} style={{ flex: 1, paddingVertical: 14, borderRadius: t.radius, alignItems: 'center', backgroundColor: t.surface2 }}>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: '700' }}>Back</Text>
              </Pressable>
            )}
            {step < 3 ? (
              <Pressable disabled={!canNext} onPress={() => setStep((s) => s + 1)} style={{ flex: 1, borderRadius: t.radius, overflow: 'hidden', opacity: canNext ? 1 : 0.4 }}>
                <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{step === 2 ? 'Show my size' : 'Continue'}</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable onPress={done} style={{ flex: 1, borderRadius: t.radius, overflow: 'hidden' }}>
                <LinearGradient colors={[t.buy, '#065F46']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Got it</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function QuestionRow({ title, options, value, onSelect }: { title: string; options: string[]; value: string | null; onSelect: (v: string) => void }) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 14 }}>{title}</Text>
      <View style={{ gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable key={opt} onPress={() => onSelect(opt)} style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: active ? t.accent1 : t.surface2, borderWidth: 1, borderColor: active ? t.accent1 : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: active ? '#fff' : t.text }}>{opt}</Text>
              {active && <Icon name="check" size={18} color="#fff" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
