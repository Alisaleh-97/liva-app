// Past Lives — list of saved stream replays with stats per entry.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras, SavedStream } from '@/state/AppExtras';
import { byId } from '@/data';
import { t as tr, price, fmtK, isRTL } from '@/i18n';

export function PastLivesScreen({
  onBack, onOpen,
}: { onBack: () => void; onOpen: (s: SavedStream) => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedStreams, removeSavedStream } = useExtras();
  const [refreshing, setRefreshing] = useState(false);
  function onRefresh() { setRefreshing(true); setTimeout(() => setRefreshing(false), 700); }

  function confirmRemove(id: string, title: string) {
    Alert.alert('Delete replay', title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSavedStream(id) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Past Lives</Text>
        <View style={{ width: 40 }} />
      </View>

      {savedStreams.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="live" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>No replays yet</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>
            Every live stream is auto-saved here when you end it — with full stats, chat highlights, and polls.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent1} />}
        >
          {savedStreams.map((s) => {
            const prod = byId[s.productId];
            const mm = String(Math.floor(s.durationSec / 60)).padStart(2, '0');
            const ss = String(s.durationSec % 60).padStart(2, '0');
            return (
              <Pressable
                key={s.id}
                onPress={() => onOpen(s)}
                style={({ pressed }) => ({ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, overflow: 'hidden', opacity: pressed ? 0.85 : 1 })}
              >
                {/* Thumbnail strip */}
                <View style={{ height: 130, position: 'relative' }}>
                  <Thumb seed={s.thumbnail || s.id} vivid style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.85)']}
                    locations={[0, 0.4, 1]}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 }}>
                    <Badge kind="live">REPLAY</Badge>
                    <Badge kind="glass">{mm}:{ss}</Badge>
                  </View>
                  <View style={{ position: 'absolute', top: 10, right: 10 }}>
                    <Pressable onPress={() => confirmRemove(s.id, s.title)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                  <View style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{s.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                      {new Date(s.endedAt).toLocaleDateString()} · {s.sellerName}
                    </Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-around', gap: 8 }}>
                  <MicroStat icon="eye" label="Peak" value={fmtK(s.peakViewers)} />
                  <MicroStat icon="heart" label="Likes" value={fmtK(s.totalLikes)} />
                  <MicroStat icon="cart" label="Sales" value={`${s.totalSales} · ${price(s.salesValue, { dec: 0 })}`} />
                  {s.tipsValue > 0 && <MicroStat icon="wallet" label="Tips" value={price(s.tipsValue, { dec: 0 })} accent="#FFB339" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function MicroStat({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Icon name={icon} size={14} color={accent || t.accent1} />
      <Text style={{ fontSize: 12.5, fontWeight: '800', color: accent || t.text, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 9.5, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function btn(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
