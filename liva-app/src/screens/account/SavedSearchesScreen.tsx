// Saved searches — the user's saved queries + tap-to-rerun + swipe-to-delete.
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras, SavedSearch } from '@/state/AppExtras';
import { price, isRTL } from '@/i18n';

interface Props {
  onBack: () => void;
  onRunSearch: (query: string) => void;
}

export function SavedSearchesScreen({ onBack, onRunSearch }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedSearches, removeSavedSearch } = useExtras();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Saved searches</Text>
        <View style={{ width: 40 }} />
      </View>

      {savedSearches.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="search" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>No saved searches</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>
            Save any search from the Search screen to get notified when matching items land.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 60 }}>
          {savedSearches.map((s: SavedSearch) => (
            <View key={s.id} style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="search" size={18} color={t.accent1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{s.query || 'Any product'}</Text>
                <Text style={{ fontSize: 11.5, color: t.textDim, marginTop: 3 }}>
                  {[
                    s.filterMinPrice != null || s.filterMaxPrice != null ? `${price(s.filterMinPrice ?? 0, { dec: 0 })}–${s.filterMaxPrice != null ? price(s.filterMaxPrice, { dec: 0 }) : '∞'}` : null,
                    s.filterMinRating ? `★ ${s.filterMinRating}+` : null,
                  ].filter(Boolean).join(' · ') || 'no filters'}
                </Text>
              </View>
              <Pressable onPress={() => onRunSearch(s.query)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.15)' }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: t.accent1 }}>Run</Text>
              </Pressable>
              <Pressable onPress={() => removeSavedSearch(s.id)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,59,92,0.14)' }}>
                <Icon name="close" size={12} color={t.live} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
