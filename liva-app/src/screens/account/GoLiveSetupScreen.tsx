// Go Live setup — title + featured product + schedule now / later.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { PRODUCTS, Product } from '@/data';
import { t as tr, price, isRTL } from '@/i18n';

export function GoLiveSetupScreen({
  onBack,
  onStartLive,
}: {
  onBack: () => void;
  onStartLive: (title: string, product: Product, salesGoal: number) => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { sellerProducts } = useApp();
  const [title, setTitle] = useState('');
  const [featured, setFeatured] = useState<Product | null>(null);
  const [salesGoal, setSalesGoal] = useState(5);

  // Seller's own products first; otherwise let them feature catalog items for the demo
  const pickable: Product[] = sellerProducts.length ? sellerProducts : PRODUCTS.slice(0, 8);

  function startNow() {
    if (!title.trim()) return Alert.alert(tr('streamTitle'), tr('streamPickFirst'));
    if (!featured) return Alert.alert(tr('featureProduct'), tr('selectProduct'));
    onStartLive(title.trim(), featured, salesGoal);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('goLiveSetup')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 18 }}>
        {/* AI tip */}
        <LinearGradient
          colors={['rgba(139,92,246,0.22)', 'rgba(236,72,153,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: t.radius, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ai" size={18} color={t.accent1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: t.textDim }}>{tr('streamAITip')}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>Thursday, 8–9 PM · 2.3× conversion</Text>
          </View>
        </LinearGradient>

        {/* Title */}
        <View>
          <Text style={lbl(t)}>{tr('streamTitle')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
            <Icon name="live" size={18} color={t.live} />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={tr('streamTitleHint')}
              placeholderTextColor={t.textDim}
              style={{ flex: 1, color: t.text, fontSize: 15 }}
            />
          </View>
        </View>

        {/* Featured product */}
        <View>
          <Text style={lbl(t)}>{tr('featureProduct')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {pickable.map((p) => {
              const active = featured?.id === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setFeatured(p)}
                  style={{
                    width: 130,
                    padding: 8,
                    backgroundColor: t.surface,
                    borderWidth: 1.5,
                    borderColor: active ? t.accent1 : t.border,
                    borderRadius: t.radius,
                  }}
                >
                  <View style={{ aspectRatio: 1, borderRadius: t.radius * 0.6, overflow: 'hidden', marginBottom: 8 }}>
                    <Thumb seed={p.seed} style={{ flex: 1 }} />
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: t.text }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: t.buy, marginTop: 2 }}>{price(p.price)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Sales goal picker */}
        <View>
          <Text style={lbl(t)}>Sales goal</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[3, 5, 10, 25, 50].map((n) => {
              const active = salesGoal === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setSalesGoal(n)}
                  style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: t.radius, borderWidth: 1.5, borderColor: active ? t.accent1 : t.border, backgroundColor: active ? 'rgba(139,92,246,0.12)' : t.surface }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: active ? t.accent1 : t.text }}>{n}</Text>
                  <Text style={{ fontSize: 10, color: t.textDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>sales</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Audience */}
        <View>
          <Text style={lbl(t)}>{tr('audienceTarget')}</Text>
          <View style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="users" size={18} color={t.accent1} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: t.text }}>{tr('allFollowers')}</Text>
            <Icon name={isRTL() ? 'chevL' : 'chevR'} size={16} color={t.textDim} />
          </View>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Pressable
            onPress={() => Alert.alert(tr('scheduleLater'), tr('comingSoon'))}
            style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: t.radius, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flexDirection: 'row', gap: 7 }}
          >
            <Icon name="bell" size={16} color={t.text} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{tr('scheduleLater')}</Text>
          </Pressable>
          <Pressable onPress={startNow} style={{ flex: 1, height: 52, borderRadius: t.radius, overflow: 'hidden' }}>
            <LinearGradient
              colors={t.accentGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}
            >
              <Icon name="live" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('startLive')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function lbl(t: any) {
  return { fontSize: 12, fontWeight: '700' as const, color: t.textDim, marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
