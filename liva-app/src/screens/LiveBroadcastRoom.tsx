// LIVE BROADCAST ROOM - seller control surface. Presence, chat, and reactions
// are shared through the backend WebSocket room; visual selling tools remain
// responsive locally while the host is live.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Animated, Easing, Alert, Dimensions, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  Confetti, EmojiBurst, MilestonePulse, ViralBadge, FlashDealOverlay, CoinBurst, ReactionKind,
} from '@/components/StreamEffects';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/state/AuthContext';
import { useExtras, ChatHighlight, PollResult } from '@/state/AppExtras';
import { Product } from '@/data';
import { t as tr, price, fmtK, pname } from '@/i18n';
import { tap } from '@/lib/haptics';
import { useLiveRoom } from '@/lib/useLiveRoom';

interface ChatMsg {
  id: string;
  user: string;
  seed: string;
  text: string;
  buyIntent?: boolean;
  isTip?: boolean;
  tipAmount?: number;
}

const REACTIONS: { kind: ReactionKind; emoji: string; label: string }[] = [
  { kind: 'heart', emoji: '❤️', label: 'Love' },
  { kind: 'fire', emoji: '🔥', label: 'Fire' },
  { kind: 'money', emoji: '🤑', label: 'Take my money' },
  { kind: 'clap', emoji: '👏', label: 'Clap' },
  { kind: 'wow', emoji: '🤩', label: 'Wow' },
  { kind: 'laugh', emoji: '😂', label: 'LOL' },
];

const TIP_AMOUNTS = [1, 5, 10, 25];

interface Props {
  title: string;
  product: Product;
  salesGoal?: number;
  onClose: () => void;
}

