// checkout.jsx — fast multi-gateway checkout w/ installments. Tap Buy → confirm → pay → done → track.
const { Icon, Thumb, BuyBtn, money, LIVA_DATA, LIVA_I18N } = window;
const { useState, useEffect } = React;
const TC = (k, v) => LIVA_I18N.t(k, v);

function Sheet({ open, onClose, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,2,10,.6)', opacity: open ? 1 : 0, transition: 'opacity .28s' }} />
      <div style={{ position: 'absolute', insetInline: 0, bottom: 0, background: 'var(--surface)', borderRadius: '26px 26px 0 0', borderTop: '1px solid var(--border)', padding: '10px 18px 40px',
        transform: open ? 'translateY(0)' : 'translateY(110%)', transition: 'transform .34s cubic-bezier(.32,.72,0,1)', boxShadow: '0 -20px 50px -20px rgba(0,0,0,.6)', maxHeight: '88%', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--border)', margin: '0 auto 14px' }} />
        {children}
      </div>
    </div>
  );
}

function CheckoutSheet({ product, onClose, onTrack }) {
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState('full');   // full | monthly
  const [plan, setPlan] = useState(6);         // 3 | 6 | 12
  const [pay, setPay] = useState('apple');
  const open = !!product;
  useEffect(() => { if (product) { setStep(0); setQty(1); setMode('full'); } }, [product]);

  const p = product || LIVA_DATA.PRODUCTS[0];
  const total = p.price * qty;
  const monthly = total / plan;

  const methods = [
    { id: 'apple', label: TC('applePay'), sub: TC('instant'), icon: 'bolt' },
    { id: 'card', label: 'Visa •••• 4242', sub: TC('card'), icon: 'wallet' },
    { id: 'tappy', label: TC('tappy'), sub: TC('instant'), icon: 'bolt' },
    { id: 'liva', label: TC('livaBalance'), sub: money(1256.75), icon: 'wallet' },
    { id: 'cod', label: TC('cod'), sub: TC('codSub'), icon: 'truck' },
  ];

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? 'var(--accent1)' : 'var(--surface-2)', transition: 'background .3s' }} />)}
      </div>

      {step === 0 && (
        <div>
          <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{TC('confirmOrder')}</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0 }}><Thumb seed={p.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{LIVA_I18N.name(p)}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{money(p.price)}</span>
                {p.was && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', textDecoration: 'line-through' }}>{money(p.was)}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', height: 36, alignSelf: 'center', background: 'var(--surface-2)', borderRadius: 999 }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={qtyBtn()}>−</button>
              <span style={{ width: 26, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={qtyBtn()}>+</button>
            </div>
          </div>
          <Row label={TC('subtotal')} value={money(total)} />
          <Row label={TC('shipping')} value={TC('free')} green />
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
          <Row label={TC('total')} value={money(total)} big />
          <BuyBtn full onClick={() => setStep(1)} style={{ marginTop: 18 }}>{TC('continue')} · {money(total)}</BuyBtn>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, color: 'var(--text-dim)', fontSize: 11.5 }}>
            <Icon name="shield" size={13} color="var(--text-dim)" />{TC('secureReturns')}</div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{TC('payment')}</h3>
          {/* pay mode toggle */}
          {p.install && (
            <div style={{ display: 'flex', gap: 3, background: 'var(--surface-2)', borderRadius: 999, padding: 3, marginBottom: 14 }}>
              {[['full', TC('payWith')], ['monthly', TC('payMonthly')]].map(([m, lb]) => (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '9px 0', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  background: mode === m ? 'var(--accent-grad)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-dim)' }}>{lb}</button>
              ))}
            </div>
          )}

          {mode === 'monthly' && p.install && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 9, marginBottom: 12 }}>
                {[3, 6, 12].map(m => (
                  <button key={m} onClick={() => setPlan(m)} style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                    border: '1.5px solid ' + (plan === m ? 'var(--accent1)' : 'var(--border)'), background: plan === m ? 'rgba(139,92,246,.12)' : 'var(--surface-2)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{m}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{TC('months')}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius)', background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.25)' }}>
                <div><div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{money(monthly)}<span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{TC('perMonth')}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{TC('total')} {money(total)}</div></div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--accent1)', background: 'var(--surface)', padding: '5px 10px', borderRadius: 999 }}><Icon name="ticket" size={13} color="var(--accent1)" />{TC('interestFree')}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {(mode === 'monthly' ? methods.filter(m => m.id === 'card' || m.id === 'apple') : methods).map(m => (
              <button key={m.id} onClick={() => setPay(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'start', fontFamily: 'inherit',
                border: '1.5px solid ' + (pay === m.id ? 'var(--accent1)' : 'var(--border)'), background: pay === m.id ? 'rgba(139,92,246,.1)' : 'var(--surface-2)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', display: 'grid', placeItems: 'center' }}><Icon name={m.icon} size={18} color="var(--accent1)" /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.label}</div><div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{m.sub}</div></div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (pay === m.id ? 'var(--accent1)' : 'var(--border)'), display: 'grid', placeItems: 'center' }}>{pay === m.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent1)' }} />}</div>
              </button>
            ))}
          </div>
          <BuyBtn full onClick={() => setStep(2)}>{mode === 'monthly' ? `${TC('pay')} ${money(monthly)}${TC('perMonth')}` : `${TC('pay')} ${money(total)}`}</BuyBtn>
        </div>
      )}

      {step === 2 && (
        <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
          <div className="liva-pop" style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--buy)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', boxShadow: '0 12px 36px -10px var(--buy)' }}>
            <Icon name="check" size={40} color="#04210f" stroke={3} /></div>
          <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{TC('orderPlaced')}</h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.5 }}>{qty} × {LIVA_I18N.name(p)}<br />{TC('arriving', { a: p.ship[0], b: p.ship[1] })}</p>
          <BuyBtn full onClick={() => { onTrack && onTrack({ product: p, qty }); }} style={{ marginBottom: 10 }}><Icon name="truck" size={17} color="#04210f" />{TC('trackOrder')}</BuyBtn>
          <button onClick={onClose} style={{ width: '100%', padding: '13px 0', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{TC('done')}</button>
        </div>
      )}
    </Sheet>
  );
}
function qtyBtn() { return { width: 32, height: 36, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 18, fontWeight: 700 }; }
function Row({ label, value, big, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: big ? 15 : 13.5, fontWeight: big ? 800 : 500, color: big ? 'var(--text)' : 'var(--text-dim)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: big ? 18 : 13.5, fontWeight: big ? 800 : 600, color: green ? 'var(--buy)' : 'var(--text)' }}>{value}</span>
    </div>
  );
}

Object.assign(window, { CheckoutSheet });
