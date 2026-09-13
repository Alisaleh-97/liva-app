// Add-a-product form for sellers. Saves to AsyncStorage via AppContext.
// Real image upload via Cloudinary (when configured) or local URI fallback.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { Product } from '@/data';
import { pickImage, takePhoto, uploadImage, cloudinaryConfigured } from '@/lib/cloudinary';
import { t as tr, isRTL } from '@/i18n';

const CATS: Array<Product['type']> = ['clothing', 'accessories', 'electronics', 'beauty', 'home', 'sport'];

export function AddProductScreen({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { addSellerProduct } = useApp();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [cat, setCat] = useState<Product['type']>('electronics');
  const [priceStr, setPriceStr] = useState('');
  const [stock, setStock] = useState('10');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function chooseFromLibrary() {
    const uri = await pickImage({ square: true });
    if (!uri) return;
    setUploading(true);
    try {
      const remote = await uploadImage(uri);
      setPhoto(remote);
    } finally { setUploading(false); }
  }

  async function snap() {
    const uri = await takePhoto();
    if (!uri) return;
    setUploading(true);
    try {
      const remote = await uploadImage(uri);
      setPhoto(remote);
    } finally { setUploading(false); }
  }

  function submit() {
    if (!name.trim()) return Alert.alert(tr('productName'), 'Required.');
    if (!brand.trim()) return Alert.alert(tr('productBrand'), 'Required.');
    const priceNum = parseFloat(priceStr);
    if (!isFinite(priceNum) || priceNum <= 0) return Alert.alert(tr('productPrice'), 'Enter a valid number.');
    const stockNum = parseInt(stock, 10) || 0;
    const seed = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + Date.now().toString(36);
    const product: Product = {
      id: 's' + Date.now(),
      name: name.trim(),
      brand: brand.trim(),
      audience: 'unisex',
      type: cat,
      sub: cat[0].toUpperCase() + cat.slice(1),
      price: priceNum,
      rating: 4.6,
      reviews: 0,
      seed,
      colors: [],
      sizes: [],
      stock: stockNum,
      ship: [2, 5],
      install: false,
      images: photo ? [photo] : [seed, seed + '-2'],
      badge: 'New',
    };
    addSellerProduct(product);
    Alert.alert(tr('productPublished'), `${product.name} is now listed in your store.`);
    onSaved();
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('addProductTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Photo picker */}
        <View style={{ height: 200, borderRadius: t.radius, overflow: 'hidden', borderWidth: 1, borderColor: t.border, position: 'relative' }}>
          {photo ? (
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Thumb seed={name || 'new-product'} style={{ flex: 1 }} />
          )}
          {uploading && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}
          <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10, flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={chooseFromLibrary} disabled={uploading} style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.55)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center' }}>
                <Icon name="eye" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Photo library</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={snap} disabled={uploading} style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center' }}>
                <Icon name="scan" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Take photo</Text>
              </LinearGradient>
            </Pressable>
          </View>
          {!cloudinaryConfigured && (
            <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5 }}>LOCAL ONLY</Text>
            </View>
          )}
        </View>

        <Field label={tr('productName')} value={name} onChange={setName} placeholder={tr('productNameHint')} icon="tag" />
        <Field label={tr('productBrand')} value={brand} onChange={setBrand} placeholder={tr('productBrandHint')} icon="shop" />

        {/* Category */}
        <View>
          <Text style={lbl(t)}>{tr('productCategory')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCat(c)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 9,
                  borderRadius: 999, borderWidth: 1.5,
                  borderColor: cat === c ? t.accent1 : t.border,
                  backgroundColor: cat === c ? 'rgba(139,92,246,0.12)' : t.surface,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: cat === c ? t.accent1 : t.text, textTransform: 'capitalize' }}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label={tr('productPrice')} value={priceStr} onChange={setPriceStr} keyboard="decimal-pad" icon="wallet" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={tr('productStock')} value={stock} onChange={setStock} keyboard="number-pad" icon="cart" />
          </View>
        </View>

        <View>
          <Text style={lbl(t)}>{tr('productDesc')}</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={3}
            placeholder="Optional"
            placeholderTextColor={t.textDim}
            style={{ minHeight: 80, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, color: t.text, fontSize: 14, textAlignVertical: 'top' }}
          />
        </View>

        <BuyBtn full onPress={submit} style={{ height: 52, marginTop: 8 }}>
          {tr('publishProduct')}
        </BuyBtn>
      </ScrollView>
    </View>
  );
}

function lbl(t: any) {
  return { fontSize: 12, fontWeight: '700' as const, color: t.textDim, marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
}

function Field({
  label, value, onChange, placeholder, icon, keyboard,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon: string;
  keyboard?: 'default' | 'email-address' | 'decimal-pad' | 'number-pad';
}) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={lbl(t)}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={t.textDim}
          keyboardType={keyboard}
          autoCorrect={false}
          style={{ flex: 1, color: t.text, fontSize: 15 }}
        />
      </View>
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
