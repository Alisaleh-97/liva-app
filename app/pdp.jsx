// pdp.jsx — Product Detail Page (gallery/zoom, variants, installments, trust, reviews).
const { Icon, Thumb, Avatar, Badge, Stars, BuyBtn, GradText, money, fmtK, LIVA_DATA, LIVA_I18N } = window;
const { useState, useRef } = React;
const T = (k, v) => LIVA_I18N.t(k, v);

function Gallery({ p, onZoom }) {
  const [i, setI] = useState(0);
  const ref = useRef(null);
  function onScroll() {
    const el = ref.current; if (!el) return;
    setI(Math.round(el.scrollLeft / el.clientWidth) * (LIVA_I18N.isRTL() ? -1 : 1) % p.images.length);
  }
  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} onScroll={onScroll} className="hscroll" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', aspectRatio: '1 / 1' }}>
        {p.images.map((s, k) => (
          <div key={k} onClick={() => onZoom(k)} style={{ flex: '0 0 100%', scrollSnapAlign: 'center', position: 'relative', cursor: 'zoom-in' }}>
            <Thumb seed={s} style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
          </div>
        ))}
      </div>
      <Badge kind="glass" style={{ position: 'absolute', bottom: 12, insetInlineStart: 12 }}><Icon name="scan" size={11} />360°</Badge>
      <div style={{ position: 'absolute', bottom: 13, insetInlineEnd: 12, display: 'flex', gap: 5 }}>
        {p.images.map((_, k) => <span key={k} style={{ width: Math.abs(i) === k ? 16 : 6, height: 6, borderRadius: 99, background: Math.abs(i) === k ? '#fff' : 'rgba(255,255,255,.5)', transition: 'width .2s' }} />)}
      </div>
    </div>
  );
}

function Zoom({ p, start, onClose }) {
  const [scale, setScale] = useState(1);
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 110, background: 'rgba(4,2,10,.95)', display: 'grid', placeItems: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 54, insetInlineEnd: 16, zIndex: 2, width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="close" size={18} color="#fff" /></button>
      <div onClick={e => { e.stopPropagation(); setScale(s => s === 1 ? 2.1 : 1); }} style={{ width: '88%', aspectRatio: '1/1', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: scale === 1 ? 'zoom-in' : 'zoom-out' }}>
        <div style={{ width: '100%', height: '100%', transform: `scale(${scale})`, transition: 'transform .3s' }}>
          <Thumb seed={p.images[start] || p.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 50, color: 'rgba(255,255,255,.6)', fontSize: 12 }}>Tap image to zoom</div>
    </div>
  );
}

