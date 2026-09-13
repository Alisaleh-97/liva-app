// Product thumbnail. Renders a real image URL when one is provided, otherwise
// falls back to a deterministic 2-stop gradient seeded by the product name.
import React from 'react';
import { View, ViewStyle, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientFor } from '@/theme/colors';

interface Props {
  seed: string;
  style?: ViewStyle;
  vivid?: boolean;
  imageUrl?: string | null;
}

const LOCAL_PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  'watch-steel': require('../../assets/products/aura-watch.png'),
  'earbuds-jet': require('../../assets/products/pulse-earbuds.png'),
  'perfume-rose': require('../../assets/products/velvet-perfume.png'),
  'sneaker-run': require('../../assets/products/cloudstep-runners.png'),
  'dress-aurora': require('../../assets/products/aurora-dress.png'),
  'hoops-gold': require('../../assets/products/mira-earrings.png'),
  'charger-flux': require('../../assets/products/flux-charger.png'),
  'serum-glow': require('../../assets/products/lumen-serum.png'),
};

export function Thumb({ seed, style, vivid = true, imageUrl }: Props) {
  const looksLikeUrl = imageUrl && /^(https?:|file:|data:|content:)/.test(imageUrl);
  const localKey = String(imageUrl || seed).replace(/-[234]$/, '');
  const localSource = LOCAL_PRODUCT_IMAGES[localKey];
  const [c1, c2] = gradientFor(seed, { vivid });
  return (
    <View style={[styles.root, style]}>
      {looksLikeUrl || localSource ? (
        <Image source={looksLikeUrl ? { uri: imageUrl! } : localSource} style={styles.image} resizeMode="cover" />
      ) : (
        <>
          <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(255,255,255,0.28)', 'transparent']} start={{ x: 0.25, y: 0.1 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  // Explicit percentages prevent React Native Web from applying a bundled
  // asset's intrinsic pixel dimensions (for example 768x768) over the card.
  image: { width: '100%', height: '100%' },
});
