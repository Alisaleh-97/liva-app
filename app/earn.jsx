// earn.jsx — Earn: creator monetization dashboard.
const { Icon, Sparkline, GradText, Avatar, money, fmtK, LIVA_DATA, LIVA_I18N } = window;
const { useState } = React;
const E2 = (k, v) => LIVA_I18N.t(k, v);

const RANGE = ['Daily', 'Weekly', 'Monthly'];
const SERIES = {
  Daily: LIVA_DATA.EARN.series,
  Weekly: [820, 1100, 960, 1340, 1180, 1520, 1680],
  Monthly: [3200, 4100, 3800, 5200, 4900, 6100],
};

function EarnScreen({ onGoTab }) {
  const E = LIVA_DATA.EARN;
  const [range, setRange] = useState('Daily');
  const max = Math.max(...E.breakdown.map(b => b.amount));
  const colors = { live: 'var(--accent1)', affiliate: 'var(--accent2)', ai: '#22C55E', bonus: '#FFB339' };

  return (
    <div style={{ paddingBottom: 30 }}>
      <div style={{ padding: '56px 18px 8px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: -.6, color: 'var(--text)' }}>{E2('earnTitle')}</h1>
      </div>

      {/* hero balance card */}
      <div style={{ margin: '14px 18px 20px', borderRadius: 'calc(var(--radius)*1.4)', overflow: 'hidden', position: 'relative',
        background: 'var(--accent-grad)', padding: 20, boxShadow: '0 18px 40px -16px var(--accent1)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .5,
          background: 'radial-gradient(120% 80% at 85% 0%, rgba(255,255,255,.28), transparent 55%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <Icon name="wallet" size={15} color="rgba(255,255,255,.9)" />{E2('currentBalance')}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,.2)', color: '#fff',
              fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>USD</span>
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1, marginTop: 6, lineHeight: 1 }}>{money(E.balance)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>{E2('totalEarned')}</div>
              <div style={{ fontFamily: 'var(--mono)', color: '#fff', fontSize: 16, fontWeight: 700 }}>{money(E.total)}</div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.18)', color: '#fff',
              fontSize: 12.5, fontWeight: 800, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
              <Icon name="trend" size={14} color="#fff" />+{E.growth}%</div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
            {[['arrowUR', E2('withdraw')], ['send', E2('transfer')], ['eye', E2('details')]].map(([ic, lb]) => (
              <button key={lb} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 0', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,.95)', color: '#1a1030', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                <Icon name={ic} size={15} color="#1a1030" />{lb}</button>
            ))}
          </div>
        </div>
      </div>

      {/* AI optimization tip */}
      <div style={{ margin: '0 18px 20px', display: 'flex', gap: 11, padding: '13px 14px', background: 'var(--surface)',
        border: '1px solid rgba(139,92,246,.3)', borderRadius: 'var(--radius)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(139,92,246,.16)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="ai" size={18} color="var(--accent1)" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>AI optimization tip</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>Go live Thursday 8–9 PM — your audience converts <strong style={{ color: 'var(--buy)' }}>2.3×</strong> higher then.</div>
        </div>
        <button onClick={() => onGoTab('live')} style={{ alignSelf: 'center', background: 'var(--accent-grad)', border: 'none', color: '#fff',
          fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 'calc(var(--radius)*.8)', cursor: 'pointer', flexShrink: 0 }}>Apply</button>
      </div>

      {/* performance graph */}
      <div style={{ margin: '0 18px 20px', padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{E2('performance')}</span>
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 999, padding: 3 }}>
            {RANGE.map(r => (
              <button key={r} onClick={() => setRange(r)} style={{ padding: '5px 11px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit',
                background: range === r ? 'var(--accent-grad)' : 'transparent', color: range === r ? '#fff' : 'var(--text-dim)' }}>{r}</button>
            ))}
          </div>
        </div>
        <Sparkline data={SERIES[range]} h={104} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>
          <span>{range === 'Daily' ? '14d ago' : range === 'Weekly' ? '7w ago' : '6mo ago'}</span><span>now</span>
        </div>
      </div>

      {/* revenue breakdown */}
      <div style={{ margin: '0 18px 20px', padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{E2('revenueBreakdown')}</span>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {E.breakdown.map(b => (
            <div key={b.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{b.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{money(b.amount)}</span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: (b.amount / max * 100) + '%', borderRadius: 999, background: colors[b.key] }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* referrals */}
      <div style={{ margin: '0 18px', padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Icon name="users" size={17} color="var(--accent2)" />
          <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{E2('referrals')}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[[fmtK(E.referrals.count), 'invited'], [money(E.referrals.perUser), 'per user'], [E.referrals.multiplier + '×', 'multiplier']].map(([v, l]) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', padding: '11px 0', background: 'var(--surface-2)', borderRadius: 'calc(var(--radius)*.85)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{v}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: .3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 0 14px', height: 46, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
          <Icon name="share" size={16} color="var(--accent1)" />
          <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--text)' }}>{E.referrals.link}</span>
          <button style={{ height: 46, padding: '0 18px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
            background: 'var(--accent-grad)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>Copy</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EarnScreen });
