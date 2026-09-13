// components.jsx — shared LIVA UI primitives.
// Exports: Thumb, Avatar, Chip, Pill, Badge, SectionHead, Stars, BuyBtn,
//          LiveDot, Sparkline, GradText, Counter

const { Icon, gradientFor, money, fmtK } = window;

// Deterministic gradient placeholder w/ optional faint product glyph + mono tag
function Thumb({ seed, label, style = {}, vivid = true, tag }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: gradientFor(seed, { vivid }),
      borderRadius: 'inherit', ...style,
    }}>
      {/* soft sheen */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 25% 10%, rgba(255,255,255,.28), transparent 55%)' }} />
      {/* diagonal hairline texture so it reads as a placeholder, not a flat fill */}
      <div style={{ position: 'absolute', inset: 0, opacity: .14,
        backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 11px)' }} />
      {tag && (
        <div style={{ position: 'absolute', bottom: 8, left: 8, fontFamily: 'var(--mono)',
          fontSize: 9, letterSpacing: .5, textTransform: 'uppercase',
          color: 'rgba(255,255,255,.82)', background: 'rgba(0,0,0,.28)',
          padding: '2px 6px', borderRadius: 5, backdropFilter: 'blur(4px)' }}>{tag}</div>
      )}
    </div>
  );
}

function Avatar({ seed, size = 40, ring, verified, style = {} }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        background: gradientFor(seed, { vivid: true }),
        boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 ${ring}px var(--accent1)` : 'none',
      }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(80% 60% at 30% 25%, rgba(255,255,255,.4), transparent 60%)' }} />
      </div>
      {verified && (
        <div style={{ position: 'absolute', right: -2, bottom: -2, color: 'var(--accent1)' }}>
          <Icon name="verified" size={size * 0.42} />
        </div>
      )}
    </div>
  );
}

function LiveDot({ size = 6 }) {
  return <span className="liva-pulse" style={{ width: size, height: size, borderRadius: '50%',
    background: 'var(--live)', display: 'inline-block' }} />;
}

function Badge({ kind = 'default', children, style = {} }) {
  const map = {
    live:   { bg: 'var(--live)', fg: '#fff' },
    ai:     { bg: 'rgba(139,92,246,.16)', fg: 'var(--accent1)', bd: 'rgba(139,92,246,.4)' },
    hot:    { bg: 'rgba(236,72,153,.16)', fg: 'var(--accent2)', bd: 'rgba(236,72,153,.4)' },
    deal:   { bg: 'var(--buy)', fg: '#04210f' },
    glass:  { bg: 'rgba(0,0,0,.35)', fg: '#fff' },
    default:{ bg: 'var(--surface-2)', fg: 'var(--text-dim)' },
  };
  const s = map[kind] || map.default;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10.5, fontWeight: 700, letterSpacing: .3, lineHeight: 1,
      padding: '4px 7px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap',
      background: s.bg, color: s.fg, border: s.bd ? `1px solid ${s.bd}` : 'none',
      backdropFilter: kind === 'glass' ? 'blur(6px)' : 'none', ...style }}>
      {kind === 'live' && <LiveDot size={5} />}
      {children}
    </span>
  );
}

function Chip({ active, icon, live, children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
      padding: icon ? '8px 13px 8px 11px' : '8px 14px',
      borderRadius: 'calc(var(--radius) * .9)', cursor: 'pointer',
      border: '1px solid ' + (active ? 'transparent' : 'var(--border)'),
      background: active ? 'var(--accent-grad)' : 'var(--surface)',
      color: active ? '#fff' : 'var(--text)',
      fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
      whiteSpace: 'nowrap', transition: 'all .18s', ...style }}>
      {live && <LiveDot size={5} />}
      {icon && <Icon name={icon} size={16} stroke={2} />}
      {children}
    </button>
  );
}

function Stars({ rating, reviews, size = 12 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)', fontSize: 11.5 }}>
      <Icon name="star" size={size} color="#FFB339" />
      <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{rating}</strong>
      {reviews != null && <span>({fmtK(reviews)})</span>}
    </span>
  );
}

function GradText({ children, style = {} }) {
  return <span style={{ background: 'var(--accent-grad)', WebkitBackgroundClip: 'text',
    backgroundClip: 'text', color: 'transparent', ...style }}>{children}</span>;
}

function SectionHead({ title, icon, iconColor, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 18px', marginBottom: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <Icon name={icon} size={18} color={iconColor || 'var(--text)'} stroke={2} />}
        <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700,
          letterSpacing: -.2, color: 'var(--text)' }}>{title}</h3>
      </div>
      {action && (
        <button onClick={onAction} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          color: 'var(--accent1)', fontSize: 13, fontWeight: 600 }}>
          {action}<Icon name="chevR" size={14} stroke={2.2} />
        </button>
      )}
    </div>
  );
}

// Buy actions are always green (spec rule)
function BuyBtn({ children = 'Buy', onClick, full, small, style = {} }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      width: full ? '100%' : 'auto', cursor: 'pointer', fontFamily: 'inherit',
      padding: small ? '8px 14px' : '13px 20px', borderRadius: small ? 'calc(var(--radius)*.85)' : 'var(--radius)',
      border: 'none', background: 'var(--buy)', color: '#04210f',
      fontSize: small ? 13 : 15, fontWeight: 800, letterSpacing: .2,
      boxShadow: '0 6px 18px -6px var(--buy)', transition: 'transform .12s', ...style }}
      onPointerDown={e => e.currentTarget.style.transform = 'scale(.97)'}
      onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {children}
    </button>
  );
}

// lightweight SVG sparkline / area chart
function Sparkline({ data, w = 320, h = 96, fill = true, stroke = 'var(--accent1)' }) {
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - ((v - min) / span) * (h - 10) - 5 ]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent1)" stopOpacity=".34" />
          <stop offset="1" stopColor="var(--accent1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill="url(#spark-fill)" />}
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill="var(--accent1)" stroke="var(--bg)" strokeWidth="2" />
    </svg>
  );
}

Object.assign(window, { Thumb, Avatar, Chip, Badge, SectionHead, Stars, BuyBtn, LiveDot, Sparkline, GradText });
