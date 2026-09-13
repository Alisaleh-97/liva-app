// home.jsx — Home: intelligent commerce decision feed (marketplace-aware).
const { Icon, Thumb, Avatar, Badge, Chip, SectionHead, BuyBtn, GradText, LiveDot,
  StreamCard, AIPickCard, FlashCard, ProductCard, SellerRow, money, fmtK, LIVA_DATA, LIVA_I18N } = window;
const { useState, useEffect, useRef } = React;
const H = (k, v) => LIVA_I18N.t(k, v);

function Countdown({ start = 9933 }) {
  const [s, setS] = useState(start);
  useEffect(() => { const t = setInterval(() => setS(v => (v > 0 ? v - 1 : start)), 1000); return () => clearInterval(t); }, []);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const box = t => <span style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '3px 5px', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t}</span>;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, direction: 'ltr' }}>{box(hh)}<span style={{ color: 'var(--text-dim)' }}>:</span>{box(mm)}<span style={{ color: 'var(--text-dim)' }}>:</span>{box(ss)}</span>;
}

function HomeHeader({ onSearch, onNotif, onWishlist }) {
  return (
    <div style={{ padding: '56px 18px 12px', position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(180deg, var(--bg) 70%, transparent)', backdropFilter: 'blur(2px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px -4px var(--accent1)' }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: '#fff' }}>L</span></div>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, letterSpacing: -.5, color: 'var(--text)' }}>LIVA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onWishlist} style={iconBtn()}><Icon name="heart" size={20} color="var(--text)" /></button>
          <button onClick={onNotif} style={iconBtn()}>
            <Icon name="bell" size={20} color="var(--text)" />
            <span style={{ position: 'absolute', top: 7, insetInlineEnd: 7, width: 7, height: 7, borderRadius: '50%', background: 'var(--live)', border: '1.5px solid var(--bg)' }} />
          </button>
        </div>
      </div>
      <div onClick={onSearch} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'text' }}>
        <Icon name="search" size={18} color="var(--text-dim)" />
        <span style={{ flex: 1, color: 'var(--text-dim)', fontSize: 14 }}>{H('search_ph')}</span>
        <Icon name="scan" size={19} color="var(--text-dim)" />
      </div>
    </div>
  );
}
function iconBtn() { return { position: 'relative', width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }; }

function BannerSlider() {
  return (
    <div className="hscroll" style={{ display: 'flex', gap: 12, padding: '4px 18px 22px', overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
      {LIVA_DATA.BANNERS.map(b => { const ar = LIVA_I18N.isRTL(); return (
        <div key={b.id} style={{ flex: '0 0 86%', scrollSnapAlign: 'center', position: 'relative', borderRadius: 'calc(var(--radius)*1.2)', overflow: 'hidden', aspectRatio: '21 / 9', border: '1px solid var(--border)' }}>
          <Thumb seed={b.seed} vivid style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: ar ? 'linear-gradient(260deg, rgba(8,5,16,.82) 12%, rgba(8,5,16,.3) 60%, transparent)' : 'linear-gradient(100deg, rgba(8,5,16,.82) 12%, rgba(8,5,16,.3) 60%, transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--accent2)' }}>{ar ? b.kickerAr : b.kicker}</span>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -.4, margin: '3px 0 2px' }}>{ar ? b.titleAr : b.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>{ar ? b.subAr : b.sub}</div>
          </div>
        </div>
      ); })}
    </div>
  );
}

