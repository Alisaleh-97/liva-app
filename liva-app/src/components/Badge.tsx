import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type Kind = 'live' | 'ai' | 'hot' | 'deal' | 'glass' | 'default';

export function Badge({ kind = 'default', children, style }: { kind?: Kind; children: React.ReactNode; style?: ViewStyle }) {
  const { t } = useTheme();
  const map: Record<Kind, { bg: string; fg: string; bd?: string }> = {
    live:    { bg: t.live, fg: '#fff' },
    ai:      { bg: 'rgba(99,91,255,0.16)', fg: t.accent1, bd: 'rgba(99,91,255,0.4)' },
    hot:     { bg: 'rgba(255,61,113,0.16)', fg: t.live, bd: 'rgba(255,61,113,0.4)' },
    deal:    { bg: t.buy, fg: '#06362A' },
    glass:   { bg: 'rgba(0,0,0,0.35)', fg: '#fff' },
    default: { bg: t.surface2, fg: t.textDim },
  };
  const s = map[kind];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 7,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: s.bg,
          borderWidth: s.bd ? 1 : 0,
          borderColor: s.bd,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text style={{ color: s.fg, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {children}
      </Text>
    </View>
  );
}
