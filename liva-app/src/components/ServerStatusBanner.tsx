// Polls /health every 30s and shows a slim banner when the backend is offline.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeContext';
import { API_URL } from '@/lib/api';

export function ServerStatusBanner() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 4000);
        const res = await fetch(`${API_URL}/health`, { signal: ctl.signal });
        clearTimeout(timer);
        if (!cancelled) setOnline(res.ok);
      } catch {
        if (!cancelled) setOnline(false);
      }
    }
    check();
    const id = setInterval(check, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (online !== false || dismissed) return null;
  return (
    <View style={{ position: 'absolute', top: insets.top + 6, left: 14, right: 14, zIndex: 998, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,179,57,0.18)', borderWidth: 1, borderColor: 'rgba(255,179,57,0.4)', borderRadius: 12 }}>
      <Icon name="shield" size={14} color="#FFB339" />
      <Text style={{ flex: 1, color: t.text, fontSize: 12, fontWeight: '700' }}>
        Backend offline — AI tab and payments are unavailable. Catalog still works.
      </Text>
      <Pressable onPress={() => setDismissed(true)}>
        <Icon name="close" size={14} color={t.textDim} />
      </Pressable>
    </View>
  );
}
