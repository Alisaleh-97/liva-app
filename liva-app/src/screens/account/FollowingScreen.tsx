// Following — list of sellers the user follows + quick unfollow.
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { Stars } from '@/components/Stars';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';
import { SELLERS, Seller } from '@/data';
import { fmtK, isRTL } from '@/i18n';

interface Props {
  onBack: () => void;
  onOpenSeller: (id: string) => void;
}

export function FollowingScreen({ onBack, onOpenSeller }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { followedSellers, toggleFollow } = useExtras();
  const followed: Seller[] = followedSellers
    .map((id) => SELLERS.find((s) => s.id === id))
    .filter((s): s is Seller => !!s);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Following</Text>
        <View style={{ width: 40 }} />
      </View>

      {followed.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="users" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>No follows yet</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>
            Tap Follow on any seller's profile to see their lives, drops, and updates here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 60 }}>
          {followed.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => onOpenSeller(s.id)}
              style={{ padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar seed={s.seed} size={48} verified={s.verified} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{s.name}</Text>
                <Text style={{ fontSize: 11.5, color: t.textDim, marginTop: 2 }}>{s.handle} · {fmtK(s.sales)} sales</Text>
                <View style={{ marginTop: 4 }}><Stars rating={s.rating} /></View>
              </View>
              <Pressable onPress={() => toggleFollow(s.id)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: t.surface2 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: t.text }}>Following</Text>
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
