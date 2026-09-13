// Edit an existing seller product (reuses the same form layout as Add).
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { Product } from '@/data';
import { t as tr, isRTL } from '@/i18n';

const CATS: Array<Product['type']> = ['clothing', 'accessories', 'electronics', 'beauty', 'home', 'sport'];

export function EditProductScreen({ product, onBack }: { product: Product; onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { updateSellerProduct } = useApp();
  const [name, setName] = useState(product.name);
  const [brand, setBrand] = useState(product.brand);
  const [cat, setCat] = useState<Product['type']>(product.type);
  const [priceStr, setPriceStr] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));

  function submit() {
    if (!name.trim() || !brand.trim()) return Alert.alert('Required', 'Name and brand are required.');
    const p = parseFloat(priceStr);
    if (!isFinite(p) || p <= 0) return Alert.alert('Invalid', tr('productPrice'));
    const s = parseInt(stock, 10) || 0;
    updateSellerProduct(product.id, { name: name.trim(), brand: brand.trim(), type: cat, price: p, stock: s });
    Alert.alert(tr('productUpdated'));
    onBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('editProductTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ height: 140, borderRadius: t.radius, overflow: 'hidden', borderWidth: 1, borderColor: t.border }}>
          <Thumb seed={product.seed} style={{ flex: 1 }} />
        </View>
        <Field label={tr('productName')} value={name} onChange={setName} icon="tag" />
        <Field label={tr('productBrand')} value={brand} onChange={setBrand} icon="shop" />
        <View>
          <Text style={lbl(t)}>{tr('productCategory')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATS.map((c) => (
              <Pressable key={c} onPress={() => setCat(c)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5, borderColor: cat === c ? t.accent1 : t.border, backgroundColor: cat === c ? 'rgba(139,92,246,0.12)' : t.surface }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: cat === c ? t.accent1 : t.text, textTransform: 'capitalize' }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label={tr('productPrice')} value={priceStr} onChange={setPriceStr} icon="wallet" keyboard="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label={tr('productStock')} value={stock} onChange={setStock} icon="cart" keyboard="number-pad" /></View>
        </View>
        <BuyBtn full onPress={submit} style={{ height: 52, marginTop: 8 }}>{tr('saveChanges')}</BuyBtn>
      </ScrollView>
    </View>
  );
}

function lbl(t: any) {
  return { fontSize: 12, fontWeight: '700' as const, color: t.textDim, marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
}

function Field({ label, value, onChange, icon, keyboard }: { label: string; value: string; onChange: (v: string) => void; icon: string; keyboard?: 'default' | 'number-pad' | 'decimal-pad' }) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={lbl(t)}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput value={value} onChangeText={onChange} keyboardType={keyboard} autoCorrect={false} style={{ flex: 1, color: t.text, fontSize: 15 }} placeholderTextColor={t.textDim} />
      </View>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
