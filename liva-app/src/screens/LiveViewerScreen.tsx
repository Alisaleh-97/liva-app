// Buyer-side live experience. Presence, chat, and reactions are synchronized
// through the backend; purchase controls stay pinned within thumb reach.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Thumb } from '@/components/Thumb';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { EmojiBurst, ReactionKind, CoinBurst } from '@/components/StreamEffects';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras } from '@/state/AppExtras';
import { useApp } from '@/state/AppContext';
import { Stream, SELLERS, byId, Product } from '@/data';
import { t as tr, price, fmtK, pname } from '@/i18n';
import { tap } from '@/lib/haptics';
import { useLiveRoom } from '@/lib/useLiveRoom';

const REACTIONS: { kind: ReactionKind; emoji: string }[] = [
  { kind: 'heart', emoji: '❤️' }, { kind: 'fire', emoji: '🔥' },
  { kind: 'money', emoji: '🤑' }, { kind: 'clap', emoji: '👏' },
  { kind: 'laugh', emoji: '😂' }, { kind: 'wow', emoji: '🤩' },
];
const TIP_AMOUNTS = [1, 5, 10, 25];

interface Props {
  stream: Stream;
  onClose: () => void;
  onBuy: (p: Product) => void;
}

export function LiveViewerScreen({ stream, onClose, onBuy }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { preferences, followedSellers, toggleFollow } = useExtras();
  const { awardCoins } = useApp();
  const product = byId[stream.product];
  const host = SELLERS.find((s) => s.id === stream.host)!;
  const isFollowed = followedSellers.includes(host.id);
  const W = Dimensions.get('window').width;
  const liveRoom = useLiveRoom(`product:${stream.product}`);
  const roomMessages = liveRoom.messages.map((message) => ({
    id: message.id,
    user: message.mine ? 'You' : message.userName,
    text: message.text,
    seed: message.avatarSeed,
  }));

  const [localMessages, setMessages] = useState<Array<{ id: string; user: string; text: string; seed: string }>>([]);
  const messages = [...roomMessages, ...localMessages].slice(-100);
  const [composer, setComposer] = useState('');
  const [reactions, setReactions] = useState<Array<{ id: string; kind: ReactionKind; xPercent: number }>>([]);
  const [tipOpen, setTipOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [rewardToast, setRewardToast] = useState<{ id: number; amount: number } | null>(null);
  const [raffle, setRaffle] = useState<{ id: number; prize: string; endsIn: number; entered: boolean } | null>(null);
  const [poll, setPoll] = useState<{ id: number; question: string; options: string[]; votes: number[]; myVote: number | null; endsIn: number } | null>(null);
  // Auto product tag — the AI "detects" mentioned product and flashes a tag
  const [autoTag, setAutoTag] = useState<{ id: number; visible: boolean } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // VS Battle mode — kicks in at 60s. Second host + team vote overlay.
  const [vsBattle, setVsBattle] = useState<{ teamA: number; teamB: number; ended: boolean } | null>(null);
  useEffect(() => {
    if (elapsed === 60 && !vsBattle) {
      setVsBattle({ teamA: 148, teamB: 132, ended: false });
    }
  }, [elapsed, vsBattle]);
  useEffect(() => {
    if (!vsBattle || vsBattle.ended) return;
    const int = setInterval(() => {
      setVsBattle((b) => {
        if (!b) return null;
        return {
          teamA: b.teamA + Math.floor(Math.random() * 4),
          teamB: b.teamB + Math.floor(Math.random() * 4),
          ended: b.teamA + b.teamB > 800,
        };
      });
    }, 1200);
    return () => clearInterval(int);
  }, [vsBattle]);

  // Guest live — someone joins at 30s as a floating panel
  const [guest, setGuest] = useState<{ name: string; seed: string } | null>(null);
  useEffect(() => {
    if (elapsed === 30 && !guest) {
      setGuest({ name: 'Layla', seed: 'guest-layla' });
    }
  }, [elapsed, guest]);

  // Auto product tag — flashes every 20s starting at 5s, visible for 4s
  useEffect(() => {
    if (elapsed > 0 && elapsed % 20 === 5) {
      setAutoTag({ id: Date.now(), visible: true });
      const timeout = setTimeout(() => setAutoTag(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [elapsed]);

  // Interactive poll — kicks off 20s into stream. Fires once per session.
  useEffect(() => {
    if (elapsed === 20 && !poll) {
      const polls = [
        { question: 'Which color would you buy?', options: ['🖤 Black', '🤍 White', '❤️ Red'] },
        { question: 'What size do you want next?', options: ['S', 'M', 'L', 'XL'] },
        { question: 'Should I unbox it now?', options: ['Yes! 🙌', 'Wait 5 min', 'Save for later'] },
      ];
      const p = polls[Math.floor(Math.random() * polls.length)];
      setPoll({
        id: Date.now(), question: p.question, options: p.options,
        // seed with some existing votes so bars aren't empty
        votes: p.options.map(() => 15 + Math.floor(Math.random() * 45)),
        myVote: null, endsIn: 30,
      });
    }
  }, [elapsed, poll]);

  useEffect(() => {
    if (!poll) return;
    if (poll.endsIn <= 0) {
      const t = setTimeout(() => setPoll(null), 5000);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => setPoll((p) => {
      if (!p) return null;
      // Other viewers keep voting during the poll
      const bumpIdx = Math.floor(Math.random() * p.options.length);
      const newVotes = p.votes.map((v, i) => i === bumpIdx ? v + Math.floor(Math.random() * 3) : v);
      return { ...p, endsIn: p.endsIn - 1, votes: newVotes };
    }), 1000);
    return () => clearTimeout(timer);
  }, [poll]);

  // Flash raffle — kicks off once, 45 seconds into the stream, and gives
  // viewers 20 seconds to tap "Enter" for a chance at a prize.
  useEffect(() => {
    if (elapsed === 45 && !raffle) {
      const prizes = ['Free product', '50% off code', '100 LIVA coins', 'Priority support'];
      setRaffle({ id: Date.now(), prize: prizes[Math.floor(Math.random() * prizes.length)], endsIn: 20, entered: false });
    }
  }, [elapsed, raffle]);

  // Tick down the raffle countdown
  useEffect(() => {
    if (!raffle) return;
    if (raffle.endsIn <= 0) {
      const t = setTimeout(() => setRaffle(null), 3000);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => setRaffle((r) => r ? { ...r, endsIn: r.endsIn - 1 } : null), 1000);
    return () => clearTimeout(timer);
  }, [raffle]);

  // Live viewing rewards — every 30 seconds of watching earns +5 coins.
  // Toast pops on-screen briefly to reinforce the loop.
  useEffect(() => {
    if (elapsed > 0 && elapsed % 30 === 0) {
      awardCoins('Live viewing reward', 5);
      setRewardToast({ id: Date.now(), amount: 5 });
      const timeout = setTimeout(() => setRewardToast(null), 2500);
      return () => clearTimeout(timeout);
    }
  }, [elapsed, awardCoins]);

  useEffect(() => {
    const tickId = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(tickId);
  }, []);

  useEffect(() => {
    if (liveRoom.lastReaction) spawnReaction(liveRoom.lastReaction.kind);
  }, [liveRoom.lastReaction]);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages.length]);

  function spawnReaction(kind: ReactionKind) {
    const id = 'r' + Date.now() + Math.random();
    setReactions((p) => [...p.slice(-18), { id, kind, xPercent: 0.5 + (Math.random() - 0.5) * 0.4 }]);
    setTimeout(() => setReactions((p) => p.filter((r) => r.id !== id)), 2000);
  }

  function sendReaction(kind: ReactionKind) {
    // The server echoes the event to every device, including this one.
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

  function handleTip(amount: number) {
    setCoinTrigger((c) => c + 1);
    setMessages((m) => [...m.slice(-40), { id: 'tip' + Date.now(), user: 'You', text: `tipped $${amount}! 💰`, seed: 'me' }]);
    setTipOpen(false);
    tap('success', preferences.haptics);
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Thumb seed={stream.id + host.seed} vivid style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.25, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Top bar: host card + close */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 }}>
          <Avatar seed={host.seed} size={28} verified={host.verified} />
          <View>
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800' }}>{host.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{fmtK(host.sales)} sales</Text>
          </View>
          <Pressable
            onPress={() => { tap('light', preferences.haptics); toggleFollow(host.id); }}
            style={{ marginLeft: 6, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: isFollowed ? 'rgba(255,255,255,0.18)' : '#fff' }}
          >
            <Text style={{ color: isFollowed ? '#fff' : '#000', fontSize: 11.5, fontWeight: '800' }}>{isFollowed ? 'Following' : 'Follow'}</Text>
          </Pressable>
        </View>
        <Badge kind="live">LIVE · {mins}:{secs}</Badge>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }}>
          <Icon name="eye" size={12} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{fmtK(liveRoom.viewers)}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Stream title */}
      <View style={{ position: 'absolute', top: insets.top + 60, left: 14, right: 14 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 }} numberOfLines={2}>
          {stream.title}
        </Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: liveRoom.connection === 'live' ? '#00E672' : '#FFB339' }} />
          <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '800' }}>{liveRoom.connection === 'live' ? 'REALTIME CONNECTED' : 'RECONNECTING'}</Text>
        </View>
      </View>

      <EmojiBurst reactions={reactions} />
      <CoinBurst trigger={coinTrigger} />

      {/* VS Battle overlay — split-screen vote bar between two hosts */}
      {vsBattle && (() => {
        const total = vsBattle.teamA + vsBattle.teamB || 1;
        const aPct = Math.round((vsBattle.teamA / total) * 100);
        const bPct = 100 - aPct;
        const aWinning = vsBattle.teamA > vsBattle.teamB;
        return (
          <View style={{ position: 'absolute', top: insets.top + 50, left: 12, right: 12, zIndex: 22 }}>
            <View style={{ padding: 12, backgroundColor: 'rgba(11,7,20,0.92)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,42,157,0.4)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 15 }}>⚔️</Text>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>VS BATTLE {vsBattle.ended ? '· ENDED' : `· LIVE`}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Avatar seed={host.seed} size={40} />
                  <Text numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginTop: 4 }}>{host.name}</Text>
                  <Text style={{ color: aWinning ? t.buy : t.textDim, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{aPct}%</Text>
                </View>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.live, alignItems: 'center', justifyContent: 'center', shadowColor: t.live, shadowOpacity: 0.6, shadowRadius: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>VS</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Avatar seed="rival-star" size={40} />
                  <Text numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginTop: 4 }}>Rival Star</Text>
                  <Text style={{ color: !aWinning ? t.buy : t.textDim, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{bPct}%</Text>
                </View>
              </View>
              {/* Vote bar */}
              <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
                <View style={{ width: `${aPct}%`, backgroundColor: t.accent1 }} />
                <View style={{ width: `${bPct}%`, backgroundColor: '#FF6E40' }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                <Pressable disabled={vsBattle.ended} onPress={() => setVsBattle((b) => b ? { ...b, teamA: b.teamA + 1 } : null)} style={{ flex: 1, paddingVertical: 8, borderRadius: 999, backgroundColor: t.accent1, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Vote {host.name}</Text>
                </Pressable>
                <Pressable disabled={vsBattle.ended} onPress={() => setVsBattle((b) => b ? { ...b, teamB: b.teamB + 1 } : null)} style={{ flex: 1, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FF6E40', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Vote Rival Star</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })()}

      {/* Guest joined — floating panel with second avatar (co-host style) */}
      {guest && (
        <View style={{ position: 'absolute', top: insets.top + 200, right: 12, zIndex: 21 }}>
          <View style={{ padding: 8, backgroundColor: 'rgba(11,7,20,0.9)', borderRadius: 14, borderWidth: 1, borderColor: t.accent2, alignItems: 'center', gap: 4, width: 84 }}>
            <View style={{ position: 'relative' }}>
              <Avatar seed={guest.seed} size={54} />
              <View style={{ position: 'absolute', bottom: -3, left: 0, right: 0, paddingHorizontal: 5, paddingVertical: 1.5, backgroundColor: t.accent2, borderRadius: 999, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.3 }}>GUEST</Text>
              </View>
            </View>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{guest.name}</Text>
            <Pressable onPress={() => setGuest(null)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={10} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Auto product tag — AI detected the mentioned product; tap to buy */}
      {autoTag && product && (
        <Pressable
          onPress={() => onBuy(product)}
          style={{ position: 'absolute', bottom: 220, left: 14, right: 14, zIndex: 23 }}
        >
          <View style={{ padding: 10, backgroundColor: 'rgba(11,7,20,0.92)', borderRadius: 16, borderWidth: 1, borderColor: t.accent1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden' }}>
              <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: t.accent1, letterSpacing: 0.5 }}>✨ AI TAGGED</Text>
              </View>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 1 }}>{pname(product)}</Text>
              <Text style={{ color: t.buy, fontSize: 12.5, fontWeight: '800', marginTop: 1 }}>{price(product.price)}</Text>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: t.buy }}>
              <Text style={{ color: '#04210f', fontSize: 12, fontWeight: '800' }}>Buy</Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* Interactive poll — floating widget with live vote bars */}
      {poll && (
        <View style={{ position: 'absolute', top: insets.top + 100, left: 14, right: 14, zIndex: 24 }}>
          <View style={{ padding: 14, backgroundColor: 'rgba(11,7,20,0.9)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.5)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14 }}>📊</Text>
                <Text style={{ color: t.accent1, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 }}>LIVE POLL</Text>
              </View>
              <Text style={{ color: t.textDim, fontSize: 10.5, fontWeight: '700' }}>{poll.endsIn > 0 ? `${poll.endsIn}s` : 'Results'}</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10 }}>{poll.question}</Text>
            <View style={{ gap: 6 }}>
              {poll.options.map((opt, i) => {
                const total = poll.votes.reduce((s, v) => s + v, 0) || 1;
                const pct = Math.round((poll.votes[i] / total) * 100);
                const mine = poll.myVote === i;
                return (
                  <Pressable
                    key={opt}
                    disabled={poll.myVote != null || poll.endsIn <= 0}
                    onPress={() => {
                      setPoll((p) => p ? { ...p, myVote: i, votes: p.votes.map((v, j) => j === i ? v + 1 : v) } : null);
                      tap('light', preferences.haptics);
                    }}
                    style={{ position: 'relative', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.surface2, overflow: 'hidden' }}
                  >
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: mine ? t.accent2 : t.accent1, opacity: 0.4 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: mine ? '800' : '600' }}>{mine ? '✓ ' : ''}{opt}</Text>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{pct}%</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Flash raffle popup — appears 45s into stream, 20s to enter */}
      {raffle && (
        <View style={{ position: 'absolute', top: insets.top + 140, left: 14, right: 14, zIndex: 25 }}>
          <LinearGradient colors={['#FF1744', '#FF6E40', '#FFB339']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 14, shadowColor: '#FF1744', shadowOpacity: 0.5, shadowRadius: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 32 }}>🎁</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800', letterSpacing: 1 }}>FLASH RAFFLE</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginTop: 2 }}>Win: {raffle.prize}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 }}>{raffle.endsIn > 0 ? `Ends in ${raffle.endsIn}s` : (raffle.entered ? "You're entered! 🍀" : 'Ended')}</Text>
              </View>
              {raffle.endsIn > 0 && (
                <Pressable
                  onPress={() => { setRaffle((r) => r ? { ...r, entered: true } : null); tap('success', preferences.haptics); }}
                  disabled={raffle.entered}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: raffle.entered ? 'rgba(255,255,255,0.4)' : '#fff', borderRadius: 999 }}
                >
                  <Text style={{ color: '#1a1030', fontSize: 12.5, fontWeight: '800' }}>{raffle.entered ? '✓ Entered' : 'Enter'}</Text>
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Live viewing reward pill — pops in when the 30s tick fires */}
      {rewardToast && (
        <View style={{ position: 'absolute', top: insets.top + 100, alignSelf: 'center', left: 0, right: 0, alignItems: 'center', zIndex: 20 }} pointerEvents="none">
          <LinearGradient colors={['#00E672', '#065F46']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, shadowColor: '#00E672', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
            <Text style={{ fontSize: 18 }}>🪙</Text>
            <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '800', letterSpacing: -0.1 }}>+{rewardToast.amount} coins · watching bonus</Text>
          </LinearGradient>
        </View>
      )}

      {/* Chat — scrollable column above the buy bar */}
      <View style={{ position: 'absolute', left: 12, right: 80, bottom: 165, top: insets.top + 110, justifyContent: 'flex-end' }}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {messages.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: 'rgba(0,0,0,0.42)', paddingVertical: 5, paddingHorizontal: 11, paddingLeft: 5, borderRadius: 999 }}>
              <Avatar seed={m.seed} size={22} />
              <Text style={{ color: m.user === 'You' ? '#FFB339' : '#fff', fontWeight: '700', fontSize: 12 }}>{m.user}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12.5, flex: 1 }} numberOfLines={2}>{m.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Featured product + Buy CTA */}
      {product && (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 70, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, padding: 8 }}>
          <View style={{ width: 46, height: 46, borderRadius: 9, overflow: 'hidden' }}>
            <Thumb seed={product.seed} imageUrl={product.images?.[0]} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 }}>FEATURED · LIVE</Text>
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>{pname(product)}</Text>
            <Text style={{ color: t.buy, fontSize: 13, fontWeight: '800', marginTop: 2 }}>{price(product.price)}</Text>
          </View>
          <BuyBtn small onPress={() => { tap('medium', preferences.haptics); onBuy(product); }}>Buy</BuyBtn>
        </View>
      )}

      {/* Right side rail — viewer-friendly: just react + tip */}
      <View style={{ position: 'absolute', right: 12, bottom: insets.bottom + 75, gap: 10, zIndex: 4 }}>
        <Pressable onPress={() => setReactionPickerOpen(true)} style={{ alignItems: 'center' }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>❤️</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 3 }}>React</Text>
        </Pressable>
        <Pressable onPress={() => setTipOpen(true)} style={{ alignItems: 'center' }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="wallet" size={20} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 3 }}>Tip</Text>
        </Pressable>
        <Pressable style={{ alignItems: 'center' }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="share" size={20} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 3 }}>Share</Text>
        </Pressable>
      </View>

      {/* Composer */}
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, height: 42, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 21 }}>
          <Icon name="comment" size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={composer}
            onChangeText={setComposer}
            onSubmitEditing={send}
            placeholder="Say something…"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{ flex: 1, color: '#fff', fontSize: 13 }}
            returnKeyType="send"
          />
        </View>
        <Pressable onPress={send} style={{ width: 42, height: 42, borderRadius: 21, overflow: 'hidden' }}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {liveRoom.error && (
        <Pressable
          onPress={liveRoom.clearError}
          style={{ position: 'absolute', left: 18, right: 18, bottom: insets.bottom + 62, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.94)', zIndex: 30 }}
        >
          <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700', textAlign: 'center' }}>{liveRoom.error}</Text>
        </Pressable>
      )}

      {/* Reaction picker */}
      <Modal visible={reactionPickerOpen} transparent animationType="fade" onRequestClose={() => setReactionPickerOpen(false)}>
        <Pressable onPress={() => setReactionPickerOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.65)', justifyContent: 'flex-end', paddingBottom: insets.bottom + 80 }}>
          <View style={{ marginHorizontal: 18, padding: 16, backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: t.text, marginBottom: 12, textAlign: 'center' }}>Send a reaction</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12 }}>
              {REACTIONS.map((r) => (
                <Pressable key={r.kind} onPress={() => sendReaction(r.kind)}>
                  <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Tip picker */}
      <Modal visible={tipOpen} transparent animationType="slide" onRequestClose={() => setTipOpen(false)}>
        <Pressable onPress={() => setTipOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.65)' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 }}>
          <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 14 }} />
          <Text style={{ fontSize: 22 }}>💰</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, marginTop: 6 }}>Tip {host.name}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, marginTop: 4, marginBottom: 18, lineHeight: 18 }}>
            Send a tip instantly. Coins rain across everyone's screen.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {TIP_AMOUNTS.map((amt) => (
              <Pressable
                key={amt}
                onPress={() => handleTip(amt)}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,179,57,0.14)', borderWidth: 1.5, borderColor: 'rgba(255,179,57,0.35)' }}
              >
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFB339' }}>${amt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
