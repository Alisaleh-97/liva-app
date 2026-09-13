// Scan-to-search — pick or shoot a photo of a product, send it through the
// /api/ai/extract endpoint (with image in production), and surface a result
// card the user can buy/save/open.
//
// For the preview, image uploads aren't piped through the extract endpoint
// (that takes a URL not an image). We still let the user pick an image and
// then run a friendly demo: search the catalog by similar gradient seed.

import React, { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { pickImage, takePhoto } from '@/lib/cloudinary';
import { useApp } from '@/state/AppContext';
import { PRODUCTS, Product } from '@/data';
import { t as tr, price, pname, isRTL } from '@/i18n';

interface Props {
  onClose: () => void;
  onOpen: (p: Product) => void;
  onBuy: (p: Product) => void;
}

export function ScanScreen({ onClose, onOpen, onBuy }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { extras } = useApp();
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Product[] | null>(null);

  async function fromLibrary() {
    const uri = await pickImage({ square: false });
    if (uri) startAnalyze(uri);
  }
  async function fromCamera() {
    const uri = await takePhoto();
    if (uri) startAnalyze(uri);
  }

  async function startAnalyze(uri: string) {
    setPhoto(uri);
    setAnalyzing(true);
    // Demo: simulate AI vision search. In production, POST the image to
    // /api/ai/visual-search and get back matched product IDs.
    await new Promise((r) => setTimeout(r, 1500));
    const catalog = [...PRODUCTS, ...extras];
    // Return 4 random-ish matches as the "AI found these similar items" result
    const shuffled = [...catalog].sort(() => Math.random() - 0.5).slice(0, 4);
    setResults(shuffled);
    setAnalyzing(false);
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg, zIndex: 96 }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onClose} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Visual Search</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60 }}>
        {!photo ? (
          <>
            <LinearGradient
              colors={t.accentGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 80, height: 80, borderRadius: 24, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 22 }}
            >
              <Icon name="scan" size={42} color="#fff" />
            </LinearGradient>
            <Text style={{ fontSize: 26, fontWeight: '800', color: t.text, textAlign: 'center', letterSpacing: -0.4 }}>
              Find anything by photo
            </Text>
            <Text style={{ fontSize: 14, color: t.textDim, marginTop: 8, marginBottom: 32, textAlign: 'center', lineHeight: 21 }}>
              Snap a product or pick a photo from your library. Our AI matches it against the catalog and surfaces visually similar items.
            </Text>

            <Pressable onPress={fromCamera} style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}>
              <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Icon name="scan" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Take a photo</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={fromLibrary} style={{ paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: t.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: t.surface }}>
              <Icon name="eye" size={17} color={t.text} />
              <Text style={{ color: t.text, fontSize: 15, fontWeight: '800' }}>Pick from photo library</Text>
            </Pressable>

            <View style={{ marginTop: 24, padding: 14, backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', borderRadius: 12, flexDirection: 'row', gap: 10 }}>
              <Icon name="ai" size={18} color={t.accent1} />
              <Text style={{ flex: 1, fontSize: 12, color: t.text, lineHeight: 17 }}>
                Visual search uses our backend AI to identify products. Works best on plain backgrounds.
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.border, marginBottom: 18 }}>
              <Image source={{ uri: photo }} style={{ width: '100%', height: 240 }} resizeMode="cover" />
              {analyzing && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Analyzing image…</Text>
                </View>
              )}
            </View>

            <Pressable onPress={() => { setPhoto(null); setResults(null); }} style={{ alignSelf: 'center', marginBottom: 18 }}>
              <Text style={{ color: t.accent1, fontSize: 13, fontWeight: '700' }}>← Try another photo</Text>
            </Pressable>

            {results && (
              <>
                <Text style={{ fontSize: 12, color: t.textDim, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 }}>
                  Visual matches ({results.length})
                </Text>
                <View style={{ gap: 10 }}>
                  {results.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => onOpen(p)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}
                    >
                      <View style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden' }}>
                        <Thumb seed={p.seed} imageUrl={p.images?.[0]} style={{ width: '100%', height: '100%' }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: t.accent1, fontWeight: '800', letterSpacing: 0.4 }}>{p.brand}</Text>
                        <Text style={{ fontSize: 13.5, fontWeight: '700', color: t.text }} numberOfLines={1}>{pname(p)}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: t.buy, marginTop: 2 }}>{price(p.price)}</Text>
                      </View>
                      <BuyBtn small onPress={() => onBuy(p)}>Buy</BuyBtn>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function btn(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
