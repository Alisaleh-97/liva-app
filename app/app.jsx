// app.jsx — LIVA app shell: tab nav, routing, overlays (PDP, search, wishlist,
// tracking, live, checkout), wishlist state, and language/currency/theme tweaks.
const { useState } = React;
const {
  Icon, IOSDevice, HomeScreen, ShopScreen, EarnScreen, AIScreen, LiveScreen, CheckoutSheet,
  PDP, SearchScreen, WishlistScreen, TrackingScreen, LIVA_I18N,
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSlider, TweakSelect,
} = window;

const TABS = [
  { id: 'home', icon: 'home', key: 'home' },
  { id: 'shop', icon: 'shop', key: 'shop' },
  { id: 'live', icon: 'live', key: 'live', center: true },
  { id: 'earn', icon: 'earn', key: 'earn' },
  { id: 'ai',   icon: 'ai',   key: 'ai' },
];

const ARABIC = "'IBM Plex Sans Arabic'";
const FONTS = {
  'Sora':          "'Sora', " + ARABIC + ", sans-serif",
  'Space Grotesk': "'Space Grotesk', " + ARABIC + ", sans-serif",
  'Bricolage':     "'Bricolage Grotesque', " + ARABIC + ", sans-serif",
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": ["#8B5CF6", "#EC4899"],
  "radius": 16,
  "font": "Sora",
  "lang": "en",
  "ccy": "USD"
}/*EDITMODE-END*/;

function themeVars(t) {
  const [a1, a2] = t.accent;
  const dark = t.theme === 'dark';
  return {
    '--accent1': a1, '--accent2': a2,
    '--accent-grad': `linear-gradient(135deg, ${a1}, ${a2})`,
    '--buy': '#22C55E', '--live': '#FF3B5C',
    '--radius': t.radius + 'px',
    '--display': FONTS[t.font],
    '--body': "'Manrope', " + ARABIC + ", sans-serif",
    '--mono': "'Space Mono', monospace",
    ...(dark ? {
      '--bg': '#0D0A16', '--surface': '#171221', '--surface-2': '#221B30',
      '--border': 'rgba(255,255,255,0.09)', '--text': '#F4F1F8', '--text-dim': 'rgba(244,241,248,0.56)',
    } : {
      '--bg': '#F5F3FA', '--surface': '#FFFFFF', '--surface-2': '#EFEBF6',
      '--border': 'rgba(26,16,48,0.09)', '--text': '#191226', '--text-dim': 'rgba(25,18,38,0.55)',
    }),
  };
}

