// Promotions list + inline create-new bottom sheet.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp, Promotion, PromoKind } from '@/state/AppContext';
import { t as tr, isRTL } from '@/i18n';

const KINDS: Array<{ id: PromoKind; key: string; icon: string }> = [
  { id: 'percent', key: 'promoPercent', icon: 'tag' },
  { id: 'fixed', key: 'promoFixed', icon: 'wallet' },
  { id: 'flash', key: 'promoFlash', icon: 'bolt' },
  { id: 'bundle', key: 'promoBundle', icon: 'gift' },
];

export function PromotionsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { promotions, addPromotion, togglePromotion, removePromotion } = useApp();
  const [sheet, setSheet] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('promotionsTitle')}</Text>
        <Pressable onPress={() => setSheet(true)} style={btn(t)}>
          <Icon name="plus" size={20} color={t.accent1} stroke={2.2} />
        </Pressable>
      </View>

      {promotions.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bolt" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr('noPromos')}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>{tr('noPromosSub')}</Text>
          <Pressable onPress={() => setSheet(true)} style={{ marginTop: 8, borderRadius: t.radius, overflow: 'hidden' }}>
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 }}>
              <Icon name="plus" size={16} color="#fff" stroke={2.2} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('createFirstPromo')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 60 }}>
          {promotions.map((p) => (
            <View key={p.id} style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={KINDS.find((k) => k.id === p.kind)?.icon || 'tag'} size={18} color={t.accent1} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }} numberOfLines={1}>{p.name}</Text>
                    {p.active ? <Badge kind="deal">{tr('promoActive')}</Badge> : <Badge>{tr('promoInactive')}</Badge>}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 11.5, color: t.accent1, fontWeight: '800', letterSpacing: 0.4 }}>{p.code}</Text>
                    <Text style={{ fontSize: 11.5, color: t.textDim }}>·</Text>
                    <Text style={{ fontSize: 11.5, color: t.text }}>
                      {p.kind === 'percent' ? `${p.value}% off` : `$${p.value} off`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: t.textDim, marginTop: 3 }}>{p.redemptions} {tr('promoRedemptions')}</Text>
                </View>
                <Switch
                  value={p.active}
                  onValueChange={() => togglePromotion(p.id)}
                  trackColor={{ false: t.surface2, true: t.accent1 }}
                  thumbColor="#fff"
                />
              </View>
              <Pressable onPress={() => Alert.alert('Delete', p.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removePromotion(p.id) }])} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 12, color: t.live, fontWeight: '700' }}>{tr('remove')}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <CreatePromoSheet
        open={sheet}
        onClose={() => setSheet(false)}
        onCreate={(p) => { addPromotion(p); setSheet(false); }}
      />
    </View>
  );
}

function CreatePromoSheet({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (p: Omit<Promotion, 'id' | 'createdAt' | 'redemptions'>) => void }) {
  const { t } = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<PromoKind>('percent');
  const [value, setValue] = useState('10');

  function go() {
    if (!name.trim()) return Alert.alert('Required', tr('promoName'));
    if (!code.trim()) return Alert.alert('Required', tr('promoCode'));
    const v = parseFloat(value);
    if (!isFinite(v) || v <= 0) return Alert.alert('Required', tr('promoValue'));
    onCreate({ name: name.trim(), code: code.trim().toUpperCase(), kind, value: v, active: true });
    setName(''); setCode(''); setValue('10'); setKind('percent');
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 30, gap: 12 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 6 }} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>{tr('newPromo')}</Text>

        <Input label={tr('promoName')} value={name} onChange={setName} icon="tag" />
        <Input label={tr('promoCode')} value={code} onChange={(v) => setCode(v.toUpperCase())} icon="ticket" autoCap="characters" />

        <View>
          <Text style={lbl(t)}>{tr('promoKind')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {KINDS.map((k) => {
              const active = kind === k.id;
              return (
                <Pressable
                  key={k.id}
                  onPress={() => setKind(k.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 8,
                    borderRadius: 999, borderWidth: 1.5,
                    borderColor: active ? t.accent1 : t.border,
                    backgroundColor: active ? 'rgba(139,92,246,0.12)' : t.surface2,
                  }}
                >
                  <Icon name={k.icon} size={14} color={active ? t.accent1 : t.text} />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? t.accent1 : t.text }}>{tr(k.key)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input label={tr('promoValue')} value={value} onChange={setValue} icon="bolt" keyboard="decimal-pad" />

        <BuyBtn full onPress={go} style={{ height: 52, marginTop: 6 }}>{tr('publishPromo')}</BuyBtn>
      </View>
    </Modal>
  );
}

function lbl(t: any) {
  return { fontSize: 12, fontWeight: '700' as const, color: t.textDim, marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: 0.5 };
}

function Input({ label, value, onChange, icon, autoCap = 'sentences', keyboard }: {
  label: string; value: string; onChange: (v: string) => void; icon: string;
  autoCap?: 'none' | 'characters' | 'sentences' | 'words';
  keyboard?: 'default' | 'decimal-pad' | 'number-pad';
}) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={lbl(t)}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface2, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput value={value} onChangeText={onChange} autoCapitalize={autoCap} keyboardType={keyboard} style={{ flex: 1, color: t.text, fontSize: 15 }} placeholderTextColor={t.textDim} />
      </View>
    </View>
  );
}

function btn(t: any) {
  return {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
  };
}
