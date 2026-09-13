// live.jsx — Live: real-time commerce streaming (hero screen).
const { Icon, Thumb, Avatar, Badge, BuyBtn, LiveDot, money, fmtK, LIVA_DATA, LIVA_I18N } = window;
const { useState, useEffect, useRef } = React;
const LV = (k, v) => LIVA_I18N.t(k, v);

function ActionRail({ liked, onLike, likes, onBuy, onGift }) {
  const Btn = ({ icon, label, onClick, color, active, pop }) => (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'none', border: 'none', cursor: 'pointer' }}>
      <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(0,0,0,.32)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,.14)', display: 'grid', placeItems: 'center',
        transform: pop ? 'scale(1.18)' : 'scale(1)', transition: 'transform .2s' }}>
        <Icon name={icon} size={23} color={active ? color : '#fff'} fill={active ? color : 'none'} />
      </span>
      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,.6)' }}>{label}</span>
    </button>
  );
  return (
    <div style={{ position: 'absolute', right: 12, bottom: 188, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 6 }}>
      <Btn icon="heart" label={fmtK(likes)} onClick={onLike} color="var(--live)" active={liked} pop={liked} />
      <Btn icon="comment" label="1.2K" />
      <Btn icon="gift" label="8.6K" onClick={onGift} />
      <Btn icon="share" label="533" />
    </div>
  );
}

