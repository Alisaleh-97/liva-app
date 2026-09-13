import { useCallback, useEffect, useRef, useState } from 'react';
import { Auction, AuctionBid } from '@/data/auctions';
import { apiGetAuction, apiPlaceAuctionBid, realtimeUrl } from '@/lib/api';
import { getSecure, SECURE_KEYS } from '@/lib/secureStorage';

export type RealtimeState = 'connecting' | 'live' | 'reconnecting' | 'offline';

interface AuctionRoomState {
  auction: Auction;
  bids: AuctionBid[];
  connection: RealtimeState;
  viewers: number;
  pendingBid: boolean;
  error: string | null;
  placeBid: (amount: number) => Promise<void>;
  clearError: () => void;
}

type WireMessage = {
  type: string;
  auction?: Auction;
  bid?: AuctionBid;
  serverTime?: number;
  viewers?: number;
  message?: string;
  code?: string;
};

function requestId() {
  return `bid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useAuctionRoom(seed: Auction): AuctionRoomState {
  const [auction, setAuction] = useState(seed);
  const [bids, setBids] = useState<AuctionBid[]>(seed.bids || []);
  const [connection, setConnection] = useState<RealtimeState>('connecting');
  const [viewers, setViewers] = useState(1);
  const [pendingBid, setPendingBid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const disposedRef = useRef(false);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySnapshot = useCallback((next: Auction) => {
    setAuction(next);
    if (next.bids) setBids(next.bids);
  }, []);

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
        socket.send(JSON.stringify({ type: 'auction:join', auctionId: seed.id }));
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as WireMessage;
          if (message.type === 'auction:snapshot' && message.auction) {
            applySnapshot(message.auction);
            setViewers(message.viewers || 1);
          } else if ((message.type === 'auction:bid' || message.type === 'auction:ended') && message.auction) {
            applySnapshot(message.auction);
            setPendingBid(false);
          } else if (message.type === 'auction:viewers') {
            setViewers(Math.max(0, message.viewers || 0));
          } else if (message.type === 'error') {
            setPendingBid(false);
            setError(message.message || 'Realtime action failed.');
            if (message.code === 'AUTH_REQUIRED') setConnection('offline');
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

    apiGetAuction(seed.id)
      .then(({ auction: fresh }) => applySnapshot(fresh))
      .catch(() => setConnection('connecting'));
    connect().catch(() => setConnection('offline'));

    return () => {
      disposedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'auction:leave', auctionId: seed.id }));
      }
      socketRef.current?.close();
    };
  }, [applySnapshot, seed.id]);

  const placeBid = useCallback(async (amount: number) => {
    setPendingBid(true);
    setError(null);
    const rid = requestId();
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && connection === 'live') {
      socket.send(JSON.stringify({ type: 'auction:bid', auctionId: seed.id, amount, requestId: rid }));
      return;
    }

    try {
      const token = await getSecure(SECURE_KEYS.authToken);
      if (!token) throw new Error('Sign in again to place a bid.');
      const result = await apiPlaceAuctionBid(token, seed.id, amount, rid);
      applySnapshot(result.auction);
      setPendingBid(false);
    } catch (reason) {
      setPendingBid(false);
      setConnection('offline');
      setError(reason instanceof Error ? reason.message : 'Could not place this bid.');
      throw reason;
    }
  }, [applySnapshot, connection, seed.id]);

  return {
    auction,
    bids,
    connection,
    viewers,
    pendingBid,
    error,
    placeBid,
    clearError: () => setError(null),
  };
}