export function LiveBroadcastRoom({ title, product, salesGoal: salesGoalProp = 5, onClose }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { preferences, saveStream } = useExtras();
  const liveRoom = useLiveRoom(`product:${product.id}`);

  // ── Core stream state ────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [composer, setComposer] = useState('');
  const viewers = liveRoom.viewers;
  const peakViewersRef = useRef(0);
  const [likes, setLikes] = useState(48);
  const [salesCount, setSalesCount] = useState(0);
  const [salesValue, setSalesValue] = useState(0);
  const [tipsTotal, setTipsTotal] = useState(0);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef(Date.now());
  const scrollRef = useRef<ScrollView>(null);
  const W = Dimensions.get('window').width;

  // ── Effects state ────────────────────────────────────────────────────────
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [milestone, setMilestone] = useState<{ trigger: number; label: string }>({ trigger: 0, label: '' });
  const [reactions, setReactions] = useState<Array<{ id: string; kind: ReactionKind; xPercent: number }>>([]);
  const seenMilestones = useRef<Set<number>>(new Set());
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  // ── Stream goal (sales count) — set by host in the setup screen ─────────
  const goal = salesGoalProp;

  // ── Flash deal ───────────────────────────────────────────────────────────
  const [flashActive, setFlashActive] = useState(false);
  const [flashSecondsLeft, setFlashSecondsLeft] = useState(0);
  const flashNewPrice = product.price * 0.7;

  // ── Poll ─────────────────────────────────────────────────────────────────
  const [poll, setPoll] = useState<PollResult | null>(null);
  const [pollPickerOpen, setPollPickerOpen] = useState(false);
  const collectedPollsRef = useRef<PollResult[]>([]);

  // ── Tip flow ─────────────────────────────────────────────────────────────
  const [tipOpen, setTipOpen] = useState(false);

  // ── Giveaway ─────────────────────────────────────────────────────────────
  const [giveawayWinner, setGiveawayWinner] = useState<string | null>(null);

  // ── End dialog ───────────────────────────────────────────────────────────
  const [endConfirm, setEndConfirm] = useState(false);

  // Track viral mode (>50% growth in last 30s)
  const [viral, setViral] = useState(false);
  const recentViewersRef = useRef<{ at: number; v: number }[]>([]);

  // ── Tick loop: every second ──────────────────────────────────────────────
  useEffect(() => {
    if (ended) return;
    const tick = setInterval(() => {
      setElapsed((s) => s + 1);

    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  // Server-authoritative viewers and chat replace the old random counters and
  // bot messages. This effect also keeps the seller's replay metrics accurate.
  useEffect(() => {
    if (viewers > peakViewersRef.current) peakViewersRef.current = viewers;
    const now = Date.now();
    recentViewersRef.current = [
      ...recentViewersRef.current.filter((row) => now - row.at < 30_000),
      { at: now, v: viewers },
    ];
    if (recentViewersRef.current.length >= 3) {
      const first = recentViewersRef.current[0].v;
      const last = recentViewersRef.current[recentViewersRef.current.length - 1].v;
      setViral(first > 0 && last > first * 1.5 && viewers > 10);
    }
  }, [viewers]);

  useEffect(() => {
    setMessages(liveRoom.messages.map((message) => {
      const tipMatch = message.text.match(/^tipped \$(\d+(?:\.\d+)?)!/i);
      return {
        id: message.id,
        user: message.mine ? (user?.firstName || 'You') : message.userName,
        seed: message.avatarSeed,
        text: message.text,
        buyIntent: /buy|stock|ship|deal|price/i.test(message.text),
        isTip: !!tipMatch,
        tipAmount: tipMatch ? Number(tipMatch[1]) : undefined,
      };
    }));
  }, [liveRoom.messages, user?.firstName]);

  useEffect(() => {
    if (liveRoom.lastReaction) spawnReaction(liveRoom.lastReaction.kind);
  }, [liveRoom.lastReaction]);

  // Flash deal countdown
  useEffect(() => {
    if (!flashActive) return;
    const t = setInterval(() => setFlashSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [flashActive]);

  // Milestone detection
  useEffect(() => {
    const milestones = [100, 250, 500, 1000, 2500, 5000];
    for (const m of milestones) {
      if (viewers >= m && !seenMilestones.current.has(m)) {
        seenMilestones.current.add(m);
        setMilestone({ trigger: Date.now(), label: fmtK(m) + ' viewers!' });
        setConfettiTrigger((c) => c + 1);
        break;
      }
    }
  }, [viewers]);

  // Scroll chat to bottom
  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages.length]);

  // ── Actions ──────────────────────────────────────────────────────────────
  function spawnReaction(kind: ReactionKind) {
    const id = 'r' + Date.now() + Math.random();
    const xPercent = 0.5 + (Math.random() - 0.5) * 0.5;
    setReactions((p) => [...p.slice(-20), { id, kind, xPercent }]);
    setLikes((l) => l + 1);
    setTimeout(() => setReactions((p) => p.filter((r) => r.id !== id)), 2000);
  }

  function sendReaction(kind: ReactionKind) {
    if (!liveRoom.sendReaction(kind)) spawnReaction(kind);
    tap('light', preferences.haptics);
    setReactionPickerOpen(false);
  }

  function send() {
    if (!composer.trim()) return;
    if (!liveRoom.sendChat(composer)) return;
    setComposer('');
    tap('light', preferences.haptics);
  }

  function startFlashDeal() {
    setFlashActive(true);
    setFlashSecondsLeft(180); // 3 minutes
    tap('medium', preferences.haptics);
  }

  function startPoll(question: string, options: string[]) {
    setPoll({ question, options, votes: options.map(() => 0) });
    setPollPickerOpen(false);
    // Auto-generate votes during the poll life
    let ticks = 0;
    const voteTick = setInterval(() => {
      ticks++;
      setPoll((p) => p ? { ...p, votes: p.votes.map((v) => v + Math.floor(Math.random() * 3)) } : p);
      if (ticks >= 20) clearInterval(voteTick);
    }, 800);
  }

  function closePoll() {
    if (poll) collectedPollsRef.current.push(poll);
    setPoll(null);
  }

  function sendTip(amount: number) {
    setTipsTotal((t) => t + amount);
    setCoinTrigger((c) => c + 1);
    liveRoom.sendChat(`tipped $${amount}!`);
    setTipOpen(false);
    tap('success', preferences.haptics);
  }

  function pickGiveawayWinner() {
    const candidates = Array.from(new Set(messages.filter((m) => !m.isTip).map((m) => m.user)));
    if (candidates.length === 0) {
      Alert.alert('Giveaway', 'Wait for viewers to chat first.');
      return;
    }
    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    setGiveawayWinner(winner);
    setConfettiTrigger((c) => c + 1);
    setTimeout(() => setGiveawayWinner(null), 4500);
  }

  function endStream() {
    setEndConfirm(true);
  }

  function confirmEndStream() {
    setEndConfirm(false);

    // Save the stream as a replay
    const highlights: ChatHighlight[] = messages.slice(-30).map((m) => ({
      id: m.id, user: m.user, text: m.text, at: Date.now(),
      buyIntent: m.buyIntent, tipAmount: m.tipAmount,
    }));
    saveStream({
      sellerName: user?.businessName || user?.name || 'Seller',
      sellerSeed: user?.avatarSeed || 'me',
      title,
      productId: product.id,
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      durationSec: elapsed,
      peakViewers: peakViewersRef.current,
      totalLikes: likes,
      totalSales: salesCount,
      salesValue,
      tipsValue: tipsTotal,
      highlights,
      polls: collectedPollsRef.current,
      thumbnail: product.seed,
    });

    setEnded(true);
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  const sellerName = user?.businessName || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Seller';

  // ── End screen ──────────────────────────────────────────────────────────
  if (ended) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 30 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <LinearGradient
            colors={t.accentGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 90, height: 90, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}
          >
            <Icon name="check" size={48} color="#fff" stroke={3} />
          </LinearGradient>
          <Text style={{ fontSize: 26, fontWeight: '800', color: t.text }}>{tr('streamEnded')}</Text>
          <Text style={{ fontSize: 14, color: t.textDim, marginTop: 6, marginBottom: 8 }}>{mins}:{secs} live</Text>
          <Text style={{ fontSize: 12, color: t.buy, marginBottom: 28, fontWeight: '700' }}>✓ Replay saved to Past Lives</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, width: '100%' }}>
            <StatBox label="VIEWERS" value={fmtK(peakViewersRef.current)} />
            <StatBox label="LIKES" value={fmtK(likes)} icon="heart" />
            <StatBox label="SALES" value={`${salesCount} · ${price(salesValue, { dec: 0 })}`} icon="cart" />
          </View>
          {tipsTotal > 0 && (
            <View style={{ width: '100%', padding: 14, backgroundColor: 'rgba(255,179,57,0.14)', borderWidth: 1, borderColor: 'rgba(255,179,57,0.35)', borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Text style={{ fontSize: 22 }}>💰</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#FFB339', fontWeight: '800', letterSpacing: 0.5 }}>TIPS COLLECTED</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{price(tipsTotal)}</Text>
              </View>
            </View>
          )}

          <BuyBtn full onPress={onClose} style={{ height: 52, marginTop: 8 }}>{tr('backToDash')}</BuyBtn>
        </View>
      </View>
    );
  }

  // ── Active stream ───────────────────────────────────────────────────────
  const currentPrice = flashActive ? flashNewPrice : product.price;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Camera placeholder */}
      <Thumb seed={product.seed + 'live'} vivid style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.25, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Top bar */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
          <Avatar seed={user?.avatarSeed || 'me'} size={28} verified={user?.verified} />
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>{sellerName}</Text>
        </View>
        <Badge kind="live">LIVE · {mins}:{secs}</Badge>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }}>
          <Icon name="eye" size={12} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{fmtK(viewers)}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={endStream} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: t.live }}>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{tr('endStream')}</Text>
        </Pressable>
      </View>

      {/* Stream title */}
      <View style={{ position: 'absolute', top: insets.top + 56, left: 14, right: 14 }}>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 }} numberOfLines={2}>
          {title}
        </Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: liveRoom.connection === 'live' ? '#00E672' : '#FFB339' }} />
          <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '800' }}>{liveRoom.connection === 'live' ? 'AUDIENCE SYNCED' : 'RECONNECTING'}</Text>
        </View>
      </View>

      {/* Goal progress */}
      <View style={{ position: 'absolute', top: insets.top + 100, left: 14, right: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 }}>SALES GOAL · {salesCount}/{goal}</Text>
          {salesCount >= goal && <Text style={{ color: '#22C55E', fontSize: 10.5, fontWeight: '800' }}>✓ HIT!</Text>}
        </View>
        <View style={{ height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 4, width: `${Math.min(100, (salesCount / goal) * 100)}%`, borderRadius: 99 }} />
        </View>
      </View>

      {/* Effects */}
      <Confetti trigger={confettiTrigger} />
      <CoinBurst trigger={coinTrigger} />
      <EmojiBurst reactions={reactions} />
      <MilestonePulse trigger={milestone.trigger} label={milestone.label} />
      <ViralBadge visible={viral} />
      <FlashDealOverlay
        active={flashActive}
        oldPrice={product.price}
        newPrice={flashNewPrice}
        secondsLeft={flashSecondsLeft}
        onExpire={() => setFlashActive(false)}
      />

      {/* Active poll */}
      {poll && (
        <View style={{ position: 'absolute', top: insets.top + 150, left: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.65)', padding: 12, borderRadius: 14, zIndex: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>📊 {poll.question}</Text>
            <Pressable onPress={closePoll}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Close</Text>
            </Pressable>
          </View>
          {poll.options.map((opt, i) => {
            const total = Math.max(1, poll.votes.reduce((a, b) => a + b, 0));
            const pct = (poll.votes[i] / total) * 100;
            return (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{opt}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' }}>{poll.votes[i]} · {pct.toFixed(0)}%</Text>
                </View>
                <View style={{ height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                  <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 5, width: `${pct}%`, borderRadius: 99 }} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Giveaway winner banner */}
      {giveawayWinner && (
        <View style={{ position: 'absolute', top: 200, left: 30, right: 30, zIndex: 9, padding: 18, borderRadius: 18, alignItems: 'center' }}>
          <LinearGradient colors={['#FFD700', '#FFB339']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, borderRadius: 18, alignItems: 'center', width: '100%' }}>
            <Text style={{ fontSize: 26 }}>🎁🎉</Text>
            <Text style={{ color: '#1a1030', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 }}>GIVEAWAY WINNER</Text>
            <Text style={{ color: '#1a1030', fontSize: 24, fontWeight: '800', marginTop: 6 }}>{giveawayWinner}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Chat list */}
      <View style={{ position: 'absolute', left: 12, right: 90, bottom: 165, top: insets.top + 175, justifyContent: 'flex-end', zIndex: 1 }}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 6 }}>
          {messages.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: m.isTip ? 'rgba(255,179,57,0.5)' : 'rgba(0,0,0,0.4)', paddingVertical: 5, paddingRight: 11, paddingLeft: 5, borderRadius: 999 }}>
              <Avatar seed={m.seed} size={22} />
              <Text style={{ color: m.isTip ? '#1a1030' : (m.buyIntent ? t.buy : '#fff'), fontWeight: '700', fontSize: 12 }}>{m.user}</Text>
              <Text style={{ color: m.isTip ? '#1a1030' : 'rgba(255,255,255,0.95)', fontSize: 12.5, flex: 1, fontWeight: m.isTip ? '800' : '400' }} numberOfLines={2}>{m.text}</Text>
              {m.buyIntent && !m.isTip && <Icon name="check" size={11} color={t.buy} stroke={2.5} />}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Pinned product card (bottom-left) */}
      <View style={{ position: 'absolute', left: 12, bottom: insets.bottom + 70, right: 90, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, padding: 7 }}>
        <View style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden' }}>
          <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5 }}>PINNED</Text>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>{pname(product)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
            {flashActive && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textDecorationLine: 'line-through' }}>{price(product.price)}</Text>}
            <Text style={{ color: flashActive ? '#FFB339' : t.buy, fontSize: 14, fontWeight: '800' }}>{price(currentPrice)}</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '700', backgroundColor: t.live, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
            {salesCount} {tr('sales')}
          </Text>
        </View>
      </View>

      {/* Right-side action rail */}
      <View style={{ position: 'absolute', right: 12, bottom: insets.bottom + 70, gap: 10, zIndex: 4 }}>
        <RightAction icon="bolt" label={flashActive ? 'Active' : 'Flash'} onPress={() => !flashActive && startFlashDeal()} accent={flashActive} />
        <RightAction icon="filter" label="Poll" onPress={() => setPollPickerOpen(true)} disabled={!!poll} />
        <RightAction icon="gift" label="Pick" onPress={pickGiveawayWinner} />
        <RightAction icon="wallet" label="Tip" onPress={() => setTipOpen(true)} />
        <Pressable onPress={() => setReactionPickerOpen(true)} style={{ alignItems: 'center' }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>❤️</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 3 }}>React</Text>
        </Pressable>
      </View>

      {/* Composer */}
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 12, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 4 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, height: 44, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 22 }}>
          <Icon name="comment" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={composer}
            onChangeText={setComposer}
            onSubmitEditing={send}
            placeholder={tr('chatPh')}
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{ flex: 1, color: '#fff', fontSize: 13 }}
            returnKeyType="send"
          />
        </View>
        <Pressable onPress={send} style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {liveRoom.error && (
        <Pressable
          onPress={liveRoom.clearError}
          style={{ position: 'absolute', left: 18, right: 18, bottom: insets.bottom + 64, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.94)', zIndex: 30 }}
        >
          <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700', textAlign: 'center' }}>{liveRoom.error}</Text>
        </Pressable>
      )}

      {/* Reaction picker modal */}
      <Modal visible={reactionPickerOpen} transparent animationType="fade" onRequestClose={() => setReactionPickerOpen(false)}>
        <Pressable onPress={() => setReactionPickerOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.65)', justifyContent: 'flex-end', paddingBottom: insets.bottom + 80 }}>
          <View style={{ marginHorizontal: 18, padding: 16, backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: t.text, marginBottom: 12, textAlign: 'center' }}>Send a reaction</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12 }}>
              {REACTIONS.map((r) => (
                <Pressable key={r.kind} onPress={() => sendReaction(r.kind)} style={{ alignItems: 'center', width: 80 }}>
                  <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
                  </View>
                  <Text style={{ color: t.text, fontSize: 11, fontWeight: '700', marginTop: 5 }}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Poll picker modal */}
      <PollPicker open={pollPickerOpen} onClose={() => setPollPickerOpen(false)} onCreate={startPoll} />

      {/* Tip picker modal */}
      <TipPicker open={tipOpen} onClose={() => setTipOpen(false)} onTip={sendTip} />

      {/* End confirm */}
      <ConfirmDialog
        visible={endConfirm}
        title="End the live stream?"
        message={`The replay will be saved to your Past Lives library with all stats and chat highlights.`}
        confirmLabel={tr('endStream')}
        destructive
        onConfirm={confirmEndStream}
        onCancel={() => setEndConfirm(false)}
      />
    </View>
  );
}

