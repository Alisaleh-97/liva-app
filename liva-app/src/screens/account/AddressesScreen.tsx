// Addresses list + add (with auto-location detect via browser geolocation).
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useApp, Address } from '@/state/AppContext';
import { getCurrentPosition, reverseGeocode } from '@/lib/geo';
import { t as tr, isRTL } from '@/i18n';

export function AddressesScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { addresses, addAddress, removeAddress, setDefaultAddress } = useApp();
  const [sheet, setSheet] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>{tr('addressesTitle')}</Text>
        <Pressable onPress={() => setSheet(true)} style={btn(t)}>
          <Icon name="plus" size={20} color={t.accent1} stroke={2.2} />
        </Pressable>
      </View>

      {addresses.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="truck" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{tr('noAddresses')}</Text>
          <Text style={{ fontSize: 13, color: t.textDim, textAlign: 'center', maxWidth: 280 }}>{tr('noAddressesSub')}</Text>
          <Pressable onPress={() => setSheet(true)} style={{ marginTop: 8, borderRadius: t.radius, overflow: 'hidden' }}>
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 }}>
              <Icon name="plus" size={16} color="#fff" stroke={2.2} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('addAddress')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 60 }}>
          {addresses.map((a) => (
            <View key={a.id} style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: a.isDefault ? t.accent1 : t.border, borderRadius: t.radius }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon name="truck" size={16} color={t.accent1} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: t.text }}>{a.label}</Text>
                {a.isDefault && <Badge kind="ai">{tr('defaultAddress')}</Badge>}
              </View>
              <Text style={{ fontSize: 13, color: t.text, lineHeight: 18 }}>
                {a.recipient}{'\n'}
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}{'\n'}
                {a.city}{a.state ? `, ${a.state}` : ''}{a.zip ? ` ${a.zip}` : ''}{'\n'}
                {a.country}
              </Text>
              <View style={{ flexDirection: 'row', gap: 9, marginTop: 10 }}>
                {!a.isDefault && (
                  <Pressable onPress={() => setDefaultAddress(a.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: t.surface2 }}>
                    <Icon name="check" size={12} color={t.text} />
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.text }}>{tr('setDefault')}</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => Alert.alert(tr('remove'), a.label, [{ text: 'Cancel', style: 'cancel' }, { text: tr('remove'), style: 'destructive', onPress: () => removeAddress(a.id) }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,59,92,0.12)' }}>
                  <Icon name="close" size={12} color={t.live} />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.live }}>{tr('remove')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <AddAddressSheet open={sheet} onClose={() => setSheet(false)} onSave={(a) => { addAddress(a); setSheet(false); }} />
    </View>
  );
}

function AddAddressSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (a: Omit<Address, 'id' | 'isDefault'>) => void }) {
  const { t } = useTheme();
  const [label, setLabel] = useState('Home');
  const [recipient, setRecipient] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('UAE');
  const [phone, setPhone] = useState('');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [detecting, setDetecting] = useState(false);

  async function detect() {
    try {
      setDetecting(true);
      const c = await getCurrentPosition();
      setCoords({ lat: c.latitude, lng: c.longitude });
      const r = await reverseGeocode(c.latitude, c.longitude);
      if (r.street) setLine1(r.street);
      if (r.city) setCity(r.city);
      if (r.state) setState(r.state);
      if (r.zip) setZip(r.zip);
      if (r.country) setCountry(r.country);
    } catch (e: any) {
      Alert.alert(tr('locationFailed'), String(e?.message || e));
    } finally {
      setDetecting(false);
    }
  }

  function go() {
    if (!recipient.trim() || !line1.trim() || !city.trim()) {
      return Alert.alert('Required', 'Recipient, street and city are required.');
    }
    onSave({
      label: label.trim() || 'Address',
      recipient: recipient.trim(),
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      state: state.trim() || undefined,
      zip: zip.trim() || undefined,
      country: country.trim() || 'UAE',
      phone: phone.trim() || undefined,
      lat: coords.lat,
      lng: coords.lng,
    });
    // reset
    setLabel('Home'); setRecipient(''); setLine1(''); setLine2('');
    setCity(''); setState(''); setZip(''); setCoords({});
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.6)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 30, maxHeight: '92%' }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 99, backgroundColor: t.border, marginBottom: 6 }} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 14 }}>{tr('addAddress')}</Text>

          {/* Auto location button */}
          <Pressable
            onPress={detect}
            disabled={detecting}
            style={{ marginBottom: 14, height: 48, borderRadius: t.radius, overflow: 'hidden' }}
          >
            <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {detecting ? <ActivityIndicator color="#fff" /> : <Icon name="globe" size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                {detecting ? tr('detectingLocation') : tr('useCurrentLocation')}
              </Text>
            </LinearGradient>
          </Pressable>

          {coords.lat && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Icon name="check" size={13} color={t.buy} stroke={2.5} />
              <Text style={{ fontSize: 11.5, color: t.buy, fontWeight: '700' }}>
                {tr('locationOk')}: {coords.lat?.toFixed(4)}, {coords.lng?.toFixed(4)}
              </Text>
            </View>
          )}

          <View style={{ gap: 12 }}>
            <Input label={tr('addressLabel')} value={label} onChange={setLabel} icon="tag" autoCap="words" />
            <Input label={tr('recipientField')} value={recipient} onChange={setRecipient} icon="users" autoCap="words" />
            <Input label={tr('line1')} value={line1} onChange={setLine1} icon="truck" autoCap="words" />
            <Input label={tr('line2')} value={line2} onChange={setLine2} icon="truck" autoCap="words" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label={tr('cityField')} value={city} onChange={setCity} icon="globe" autoCap="words" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label={tr('stateField')} value={state} onChange={setState} icon="globe" autoCap="words" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label={tr('zipField')} value={zip} onChange={setZip} icon="ticket" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label={tr('countryField')} value={country} onChange={setCountry} icon="globe" autoCap="words" />
              </View>
            </View>
            <Input label={tr('phoneField')} value={phone} onChange={setPhone} icon="headset" keyboard="phone-pad" />
          </View>

          <BuyBtn full onPress={go} style={{ height: 52, marginTop: 16 }}>{tr('saveAddress')}</BuyBtn>
        </ScrollView>
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
  keyboard?: 'default' | 'phone-pad';
}) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={lbl(t)}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, backgroundColor: t.surface2, borderRadius: t.radius }}>
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