function QuickCats({ onCategory }) {
  return (
    <div className="hscroll" style={{ display: 'flex', gap: 16, padding: '0 18px 24px', overflowX: 'auto' }}>
      {LIVA_DATA.CATEGORIES.map(c => (
        <button key={c.id} onClick={() => onCategory(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0, width: 60 }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
            <Thumb seed={c.seed} vivid style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{H(c.key)}</span>
        </button>
      ))}
    </div>
  );
}

function HeroLive({ onJoin }) {
  const s = LIVA_DATA.STREAMS[0];
  const seller = LIVA_DATA.SELLERS.find(x => x.id === s.host);
  return (
    <div onClick={() => onJoin(s)} style={{ margin: '4px 18px 22px', borderRadius: 'calc(var(--radius)*1.3)', overflow: 'hidden', position: 'relative', aspectRatio: '16 / 10', cursor: 'pointer', border: '1px solid var(--border)' }}>
      <image-slot id="liva-hero-live" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} shape="rect" placeholder="Drop live host shot"></image-slot>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(105deg, rgba(10,6,20,.92) 8%, rgba(10,6,20,.45) 48%, transparent 78%)' }} />
      <div style={{ position: 'absolute', inset: 0, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <Badge kind="live">{H('liveBadge')}</Badge>
          <Badge kind="glass"><Icon name="eye" size={11} />{fmtK(s.viewers)}</Badge>
        </div>
        <div style={{ maxWidth: '74%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Avatar seed={seller.seed} size={24} verified={seller.verified} />
            <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{seller.name}</span>
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 800, fontSize: 23, lineHeight: 1.12, color: '#fff', letterSpacing: -.4 }}>{LIVA_I18N.isRTL() ? s.titleAr : s.title}</h2>
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, pointerEvents: 'auto', background: 'rgba(255,255,255,.96)', color: '#100a1c', padding: '10px 18px', borderRadius: 'var(--radius)', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>
            <Icon name="play" size={15} color="#100a1c" />{H('watchNow')}</div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ onJoin, onOpen, onBuy, onSearch, onNotif, onWishlist, onGoTab, onCategory }) {
  const flash = LIVA_DATA.PRODUCTS.filter(p => p.was).slice(0, 6);
  const trending = LIVA_DATA.PRODUCTS.filter(p => p.badge === 'Trending' || p.rating >= 4.8).slice(0, 4);
  const sellers = [...LIVA_DATA.SELLERS].sort((a, b) => b.sales - a.sales).slice(0, 4);
  const trust = [
    { icon: 'truck', t: H('trust_ship'), s: H('trust_ship_s') },
    { icon: 'shield', t: H('trust_pay'), s: H('trust_pay_s') },
    { icon: 'check', t: H('trust_guard'), s: H('trust_guard_s') },
    { icon: 'headset', t: H('trust_help'), s: H('trust_help_s') },
  ];
  return (
    <div>
      <HomeHeader onSearch={onSearch} onNotif={onNotif} onWishlist={onWishlist} />
      <BannerSlider />

      {/* quick categories */}
      <SectionHead title={H('categories')} action={H('seeAll')} onAction={() => onGoTab('shop')} />
      <QuickCats onCategory={onCategory} />

      <HeroLive onJoin={onJoin} />

      <SectionHead title={H('liveNow')} icon="live" iconColor="var(--live)" action={H('seeAll')} onAction={() => onGoTab('live')} />
      <div className="hscroll" style={{ display: 'flex', gap: 12, padding: '0 18px 24px', overflowX: 'auto' }}>
        {LIVA_DATA.STREAMS.map(s => <StreamCard key={s.id} stream={s} onJoin={onJoin} />)}
      </div>

      {/* AI picks */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', marginBottom: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="ai" size={18} color="var(--accent1)" stroke={2} />
          <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, letterSpacing: -.2, color: 'var(--text)' }}>{H('aiPicks')} <GradText>{H('forYou')}</GradText></h3>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><LiveDot size={5} />{H('updates60')}</span>
      </div>
      <div className="hscroll" style={{ display: 'flex', gap: 12, padding: '0 18px 24px', overflowX: 'auto' }}>
        {LIVA_DATA.AI_PICKS.map((pk, i) => <AIPickCard key={i} pick={pk} onOpen={onOpen} onBuy={onBuy} />)}
      </div>

      {/* Flash deals */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', marginBottom: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="bolt" size={18} color="#FFB339" stroke={2} />
          <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, letterSpacing: -.2, color: 'var(--text)' }}>{H('flashDeals')}</h3>
        </div>
        <Countdown />
      </div>
      <div className="hscroll" style={{ display: 'flex', gap: 14, padding: '0 18px 26px', overflowX: 'auto' }}>
        {flash.map(p => <FlashCard key={p.id} p={p} onOpen={onOpen} onBuy={onBuy} />)}
      </div>

      {/* Trending grid */}
      <SectionHead title={H('trending')} icon="flame" iconColor="var(--accent2)" action={H('seeAll')} onAction={() => onGoTab('shop')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 18px 26px' }}>
        {trending.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen} onBuy={onBuy} />)}
      </div>

      {/* Top sellers */}
      <SectionHead title={H('topSellers')} icon="users" action={H('seeAll')} onAction={() => onGoTab('shop')} />
      <div style={{ margin: '0 18px 26px', padding: '4px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        {sellers.map((s, i) => <div key={s.id} style={{ borderBottom: i < sellers.length - 1 ? '1px solid var(--border)' : 'none' }}><SellerRow seller={s} rank={i + 1} /></div>)}
      </div>

      {/* Trust strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 18px 30px' }}>
        {trust.map(t => (
          <div key={t.t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(139,92,246,.14)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={t.icon} size={18} color="var(--accent1)" /></div>
            <div><div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{t.t}</div><div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{t.s}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
