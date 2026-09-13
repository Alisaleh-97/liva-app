// Authoritative live-auction service. All validation happens here so every
// connected phone sees the same price, deadline and winner.

import { prisma } from '../lib/db.js';

const DEMO_AUCTIONS = [
  { id: 'auc-p5', productId: 'p5', sellerId: 's4', startingBid: 22, currentBid: 37, minIncrement: 2, durationSec: 15 * 60, bidCount: 24 },
  { id: 'auc-p1', productId: 'p1', sellerId: 's1', startingBid: 13, currentBid: 24, minIncrement: 5, durationSec: 22 * 60, bidCount: 41 },
  { id: 'auc-p15', productId: 'p15', sellerId: 's2', startingBid: 14, currentBid: 19, minIncrement: 3, durationSec: 31 * 60, bidCount: 12 },
  { id: 'auc-p13', productId: 'p13', sellerId: 's4', startingBid: 16, currentBid: 26, minIncrement: 5, durationSec: 44 * 60, bidCount: 18 },
  { id: 'auc-p2', productId: 'p2', sellerId: 's1', startingBid: 10, currentBid: 15, minIncrement: 2, durationSec: 55 * 60, bidCount: 33 },
];

const rooms = new Map();
const queues = new Map();
let publisher = () => {};
let sweepTimer = null;

const money = (n) => Math.round(Number(n) * 100) / 100;

function publicBid(bid) {
  return {
    id: bid.id,
    userId: bid.userId,
    userName: bid.userName,
    avatarSeed: bid.avatarSeed || `bidder-${bid.userName.toLowerCase()}`,
    amount: bid.amount,
    at: new Date(bid.createdAt).getTime(),
  };
}

function publicAuction(room, includeBids = false) {
  const value = {
    id: room.id,
    productId: room.productId,
    sellerId: room.sellerId,
    startingBid: room.startingBid,
    currentBid: room.currentBid,
    minIncrement: room.minIncrement,
    endsAt: new Date(room.endsAt).getTime(),
    status: room.status,
    bidCount: room.bidCount,
    winnerId: room.winnerId || null,
    topBidder: room.bids[0] ? publicBid(room.bids[0]) : null,
  };
  if (includeBids) value.bids = room.bids.slice(0, 40).map(publicBid);
  return value;
}

async function seedDemoAuctions() {
  const now = Date.now();
  for (const seed of DEMO_AUCTIONS) {
    const existing = await prisma.liveAuction.findUnique({ where: { id: seed.id } });
    const shouldReset = !existing || existing.status === 'ended' || existing.endsAt.getTime() <= now + 15_000;
    const endsAt = new Date(now + seed.durationSec * 1000);
    await prisma.liveAuction.upsert({
      where: { id: seed.id },
      create: {
        id: seed.id,
        productId: seed.productId,
        sellerId: seed.sellerId,
        startingBid: seed.startingBid,
        currentBid: seed.currentBid,
        minIncrement: seed.minIncrement,
        endsAt,
        status: 'live',
        bidCount: seed.bidCount,
      },
      update: shouldReset ? {
        currentBid: seed.currentBid,
        minIncrement: seed.minIncrement,
        endsAt,
        status: 'live',
        bidCount: seed.bidCount,
        winnerId: null,
      } : {},
    });
  }
}

async function hydrateRooms() {
  const rows = await prisma.liveAuction.findMany({
    where: { status: { in: ['scheduled', 'live'] } },
    include: { bids: { orderBy: { createdAt: 'desc' }, take: 40 } },
    orderBy: { endsAt: 'asc' },
  });
  rooms.clear();
  for (const row of rows) rooms.set(row.id, { ...row, bids: row.bids });
}

export async function initAuctionService() {
  await seedDemoAuctions();
  await hydrateRooms();
  if (sweepTimer) clearInterval(sweepTimer);
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (room.status !== 'live' || new Date(room.endsAt).getTime() > now) continue;
      room.status = 'ended';
      room.winnerId = room.bids[0]?.userId || null;
      prisma.liveAuction.update({
        where: { id: room.id },
        data: { status: 'ended', winnerId: room.winnerId },
      }).catch((error) => console.error('[auction] failed to persist ending', error));
      publisher(room.id, { type: 'auction:ended', auction: publicAuction(room, true) });
    }
  }, 1000);
  sweepTimer.unref?.();
}

