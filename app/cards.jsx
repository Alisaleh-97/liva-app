// cards.jsx — composite cards for feeds/grids. Exports: ProductCard, FlashCard,
// StreamCard, AIPickCard, SellerRow
const { Icon, Thumb, Avatar, Badge, Stars, BuyBtn, LiveDot, money, fmtK, LIVA_DATA } = window;
const tname = (p) => (window.LIVA_I18N ? window.LIVA_I18N.name(p) : p.name);
const tt = (k, v) => (window.LIVA_I18N ? window.LIVA_I18N.t(k, v) : k);

function discount(p) { return p.was ? Math.round((1 - p.price / p.was) * 100) : 0; }

// Grid product card (Shop, AI picks list)
function ProductCard({ p, onOpen, onBuy }) {
  const off = discount(p);
  return (
    <div onClick={() => onOpen && onOpen(p)} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)',
      overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1' }}>
        <Thumb seed={p.seed} style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
        {off > 0 && <Badge kind="live" style={{ position: 'absolute', top: 9, insetInlineStart: 9, background: 'var(--live)' }}>-{off}%</Badge>}
        {p.badge && <Badge kind={p.badge === 'AI Pick' ? 'ai' : 'hot'} style={{ position: 'absolute', top: 9, insetInlineEnd: 9 }}>{p.badge}</Badge>}
        <button onClick={e => { e.stopPropagation(); window.__livaWishToggle && window.__livaWishToggle(p.id); }} style={{ position: 'absolute', bottom: 9, insetInlineEnd: 9,
          width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(0,0,0,.32)', backdropFilter: 'blur(6px)', color: '#fff',
          display: 'grid', placeItems: 'center' }}>
          {(() => { const w = window.__livaWish && window.__livaWish.has(p.id); return <Icon name="heart" size={16} color={w ? 'var(--live)' : '#fff'} fill={w ? 'var(--live)' : 'none'} />; })()}</button>
      </div>
      <div style={{ padding: '11px 12px 12px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 35 }}>{tname(p)}</div>
        <div style={{ marginTop: 6 }}><Stars rating={p.rating} reviews={p.reviews} /></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{money(p.price)}</span>
            {p.was && <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-dim)', textDecoration: 'line-through' }}>{money(p.was)}</span>}
          </div>
          <BuyBtn small onClick={e => { e.stopPropagation(); onBuy && onBuy(p); }}>Buy</BuyBtn>
        </div>
      </div>
    </div>
  );
}

// Compact flash-deal card (Home, horizontal scroll)
function FlashCard({ p, onOpen, onBuy }) {
  const off = discount(p);
  return (
    <div onClick={() => onOpen && onOpen(p)} style={{ width: 132, flexShrink: 0, cursor: 'pointer' }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <Thumb seed={p.seed} style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
        {off > 0 && <Badge kind="live" style={{ position: 'absolute', top: 8, left: 8 }}>-{off}%</Badge>}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginTop: 8, lineHeight: 1.25,
        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tname(p)}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--buy)' }}>{money(p.price)}</span>
        {p.was && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-dim)', textDecoration: 'line-through' }}>{money(p.was)}</span>}
      </div>
    </div>
  );
}

// Live stream card (Home "Live Now" rail)
function StreamCard({ stream, onJoin }) {
  const host = LIVA_DATA.byId ? null : null;
  const seller = LIVA_DATA.SELLERS.find(s => s.id === stream.host);
  const prod = LIVA_DATA.byId[stream.product];
  return (
    <div onClick={() => onJoin && onJoin(stream)} style={{ width: 220, flexShrink: 0, cursor: 'pointer',
      borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative', aspectRatio: '3 / 4',
      border: '1px solid var(--border)' }}>
      <Thumb seed={stream.id + seller.seed} vivid style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,5,16,.45) 0%, transparent 28%, transparent 50%, rgba(8,5,16,.9) 100%)' }} />
      {/* top row */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between' }}>
        <Badge kind="live">Live</Badge>
        <Badge kind="glass"><Icon name="eye" size={11} />{fmtK(stream.viewers)}</Badge>
      </div>
      {/* bottom */}
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <Avatar seed={seller.seed} size={26} verified={seller.verified} />
          <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{seller.name}</span>
        </div>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.25, marginBottom: 9,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{(window.LIVA_I18N && window.LIVA_I18N.isRTL() && stream.titleAr) ? stream.titleAr : stream.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)',
          borderRadius: 'calc(var(--radius)*.7)', padding: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}><Thumb seed={prod.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tname(prod)}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 700, color: 'var(--buy)' }}>{money(prod.price)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI pick card — product + one-line reason
function AIPickCard({ pick, onOpen, onBuy }) {
  const p = LIVA_DATA.byId[pick.product];
  return (
    <div onClick={() => onOpen && onOpen(p)} style={{ width: 250, flexShrink: 0, cursor: 'pointer',
      background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
      padding: 12, display: 'flex', gap: 12 }}>
      <div style={{ width: 76, height: 76, borderRadius: 'calc(var(--radius)*.8)', overflow: 'hidden', flexShrink: 0 }}>
        <Thumb seed={p.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <Icon name="ai" size={13} color="var(--accent1)" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent1)', textTransform: 'uppercase', letterSpacing: .4 }}>AI · {pick.confidence}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tname(p)}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.3, marginTop: 3, marginBottom: 'auto',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pick.reason}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{money(p.price)}</span>
          <BuyBtn small onClick={e => { e.stopPropagation(); onBuy && onBuy(p); }}>Buy</BuyBtn>
        </div>
      </div>
    </div>
  );
}

function SellerRow({ seller, rank }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <span style={{ width: 18, fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
        color: rank <= 3 ? 'var(--accent1)' : 'var(--text-dim)' }}>{rank}</span>
      <Avatar seed={seller.seed} size={42} verified={seller.verified} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{seller.name}</div>
        <div style={{ marginTop: 2 }}><Stars rating={seller.rating} /></div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmtK(seller.sales)}</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: .4 }}>sales</div>
      </div>
    </div>
  );
}

Object.assign(window, { ProductCard, FlashCard, StreamCard, AIPickCard, SellerRow, discount });
