import WebSocket from 'ws';

const HTTP_URL = process.env.TEST_API_URL || 'http://localhost:3001';
const WS_URL = HTTP_URL.replace(/^http/, 'ws') + '/realtime';

async function post(path, body) {
  const response = await fetch(HTTP_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path}: ${response.status} ${data.error || 'failed'}`);
  return data;
}

function opened(socket) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket open timed out')), 5000);
    socket.once('open', () => { clearTimeout(timer); resolve(); });
    socket.once('error', reject);
  });
}

function waitFor(socket, predicate, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error(`${label} timed out`));
    }, 5000);
    function onMessage(raw) {
      const message = JSON.parse(raw.toString());
      if (!predicate(message)) return;
      clearTimeout(timer);
      socket.off('message', onMessage);
      resolve(message);
    }
    socket.on('message', onMessage);
  });
}

const suffix = String(Date.now());
const account = await post('/api/auth/register', {
  email: `realtime-smoke-${suffix}@example.com`,
  password: 'Realtime9!',
  firstName: 'Realtime',
  lastName: 'Tester',
  phone: `+97155${suffix.slice(-7)}`,
  country: 'AE',
  role: 'shopper',
  provider: 'email',
});

const roomId = `smoke:${suffix}`;
const first = new WebSocket(`${WS_URL}?token=${encodeURIComponent(account.token)}`);
const second = new WebSocket(`${WS_URL}?token=${encodeURIComponent(account.token)}`);
let third;

try {
  await Promise.all([opened(first), opened(second)]);

  const firstSnapshot = waitFor(first, (m) => m.type === 'live:snapshot' && m.roomId === roomId, 'first snapshot');
  first.send(JSON.stringify({ type: 'live:join', roomId }));
  await firstSnapshot;

  const secondSnapshot = waitFor(second, (m) => m.type === 'live:snapshot' && m.roomId === roomId, 'second snapshot');
  const viewerUpdate = waitFor(first, (m) => m.type === 'live:viewers' && m.viewers === 2, 'viewer update');
  second.send(JSON.stringify({ type: 'live:join', roomId }));
  await Promise.all([secondSnapshot, viewerUpdate]);

  const chatOnSecond = waitFor(second, (m) => m.type === 'live:chat' && m.message?.text === 'hello from device one', 'chat broadcast');
  first.send(JSON.stringify({ type: 'live:chat', roomId, text: 'hello from device one' }));
  await chatOnSecond;

  const reactionOnFirst = waitFor(first, (m) => m.type === 'live:reaction' && m.reaction?.kind === 'fire', 'reaction broadcast');
  second.send(JSON.stringify({ type: 'live:reaction', roomId, kind: 'fire' }));
  await reactionOnFirst;

  const firstClosed = new Promise((resolve) => first.once('close', resolve));
  const secondClosed = new Promise((resolve) => second.once('close', resolve));
  first.close();
  second.close();
  await Promise.all([firstClosed, secondClosed]);

  third = new WebSocket(`${WS_URL}?token=${encodeURIComponent(account.token)}`);
  await opened(third);
  const persistedSnapshot = waitFor(
    third,
    (m) => m.type === 'live:snapshot' && m.roomId === roomId,
    'persisted chat snapshot',
  );
  third.send(JSON.stringify({ type: 'live:join', roomId }));
  const replay = await persistedSnapshot;
  if (!replay.messages?.some((message) => message.text === 'hello from device one')) {
    throw new Error('persisted chat message was not replayed after reconnect');
  }

  console.log('realtime smoke: presence, chat, reactions, and persisted replay passed');
} finally {
  first.close();
  second.close();
  third?.close();
}
