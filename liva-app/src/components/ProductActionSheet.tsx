// Product action sheet — iOS-style bottom sheet triggered by long-press on
// a product card. Shows Share / Wishlist / Compare / View details, each with
// its own icon and colored chip background.

import React from 'react';
import { Modal, View, Text, Pressable, Platform, Share } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { useCompare } from '@/state/CompareContext';
import { useToast } from '@/components/Toast';
import { Product } from '@/data';
import { pname, price } from '@/i18n';

interface Props {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onOpen: () => void;
  onCompare?: () => void;
}

export function ProductActionSheet({ visible, product, onClose, onOpen, onCompare }: Props) {
  const { t } = useTheme();
  const { wishlist, toggleWish } = useApp();
  const compare = useCompare();
  const toast = useToast();
  if (!product) return null;

  const wished = wishlist.has(product.id);
  const inCompare = compare.has(product.id);

  async function share() {
    onClose();
    const text = `Check out ${pname(product!)} — ${price(product!.price)} on LIVA`;
    try {
      if (Platform.OS === 'web') {
        if ((navigator as any).share) await (navigator as any).share({ title: pname(product!), text });
        else await (navigator as any).clipboard?.writeText?.(text);
        toast.show('Product link copied', { icon: 'share', kind: 'success' });
      } else {
        await Share.share({ message: text });
      }
    } catch { /* user cancelled */ }
  }

  function doWish() {
    toggleWish(product!.id);
    toast.show(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: 'heart', kind: 'success' });
    onClose();
  }

  function doCompare() {
    if (inCompare) {
      compare.remove(product!.id);
      toast.show('Removed from compare', { kind: 'info' });
    } else {
      compare.add(product!);
      toast.show(`Added to compare (${compare.items.length + 1})`, { kind: 'success' });
    }
    onClose();
    onCompare?.();
  }

  const actions = [
    { icon: 'eye',   label: 'View details',    color: t.accent1, onPress: () => { onClose(); onOpen(); } },
    { icon: 'heart', label: wished ? 'Remove from wishlist' : 'Save to wishlist', color: t.live, onPress: doWish },
    { icon: 'share', label: 'Share',           color: '#0EA5E9', onPress: share },
    { icon: 'plus',  label: inCompare ? 'Remove from compare' : 'Add to compare', color: t.accent2, onPress: doCompare },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <Pressable onPress={(e) => e.stopPropagation?.()} style={{ backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 26 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.textDim, opacity: 0.3, alignSelf: 'center', marginBottom: 14 }} />
          {/* Product header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: t.border }}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: t.text }}>{pname(product)}</Text>
              <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{price(product.price)}</Text>
            </View>
          </View>
          {/* Actions */}
          <View style={{ paddingTop: 6 }}>
            {actions.map((a, i) => (
              <Pressable key={i} onPress={a.onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, opacity: pressed ? 0.65 : 1 })}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${a.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={a.icon} size={18} color={a.color} />
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: t.text }}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