function RatingBars({ p }) {
  // synthesize a distribution skewed to the product rating
  const dist = [0, 0, 0, 0, 0];
  const total = p.reviews;
  const r = p.rating;
  dist[4] = Math.round(total * (r >= 4.7 ? 0.74 : 0.6));
  dist[3] = Math.round(total * 0.18);
  dist[2] = Math.round(total * 0.05);
  dist[1] = Math.round(total * 0.02);
  dist[0] = total - dist[4] - dist[3] - dist[2] - dist[1];
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 38, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{p.rating}</div>
        <div style={{ display: 'flex', gap: 1, justifyContent: 'center', margin: '4px 0' }}>{[0,1,2,3,4].map(s => <Icon key={s} name="star" size={12} color={s < Math.round(p.rating) ? '#FFB339' : 'var(--surface-2)'} />)}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{fmtK(p.reviews)} {T('reviews')}</div>
      </div>
      <div style={{ flex: 1 }}>
        {[5,4,3,2,1].map(star => {
          const v = dist[star - 1]; const pct = total ? (v / total * 100) : 0;
          return (
            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-dim)', width: 8 }}>{star}</span>
              <Icon name="star" size={9} color="#FFB339" />
              <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}><div style={{ height: '100%', width: pct + '%', background: '#FFB339', borderRadius: 99 }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewItem({ r, highlight }) {
  const txt = LIVA_I18N.isRTL() ? r.textAr : r.text;
  return (
    <div style={{ padding: 13, borderRadius: 'var(--radius)', background: highlight ? 'rgba(139,92,246,.08)' : 'var(--surface)', border: '1px solid ' + (highlight ? 'rgba(139,92,246,.28)' : 'var(--border)') }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Avatar seed={r.seed} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.user}</span>
            {r.verified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--buy)', fontWeight: 600 }}><Icon name="verified" size={11} color="var(--buy)" />{T('verifiedPurchase')}</span>}
          </div>
          <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>{[0,1,2,3,4].map(s => <Icon key={s} name="star" size={10} color={s < r.rating ? '#FFB339' : 'var(--surface-2)'} />)}</div>
        </div>
        {highlight && <Badge kind="ai">{T('mostHelpful')}</Badge>}
      </div>
      <p style={{ margin: '9px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--text)' }}>{txt}</p>
      {r.photo && <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>{[r.seed + 'a', r.seed + 'b'].map(s => <div key={s} style={{ width: 56, height: 56, borderRadius: 9, overflow: 'hidden' }}><Thumb seed={s} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>)}</div>}
      <button style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, padding: '5px 11px', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit' }}>
        <Icon name="check" size={12} color="var(--text-dim)" />{T('helpful')} ({r.helpful})</button>
    </div>
  );
}

function PDP({ product, onClose, onBuy, wished, onWish }) {
  const p = product;
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(p.sizes.length ? null : 'one');
  const [zoom, setZoom] = useState(null);
  const seller = LIVA_DATA.sellerFor(p);
  const reviews = LIVA_DATA.reviewsFor(p.id);
  const photoReviews = reviews.filter(r => r.photo);
  const monthly = p.price / 6;
  const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 95, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* floating top controls */}
      <div style={{ position: 'absolute', top: 52, insetInlineStart: 12, insetInlineEnd: 12, zIndex: 4, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={circBtn()}><Icon name={LIVA_I18N.isRTL() ? 'chevR' : 'chevL'} size={20} color="#fff" /></button>
        <div style={{ display: 'flex', gap: 9 }}>
          <button style={circBtn()}><Icon name="share" size={18} color="#fff" /></button>
          <button onClick={() => onWish(p.id)} style={circBtn()}><Icon name="heart" size={19} color={wished ? 'var(--live)' : '#fff'} fill={wished ? 'var(--live)' : 'none'} /></button>
        </div>
      </div>

      <div className="liva-screen" style={{ flex: 1, overflowY: 'auto', paddingBottom: 92 }}>
        <Gallery p={p} onZoom={k => setZoom(k)} />

        <div style={{ padding: '16px 18px 0' }}>
          {/* brand + title + price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent1)', textTransform: 'uppercase', letterSpacing: .6 }}>{p.brand}</span>
            {off > 0 && <Badge kind="hot">-{off}%</Badge>}
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, lineHeight: 1.2, color: 'var(--text)', letterSpacing: -.3 }}>{LIVA_I18N.name(p)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
            <Stars rating={p.rating} reviews={p.reviews} size={14} />
            <span style={{ width: 3, height: 3, borderRadius: 99, background: 'var(--text-dim)' }} />
            <span style={{ fontSize: 12, whiteSpace: 'nowrap', color: p.stock > 10 ? 'var(--buy)' : 'var(--live)', fontWeight: 600 }}>
              {p.stock > 10 ? T('inStock') : T('lowStock', { n: p.stock })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{money(p.price)}</span>
            {p.was && <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--text-dim)', textDecoration: 'line-through' }}>{money(p.was)}</span>}
          </div>
          {p.install && (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 'calc(var(--radius)*.8)', background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)' }}>
              <Icon name="ticket" size={15} color="var(--accent1)" />
              <span style={{ fontSize: 12, color: 'var(--text)' }}>{T('orPay', { n: money(monthly) })} · <span style={{ color: 'var(--accent1)', fontWeight: 700 }}>{T('interestFree')}</span></span>
            </div>
          )}

          {/* color */}
          {p.colors.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 9 }}>{T('color')}: <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>{p.colors[color].n}</span></div>
              <div style={{ display: 'flex', gap: 10 }}>
                {p.colors.map((c, k) => (
                  <button key={k} onClick={() => setColor(k)} style={{ width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', background: c.hex, border: '2px solid ' + (color === k ? 'var(--accent1)' : 'var(--border)'), boxShadow: color === k ? '0 0 0 2px var(--bg) inset' : 'none' }} />
                ))}
              </div>
            </div>
          )}

          {/* size */}
          {p.sizes.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{T('size')}</span>
                <span style={{ fontSize: 12, color: 'var(--accent1)', fontWeight: 600 }}>Size guide</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.sizes.map(s => (
                  <button key={s} onClick={() => setSize(s)} style={{ minWidth: 46, height: 42, padding: '0 12px', borderRadius: 'calc(var(--radius)*.8)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                    border: '1.5px solid ' + (size === s ? 'var(--accent1)' : 'var(--border)'), background: size === s ? 'rgba(139,92,246,.12)' : 'var(--surface)', color: size === s ? 'var(--accent1)' : 'var(--text)' }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* trust rows */}
          <div style={{ marginTop: 22, borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
              <Avatar seed={seller.seed} size={36} verified={seller.verified} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{seller.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--buy)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="verified" size={12} color="var(--buy)" />{T('verifiedSeller')}</div></div>
              <Stars rating={seller.rating} />
            </div>
            {[['truck', T('delivery'), T('arriving', { a: p.ship[0], b: p.ship[1] })], ['shield', T('returns'), '']].map(([ic, a, b]) => (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderBottom: a === T('delivery') ? '1px solid var(--border)' : 'none' }}>
                <Icon name={ic} size={18} color="var(--accent1)" />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{a}</span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{b}</span>
              </div>
            ))}
          </div>

          {/* reviews */}
          <div style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{T('reviews')}</h3>
              <span style={{ fontSize: 13, color: 'var(--accent1)', fontWeight: 600 }}>{T('writeReview')}</span>
            </div>
            <RatingBars p={p} />
            {photoReviews.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 9 }}>{T('photoReviews')}</div>
                <div className="hscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {photoReviews.concat(photoReviews).map((r, k) => <div key={k} style={{ width: 84, height: 84, borderRadius: 'calc(var(--radius)*.8)', overflow: 'hidden', flexShrink: 0 }}><Thumb seed={r.seed + k} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>)}
                </div>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {reviews.slice(0, 3).map((r, k) => <ReviewItem key={r.id} r={r} highlight={k === 0} />)}
            </div>
            <button style={{ width: '100%', marginTop: 14, padding: '13px 0', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{T('allReviews')} ({fmtK(p.reviews)})</button>
          </div>
        </div>
      </div>

      {/* sticky buy bar */}
      <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: '12px 18px calc(12px + env(safe-area-inset-bottom))', paddingBottom: 24, background: 'color-mix(in srgb, var(--bg) 90%, transparent)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)', display: 'flex', gap: 11, alignItems: 'center' }}>
        <button onClick={() => onWish(p.id)} style={{ width: 52, height: 52, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="heart" size={22} color={wished ? 'var(--live)' : 'var(--text)'} fill={wished ? 'var(--live)' : 'none'} /></button>
        <BuyBtn full onClick={() => onBuy(p)} style={{ height: 52 }}>{T('buyNow')} · {money(p.price)}</BuyBtn>
      </div>

      {zoom != null && <Zoom p={p} start={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}
function circBtn() { return { width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.18)', background: 'rgba(0,0,0,.38)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }; }

Object.assign(window, { PDP });
