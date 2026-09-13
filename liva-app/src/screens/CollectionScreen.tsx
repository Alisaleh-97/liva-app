// Banner-driven collection screen — opened when a Home banner is tapped.
// Three variants share the same layout but pull different products + headers:
//  - 'mega' → biggest discounts
//  - 'new'  → newest arrivals (latest IDs + 'New' badges)
//  - 'pay'  → installment-eligible (install: true)
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { PRODUCTS, Product, BannerType } from '@/data';
import { t as tr, price, isRTL } from '@/i18n';

interface Props {
  type: BannerType;
  onBack: () => void;
  onOpen: (p: Product) => void;
  onBuy: (p: Product) => void;
}

export function CollectionScreen({ type, onBack, onOpen, onBuy }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { extras } = useApp();
  const catalog = useMemo(() => [...PRODUCTS, ...extras], [extras]);

  // Per-banner config: header gradient, title, subtitle, and the filter function
  const cfg = useMemo(() => {
    if (type === 'mega') {
      return {
        title: tr('megaWeek'),
        sub: tr('megaWeekSub'),
        kicker: 'MEGA WEEK',
        colors: ['#8B5CF6', '#EC4899'] as [string, string],
        icon: 'flame',
        products: catalog
          .filter((p) => p.was)
          .sort((a, b) => (1 - a.price / (a.was || 1)) - (1 - b.price / (b.was || 1)) > 0 ? -1 : 1)
          .reverse(),
      };
    }
    if (type === 'new') {
      // "New" = items with badge 'New' OR the latest few seller-added extras,
      // plus the highest-ID catalog products as a stand-in for "newest".
      const news = catalog.filter((p) => p.badge === 'New' || p.id.startsWith('s') || p.id.startsWith('x'));
      const fresh = [...catalog].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 12);
      const seen = new Set<string>();
      const list = [...news, ...fresh].filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
      return {
        title: tr('newIn'),
        sub: tr('newInSub'),
        kicker: 'NEW IN',
        colors: ['#6366F1', '#22D3EE'] as [string, string],
        icon: 'star',
        products: list,
      };
    }
    // 'pay'
    return {
      title: tr('payMonthly'),
      sub: tr('payMonthlySub'),
      kicker: 'PAY MONTHLY',
      colors: ['#F59E0B', '#EF4444'] as [string, string],
      icon: 'ticket',
      products: catalog.filter((p) => p.install),
    };
  }, [type, catalog]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg, zIndex: 92 }}>
      {/* Floating back button */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12, zIndex: 3 }}>
        <Pressable onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero header */}
        <LinearGradient
          colors={cfg.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 60, paddingHorizontal: 22, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name={cfg.icon} size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800', letterSpacing: 2 }}>{cfg.kicker}</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.7 }}>{cfg.title}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 320 }}>{cfg.sub}</Text>

          {/* Mini stats strip */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <HeroStat label="ITEMS" value={String(cfg.products.length)} />
            {type === 'mega' && cfg.products[0]?.was && (
              <HeroStat label="MAX OFF" value={`${Math.round((1 - cfg.products[0].price / cfg.products[0].was) * 100)}%`} />
            )}
            {type === 'pay' && (
              <HeroStat label="INSTALLMENTS" value="3 · 6 · 12" />
            )}
            {type === 'new' && (
              <HeroStat label="ADDED" value="this week" />
            )}
          </View>
        </LinearGradient>

        {/* Products grid */}
        {cfg.products.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
            <Icon name="search" size={36} color={t.textDim} />
            <Text style={{ fontSize: 14, color: t.textDim }}>No items match this collection yet.</Text>
          </View>
        ) : (
          <View style={{ padding: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {cfg.products.map((p) => (
              <View key={p.id} style={{ width: '48%' }}>
                <ProductCard p={p} onOpen={onOpen} onBuy={onBuy} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: 9, paddingHorizontal: 13, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 11 }}>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 }}>{label}</Text>
    </View>
  );
}
