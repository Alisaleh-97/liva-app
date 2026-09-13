// Cross-platform confirmation dialog — React Native Web's Alert.alert is buggy
// (the destructive button often doesn't fire), so we render our own Modal.
import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive, onConfirm, onCancel,
}: Props) {
  const { t } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} style={{ flex: 1, backgroundColor: 'rgba(4,2,10,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 360, backgroundColor: t.surface, borderRadius: 22, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
          <View style={{ padding: 22 }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: t.text, marginBottom: 8 }}>{title}</Text>
            {message ? <Text style={{ fontSize: 14, color: t.textDim, lineHeight: 20 }}>{message}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.border }}>
            <Pressable onPress={onCancel} style={{ flex: 1, paddingVertical: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: t.border }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={{ flex: 1 }}>
              {destructive ? (
                <View style={{ paddingVertical: 16, alignItems: 'center', backgroundColor: 'rgba(255,59,92,0.1)' }}>
                  <Text style={{ color: t.live, fontWeight: '800', fontSize: 15 }}>{confirmLabel}</Text>
                </View>
              ) : (
                <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{confirmLabel}</Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
