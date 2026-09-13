// shop.jsx — Shop: optimized decision marketplace (category tree + subfilters).
const { Icon, Chip, ProductCard, Badge, LIVA_DATA, LIVA_I18N } = window;
const { useState } = React;
const SH = (k, v) => LIVA_I18N.t(k, v);
const AUDIENCE = ['women', 'men', 'kids'];

function ShopScreen({ onOpen, onBuy, onSearch, initial }) {
  const [filter, setFilter] = useState(initial || 'ai');
  const [reordering, setReordering] = useState(false);

  let list = [...LIVA_DATA.PRODUCTS];
  if (filter === 'ai') { list = list.filter(p => p.badge === 'AI Pick' || p.rating >= 4.7); list.sort((a, b) => b.rating - a.rating); }
  else if (filter === 'trending') list = list.filter(p => p.badge === 'Trending' || p.badge === 'Hot' || p.badge === 'Price drop');
  else if (AUDIENCE.includes(filter)) list = list.filter(p => p.audience === filter || p.audience === 'unisex');
  else if (filter !== 'all') list = list.filter(p => p.type === filter);

  function triggerReorder() { setReordering(true); setTimeout(() => setReordering(false), 900); }

  return (
    <div>
      <div style={{ padding: '56px 18px 12px', position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(180deg, var(--bg) 78%, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 28, fontWeight: 800, letterSpacing: -.6, color: 'var(--text)' }}>{SH('shopTitle')}</h1>
          <button onClick={triggerReorder} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--accent1)', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            <Icon name="ai" size={15} color="var(--accent1)" />{SH('rerank')}</button>
        </div>
        <div onClick={onSearch} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'text' }}>
          <Icon name="search" size={17} color="var(--text-dim)" />
          <span style={{ flex: 1, color: 'var(--text-dim)', fontSize: 13.5 }}>{SH('searchMarket')}</span>
        </div>
      </div>

      <div className="hscroll" style={{ display: 'flex', gap: 9, padding: '2px 18px 16px', overflowX: 'auto' }}>
        {LIVA_DATA.SHOP_FILTERS.map(f => <Chip key={f.id} active={filter === f.id} icon={f.icon} onClick={() => setFilter(f.id)}>{SH(f.key)}</Chip>)}
      </div>

      {filter === 'ai' && (
        <div style={{ margin: '0 18px 16px', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.28)', borderRadius: 'var(--radius)' }}>
          <Icon name="ai" size={17} color="var(--accent1)" />
          <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.35 }}>{SH('rankedBlurb')}</span>
        </div>
      )}

      <div className={reordering ? 'liva-reorder' : ''} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 18px 30px' }}>
        {list.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen} onBuy={onBuy} />)}
      </div>
    </div>
  );
}

Object.assign(window, { ShopScreen });