function TabBar({ active, onTab }) {
  const T = LIVA_I18N.t;
  return (
    <div style={{ flexShrink: 0, position: 'relative', zIndex: 40, background: 'color-mix(in srgb, var(--bg) 86%, transparent)', backdropFilter: 'blur(18px)',
      borderTop: '1px solid var(--border)', paddingBottom: 26, paddingTop: 8, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
      {TABS.map(tab => {
        const on = active === tab.id;
        if (tab.center) {
          return (
            <button key={tab.id} onClick={() => onTab(tab.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: -22 }}>
              <span style={{ position: 'relative', width: 54, height: 54, borderRadius: 18, background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 22px -6px var(--accent1)' }}>
                <span className="liva-ring" style={{ position: 'absolute', inset: -3, borderRadius: 21, border: '2px solid var(--live)' }} />
                <Icon name="live" size={26} color="#fff" stroke={2} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--live)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span className="liva-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--live)' }} />{T(tab.key)}</span>
            </button>
          );
        }
        return (
          <button key={tab.id} onClick={() => onTab(tab.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '2px 10px', width: 64 }}>
            <Icon name={tab.icon} size={23} color={on ? 'var(--accent1)' : 'var(--text-dim)'} stroke={on ? 2.2 : 1.8} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 600, color: on ? 'var(--text)' : 'var(--text-dim)' }}>{T(tab.key)}</span>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('home');
  const [shopCat, setShopCat] = useState('ai');
  const [liveOpen, setLiveOpen] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [pdp, setPdp] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [wish, setWish] = useState(() => new Set(['p5', 'p9']));

  // apply locale BEFORE children read t()/price()
  LIVA_I18N.setLocale(t.lang, t.ccy);
  const rtl = t.lang === 'ar';

  // expose wishlist to ProductCard hearts
  const toggleWish = (id) => setWish(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  window.__livaWish = wish;
  window.__livaWishToggle = toggleWish;

  function go(id) { if (id === 'live') { setLiveOpen(true); return; } setTab(id); }
  const openPDP = (p) => setPdp(p);
  const openBuy = (p) => setCheckout(p);
  function openCategory(catId) { setShopCat(catId); setTab('shop'); }

  const screen = {
    home: <HomeScreen onJoin={() => setLiveOpen(true)} onOpen={openPDP} onBuy={openBuy}
            onSearch={() => setSearchOpen(true)} onNotif={() => {}} onWishlist={() => setWishOpen(true)} onGoTab={go} onCategory={openCategory} />,
    shop: <ShopScreen key={shopCat} initial={shopCat} onOpen={openPDP} onBuy={openBuy} onSearch={() => setSearchOpen(true)} />,
    earn: <EarnScreen onGoTab={go} />,
    ai:   <AIScreen onBuy={openBuy} onOpen={openPDP} onGoTab={go} />,
  }[tab];

  return (
    <div className="liva-root" dir={rtl ? 'rtl' : 'ltr'} style={{ ...themeVars(t), fontFamily: 'var(--body)', color: 'var(--text)' }}>
      <IOSDevice dark={t.theme === 'dark'} width={402} height={874}>
        <div dir={rtl ? 'rtl' : 'ltr'} style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div key={tab} className="liva-screen" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>{screen}</div>
          <TabBar active={liveOpen ? 'live' : tab} onTab={go} />

          {liveOpen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 80 }}>
              <LiveScreen onBuy={openBuy} onClose={() => setLiveOpen(false)} onGift={() => {}} />
            </div>
          )}
          {searchOpen && <SearchScreen onClose={() => setSearchOpen(false)} onOpen={openPDP} onBuy={openBuy} />}
          {wishOpen && <WishlistScreen ids={[...wish]} onClose={() => setWishOpen(false)} onOpen={openPDP} onBuy={openBuy} onWish={toggleWish} />}
          {pdp && <PDP product={pdp} onClose={() => setPdp(null)} onBuy={openBuy} wished={wish.has(pdp.id)} onWish={toggleWish} />}
          {tracking && <TrackingScreen order={tracking} onClose={() => setTracking(null)} onReorder={openBuy} />}

          <CheckoutSheet product={checkout} onClose={() => setCheckout(null)}
            onTrack={(order) => { setCheckout(null); setTracking(order); }} />
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Locale" />
        <TweakRadio label="Language" value={t.lang} options={['en', 'ar']} onChange={v => setTweak('lang', v)} />
        <TweakRadio label="Currency" value={t.ccy} options={['USD', 'AED']} onChange={v => setTweak('ccy', v)} />
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['dark', 'light']} onChange={v => setTweak('theme', v)} />
        <TweakColor label="Accent" value={t.accent} onChange={v => setTweak('accent', v)}
          options={[['#8B5CF6','#EC4899'], ['#6366F1','#22D3EE'], ['#F43F5E','#FB923C'], ['#A855F7','#6366F1']]} />
        <TweakSection label="Shape & Type" />
        <TweakSlider label="Roundness" value={t.radius} min={6} max={24} unit="px" onChange={v => setTweak('radius', v)} />
        <TweakSelect label="Display font" value={t.font} options={['Sora', 'Space Grotesk', 'Bricolage']} onChange={v => setTweak('font', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
