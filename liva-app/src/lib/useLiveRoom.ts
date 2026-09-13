import { useCallback, useEffect, useRef, useState } from 'react';
import { realtimeUrl } from '@/lib/api';
import { getSecure, SECURE_KEYS } from '@/lib/secureStorage';

export type LiveRoomConnection = 'connecting' | 'live' | 'reconnecting' | 'offline';
export type LiveReactionKind = 'heart' | 'fire' | 'money' | 'clap' | 'laugh' | 'wow';

export interface LiveRoomMessage {
  id: string;
  userId: string;
  userName: string;
  avatarSeed: string;
  text: string;
  createdAt: number;
  mine: boolean;
}

export interface LiveRoomReaction {
  id: string;
  userId: string | null;
  kind: LiveReactionKind;
  createdAt: number;
}

interface WireChat extends Omit<LiveRoomMessage, 'mine'> {}

interface WireMessage {
  type: string;
  roomId?: string;
  messages?: WireChat[];
  message?: WireChat | string;
  reaction?: LiveRoomReaction;
  viewers?: number;
  currentUserId?: string | null;
  code?: string;
}

export function useLiveRoom(roomId: string) {
  const [messages, setMessages] = useState<LiveRoomMessage[]>([]);
  const [viewers, setViewers] = useState(0);
  const [connection, setConnection] = useState<LiveRoomConnection>('connecting');
  const [lastReaction, setLastReaction] = useState<LiveRoomReaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const disposedRef = useRef(false);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const withMine = useCallback((entry: WireChat): LiveRoomMessage => ({
    ...entry,
    mine: !!currentUserIdRef.current && entry.userId === currentUserIdRef.current,
  }), []);

  useEffect(() => {
    disposedRef.current = false;
    let attempts = 0;

    async function connect() {
      if (disposedRef.current) return;
      setConnection(attempts === 0 ? 'connecting' : 'reconnecting');
      const token = await getSecure(SECURE_KEYS.authToken);
      const query = token ? `?token=${encodeURIComponent(token)}` : '';
      const socket = new WebSocket(realtimeUrl() + query);
      socketRef.current = socket;

      socket.onopen = () => {
        attempts = 0;
        setConnection('live');
        setError(null);
        socket.send(JSON.stringify({ type: 'live:join', roomId }));
      };

      socket.onmessage = (event) => {
        try {
          const incoming = JSON.parse(String(event.data)) as WireMessage;
          if (incoming.type === 'live:snapshot') {
            currentUserIdRef.current = incoming.currentUserId || null;
            setMessages((incoming.messages || []).map(withMine));
            setViewers(Math.max(0, incoming.viewers || 0));
          } else if (incoming.type === 'live:chat' && incoming.message && typeof incoming.message !== 'string') {
            const next = withMine(incoming.message);
            setMessages((old) => old.some((m) => m.id === next.id) ? old : [...old.slice(-99), next]);
          } else if (incoming.type === 'live:viewers') {
            setViewers(Math.max(0, incoming.viewers || 0));
          } else if (incoming.type === 'live:reaction' && incoming.reaction) {
            setLastReaction(incoming.reaction);
          } else if (incoming.type === 'error') {
            setError(typeof incoming.message === 'string' ? incoming.message : 'Live action failed.');
            if (incoming.code === 'AUTH_REQUIRED') setConnection('offline');
          }
        } catch {
          setError('Received an invalid live update.');
        }
      };

      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (disposedRef.current) return;
        setConnection('reconnecting');
        attempts += 1;
        const delay = Math.min(1000 * 2 ** Math.min(attempts, 4), 12_000);
        retryRef.current = setTimeout(connect, delay);
      };
    }

    connect().catch(() => setConnection('offline'));
    return () => {
      disposedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'live:leave', roomId }));
      }
      socket?.close();
    };
  }, [roomId, withMine]);

  const sendChat = useCallback((text: string) => {
    const clean = text.trim().replace(/\s+/g, ' ').slice(0, 240);
    const socket = socketRef.current;
    if (!clean) return false;
    if (!socket || socket.readyState !== WebSocket.OPEN || connection !== 'live') {
      setError('Live room is reconnecting. Try again in a moment.');
      return false;
    }
    socket.send(JSON.stringify({ type: 'live:chat', roomId, text: clean }));
    return true;
  }, [connection, roomId]);

  const sendReaction = useCallback((kind: LiveReactionKind) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type: 'live:reaction', roomId, kind }));
    return true;
  }, [roomId]);

  return {
    messages,
    viewers,
    connection,
    lastReaction,
    error,
    sendChat,
    sendReaction,
    clearError: () => setError(null),
  };
}
