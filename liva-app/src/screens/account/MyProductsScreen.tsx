// Seller's inventory — list of items they sell + "Add product" CTA + edit/remove.
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { Product } from '@/data';
import { t as tr, price, isRTL } from '@/i18n';

export function MyProductsScreen({
  onBack,
  onAddNew,
  onEdit,
}: {
  onBack: () => void;
  onAddNew: () => void;
  onEdit: (p: Product) => void;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { sellerProducts, removeSellerProduct } = useApp();

  function confirmRemove(id: string, name: string) {
    Alert.alert(tr('remove'), name, [
      { text: 'Cancel', style: 'cancel' },
      { text: tr('remove'), style: 'destructive', onPress: () => removeSellerProduct(id) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('myProductsTitle')}</Text>
        <Pressable onPress={onAddNew} style={btn(t)}>
          <Icon name="plus" size={20} color={t.accent1} stroke={2.2} />
        </Pressable>
      </View>

      {sellerProducts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shop" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr('noProducts')}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>{tr('noProductsSub')}</Text>
          <Pressable onPress={onAddNew} style={{ marginTop: 8, borderRadius: t.radius, overflow: 'hidden' }}>
            <LinearGradient
              colors={t.accentGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 }}
            >
              <Icon name="plus" size={16} color="#fff" stroke={2.2} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('addFirst')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 80 }}>
          {sellerProducts.map((p) => (
            <View key={p.id} style={{ padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 72, height: 72, borderRadius: t.radius * 0.75, overflow: 'hidden' }}>
                <Thumb seed={p.seed} style={{ width: '100%', height: '100%' }} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: t.accent1, textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.brand}</Text>
                  {p.badge && <Badge kind="ai">{p.badge}</Badge>}
                </View>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{p.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{price(p.price)}</Text>
                  <Text style={{ fontSize: 11.5, color: t.textDim }}>
                    {tr('stockLabel')}: <Text style={{ color: p.stock > 5 ? t.buy : t.live, fontWeight: '700' }}>{p.stock}</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Pressable onPress={() => onEdit(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: t.surface2 }}>
                    <Icon name="filter" size={12} color={t.text} />
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.text }}>{tr('edit')}</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmRemove(p.id, p.name)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,59,92,0.12)' }}>
                    <Icon name="close" size={12} color={t.live} />
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.live }}>{tr('remove')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
