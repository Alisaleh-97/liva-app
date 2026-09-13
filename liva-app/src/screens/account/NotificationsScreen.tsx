// In-app notification inbox.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeContext';
import { useExtras, NotifItem } from '@/state/AppExtras';
import { isRTL } from '@/i18n';

const ICONS: Record<NotifItem['kind'], string> = {
  order: 'truck', price: 'tag', live: 'live', message: 'comment', system: 'shield',
};

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, markRead, markAllRead, clearNotifications, unreadCount } = useExtras();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-mark everything read 1.5s after opening — gives the user a moment to
  // see the unread highlights but then clears the bell badge.
  useEffect(() => {
    const id = setTimeout(() => { if (unreadCount > 0) markAllRead(); }, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }

  function timeAgo(at: number) {
    const m = Math.floor((Date.now() - at) / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={btn(t)}>
          <Icon name={isRTL() ? 'chevR' : 'chevL'} size={20} color={t.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={{ minWidth: 22, paddingHorizontal: 6, height: 22, borderRadius: 11, backgroundColor: t.live, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => markAllRead()} style={btn(t)}>
          <Icon name="check" size={18} color={t.accent1} stroke={2.2} />
        </Pressable>
      </View>

      {notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name="bell" size={36} color={t.textDim} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: t.text }}>No notifications</Text>
          <Text style={{ fontSize: 13, color: t.textDim, marginTop: 6 }}>You're all caught up.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 18, gap: 8, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent1} />}
        >
          {notifications.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => markRead(n.id)}
              style={{ padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: n.read ? t.border : 'rgba(139,92,246,0.4)', borderRadius: t.radius, flexDirection: 'row', gap: 12 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: n.read ? t.surface2 : 'rgba(139,92,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={ICONS[n.kind]} size={18} color={n.read ? t.textDim : t.accent1} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: t.text, flex: 1 }} numberOfLines={1}>{n.title}</Text>
                  <Text style={{ fontSize: 11, color: t.textDim }}>{timeAgo(n.at)}</Text>
                </View>
                <Text style={{ fontSize: 12.5, color: t.textDim, marginTop: 3, lineHeight: 18 }} numberOfLines={2}>{n.body}</Text>
              </View>
              {!n.read && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.accent1, alignSelf: 'center' }} />}
            </Pressable>
          ))}
          <Pressable onPress={clearNotifications} style={{ marginTop: 10, alignSelf: 'center' }}>
            <Text style={{ color: t.live, fontSize: 12, fontWeight: '700' }}>Clear all</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function btn(t: any) {
  return { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border };
}
