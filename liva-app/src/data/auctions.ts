// Live auction seed data — the pool of currently-active auctions users can
// browse from the auction list. Each snapshot pins a real end timestamp
// (relative to now) so the countdown starts fresh on every fetch.

import { PRODUCTS, byId } from './index';

export interface Auction {
  id: string;
  productId: string;
  sellerId: string;
  startingBid: number;   // USD
  currentBid: number;
  bidCount: number;
  endsAt: number;        // epoch ms
  minIncrement: number;
  status?: 'scheduled' | 'live' | 'ended' | 'cancelled';
  winnerId?: string | null;
  topBidder?: AuctionBid | null;
  bids?: AuctionBid[];
}

export interface AuctionBid {
  id: string;
  userId: string;
  userName: string;
  avatarSeed?: string;
  amount: number;
  at: number;
}

// Seed template — endsAt is computed fresh each read so the timer never
// starts "already expired" for a returning user.
interface AuctionSeed {
  productId: string;
  sellerId: string;
  startPct: number;      // starting bid as % of retail
  bidPct: number;        // current bid as % of retail
  bidCount: number;
  secondsLeft: number;
  minIncrement: number;
}

const SEEDS: AuctionSeed[] = [
  { productId: 'p5',  sellerId: 's4', startPct: 0.35, bidPct: 0.6,  bidCount: 24, secondsLeft: 90,  minIncrement: 2 },  // Cloudstep Runners
  { productId: 'p1',  sellerId: 's1', startPct: 0.25, bidPct: 0.45, bidCount: 41, secondsLeft: 45,  minIncrement: 5 },  // Aura Smartwatch
  { productId: 'p15', sellerId: 's2', startPct: 0.4,  bidPct: 0.55, bidCount: 12, secondsLeft: 120, minIncrement: 3 },  // Mira Gold Hoops
  { productId: 'p13', sellerId: 's4', startPct: 0.3,  bidPct: 0.5,  bidCount: 18, secondsLeft: 60,  minIncrement: 5 },  // Aurora Wrap Dress
  { productId: 'p2',  sellerId: 's1', startPct: 0.35, bidPct: 0.5,  bidCount: 33, secondsLeft: 30,  minIncrement: 2 },  // Pulse Pro Earbuds
];

function snapshotFromSeed(s: AuctionSeed): Auction {
  const p = byId[s.productId] || PRODUCTS[0];
  return {
    id: 'auc-' + s.productId,
    productId: s.productId,
    sellerId: s.sellerId,
    startingBid: Math.floor(p.price * s.startPct),
    currentBid: Math.floor(p.price * s.bidPct),
    bidCount: s.bidCount,
    endsAt: Date.now() + s.secondsLeft * 1000,
    minIncrement: s.minIncrement,
    status: 'live',
  };
}

// Returns a fresh snapshot of every active auction, each with a real endsAt
// timestamp counted from "now."
export function getActiveAuctions(): Auction[] {
  return SEEDS.map(snapshotFromSeed);
}

// Look up a single auction by id — snapshot is fresh at call time.
export function getAuctionById(id: string): Auction | undefined {
  const seed = SEEDS.find((s) => 'auc-' + s.productId === id);
  return seed ? snapshotFromSeed(seed) : undefined;
}

// Backwards-compat: first active auction (used before the list existed).
export function getActiveAuction(): Auction {
  return snapshotFromSeed(SEEDS[0]);
}