function RightAction({ icon, label, onPress, accent, disabled }: { icon: string; label: string; onPress: () => void; accent?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ alignItems: 'center', opacity: disabled ? 0.4 : 1 }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: accent ? '#FF3B5C' : 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color="#fff" />
      </View>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 3 }}>{label}</Text>
    </Pressable>
  );
}

function PollPicker({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (q: string, opts: string[]) => void }) {
  const { t } = useTheme();
  const [question, setQuestion] = useState('Which color should I drop next?');
  const [optA, setOptA] = useState('Rose Gold');
  const [optB, setOptB] = useState('Midnight Black');
  const [optC, setOptC] = useState('Sky Blue');
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.65)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36, gap: 12 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border }} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>Create a poll</Text>
        <Field label="Question" value={question} onChange={setQuestion} icon="comment" />
        <Field label="Option 1" value={optA} onChange={setOptA} icon="tag" />
        <Field label="Option 2" value={optB} onChange={setOptB} icon="tag" />
        <Field label="Option 3 (optional)" value={optC} onChange={setOptC} icon="tag" />
        <BuyBtn full onPress={() => onCreate(question, [optA, optB, optC].filter(Boolean))} style={{ height: 50, marginTop: 4 }}>Launch poll</BuyBtn>
      </View>
    </Modal>
  );
}

