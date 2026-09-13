// Edit profile — name, business name (for sellers), avatar seed.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { BuyBtn } from '@/components/BuyBtn';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/state/AuthContext';
import { useToast } from '@/components/Toast';
import { t as tr, isRTL } from '@/i18n';

const AVATAR_SEEDS = [
  'avatar-violet', 'avatar-pink', 'avatar-blue', 'avatar-green',
  'avatar-amber', 'avatar-rose', 'avatar-teal', 'avatar-indigo',
];

export function EditProfileScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || 'avatar-violet');
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const isBusiness = user.role === 'business';

  async function save() {
    if (!firstName.trim() || !lastName.trim()) return Alert.alert('Name', 'First and last name are required.');
    if (isBusiness && !businessName.trim()) return Alert.alert('Business', 'Business name is required.');
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        avatarSeed,
        ...(isBusiness ? { businessName: businessName.trim() } : {}),
      });
      toast.show('Profile updated');
      onBack();
    } catch (e: any) {
      Alert.alert('Update failed', String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btnStyle(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Edit profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60, gap: 18 }} keyboardShouldPersistTaps="handled">
        {/* Avatar preview + picker */}
        <View style={{ alignItems: 'center', gap: 14 }}>
          <Avatar seed={avatarSeed} size={84} verified={user.verified} />
          <Text style={{ fontSize: 12, color: t.textDim, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pick an avatar style</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {AVATAR_SEEDS.map((seed) => (
              <Pressable key={seed} onPress={() => setAvatarSeed(seed)}>
                <View style={{ borderWidth: 2.5, borderColor: avatarSeed === seed ? t.accent1 : 'transparent', borderRadius: 100, padding: 2 }}>
                  <Avatar seed={seed} size={44} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Fields */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="First name" value={firstName} onChange={setFirstName} icon="users" autoCap="words" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Last name" value={lastName} onChange={setLastName} icon="users" autoCap="words" />
          </View>
        </View>
        {isBusiness && (
          <Field label="Business / store name" value={businessName} onChange={setBusinessName} icon="shop" autoCap="words" />
        )}

        <View style={{ padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
          <Text style={{ fontSize: 12, color: t.textDim, fontWeight: '700' }}>Email</Text>
          <Text style={{ fontSize: 14, color: t.text, marginTop: 4 }}>{user.email}</Text>
          <Text style={{ fontSize: 10.5, color: t.textDim, marginTop: 4 }}>Email can't be changed. Contact support to migrate.</Text>
        </View>

        <BuyBtn full onPress={save} style={{ height: 52, marginTop: 6 }}>
          {saving ? 'Saving…' : 'Save changes'}
        </BuyBtn>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, icon, autoCap = 'sentences' }: {
  label: string; value: string; onChange: (v: string) => void; icon: string;
  autoCap?: 'none' | 'words' | 'sentences';
}) {
  const { t } = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 11.5, fontWeight: '800', color: t.textDim, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius }}>
        <Icon name={icon} size={18} color={t.textDim} />
        <TextInput value={value} onChangeText={onChange} autoCapitalize={autoCap} autoCorrect={false} style={{ flex: 1, color: t.text, fontSize: 15 }} />
      </View>
    </View>
  );
}

function btnStyle(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
