// AI tab — commerce assistant wired to the Express backend (OpenAI).
// Also exposes a "product extraction" sheet via the Add-by-link chip.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { GradText } from '@/components/GradText';
import { LiveDot } from '@/components/LiveDot';
import { BuyBtn } from '@/components/BuyBtn';
import { Thumb } from '@/components/Thumb';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { AI_QUICK, AI_GREETING, byId, Product } from '@/data';
import { aiChat, aiExtract, ChatMessage } from '@/lib/api';
import { t as tr, getLocale, price, pname } from '@/i18n';
import { TabId } from '@/components/TabBar';

interface UIMessage {
  role: 'user' | 'ai';
  text: string;
  productIds?: string[];
  chips?: string[];
}

interface Props {
  onBuy: (p: Product) => void;
  onOpen: (p: Product) => void;
  onGoTab: (id: TabId) => void;
}

export function AIScreen({ onBuy, onOpen, onGoTab }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { addExtra } = useApp();
  const { lang } = getLocale();
  const [msgs, setMsgs] = useState<UIMessage[]>([
    { role: 'ai', text: AI_GREETING[lang] || AI_GREETING.en },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Add-by-link extraction state
  const [extractOpen, setExtractOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, typing]);

  async function ask(text: string) {
    if (!text.trim()) return;
    const userMsg: UIMessage = { role: 'user', text };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput('');
    setTyping(true);

    const history: ChatMessage[] = next.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));

    try {
      const res = await aiChat(history);
      setMsgs((m) => [
        ...m,
        { role: 'ai', text: res.text, productIds: res.productIds, chips: res.chips },
      ]);
    } catch (e: any) {
      // Fallback: when the backend / OpenAI isn't configured, use the canned
      // pattern-matching responses from the original LIVA web design so the
      // AI tab still works for demos. Production: this never runs.
      const demo = demoRespond(text);
      setMsgs((m) => [
        ...m,
        { role: 'ai', text: demo.text + (demo.usedDemo ? '\n\n(Demo mode — set OPENAI_API_KEY in server/.env for live responses.)' : ''),
          productIds: demo.products, chips: demo.chips },
      ]);
    } finally {
      setTyping(false);
    }
  }

  // Canned-response demo fallback when backend / OpenAI isn't available.
  function demoRespond(text: string): { text: string; products?: string[]; chips?: string[]; usedDemo: boolean } {
    const t = text.toLowerCase();
    if (/live|go live|when/.test(t))
      return { usedDemo: true, text: "Best window: Thursday 8–9 PM. Your beauty audience converts 2.3× then. Lead with the perfume drop — it's your top live mover.", chips: ['Schedule live', 'Go live now'] };
    if (/sell|promote/.test(t))
      return { usedDemo: true, text: "Promote the Pulse Pro Earbuds. Margin is healthy and search demand is up 41% this week. I'd bundle it with the GaN charger.", products: ['p2', 'p9'], chips: ['Promote now'] };
    if (/buy|trending|what should/.test(t))
      return { usedDemo: true, text: 'Two strong buys right now — both flagged by price + trend velocity:', products: ['p9', 'p5'], chips: ['Buy both'] };
    if (/market|analyz|trend/.test(t))
      return { usedDemo: true, text: 'Market read: Electronics demand +18% WoW, Beauty steady, Fashion cooling. Regional spike on runners. Reallocate ad spend toward tech.', chips: ['See full report'] };
    if (/price|pricing/.test(t))
      return { usedDemo: true, text: "Drop the Velvet Rose to $37.99 during live sessions only — elasticity data says you'll net +12% units with minimal margin hit.", products: ['p3'], chips: ['Apply pricing'] };
    return { usedDemo: true, text: 'On it. I can tell you what to buy, what to sell, when to go live, or read the market. Tap a quick action or ask away.', chips: [] };
  }

  async function runExtract() {
    if (!url.trim()) return;
    setExtracting(true);
    try {
      const r = await aiExtract(url.trim());
      if (r.error || !r.name) {
        Alert.alert(tr('extractFail'), r.error || 'No product detected.');
        return;
      }
      const newProduct: Product = {
        id: 'x' + Date.now(),
        name: r.name,
        brand: r.brand || 'External',
        audience: 'unisex',
        type: 'electronics',
        sub: 'Imported',
        price: r.price ?? 0,
        rating: 4.5,
        reviews: 0,
        seed: r.name.toLowerCase().replace(/\s+/g, '-'),
        badge: 'AI Pick',
        colors: [],
        sizes: [],
        stock: 99,
        ship: [3, 6],
        install: false,
        images: [],
      };
      newProduct.images = [newProduct.seed, newProduct.seed + '-2'];
      addExtra(newProduct);
      setExtractOpen(false);
      setUrl('');
      Alert.alert('Added to catalog', `${newProduct.name} is now in your Shop tab.`);
    } catch (e: any) {
      Alert.alert(tr('extractFail'), String(e?.message || e));
    } finally {
      setExtracting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 18,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="ai" size={22} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>
            LIVA <GradText>{tr('aiTitle')}</GradText>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <LiveDot size={6} color={t.buy} />
            <Text style={{ fontSize: 11.5, color: t.textDim }}>{tr('aiOnline')}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 14 }}>
        {/* Concierge suggestion grid — only for a fresh conversation */}
        {msgs.length <= 1 && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: t.textDim, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Try asking</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { icon: '🎁', text: 'Gift ideas under $50', color: '#FF2A9D' },
                { icon: '👗', text: 'Trending fashion this week', color: '#B026FF' },
                { icon: '💰', text: 'Best deals right now', color: '#00E672' },
                { icon: '🔥', text: "What's hot in beauty?", color: '#FF6E40' },
                { icon: '🎧', text: 'Recommend headphones', color: '#0EA5E9' },
                { icon: '🏠', text: 'Home upgrades I need', color: '#FBBF24' },
              ].map((s) => (
                <Pressable
                  key={s.text}
                  onPress={() => ask(s.text)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: `${s.color}44`, maxWidth: '48%' }}
                >
                  <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 12.5, color: t.text, fontWeight: '600' }}>{s.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <View key={i} style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
              <LinearGradient
                colors={t.accentGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderBottomRightRadius: 4 }}
              >
                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 19 }}>{m.text}</Text>
              </LinearGradient>
            </View>
          ) : (
            <View key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%', flexDirection: 'row', gap: 9 }}>
              <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="ai" size={15} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, padding: 12, borderRadius: 16, borderTopLeftRadius: 4 }}>
                  <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>{m.text}</Text>
                </View>
                {m.productIds && m.productIds.length > 0 && (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    {m.productIds
                      .map((id) => byId[id])
                      .filter(Boolean)
                      .map((p) => (
                        <Pressable
                          key={p.id}
                          onPress={() => onOpen(p)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, backgroundColor: t.surface2, borderRadius: t.radius * 0.85 }}
                        >
                          <View style={{ width: 42, height: 42, borderRadius: 9, overflow: 'hidden' }}>
                            <Thumb seed={p.seed} style={{ width: '100%', height: '100%' }} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '600', color: t.text }}>{pname(p)}</Text>
                            <Text style={{ fontSize: 12.5, fontWeight: '700', color: t.buy }}>{price(p.price)}</Text>
                          </View>
                          <BuyBtn small onPress={() => onBuy(p)}>Buy</BuyBtn>
                        </Pressable>
                      ))}
                  </View>
                )}
                {m.chips && m.chips.length > 0 && (
                  <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {m.chips.map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => (/live/i.test(c) ? onGoTab('live') : ask(c))}
                        style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.1)' }}
                      >
                        <Text style={{ color: t.accent1, fontSize: 12.5, fontWeight: '700' }}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )
        )}
        {typing && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="ai" size={15} color="#fff" />
            </LinearGradient>
            <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, padding: 13, borderRadius: 16, borderTopLeftRadius: 4 }}>
              <ActivityIndicator size="small" color={t.accent1} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingVertical: 10 }}>
        <Pressable
          onPress={() => setExtractOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}
        >
          <Icon name="link" size={16} color={t.accent1} />
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{tr('extractTitle')}</Text>
        </Pressable>
        {AI_QUICK.map((q) => (
          <Pressable
            key={q.id}
            onPress={() => (q.id === 'golive' ? onGoTab('live') : ask(tr(q.key)))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}
          >
            <Icon name={q.icon} size={16} color={t.accent1} />
            <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{tr(q.key)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Composer */}
      <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 999 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => ask(input)}
            placeholder={tr('aiPlaceholder')}
            placeholderTextColor={t.textDim}
            style={{ flex: 1, color: t.text, fontSize: 14 }}
            returnKeyType="send"
          />
          <Icon name="mic" size={18} color={t.textDim} />
        </View>
        <Pressable onPress={() => ask(input)}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* Extract sheet (simple inline overlay) */}
      {extractOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(4,2,10,0.6)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => setExtractOpen(false)} style={{ flex: 1 }} />
          <View style={{ backgroundColor: t.surface, padding: 18, paddingBottom: 36, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderColor: t.border, gap: 12 }}>
            <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border }} />
            <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>{tr('extractTitle')}</Text>
            <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 18 }}>
              Paste a product URL. Our AI will pull the name, brand, price, and a short description into your catalog.
            </Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder={tr('extractPaste') + '  e.g. https://store.example.com/item/123'}
              placeholderTextColor={t.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{ height: 46, paddingHorizontal: 14, backgroundColor: t.surface2, borderRadius: t.radius, color: t.text, fontSize: 14 }}
            />
            <BuyBtn full onPress={runExtract}>
              {extracting ? tr('extracting') : tr('extractAdd')}
            </BuyBtn>
          </View>
        </View>
      )}
    </View>
  );
}
