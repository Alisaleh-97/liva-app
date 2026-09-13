import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../lib/auth.js';
import { findById } from '../lib/userStore.js';
import { prisma } from '../lib/db.js';
import { getAuction, placeBid, setAuctionPublisher } from './auctionService.js';

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

export function attachAuctionHub(server) {
  const wss = new WebSocketServer({ server, path: '/realtime' });
  const subscriptions = new Map();
  // Live-shopping rooms intentionally live in this same WebSocket server so
  // the mobile client only opens one realtime endpoint. Presence remains
  // ephemeral, while chat history is persisted through Prisma and replayed
  // when a device joins or reconnects.
  const liveRooms = new Map();

  function leaveAuctions(socket) {
    for (const [auctionId, members] of subscriptions) {
      if (!members.delete(socket)) continue;
      if (members.size === 0) subscriptions.delete(auctionId);
      else broadcast(auctionId, { type: 'auction:viewers', auctionId, viewers: members.size, serverTime: Date.now() });
    }
  }

  function getLiveRoom(roomId) {
    let room = liveRooms.get(roomId);
    if (!room) {
      room = { members: new Set(), messages: [], lastActivity: Date.now() };
      liveRooms.set(roomId, room);
    }
    return room;
  }

  function broadcastLive(roomId, payload) {
    const room = liveRooms.get(roomId);
    if (!room) return;
    for (const member of room.members) send(member, payload);
  }

  function leaveLive(socket) {
    const roomId = socket.liveRoomId;
    if (!roomId) return;
    const room = liveRooms.get(roomId);
    socket.liveRoomId = null;
    if (!room) return;
    room.members.delete(socket);
    if (room.members.size === 0) {
      liveRooms.delete(roomId);
      return;
    }
    broadcastLive(roomId, { type: 'live:viewers', roomId, viewers: room.members.size, serverTime: Date.now() });
  }

  function leaveAll(socket) {
    leaveAuctions(socket);
    leaveLive(socket);
  }

  function broadcast(auctionId, payload) {
    const members = subscriptions.get(auctionId);
    if (!members) return;
    for (const socket of members) send(socket, payload);
  }

  setAuctionPublisher(broadcast);

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url || '/realtime', 'http://localhost');
    const payload = verifyToken(url.searchParams.get('token') || '');
    // Register the message listener synchronously. A phone can send its join
    // frame immediately after the WebSocket opens, before the database lookup
    // for the authenticated user finishes. Awaiting here used to drop that
    // first frame intermittently on fast clients.
    const userPromise = payload?.sub ? findById(payload.sub).catch(() => null) : Promise.resolve(null);
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });

    userPromise.then((user) => {
      send(socket, { type: 'connected', authenticated: !!user, serverTime: Date.now() });
    });

    socket.on('message', async (raw) => {
      const user = await userPromise;
      let message;
      try { message = JSON.parse(raw.toString()); }
      catch { return send(socket, { type: 'error', code: 'BAD_MESSAGE', message: 'Invalid realtime message.' }); }

      if (message.type === 'ping') return send(socket, { type: 'pong', serverTime: Date.now() });

      if (message.type === 'auction:join') {
        const auction = getAuction(String(message.auctionId || ''), true);
        if (!auction) return send(socket, { type: 'error', code: 'NOT_FOUND', message: 'Auction not found.' });
        leaveAuctions(socket);
        const members = subscriptions.get(auction.id) || new Set();
        members.add(socket);
        subscriptions.set(auction.id, members);
        send(socket, { type: 'auction:snapshot', auction, serverTime: Date.now(), viewers: members.size });
        broadcast(auction.id, { type: 'auction:viewers', auctionId: auction.id, viewers: members.size, serverTime: Date.now() });
        return;
      }

      if (message.type === 'auction:leave') {
        leaveAuctions(socket);
        return;
      }

      if (message.type === 'auction:bid') {
        if (!user) return send(socket, { type: 'error', code: 'AUTH_REQUIRED', message: 'Sign in again to place a bid.' });
        try {
          await placeBid({
            auctionId: String(message.auctionId || ''),
            user,
            amount: Number(message.amount),
            requestId: String(message.requestId || ''),
          });
        } catch (error) {
          send(socket, {
            type: 'error',
            code: error.code || 'BID_FAILED',
            message: error.message || 'Bid failed.',
            minimum: error.minimum,
          });
        }
        return;
      }

      if (message.type === 'live:join') {
        const roomId = String(message.roomId || '').trim();
        if (!/^[A-Za-z0-9:_-]{2,120}$/.test(roomId)) {
          return send(socket, { type: 'error', code: 'BAD_ROOM', message: 'Invalid live room.' });
        }
        leaveLive(socket);
        const room = getLiveRoom(roomId);
        room.lastActivity = Date.now();
        try {
          const stored = await prisma.liveRoomMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            take: 100,
          });
          room.messages = stored.reverse().map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.getTime(),
          }));
        } catch (error) {
          console.error('[realtime/live:join] could not load room history', error);
        }
        room.members.add(socket);
        socket.liveRoomId = roomId;
        send(socket, {
          type: 'live:snapshot',
          roomId,
          messages: room.messages,
          viewers: room.members.size,
          currentUserId: user?.id || null,
          serverTime: Date.now(),
        });
        broadcastLive(roomId, { type: 'live:viewers', roomId, viewers: room.members.size, serverTime: Date.now() });
        return;
      }

      if (message.type === 'live:leave') {
        leaveLive(socket);
        return;
      }

      if (message.type === 'live:chat') {
        if (!user) return send(socket, { type: 'error', code: 'AUTH_REQUIRED', message: 'Sign in again to chat.' });
        const roomId = String(message.roomId || '');
        if (!roomId || socket.liveRoomId !== roomId) {
          return send(socket, { type: 'error', code: 'ROOM_REQUIRED', message: 'Join this live room before chatting.' });
        }
        const now = Date.now();
        if (socket.lastChatAt && now - socket.lastChatAt < 700) {
          return send(socket, { type: 'error', code: 'CHAT_RATE_LIMIT', message: 'Please wait a moment before sending again.' });
        }
        const text = String(message.text || '').trim().replace(/\s+/g, ' ').slice(0, 240);
        if (!text) return;
        socket.lastChatAt = now;
        const room = getLiveRoom(roomId);
        let chat;
        try {
          const stored = await prisma.liveRoomMessage.create({
            data: {
              roomId,
              userId: user.id,
              userName: user.firstName || 'LIVA user',
              avatarSeed: user.avatarSeed || `user-${user.id}`,
              text,
            },
          });
          chat = { ...stored, createdAt: stored.createdAt.getTime() };
        } catch (error) {
          console.error('[realtime/live:chat] could not persist message', error);
          return send(socket, { type: 'error', code: 'CHAT_SAVE_FAILED', message: 'Message could not be saved. Try again.' });
        }
        room.messages = [...room.messages.slice(-99), chat];
        room.lastActivity = now;
        broadcastLive(roomId, { type: 'live:chat', roomId, message: chat, serverTime: now });
        return;
      }

      if (message.type === 'live:reaction') {
        const roomId = String(message.roomId || '');
        if (!roomId || socket.liveRoomId !== roomId) return;
        const now = Date.now();
        if (socket.lastReactionAt && now - socket.lastReactionAt < 120) return;
        const kind = String(message.kind || '');
        if (!['heart', 'fire', 'money', 'clap', 'laugh', 'wow'].includes(kind)) return;
        socket.lastReactionAt = now;
        const room = getLiveRoom(roomId);
        room.lastActivity = now;
        broadcastLive(roomId, {
          type: 'live:reaction',
          roomId,
          reaction: {
            id: `reaction_${now}_${Math.random().toString(36).slice(2, 9)}`,
            userId: user?.id || null,
            kind,
            createdAt: now,
          },
          serverTime: now,
        });
      }
    });

    socket.on('close', () => leaveAll(socket));
    socket.on('error', () => leaveAll(socket));
  });

  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (socket.isAlive === false) {
        leaveAll(socket);
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
    const staleBefore = Date.now() - 6 * 60 * 60 * 1000;
    for (const [roomId, room] of liveRooms) {
      if (room.members.size === 0 && room.lastActivity < staleBefore) liveRooms.delete(roomId);
    }
  }, 30_000);
  heartbeat.unref?.();

  return wss;
}
