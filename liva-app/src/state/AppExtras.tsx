// Engagement state — extends AppContext with all the retention features.
// Kept in its own file so AppContext.tsx doesn't balloon.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { load, save, KEYS } from '@/lib/storage';

// ── Streak ─────────────────────────────────────────────────────────────────
export interface StreakState {
  current: number;        // consecutive days
  longest: number;
  lastCheckIn: string;    // YYYY-MM-DD
}

// ── Notifications inbox ────────────────────────────────────────────────────
export interface NotifItem {
  id: string;
  kind: 'order' | 'price' | 'live' | 'message' | 'system';
  title: string;
  body: string;
  read: boolean;
  at: number;
  data?: any;
}

// ── Messaging ──────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: number;
}
export interface Conversation {
  id: string;            // peer id
  peerName: string;
  peerSeed: string;
  lastMessage: string;
  lastAt: number;
  unread: number;
  messages: Message[];
}

// ── Saved searches ─────────────────────────────────────────────────────────
export interface SavedSearch {
  id: string;
  query: string;
  filterMinPrice?: number;
  filterMaxPrice?: number;
  filterMinRating?: number;
  createdAt: number;
}

// ── Saved live streams (replays) ───────────────────────────────────────────
export interface ChatHighlight { id: string; user: string; text: string; at: number; buyIntent?: boolean; tipAmount?: number; }
export interface PollResult { question: string; options: string[]; votes: number[]; }
export interface SavedStream {
  id: string;
  sellerName: string;
  sellerSeed: string;
  title: string;
  productId: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  peakViewers: number;
  totalLikes: number;
  totalSales: number;
  salesValue: number;
  tipsValue: number;
  highlights: ChatHighlight[];   // a sampled chat record
  polls: PollResult[];
  thumbnail?: string;            // remote URL or seed string
}

// ── Preferences ────────────────────────────────────────────────────────────
export interface Preferences {
  haptics: boolean;
  sounds: boolean;
  reducedMotion: boolean;
  autoTheme: boolean;
  officeHours?: { start: string; end: string }; // HH:mm
}

// ── Followed sellers / recently viewed are just id arrays ──────────────────

const todayStr = () => new Date().toISOString().slice(0, 10);
const rid = () => 'x' + Date.now() + Math.random().toString(36).slice(2, 6);

