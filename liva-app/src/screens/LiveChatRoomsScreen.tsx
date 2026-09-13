// Live Chat Rooms — topic-based chat rooms where shoppers hang out
// between live streams. Each room shows active member count, a preview of
// the latest message, and lets you tap in.

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { PressScale } from '@/components/PressScale';
import { useTheme } from '@/theme/ThemeContext';
import { isRTL } from '@/i18n';
import { useLiveRoom } from '@/lib/useLiveRoom';

interface Room {
  id: string;
  name: string;
  emoji: string;
  color: [string, string];
  members: number;
  hot: boolean;
  preview: string;
}

const ROOMS: Room[] = [
  { id: 'beauty',    name: 'Beauty Talk',      emoji: '💄', color: ['#FB7185', '#E11D48'], members: 342, hot: true,  preview: 'Sara: this serum is amazing 💫' },
  { id: 'tech',      name: 'Tech & Gadgets',   emoji: '📱', color: ['#22D3EE', '#0369A1'], members: 189, hot: false, preview: 'Tariq: which laptop should I get?' },
  { id: 'fashion',   name: 'Fashion Weekly',   emoji: '👗', color: ['#FF6EC7', '#B026FF'], members: 456, hot: true,  preview: 'Ahmad: fits check! 🔥' },
  { id: 'deals',     name: 'Deal Hunters',     emoji: '💰', color: ['#00E672', '#065F46'], members: 728, hot: true,  preview: 'Layla: 60% off ends in 20min' },
  { id: 'home',      name: 'Home & Living',    emoji: '🛋️', color: ['#D6B48A', '#8B5A2B'], members: 92,  hot: false, preview: 'Reem: kitchen makeover done ✨' },
  { id: 'fitness',   name: 'Fitness Fam',      emoji: '💪', color: ['#00E672', '#065F46'], members: 214, hot: false, preview: 'Noor: 30-day challenge starting Monday' },
  { id: 'auctions',  name: 'Auction Alerts',   emoji: '🔨', color: ['#FF1744', '#FF6E40'], members: 178, hot: true,  preview: 'Omar: sneakers @ $37 right now!' },
  { id: 'kids',      name: 'Parents Corner',   emoji: '🧒', color: ['#FFC53D', '#FF7A00'], members: 138, hot: false, preview: 'Maya: back-to-school haul thread' },
];

interface Props {
  onBack: () => void;
}

export function LiveChatRoomsScreen({ onBack }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);

  const room = openRoomId ? ROOMS.find((r) => r.id === openRoomId) : null;

  if (room) return <ChatRoomView room={room} onBack={() => setOpenRoomId(null)} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border }}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 22 }}>💬</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.4 }}>Chat Rooms</Text>
          </View>
          <Text style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>{ROOMS.length} realtime interest rooms</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 10 }}>
        {ROOMS.map((r) => (
          <PressScale key={r.id} onPress={() => setOpenRoomId(r.id)} scaleTo={0.98}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: t.radius }}>
              <LinearGradient colors={r.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: r.color[0], shadowOpacity: 0.4, shadowRadius: 8 }}>
                <Text style={{ fontSize: 26 }}>{r.emoji}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: t.text, letterSpacing: -0.1 }}>{r.name}</Text>
                  {r.hot && <View style={{ paddingHorizontal: 6, paddingVertical: 1.5, backgroundColor: t.live, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.3 }}>HOT</Text></View>}
                </View>
                <Text numberOfLines={1} style={{ fontSize: 12, color: t.textDim, marginTop: 3 }}>{r.preview}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.buy }} />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.text }}>Join</Text>
                </View>
                <Icon name={isRTL() ? 'chevL' : 'chevR'} size={14} color={t.textDim} />
              </View>
            </View>
          </PressScale>
        ))}
      </ScrollView>
    </View>
  );
}

// Realtime topic room shared across signed-in devices.
function ChatRoomView({ room, onBack }: { room: Room; onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const liveRoom = useLiveRoom(`community:${room.id}`);
  const [input, setInput] = useState('');
  const realtimeMessages = liveRoom.messages.map((message) => ({
    id: message.id,
    user: message.mine ? 'You' : message.userName,
    text: message.text,
    seed: message.avatarSeed,
    mine: message.mine,
  }));
  function send() {
    if (!input.trim()) return;
    if (!liveRoom.sendChat(input)) return;
    setInput('');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 0.5, borderBottomColor: t.border }}>
        <Pressable onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border }}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <LinearGradient colors={room.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>{room.emoji}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: t.text }}>{room.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: liveRoom.connection === 'live' ? t.buy : '#FFB339' }} />
            <Text style={{ fontSize: 11, color: t.textDim }}>{liveRoom.connection === 'live' ? `${liveRoom.viewers} online now` : 'reconnecting'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 8 }}>
        {realtimeMessages.length === 0 && (
          <View style={{ alignSelf: 'center', marginTop: 42, padding: 18, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
            <Icon name="comment" size={24} color={t.accent1} />
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 14, marginTop: 8 }}>Start the conversation</Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 3 }}>Messages are shared live across devices.</Text>
          </View>
        )}
        {realtimeMessages.map((m) => (
          <View key={m.id} style={{ alignSelf: m.mine ? 'flex-end' : 'flex-start', maxWidth: '78%', flexDirection: 'row', gap: 7, alignItems: 'flex-end' }}>
            {!m.mine && <Avatar seed={m.seed} size={26} />}
            <View style={{ backgroundColor: m.mine ? t.accent1 : t.surface, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderBottomLeftRadius: m.mine ? 16 : 4, borderBottomRightRadius: m.mine ? 4 : 16 }}>
              {!m.mine && <Text style={{ fontSize: 10.5, fontWeight: '800', color: t.accent1 }}>{m.user}</Text>}
              <Text style={{ color: m.mine ? '#fff' : t.text, fontSize: 13.5, lineHeight: 18, marginTop: m.mine ? 0 : 2 }}>{m.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 12, paddingBottom: Math.max(insets.bottom, 10) + 6, flexDirection: 'row', gap: 8, borderTopWidth: 0.5, borderTopColor: t.border }}>
        <View style={{ flex: 1, backgroundColor: t.surface, borderRadius: 24, paddingHorizontal: 14, height: 44, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            placeholder={`Message #${room.id}`}
            placeholderTextColor={t.textDim}
            style={{ flex: 1, color: t.text, fontSize: 14 }}
            returnKeyType="send"
          />
        </View>
        <Pressable onPress={send} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accent1 }}>
          <Icon name="send" size={19} color="#fff" />
        </Pressable>
      </View>

      {liveRoom.error && (
        <Pressable onPress={liveRoom.clearError} style={{ marginHorizontal: 12, marginBottom: 6, padding: 9, borderRadius: 12, backgroundColor: '#EF4444' }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12, fontWeight: '700' }}>{liveRoom.error}</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}
