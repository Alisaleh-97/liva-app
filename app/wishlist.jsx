// wishlist.jsx — saved items + price-drop alerts.
const { Icon, Thumb, Badge, Stars, BuyBtn, ProductCard, money, LIVA_DATA, LIVA_I18N } = window;
const TW = (k, v) => LIVA_I18N.t(k, v);

// deterministic faux "recent drop" for some saved items
function dropFor(p) { return (p.id.charCodeAt(1) % 2 === 0) ? (8 + (p.id.charCodeAt(1) % 10)) : 0; }

function WishlistScreen({ ids, onClose, onOpen, onBuy, onWish }) {
  const items = LIVA_DATA.PRODUCTS.filter(p => ids.includes(p.id));
  const drops = items.filter(p => dropFor(p) > 0);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 92, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name={LIVA_I18N.isRTL() ? 'chevR' : 'chevL'} size={20} color="var(--text)" /></button>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{TW('wishlistTitle')}</div>
        <span style={{ marginInlineStart: 'auto', fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>{items.length}</span>
      </div>

      <div className="liva-screen" style={{ flex: 1, overflowY: 'auto', padding: '6px 0 30px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 36px', color: 'var(--text-dim)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><Icon name="heart" size={28} color="var(--text-dim)" /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{TW('emptyWishlist')}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.45, marginBottom: 20 }}>{TW('emptyWishlistSub')}</div>
            <button onClick={onClose} style={{ padding: '12px 22px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent-grad)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{TW('browse')}</button>
          </div>
        ) : (
          <div>
            {/* price-drop alerts */}
            {drops.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', marginBottom: 12 }}>
                  <Icon name="bell" size={17} color="var(--accent2)" />
                  <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{TW('priceDropAlerts')}</h3>
                </div>
                <div className="hscroll" style={{ display: 'flex', gap: 12, padding: '0 18px', overflowX: 'auto' }}>
                  {drops.map(p => (
                    <div key={p.id} onClick={() => onOpen(p)} style={{ width: 220, flexShrink: 0, cursor: 'pointer', display: 'flex', gap: 11, padding: 11, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid rgba(236,72,153,.3)' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 'calc(var(--radius)*.8)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <Thumb seed={p.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                        <Badge kind="hot" style={{ position: 'absolute', top: 4, insetInlineStart: 4, fontSize: 8, padding: '2px 4px' }}>-{dropFor(p)}%</Badge>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{LIVA_I18N.name(p)}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--accent2)', fontWeight: 700, margin: '3px 0' }}><Icon name="trend" size={11} color="var(--accent2)" style={{ transform: 'scaleY(-1)' }} />{TW('dropped')} {dropFor(p)}%</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 800, color: 'var(--buy)' }}>{money(p.price)}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-dim)', textDecoration: 'line-through' }}>{money(p.was)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* all saved */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 18px' }}>
              {items.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen} onBuy={onBuy} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { WishlistScreen });