interface ExtrasCtx {
  // Streak
  streak: StreakState;
  checkInToday: () => { rewarded: number; newStreak: number; alreadyDone: boolean };
  // Notifications
  notifications: NotifItem[];
  unreadCount: number;
  addNotification: (n: Omit<NotifItem, 'id' | 'read' | 'at'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  // Conversations
  conversations: Conversation[];
  sendMessage: (peerId: string, peerName: string, peerSeed: string, text: string) => void;
  markConversationRead: (peerId: string) => void;
  // Saved searches
  savedSearches: SavedSearch[];
  addSavedSearch: (s: Omit<SavedSearch, 'id' | 'createdAt'>) => void;
  removeSavedSearch: (id: string) => void;
  // Recently viewed
  recentlyViewed: string[];
  pushRecentlyViewed: (productId: string) => void;
  // Following
  followedSellers: string[];
  toggleFollow: (sellerId: string) => void;
  // Preferences
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  // Onboarding
  onboardingShown: boolean;
  markOnboardingShown: () => void;
  // Saved live streams (replays)
  savedStreams: SavedStream[];
  saveStream: (s: Omit<SavedStream, 'id'>) => SavedStream;
  removeSavedStream: (id: string) => void;
}

const Ctx = createContext<ExtrasCtx | null>(null);

const DEFAULT_PREFS: Preferences = {
  haptics: true,
  sounds: true,
  reducedMotion: false,
  autoTheme: false,
};

export function AppExtrasProvider({ children }: { children: React.ReactNode }) {
  const [streak, setStreak] = useState<StreakState>({ current: 0, longest: 0, lastCheckIn: '' });
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [followedSellers, setFollowedSellers] = useState<string[]>(['s1', 's2']);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFS);
  const [onboardingShown, setOnboardingShown] = useState(false);
  const [savedStreams, setSavedStreams] = useState<SavedStream[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [st, nt, cv, ss, rv, fs, pr, ob] = await Promise.all([
        load<StreakState>(KEYS.streak, { current: 0, longest: 0, lastCheckIn: '' }),
        load<NotifItem[]>(KEYS.notifications, [
          { id: 'seed1', kind: 'system', title: 'Welcome to LIVA', body: 'Your shopping + selling home. Tap around to explore.', read: false, at: Date.now() - 60_000 },
          { id: 'seed2', kind: 'price', title: 'Price drop alert', body: 'Cloudstep Runners just dropped 37%.', read: false, at: Date.now() - 300_000 },
          { id: 'seed3', kind: 'live', title: 'Beauty Star is going live', body: 'Glow Up Friday — perfume drop starts in 5 min.', read: true, at: Date.now() - 3_600_000 },
        ]),
        load<Conversation[]>(KEYS.conversations, [
          { id: 's2', peerName: 'Beauty Star', peerSeed: 'beauty-star', lastMessage: 'Hi! Are the perfumes back in stock?', lastAt: Date.now() - 600_000, unread: 1,
            messages: [
              { id: 'm1', from: 'them', text: 'Hi! Are the perfumes back in stock?', at: Date.now() - 600_000 },
            ] },
        ]),
        load<SavedSearch[]>(KEYS.savedSearches, []),
        load<string[]>(KEYS.recentlyViewed, []),
        load<string[]>(KEYS.followedSellers, ['s1', 's2']),
        load<Preferences>(KEYS.preferences, DEFAULT_PREFS),
        load<boolean>(KEYS.onboardingShown, false),
      ]);
      const sv = await load<SavedStream[]>(KEYS.savedStreams, []);
      setStreak(st); setNotifications(nt); setConversations(cv);
      setSavedSearches(ss); setRecentlyViewed(rv); setFollowedSellers(fs);
      setPreferences(pr); setOnboardingShown(ob); setSavedStreams(sv);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => { if (hydrated) save(KEYS.streak, streak); }, [streak, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.notifications, notifications); }, [notifications, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.conversations, conversations); }, [conversations, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.savedSearches, savedSearches); }, [savedSearches, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.recentlyViewed, recentlyViewed); }, [recentlyViewed, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.followedSellers, followedSellers); }, [followedSellers, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.preferences, preferences); }, [preferences, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.onboardingShown, onboardingShown); }, [onboardingShown, hydrated]);
  useEffect(() => { if (hydrated) save(KEYS.savedStreams, savedStreams); }, [savedStreams, hydrated]);

  const checkInToday = useCallback(() => {
    const today = todayStr();
    if (streak.lastCheckIn === today) return { rewarded: 0, newStreak: streak.current, alreadyDone: true };
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const continued = streak.lastCheckIn === yesterday;
    const newCurrent = continued ? streak.current + 1 : 1;
    const newLongest = Math.max(newCurrent, streak.longest);
    setStreak({ current: newCurrent, longest: newLongest, lastCheckIn: today });
    // Bonus coin reward grows with streak length
    const reward = 20 + Math.min(newCurrent * 5, 100);
    return { rewarded: reward, newStreak: newCurrent, alreadyDone: false };
  }, [streak]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const addNotification = useCallback((n: Omit<NotifItem, 'id' | 'read' | 'at'>) => {
    setNotifications((prev) => [{ ...n, id: rid(), read: false, at: Date.now() }, ...prev].slice(0, 100));
  }, []);
  const markRead = useCallback((id: string) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(() => setNotifications((p) => p.map((n) => ({ ...n, read: true }))), []);
  const clearNotifications = useCallback(() => setNotifications([]), []);

  const sendMessage = useCallback((peerId: string, peerName: string, peerSeed: string, text: string) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === peerId);
      const msg: Message = { id: rid(), from: 'me', text, at: Date.now() };
      if (existing) {
        return prev.map((c) => c.id === peerId
          ? { ...c, messages: [...c.messages, msg], lastMessage: text, lastAt: Date.now() }
          : c);
      }
      const created: Conversation = {
        id: peerId, peerName, peerSeed, messages: [msg],
        lastMessage: text, lastAt: Date.now(), unread: 0,
      };
      return [created, ...prev];
    });
  }, []);
  const markConversationRead = useCallback((peerId: string) => {
    setConversations((p) => p.map((c) => c.id === peerId ? { ...c, unread: 0 } : c));
  }, []);

  const addSavedSearch = useCallback((s: Omit<SavedSearch, 'id' | 'createdAt'>) => {
    setSavedSearches((prev) => [{ ...s, id: rid(), createdAt: Date.now() }, ...prev]);
  }, []);
  const removeSavedSearch = useCallback((id: string) => setSavedSearches((p) => p.filter((s) => s.id !== id)), []);

  const pushRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed((prev) => [productId, ...prev.filter((p) => p !== productId)].slice(0, 12));
  }, []);

  const toggleFollow = useCallback((sellerId: string) => {
    setFollowedSellers((prev) => prev.includes(sellerId) ? prev.filter((s) => s !== sellerId) : [sellerId, ...prev]);
  }, []);

  const setPreference: ExtrasCtx['setPreference'] = useCallback((key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const markOnboardingShown = useCallback(() => setOnboardingShown(true), []);

  const saveStream = useCallback((s: Omit<SavedStream, 'id'>) => {
    const stream: SavedStream = { ...s, id: rid() };
    setSavedStreams((prev) => [stream, ...prev].slice(0, 50));
    return stream;
  }, []);
  const removeSavedStream = useCallback((id: string) => {
    setSavedStreams((p) => p.filter((s) => s.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{
      streak, checkInToday,
      notifications, unreadCount, addNotification, markRead, markAllRead, clearNotifications,
      conversations, sendMessage, markConversationRead,
      savedSearches, addSavedSearch, removeSavedSearch,
      recentlyViewed, pushRecentlyViewed,
      followedSellers, toggleFollow,
      preferences, setPreference,
      onboardingShown, markOnboardingShown,
      savedStreams, saveStream, removeSavedStream,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useExtras(): ExtrasCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useExtras must be inside AppExtrasProvider');
  return v;
}
