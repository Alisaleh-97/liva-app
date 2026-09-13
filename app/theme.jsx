// theme.jsx — LIVA design system: icon set + small helpers.
// Exports to window: Icon, hashHue, gradientFor, money, fmtK

// ── Line-icon library (24x24, currentColor, stroke-based) ────────────
const ICON_PATHS = {
  home:      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/>',
  live:      '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5 21 7.5v9l-5.5-3"/>',
  shop:      '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  earn:      '<rect x="3" y="6.5" width="18" height="12" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14" r="1.4" fill="currentColor" stroke="none"/>',
  ai:        '<path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z"/><path d="M18.5 4v3M20 5.5h-3" stroke-width="1.6"/>',
  search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  scan:      '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>',
  bell:      '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  heart:     '<path d="M12 20s-7-4.6-9.2-9C1.3 8 2.8 4.8 6 4.8c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.2 0 4.7 3.2 3.2 6.2C19 15.4 12 20 12 20Z"/>',
  comment:   '<path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"/>',
  share:     '<circle cx="6" cy="12" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="m8.2 10.8 7-3.6M8.2 13.2l7 3.6"/>',
  gift:      '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9S10.5 4 8 4.5 9.5 9 12 9Zm0 0s1.5-5 4-4.5S14.5 9 12 9Z"/>',
  cart:      '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.2 11h10.3l1.8-8H6"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  close:     '<path d="m6 6 12 12M18 6 6 18"/>',
  chevR:     '<path d="m9 5 7 7-7 7"/>',
  chevL:     '<path d="m15 5-7 7 7 7"/>',
  chevD:     '<path d="m5 9 7 7 7-7"/>',
  star:      '<path d="m12 3 2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.8 6.6 19.5l1.2-6L3.4 9.3l6-.7L12 3Z" fill="currentColor" stroke="none"/>',
  filter:    '<path d="M4 6h16M7 12h10M10 18h4"/>',
  bolt:      '<path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z"/>',
  clock:     '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  users:     '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2-4.3"/>',
  trend:     '<path d="M3 17 9 11l3.5 3.5L21 6"/><path d="M15 6h6v6"/>',
  send:      '<path d="M4 12 20 4l-6 16-3.5-6.5L4 12Z"/>',
  globe:     '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
  shield:    '<path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 11.5 2 2 4-4.5"/>',
  truck:     '<rect x="2.5" y="7" width="11" height="9" rx="1"/><path d="M13.5 10h4l3 3v3h-7"/><circle cx="6" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/>',
  headset:   '<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="3.5" y="13" width="3.5" height="6" rx="1.5"/><rect x="17" y="13" width="3.5" height="6" rx="1.5"/><path d="M19 19a4 4 0 0 1-4 3h-2"/>',
  play:      '<path d="M7 5v14l12-7L7 5Z" fill="currentColor" stroke="none"/>',
  pause:     '<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  dots:      '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  eye:       '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  tag:       '<path d="M3 11.5 11.5 3H20a1 1 0 0 1 1 1v8.5L12.5 21a1 1 0 0 1-1.4 0L3 12.9a1 1 0 0 1 0-1.4Z"/><circle cx="16.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>',
  check:     '<path d="m5 12.5 4.5 4.5L19 7"/>',
  flame:     '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.3-3.6.4 1 1.2 1.6 2 1.6 0-2.5-1-4 1.7-7Z"/>',
  wallet:    '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9.5h13a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H3"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor" stroke="none"/>',
  mic:       '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  arrowUR:   '<path d="M7 17 17 7M8 7h9v9"/>',
  ticket:    '<path d="M4 7.5h16v3a1.5 1.5 0 0 0 0 3v3H4v-3a1.5 1.5 0 0 0 0-3v-3Z"/><path d="M14 7.5v9" stroke-dasharray="1.5 2"/>',
  sliders:   '<path d="M5 7h14M5 17h14"/><circle cx="9" cy="7" r="2.2" fill="var(--bg)"/><circle cx="15" cy="17" r="2.2" fill="var(--bg)"/>',
  verified:  '<path d="m12 2.5 2.3 1.7 2.9-.2 1 2.7 2.4 1.6-.9 2.7.9 2.7-2.4 1.6-1 2.7-2.9-.2L12 21.5l-2.3-1.7-2.9.2-1-2.7-2.4-1.6.9-2.7-.9-2.7 2.4-1.6 1-2.7 2.9.2L12 2.5Z" fill="currentColor" stroke="none"/><path d="m8.5 12 2.3 2.3 4.7-4.8" stroke="var(--bg)" stroke-width="2"/>',
};

function Icon({ name, size = 22, color = 'currentColor', stroke = 1.8, style = {}, fill = 'none' }) {
  const inner = ICON_PATHS[name] || '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: inner }} />
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function hashHue(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}
// deterministic 2-stop gradient, kept in violet/cool family for cohesion
function gradientFor(seed, opts = {}) {
  const base = hashHue(seed);
  const h1 = (base) % 360;
  const h2 = (base + 38) % 360;
  const l = opts.dark ? 22 : 60;
  const c = opts.vivid ? 0.16 : 0.11;
  return `linear-gradient(135deg, oklch(${l/100} ${c} ${h1}), oklch(${(l-10)/100} ${c} ${h2}))`;
}
function money(n) {
  if (window.LIVA_I18N) return window.LIVA_I18N.price(n);
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtK(n) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return String(n);
}

Object.assign(window, { Icon, hashHue, gradientFor, money, fmtK });
