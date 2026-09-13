// ai.jsx — AI: commerce intelligence engine (decision assistant).
const { Icon, Avatar, Thumb, BuyBtn, GradText, money, fmtK, LIVA_DATA, LIVA_I18N } = window;
const { useState, useRef, useEffect } = React;
const A = (k, v) => LIVA_I18N.t(k, v);

// canned, actionable responses — AI as a decision engine, not a chatbot
function respond(text) {
  const t = text.toLowerCase();
  if (/live|go live|when/.test(t))
    return { text: "Best window: Thursday 8–9 PM. Your beauty audience converts 2.3× then. Lead with the perfume drop — it's your top live mover.", chips: ['Schedule live', 'Go live now'] };
  if (/sell|promote/.test(t))
    return { text: "Promote the Pulse Pro Earbuds. Margin is healthy and search demand is up 41% this week. I'd bundle it with the GaN charger.", products: ['p2', 'p9'], chips: ['Promote now'] };
  if (/buy|trending|what should/.test(t))
    return { text: "Two strong buys right now — both flagged by price + trend velocity:", products: ['p9', 'p5'], chips: ['Buy both'] };
  if (/market|analyz|trend/.test(t))
    return { text: "Market read: Electronics demand +18% WoW, Beauty steady, Fashion cooling. Regional spike on runners. Reallocate ad spend toward tech.", chips: ['See full report'] };
  if (/price|pricing/.test(t))
    return { text: "Drop the Velvet Rose to $37.99 during live sessions only — elasticity data says you'll net +12% units with minimal margin hit.", products: ['p3'], chips: ['Apply pricing'] };
  return { text: "On it. I can tell you what to buy, what to sell, when to go live, or read the market. Tap a quick action or ask away.", chips: [] };
}

function ProductMini({ id, onBuy, onOpen }) {
  const p = LIVA_DATA.byId[id];
  return (
    <div onClick={() => onOpen(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'var(--surface-2)',
      borderRadius: 'calc(var(--radius)*.85)', cursor: 'pointer' }}>
      <div style={{ width: 42, height: 42, borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}><Thumb seed={p.seed} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--buy)' }}>{money(p.price)}</div>
      </div>
      <BuyBtn small onClick={e => { e.stopPropagation(); onBuy(p); }}>Buy</BuyBtn>
    </div>
  );
}

function AIScreen({ onBuy, onOpen, onGoTab }) {
  const [msgs, setMsgs] = useState([{ role: 'ai', text: LIVA_DATA.AI_GREETING[LIVA_I18N.state.lang] || LIVA_DATA.AI_GREETING.en }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, typing]);

  function ask(text) {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { role: 'ai', ...respond(text) }]);
    }, 1100);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: '54px 18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 11,
        background: 'var(--bg)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-grad)', display: 'grid', placeItems: 'center',
          boxShadow: '0 4px 16px -4px var(--accent1)' }}>
          <Icon name="ai" size={22} color="#fff" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: -.3 }}>LIVA <GradText>{A('aiTitle')}</GradText></div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="liva-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--buy)' }} />{A('aiOnline')}</div>
        </div>
      </div>

      {/* messages */}
      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--accent-grad)', color: '#fff',
              padding: '10px 14px', borderRadius: '16px 16px 4px 16px', fontSize: 14, lineHeight: 1.4 }}>{m.text}</div>
          ) : (
            <div key={i} className="liva-msg-in" style={{ alignSelf: 'flex-start', maxWidth: '88%', display: 'flex', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
                <Icon name="ai" size={15} color="#fff" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
                  padding: '11px 14px', borderRadius: '4px 16px 16px 16px', fontSize: 14, lineHeight: 1.45 }}>{m.text}</div>
                {m.products && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.products.map(id => <ProductMini key={id} id={id} onBuy={onBuy} onOpen={onOpen} />)}
                  </div>
                )}
                {m.chips && m.chips.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {m.chips.map(c => (
                      <button key={c} onClick={() => /live/i.test(c) ? onGoTab('live') : ask(c)} style={{ padding: '7px 13px', borderRadius: 999,
                        border: '1px solid rgba(139,92,246,.4)', background: 'rgba(139,92,246,.1)', color: 'var(--accent1)',
                        fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        ))}
        {typing && (
          <div className="liva-msg-in" style={{ alignSelf: 'flex-start', display: 'flex', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--accent-grad)', display: 'grid', placeItems: 'center' }}><Icon name="ai" size={15} color="#fff" /></div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '13px 16px', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => <span key={i} className="liva-typing-dot" style={{ animationDelay: i*0.16+'s', width: 7, height: 7, borderRadius: '50%', background: 'var(--text-dim)' }} />)}
            </div>
          </div>
        )}
      </div>

      {/* quick actions */}
      <div className="hscroll" style={{ display: 'flex', gap: 8, padding: '8px 18px 10px', overflowX: 'auto' }}>
        {LIVA_DATA.AI_QUICK.map(q => (
          <button key={q.id} onClick={() => q.id === 'golive' ? onGoTab('live') : ask(A(q.key))} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
            padding: '9px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            <Icon name={q.icon} size={16} color="var(--accent1)" />{A(q.key)}</button>
        ))}
      </div>

      {/* composer */}
      <div style={{ padding: '4px 18px calc(18px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 84 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 16px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(input)}
            placeholder={A('aiPlaceholder')} style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }} />
          <Icon name="mic" size={18} color="var(--text-dim)" />
        </div>
        <button onClick={() => ask(input)} style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 16px -6px var(--accent1)' }}>
          <Icon name="send" size={20} color="#fff" /></button>
      </div>
    </div>
  );
}

Object.assign(window, { AIScreen });
