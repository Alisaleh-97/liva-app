// Supabase client — activates as the backend persistence layer when configured.
// Without env vars, all the app's data continues to live in AsyncStorage exactly
// as before. With them set, we can later swap individual reads/writes to use
// Supabase tables for cross-device sync.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(URL && KEY);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(URL!, KEY!, {
      auth: { storage: AsyncStorage as any, autoRefreshToken: true, persistSession: true },
    })
  : null;

// Helper: enable real-time row subscriptions later, e.g. seller orders.
export function subscribeToOrders(userId: string, cb: (row: any) => void) {
  if (!supabase) return () => {};
  const sub = supabase
    .channel('orders-' + userId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `seller_id=eq.${userId}` }, (payload) => cb(payload.new))
    .subscribe();
  return () => { supabase.removeChannel(sub); };
}