function FloatingChat({ messages }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages]);
  return (
    <div ref={ref} style={{ position: 'absolute', left: 12, right: 78, bottom: 176, maxHeight: 168, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 5, maskImage: 'linear-gradient(180deg, transparent, #000 22%)' }}>
      {messages.map(m => (
        <div key={m.id} className="liva-msg-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, alignSelf: 'flex-start', maxWidth: '100%' }}>
          <Avatar seed={m.seed} size={26} />
          <div style={{ background: m.intent ? 'rgba(34,197,94,.22)' : 'rgba(0,0,0,.34)', backdropFilter: 'blur(8px)',
            border: m.intent ? '1px solid rgba(34,197,94,.5)' : '1px solid rgba(255,255,255,.08)',
            borderRadius: 13, padding: '6px 11px' }}>
            <span style={{ color: m.intent ? 'var(--buy)' : 'rgba(255,255,255,.7)', fontSize: 11.5, fontWeight: 700, marginRight: 6 }}>{m.user}</span>
            <span style={{ color: '#fff', fontSize: 12.5 }}>{m.text}</span>
            {m.intent && <span style={{ marginLeft: 6 }}><Icon name="bolt" size={11} color="var(--buy)" style={{ display: 'inline' }} /></span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveScreen({ onBuy, onClose, onGift }) {
  const stream = LIVA_DATA.STREAMS[0];
  const seller = LIVA_DATA.SELLERS.find(s => s.id === stream.host);
  const prod = LIVA_DATA.byId[stream.product];

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(stream.likes);
  const [viewers, setViewers] = useState(stream.viewers);
  const [stock, setStock] = useState(23);
  const [msgs, setMsgs] = useState(() => LIVA_DATA.CHAT_SEED.slice(0, 3).map((m, i) => ({ ...m, id: 'm' + i })));
  const [urgency, setUrgency] = useState(false);
  const [hearts, setHearts] = useState([]);
  const idx = useRef(3);
  const hid = useRef(0);

  // drip chat
  useEffect(() => {
    const t = setInterval(() => {
      const base = LIVA_DATA.CHAT_SEED[idx.current % LIVA_DATA.CHAT_SEED.length];
      idx.current++;
      setMsgs(prev => [...prev.slice(-7), { ...base, id: 'm' + idx.current }]);
      setViewers(v => v + Math.floor(Math.random() * 40 - 12));
      if (Math.random() > 0.5) setLikes(l => l + Math.floor(Math.random() * 30 + 5));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  // urgency mode kicks in after engagement builds
  useEffect(() => {
    const t = setTimeout(() => setUrgency(true), 7000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!urgency) return;
    const t = setInterval(() => setStock(s => (s > 4 ? s - 1 : s)), 3200);
    return () => clearInterval(t);
  }, [urgency]);

  function tapLike() {
    setLiked(true); setLikes(l => l + 1);
    const id = ++hid.current;
    setHearts(h => [...h, { id, x: Math.random() * 30 - 15 }]);
    setTimeout(() => setHearts(h => h.filter(x => x.id !== id)), 1400);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#07040e', overflow: 'hidden' }}>
      {/* video */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #2a1840, #0e0820 70%)' }} />
      <image-slot id="liva-live-fullscreen" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        shape="rect" placeholder="Drop live stream video frame"></image-slot>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(7,4,14,.7) 0%, transparent 18%, transparent 46%, rgba(7,4,14,.92) 100%)' }} />

      {/* floating hearts */}
      {hearts.map(h => (
        <div key={h.id} className="liva-heart" style={{ position: 'absolute', right: 30, bottom: 232, transform: `translateX(${h.x}px)`, zIndex: 7, pointerEvents: 'none' }}>
          <Icon name="heart" size={26} color="var(--live)" fill="var(--live)" />
        </div>
      ))}

      {/* top bar */}
      <div style={{ position: 'absolute', top: 54, left: 12, right: 12, zIndex: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(0,0,0,.34)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,.1)', borderRadius: 999, padding: '5px 12px 5px 5px' }}>
          <Avatar seed={seller.seed} size={32} verified={seller.verified} />
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>{seller.name}</div>
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>{fmtK(seller.sales)} {LV('followers')}</div>
          </div>
          <button style={{ marginInlineStart: 4, background: 'var(--accent-grad)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, padding: '6px 13px', borderRadius: 999, cursor: 'pointer' }}>{LV('follow')}</button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge kind="live">Live</Badge>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,.34)', backdropFilter: 'blur(10px)',
            borderRadius: 999, padding: '5px 10px', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            <Icon name="eye" size={13} />{fmtK(viewers)}</div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,.14)',
            background: 'rgba(0,0,0,.34)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <Icon name="close" size={18} color="#fff" /></button>
        </div>
      </div>

      {/* urgency banner */}
      {urgency && (
        <div className="liva-msg-in" style={{ position: 'absolute', top: 104, left: 12, right: 12, zIndex: 6,
          display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(90deg, var(--live), var(--accent2))',
          borderRadius: 'var(--radius)', padding: '8px 13px', boxShadow: '0 8px 24px -8px var(--live)' }}>
          <Icon name="bolt" size={16} color="#fff" />
          <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 800, letterSpacing: .2 }}>{LV('flashUnlocked')}</span>
          <span style={{ color: 'rgba(255,255,255,.9)', fontSize: 12 }}>· {LV('demandSpiking')}</span>
          <span style={{ marginInlineStart: 'auto', fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 700, color: '#fff',
            background: 'rgba(0,0,0,.22)', padding: '2px 8px', borderRadius: 6 }}>{stock} {LV('left')}</span>
        </div>
      )}

      <ActionRail liked={liked} onLike={tapLike} likes={likes} onGift={onGift} />
      <FloatingChat messages={msgs} />

      {/* floating product card */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 116, zIndex: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(18,12,28,.78)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,.1)', borderRadius: 'calc(var(--radius)*1.05)', padding: 10,
          boxShadow: urgency ? '0 0 0 1.5px var(--buy), 0 12px 30px -10px rgba(0,0,0,.6)' : '0 12px 30px -10px rgba(0,0,0,.6)',
          transition: 'box-shadow .4s' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'calc(var(--radius)*.8)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
            <Thumb seed={prod.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            {urgency && <Badge kind="live" style={{ position: 'absolute', top: 4, left: 4, fontSize: 8, padding: '2px 4px' }}>-35%</Badge>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{LIVA_I18N.name(prod)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 800, color: '#fff' }}>{money(prod.price)}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'rgba(255,255,255,.5)', textDecoration: 'line-through' }}>{money(prod.was)}</span>
              {urgency && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--buy)', fontSize: 10.5, fontWeight: 700 }}><Icon name="clock" size={11} color="var(--buy)" />{LV('endsSoon')}</span>}
            </div>
          </div>
          <BuyBtn onClick={() => onBuy(prod)} style={{ flexShrink: 0 }}>{LV('buyNow')}</BuyBtn>
        </div>
      </div>

      {/* comment composer */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 64, zIndex: 6, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 14px',
          background: 'rgba(0,0,0,.36)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999 }}>
          <span style={{ flex: 1, color: 'rgba(255,255,255,.55)', fontSize: 13 }}>{LV('addComment')}</span>
        </div>
        <button onClick={onGift} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 16px -6px var(--accent1)' }}>
          <Icon name="gift" size={20} color="#fff" /></button>
      </div>
    </div>
  );
}

Object.assign(window, { LiveScreen });
