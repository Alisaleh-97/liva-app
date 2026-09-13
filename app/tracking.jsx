// tracking.jsx — delivery tracking (status stepper + ETA + courier + items).
const { Icon, Thumb, Avatar, Badge, BuyBtn, money, LIVA_DATA, LIVA_I18N } = window;
const { useState, useEffect } = React;
const TR = (k, v) => LIVA_I18N.t(k, v);

function TrackingScreen({ order, onClose, onReorder }) {
  const { product: p, qty } = order;
  const seller = LIVA_DATA.sellerFor(p);
  const steps = [
    { key: 'confirmed', icon: 'check' },
    { key: 'processing', icon: 'shop' },
    { key: 'shipped', icon: 'truck' },
    { key: 'outForDelivery', icon: 'bolt' },
    { key: 'delivered', icon: 'home' },
  ];
  // animate progress forward a touch for life
  const [active, setActive] = useState(2);
  useEffect(() => { const t = setTimeout(() => setActive(3), 2600); return () => clearTimeout(t); }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 96, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name={LIVA_I18N.isRTL() ? 'chevR' : 'chevL'} size={20} color="var(--text)" /></button>
        <div><div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>{TR('trackingTitle')}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>{TR('orderNo')} #LV-48213</div></div>
      </div>

      <div className="liva-screen" style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 30px' }}>
        {/* map placeholder + ETA */}
        <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', aspectRatio: '16 / 9', marginBottom: 16, border: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #211b30, #14101f)' }} />
          {/* faux route */}
          <svg viewBox="0 0 320 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path d="M30 150 C 90 120, 110 60, 180 70 S 280 50, 290 36" fill="none" stroke="var(--accent1)" strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" />
            <circle cx="30" cy="150" r="6" fill="var(--buy)" />
            <circle cx="290" cy="36" r="7" fill="var(--accent2)" stroke="var(--bg)" strokeWidth="2" />
          </svg>
          <div className="liva-pulse" style={{ position: 'absolute', top: '20%', insetInlineEnd: '8%', width: 14, height: 14, borderRadius: '50%', background: 'var(--accent2)', boxShadow: '0 0 0 6px rgba(236,72,153,.25)' }} />
          <div style={{ position: 'absolute', insetInline: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.42)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius)', padding: '9px 12px' }}>
            <Icon name="bolt" size={18} color="var(--buy)" />
            <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{TR('estArrival')}</div><div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Today, 4:30–5:15 PM</div></div>
            <Badge kind="live">{TR('liveLocation')}</Badge>
          </div>
        </div>

        {/* stepper */}
        <div style={{ padding: '4px 6px 8px' }}>
          {steps.map((s, i) => {
            const done = i <= active; const current = i === active;
            return (
              <div key={s.key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                    background: done ? 'var(--accent-grad)' : 'var(--surface-2)', border: current ? '2px solid var(--accent2)' : 'none' }}>
                    <Icon name={done ? s.icon : s.icon} size={17} color={done ? '#fff' : 'var(--text-dim)'} /></div>
                  {i < steps.length - 1 && <div style={{ width: 2, height: 26, background: i < active ? 'var(--accent1)' : 'var(--surface-2)' }} />}
                </div>
                <div style={{ paddingTop: 7, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: done ? 'var(--text)' : 'var(--text-dim)' }}>{TR(s.key)}</div>
                  {current && <div style={{ fontSize: 11.5, color: 'var(--accent1)', marginTop: 2 }}>{TR('courier')}: Fast Express · +971 5• ••• ••</div>}
                </div>
                {current && <span className="liva-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent2)', marginTop: 14 }} />}
              </div>
            );
          })}
        </div>

        {/* items */}
        <div style={{ marginTop: 18, padding: 14, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>{TR('orderItems')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 'calc(var(--radius)*.8)', overflow: 'hidden', flexShrink: 0 }}><Thumb seed={p.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{LIVA_I18N.name(p)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{TR('qty')}: {qty}</div></div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{money(p.price * qty)}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => onReorder(p)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent-grad)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Icon name="cart" size={16} color="#fff" />{TR('reorder')}</button>
            <button style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Icon name="comment" size={16} color="var(--text)" />{TR('contactSeller')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TrackingScreen });
