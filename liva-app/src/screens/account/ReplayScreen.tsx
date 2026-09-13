// Replay viewer — shows a saved stream's stats summary, chat highlights, and
// poll results. In production this would also play back the video file.
import React from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/theme/ThemeContext';
import { SavedStream } from '@/state/AppExtras';
import { byId } from '@/data';
import { t as tr, price, fmtK, isRTL } from '@/i18n';

export function ReplayScreen({
  stream, onBack,
}: { stream: SavedStream; onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const prod = byId[stream.productId];
  const mm = String(Math.floor(stream.durationSec / 60)).padStart(2, '0');
  const ss = String(stream.durationSec % 60).padStart(2, '0');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Replay</Text>
        <Pressable onPress={() => Share?.share?.({ message: `Watch ${stream.title} on LIVA` })} style={btnStyle(t)}>
          <Icon name="share" size={18} color={t.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Player placeholder */}
        <View style={{ height: 240, position: 'relative', backgroundColor: '#000' }}>
          <Thumb seed={stream.thumbnail || stream.id} vivid style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.4, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 6 }}>
            <Badge kind="ai">SAVED REPLAY</Badge>
          </View>
          {/* Play button */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={32} color="#fff" />
            </View>
          </View>
          <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }} numberOfLines={2}>{stream.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 }}>
              <Avatar seed={stream.sellerSeed} size={22} />
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '700' }}>{stream.sellerName}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>· {new Date(stream.endedAt).toLocaleDateString()} · {mm}:{ss}</Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 18 }}>
          <Stat label="Peak viewers" value={fmtK(stream.peakViewers)} icon="eye" />
          <Stat label="Total likes" value={fmtK(stream.totalLikes)} icon="heart" />
          <Stat label="Sales count" value={String(stream.totalSales)} icon="cart" />
          <Stat label="Sales value" value={price(stream.salesValue, { dec: 0 })} icon="wallet" accent="#22C55E" />
          {stream.tipsValue > 0 && <Stat label="Tips" value={price(stream.tipsValue, { dec: 0 })} icon="gift" accent="#FFB339" />}
          <Stat label="Duration" value={`${mm}:${ss}`} icon="clock" />
        </View>

        {/* Featured product */}
        {prod && (
          <>
            <SectionTitle title="Featured product" />
            <View style={{ marginHorizontal: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 60, height: 60, borderRadius: t.radius * 0.7, overflow: 'hidden' }}>
                <Thumb seed={prod.seed} imageUrl={prod.images?.[0]} style={{ width: '100%', height: '100%' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }} numberOfLines={1}>{prod.name}</Text>
                <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{prod.brand}</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: t.buy, marginTop: 4 }}>{price(prod.price)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Polls */}
        {stream.polls.length > 0 && (
          <>
            <SectionTitle title="Polls run during stream" />
            {stream.polls.map((p, i) => {
              const total = Math.max(1, p.votes.reduce((a, b) => a + b, 0));
              return (
                <View key={i} style={{ marginHorizontal: 18, marginBottom: 10, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: t.text, marginBottom: 10 }}>📊 {p.question}</Text>
                  {p.options.map((opt, k) => {
                    const pct = (p.votes[k] / total) * 100;
                    return (
                      <View key={k} style={{ marginBottom: 7 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: t.text, fontSize: 12.5, fontWeight: '600' }}>{opt}</Text>
                          <Text style={{ color: t.textDim, fontSize: 11.5 }}>{p.votes[k]} · {pct.toFixed(0)}%</Text>
                        </View>
                        <View style={{ height: 5, borderRadius: 99, backgroundColor: t.surface2, overflow: 'hidden' }}>
                          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 5, width: `${pct}%`, borderRadius: 99 }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}

        {/* Chat highlights */}
        {stream.highlights.length > 0 && (
          <>
            <SectionTitle title="Chat highlights" />
            <View style={{ marginHorizontal: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, gap: 8 }}>
              {stream.highlights.map((h) => (
                <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: h.buyIntent ? t.buy : t.accent1 }}>{h.user}</Text>
                  <Text style={{ fontSize: 12.5, color: t.text, flex: 1 }} numberOfLines={2}>{h.text}</Text>
                  {h.buyIntent && <Icon name="check" size={11} color={t.buy} stroke={2.5} />}
                  {h.tipAmount && (
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,179,57,0.2)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFB339' }}>+${h.tipAmount}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { t } = useTheme();
  return (
    <Text style={{ marginTop: 18, marginBottom: 10, paddingHorizontal: 22, fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>
      {title}
    </Text>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ width: '47%', padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
      <Icon name={icon} size={16} color={accent || t.accent1} />
      <Text style={{ fontSize: 20, fontWeight: '800', color: accent || t.text, marginTop: 6 }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: t.textDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
