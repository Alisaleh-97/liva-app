import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';

export function Chip({
  active,
  icon,
  children,
  onPress,
  style,
}: {
  active?: boolean;
  icon?: string | null;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { t } = useTheme();
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, gap: 7 }}>
      {icon && <Icon name={icon} size={16} color={active ? '#fff' : t.text} stroke={2} />}
      <Text style={{ color: active ? '#fff' : t.text, fontWeight: '600', fontSize: 13.5 }}>{children}</Text>
    </View>
  );
  return (
    <Pressable onPress={onPress} style={[{ borderRadius: t.radius * 0.9, overflow: 'hidden' }, style]}>
      {active ? (
        <LinearGradient colors={t.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: t.radius * 0.9 }}>
          {inner}
        </View>
      )}
    </Pressable>
  );
}
