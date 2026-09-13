// Gradient text via MaskedView would require an extra dep; the cheap approach
// is a single accent-colored text. Looks ~95% the same as the gradient in dark
// mode. We can swap to MaskedView later if you want true gradient fill.
import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export function GradText({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { t } = useTheme();
  return <Text style={[{ color: t.accent1, fontWeight: '700' }, style]}>{children}</Text>;
}