function TipPicker({ open, onClose, onTip }: { open: boolean; onClose: () => void; onTip: (amount: number) => void }) {
  const { t } = useTheme();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.65)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 14 }} />
        <Text style={{ fontSize: 22 }}>💰</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, marginTop: 6 }}>Send a tip</Text>
        <Text style={{ fontSize: 13, color: t.textDim, marginTop: 4, marginBottom: 18, lineHeight: 18 }}>
          Show some love. Tips arrive instantly with a gold coin animation everyone sees.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {TIP_AMOUNTS.map((amt) => (
            <Pressable
              key={amt}
              onPress={() => onTip(amt)}
              style={{ flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,179,57,0.14)', borderWidth: 1.5, borderColor: 'rgba(255,179,57,0.35)' }}
            >
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFB339' }}>${amt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon: string }) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '800', color: t.textDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 12, backgroundColor: t.surface2, borderRadius: 12 }}>
        <Icon name={icon} size={16} color={t.textDim} />
        <TextInput value={value} onChangeText={onChange} style={{ flex: 1, color: t.text, fontSize: 14 }} />
      </View>
    </View>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, alignItems: 'center' }}>
      {icon && <Icon name={icon} size={18} color={t.accent1} />}
      <Text style={{ fontSize: 18, fontWeight: '800', color: t.text, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: t.textDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
