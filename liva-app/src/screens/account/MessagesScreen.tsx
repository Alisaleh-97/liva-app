// Messages — conversation list and full chat thread.
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras, Conversation } from '@/state/AppExtras';
import { isRTL } from '@/i18n';

export function MessagesScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { conversations, markConversationRead } = useExtras();
  const [open, setOpen] = useState<Conversation | null>(null);

  if (open) return <ChatThread peer={open} onBack={() => setOpen(null)} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {conversations.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name="comment" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>No messages yet</Text>
          <Text style={{ fontSize: 13, color: t.textDim, marginTop: 6, textAlign: 'center' }}>Reach out to sellers from any product page.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 60 }}>
          {conversations.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => { markConversationRead(c.id); setOpen(c); }}
              style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', gap: 12, alignItems: 'center' }}
            >
              <Avatar seed={c.peerSeed} size={44} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{c.peerName}</Text>
                  <Text style={{ fontSize: 11, color: t.textDim }}>{new Date(c.lastAt).toLocaleDateString()}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 13, color: c.unread > 0 ? t.text : t.textDim, marginTop: 3 }}>{c.lastMessage}</Text>
              </View>
              {c.unread > 0 && (
                <View style={{ minWidth: 22, paddingHorizontal: 6, height: 22, borderRadius: 11, backgroundColor: t.accent1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{c.unread}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ChatThread({ peer, onBack }: { peer: Conversation; onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { conversations, sendMessage } = useExtras();
  const [text, setText] = useState('');
  const sv = useRef<ScrollView>(null);
  // Pull latest snapshot of this convo (state may have updated)
  const c = conversations.find((x) => x.id === peer.id) || peer;

  useEffect(() => { sv.current?.scrollToEnd({ animated: true }); }, [c.messages.length]);

  function send() {
    if (!text.trim()) return;
    sendMessage(c.id, c.peerName, c.peerSeed, text.trim());
    setText('');
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Avatar seed={c.peerSeed} size={36} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: t.text, flex: 1 }}>{c.peerName}</Text>
      </View>
      <ScrollView ref={sv} contentContainerStyle={{ padding: 16, paddingBottom: 16, gap: 8 }}>
        {c.messages.map((m) => (
          <View key={m.id} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
            {m.from === 'me' ? (
              <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderBottomRightRadius: 4 }}>
                <Text style={{ color: '#fff', fontSize: 14 }}>{m.text}</Text>
              </LinearGradient>
            ) : (
              <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderTopLeftRadius: 4 }}>
                <Text style={{ color: t.text, fontSize: 14 }}>{m.text}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 46, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 999, gap: 8 }}>
          <Icon name="comment" size={16} color={t.textDim} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            placeholder="Type a message…"
            placeholderTextColor={t.textDim}
            style={{ flex: 1, color: t.text, fontSize: 14 }}
            returnKeyType="send"
          />
        </View>
        <Pressable onPress={send} style={{ width: 46, height: 46, borderRadius: 23, overflow: 'hidden' }}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function btn(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