export function setAuctionPublisher(fn) {
  publisher = typeof fn === 'function' ? fn : () => {};
}

export function listAuctions() {
  return [...rooms.values()]
    .filter((room) => room.status !== 'cancelled')
    .sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt))
    .map((room) => publicAuction(room, false));
}

export function getAuction(id, includeBids = true) {
  const room = rooms.get(id);
  return room ? publicAuction(room, includeBids) : null;
}

function enqueue(auctionId, task) {
  const previous = queues.get(auctionId) || Promise.resolve();
  const next = previous.then(task, task).finally(() => {
    if (queues.get(auctionId) === next) queues.delete(auctionId);
  });
  queues.set(auctionId, next);
  return next;
}

export function placeBid({ auctionId, user, amount, requestId }) {
  return enqueue(auctionId, async () => {
    const room = rooms.get(auctionId);
    if (!room) throw Object.assign(new Error('Auction not found.'), { status: 404, code: 'NOT_FOUND' });
    if (room.status !== 'live' || new Date(room.endsAt).getTime() <= Date.now()) {
      throw Object.assign(new Error('This auction has ended.'), { status: 409, code: 'AUCTION_ENDED' });
    }

    const value = money(amount);
    const minimum = money(room.currentBid + room.minIncrement);
    if (!Number.isFinite(value) || value < minimum) {
      throw Object.assign(new Error(`Minimum bid is ${minimum.toFixed(2)}.`), {
        status: 409,
        code: 'BID_TOO_LOW',
        minimum,
      });
    }
    if (value > 1_000_000) {
      throw Object.assign(new Error('Bid exceeds the allowed limit.'), { status: 400, code: 'BID_LIMIT' });
    }

    if (requestId) {
      const existing = await prisma.auctionBid.findUnique({ where: { requestId } });
      if (existing) return getAuction(auctionId, true);
    }

    const previousTop = room.bids[0];
    const remaining = new Date(room.endsAt).getTime() - Date.now();
    if (remaining <= 10_000) room.endsAt = new Date(Date.now() + 10_000);

    const userName = user.businessName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'LIVA shopper';
    const bid = await prisma.$transaction(async (tx) => {
      const created = await tx.auctionBid.create({
        data: {
          auctionId,
          userId: user.id,
          userName,
          avatarSeed: user.avatarSeed,
          amount: value,
          requestId: requestId || null,
        },
      });
      await tx.liveAuction.update({
        where: { id: auctionId },
        data: {
          currentBid: value,
          bidCount: { increment: 1 },
          endsAt: room.endsAt,
          status: 'live',
        },
      });
      if (previousTop && previousTop.userId !== user.id) {
        await tx.notification.create({
          data: {
            userId: previousTop.userId,
            kind: 'auction',
            title: 'You were outbid',
            body: `${userName} placed a higher bid of $${value.toFixed(2)}.`,
            data: JSON.stringify({ auctionId, amount: value }),
          },
        }).catch(() => null);
      }
      return created;
    });

    room.currentBid = value;
    room.bidCount += 1;
    room.bids = [bid, ...room.bids].slice(0, 40);
    const auction = publicAuction(room, true);
    publisher(auctionId, { type: 'auction:bid', auction, bid: publicBid(bid) });
    return auction;
  });
}

export async function createAuction({ user, productId, startingBid, minIncrement, durationMinutes }) {
  const now = Date.now();
  const row = await prisma.liveAuction.create({
    data: {
      id: `auc-${Date.now().toString(36)}`,
      productId,
      sellerId: user.id,
      startingBid: money(startingBid),
      currentBid: money(startingBid),
      minIncrement: money(minIncrement),
      endsAt: new Date(now + durationMinutes * 60_000),
      status: 'live',
      bidCount: 0,
    },
    include: { bids: true },
  });
  rooms.set(row.id, { ...row, bids: [] });
  return getAuction(row.id, true);
}
