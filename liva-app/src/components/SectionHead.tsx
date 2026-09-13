import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';

export function SectionHead({
  title,
  icon,
  iconColor,
  action,
  onAction,
}: {
  title: string;
  icon?: string;
  iconColor?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && (
          <View style={{ width: 31, height: 31, borderRadius: 11, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={16} color={iconColor || t.accent1} stroke={2} />
          </View>
        )}
        <Text style={{ fontSize: 18, fontWeight: '900', color: t.text, letterSpacing: -0.4 }}>{title}</Text>
      </View>
      {action && (
        <Pressable onPress={onAction} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 11, backgroundColor: t.surface2, opacity: pressed ? 0.65 : 1 })}>
          <Text style={{ color: t.accent1, fontSize: 11.5, fontWeight: '800' }}>{action}</Text>
          <Icon name="chevR" size={14} color={t.accent1} stroke={2.2} />
        </Pressable>
      )}
    </View>
  );
}
