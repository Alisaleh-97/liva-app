// Saved payment cards — list + add new (demo card, last4 stored).
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp, CardBrand, PaymentMethod } from '@/state/AppContext';
import { t as tr, isRTL } from '@/i18n';

function brandOf(num: string): CardBrand {
  if (num.startsWith('4')) return 'visa';
  if (num.startsWith('5') || num.startsWith('2')) return 'mastercard';
  if (num.startsWith('34') || num.startsWith('37')) return 'amex';
  if (num.startsWith('6')) return 'discover';
  return 'card';
}

const BRAND_GRADIENT: Record<CardBrand, [string, string]> = {
  visa: ['#1A1F71', '#0F4DA8'],
  mastercard: ['#FF5F00', '#EB001B'],
  amex: ['#006FCF', '#00A8E1'],
  discover: ['#FF6000', '#FFD600'],
  card: ['#374151', '#1F2937'],
};

export function PaymentMethodsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = useApp();
  const [sheet, setSheet] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('paymentMethodsTitle')}</Text>
        <Pressable onPress={() => setSheet(true)} style={btn(t)}>
          <Icon name="plus" size={20} color={t.accent1} stroke={2.2} />
        </Pressable>
      </View>

      {paymentMethods.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="wallet" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr('noCards')}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>{tr('noCardsSub')}</Text>
          <Pressable onPress={() => setSheet(true)} style={{ marginTop: 8, borderRadius: t.radius, overflow: 'hidden' }}>
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 }}>
              <Icon name="plus" size={16} color="#fff" stroke={2.2} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('addCard')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 60 }}>
          {paymentMethods.map((m) => (
            <View key={m.id}>
              <LinearGradient
                colors={BRAND_GRADIENT[m.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: t.radius, padding: 18, height: 168, justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 }}>{m.brand}</Text>
                  {m.isDefault && <Badge kind="glass">{tr('defaultCard')}</Badge>}
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 2.4 }}>•••• •••• •••• {m.last4}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                    <View>
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr('cardholderName')}</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{m.holder}</Text>
                    </View>
                    <View>
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr('expires')}</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{String(m.expMonth).padStart(2, '0')}/{String(m.expYear).slice(-2)}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
              <View style={{ flexDirection: 'row', gap: 9, marginTop: 9 }}>
                {!m.isDefault && (
                  <Pressable onPress={() => setDefaultPaymentMethod(m.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: t.surface2 }}>
                    <Icon name="check" size={12} color={t.text} />
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.text }}>{tr('setDefault')}</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => Alert.alert(tr('remove'), `Card ending in ${m.last4}`, [{ text: 'Cancel', style: 'cancel' }, { text: tr('remove'), style: 'destructive', onPress: () => removePaymentMethod(m.id) }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,59,92,0.12)' }}>
                  <Icon name="close" size={12} color={t.live} />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.live }}>{tr('remove')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <AddCardSheet open={sheet} onClose={() => setSheet(false)} onSave={(m) => { addPaymentMethod(m); setSheet(false); }} />
    </View>
  );
}

function AddCardSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (m: Omit<PaymentMethod, 'id' | 'isDefault'>) => void }) {
  const { t } = useTheme();
  const [holder, setHolder] = useState('');
  const [num, setNum] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');

  function go() {
    const digits = num.replace(/\s/g, '');
    if (!holder.trim()) return Alert.alert('Required', tr('cardholderName'));
    if (!/^\d{13,19}$/.test(digits)) return Alert.alert('Card', 'Invalid card number');
    if (!/^\d{2}\/\d{2}$/.test(exp)) return Alert.alert('Card', 'Expiry must be MM/YY');
    if (!/^\d{3,4}$/.test(cvc)) return Alert.alert('Card', 'Invalid CVC');
    const [mm, yy] = exp.split('/').map((s) => parseInt(s, 10));
    onSave({
      brand: brandOf(digits),
      last4: digits.slice(-4),
      expMonth: mm,
      expYear: 2000 + yy,
      holder: holder.trim(),
    });
    setHolder(''); setNum(''); setExp(''); setCvc('');
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 30, gap: 12 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 6 }} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>{tr('addCardSheet')}</Text>
        <Input label={tr('cardholderName')} value={holder} onChange={setHolder} icon="users" autoCap="words" />
        <Input label={tr('cardNumber')} value={num} onChange={(v) => setNum(v.replace(/[^\d ]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 23))} icon="wallet" keyboard="number-pad" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label={tr('expiry')} value={exp} onChange={(v) => { const d = v.replace(/\D/g, '').slice(0, 4); setExp(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }} icon="clock" keyboard="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label={tr('cvc')} value={cvc} onChange={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))} icon="shield" keyboard="number-pad" />
          </View>
        </View>
        <BuyBtn full onPress={go} style={{ height: 52, marginTop: 4 }}>{tr('saveCard')}</BuyBtn>
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
  keyboard?: 'default' | 'number-pad';
}) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={lbl(t)}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface2, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput value={value} onChangeText={onChange} autoCapitalize={autoCap} keyboardType={keyboard} autoCorrect={false} style={{ flex: 1, color: t.text, fontSize: 15 }} placeholderTextColor={t.textDim} />
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
