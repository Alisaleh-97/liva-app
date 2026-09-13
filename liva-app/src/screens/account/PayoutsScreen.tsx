// Payouts — available balance, withdraw flow, transaction history.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/state/AppContext';
import { t as tr, price, isRTL } from '@/i18n';

const DEMO_BALANCE = 1256.75;
const DEMO_TOTAL = 3568.9;

export function PayoutsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { payouts, requestPayout } = useApp();
  const [sheet, setSheet] = useState(false);

  const pending = payouts.filter((p) => p.status !== 'completed' && p.status !== 'failed').reduce((s, p) => s + p.amount, 0);
  const available = Math.max(0, DEMO_BALANCE - pending);

  function handleWithdraw(amount: number, bankLast4: string) {
    if (amount < 10) return Alert.alert('', tr('minWithdraw'));
    if (amount > available) return Alert.alert('', tr('insufficientFunds'));
    requestPayout(amount, 'bank', bankLast4);
    setSheet(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('payoutsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Balance hero */}
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: t.radius * 1.4, padding: 20 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '700' }}>{tr('payoutsBalance')}</Text>
            <Text style={{ color: '#fff', fontSize: 42, fontWeight: '800', letterSpacing: -1, marginTop: 6 }}>{price(available)}</Text>
            <View style={{ flexDirection: 'row', marginTop: 14, gap: 14 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{tr('pendingPayout')}</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{price(pending)}</Text>
              </View>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{tr('allTimeEarn')}</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{price(DEMO_TOTAL)}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setSheet(true)}
              style={{ marginTop: 18, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}
            >
              <Icon name="arrowUR" size={16} color="#1a1030" />
              <Text style={{ color: '#1a1030', fontSize: 14, fontWeight: '800' }}>{tr('withdrawTitle')}</Text>
            </Pressable>
          </LinearGradient>
        </View>

        {/* History */}
        <Text style={{ marginTop: 22, marginBottom: 10, paddingHorizontal: 22, fontSize: 11, fontWeight: '800', color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>{tr('payoutHist')}</Text>

        {payouts.length === 0 ? (
          <View style={{ paddingHorizontal: 22 }}>
            <Text style={{ fontSize: 13, color: t.textDim }}>{tr('nothingPaid')}</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 10 }}>
            {payouts.map((p) => (
              <View key={p.id} style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="arrowUR" size={18} color={t.accent1} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: t.text }}>{price(p.amount)}</Text>
                  <Text style={{ fontSize: 11.5, color: t.textDim, marginTop: 2 }}>
                    {tr('bankLast')} {p.bankLast4 || '0000'} · {new Date(p.requestedAt).toLocaleString()}
                  </Text>
                </View>
                <Badge kind={p.status === 'completed' ? 'deal' : p.status === 'failed' ? 'live' : 'ai'}>
                  {p.status === 'completed' ? tr('payoutStatusCompleted') :
                   p.status === 'failed' ? tr('payoutStatusFailed') :
                   p.status === 'processing' ? tr('payoutStatusProcessing') :
                   tr('payoutStatusPending')}
                </Badge>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <WithdrawSheet
        open={sheet}
        available={available}
        onClose={() => setSheet(false)}
        onWithdraw={handleWithdraw}
      />
    </View>
  );
}

function WithdrawSheet({ open, available, onClose, onWithdraw }: { open: boolean; available: number; onClose: () => void; onWithdraw: (amount: number, last4: string) => void }) {
  const { t } = useTheme();
  const [amount, setAmount] = useState(String(Math.floor(available)));
  const [iban, setIban] = useState('');
  const [holder, setHolder] = useState('');

  function go() {
    const n = parseFloat(amount);
    if (!isFinite(n)) return Alert.alert('Amount', 'Enter a valid amount');
    const digits = iban.replace(/[^0-9]/g, '');
    if (digits.length < 4) return Alert.alert('Bank', 'Enter your account / IBAN');
    if (!holder.trim()) return Alert.alert('Bank', tr('accountHolder'));
    onWithdraw(n, digits.slice(-4));
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 30, gap: 14 }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 6 }} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>{tr('withdrawTitle')}</Text>
        <Text style={{ fontSize: 12.5, color: t.textDim }}>Available: {price(available)}</Text>
        <Input label={tr('withdrawAmount')} value={amount} onChange={setAmount} icon="wallet" keyboard="decimal-pad" />
        <Input label={tr('accountHolder')} value={holder} onChange={setHolder} icon="users" autoCap="words" />
        <Input label={tr('bankIban')} value={iban} onChange={setIban} icon="ticket" />
        <BuyBtn full onPress={go} style={{ height: 52, marginTop: 4 }}>{tr('confirmWithdraw')}</BuyBtn>
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
  keyboard?: 'default' | 'decimal-pad';
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
