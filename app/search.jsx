// search.jsx — full search overlay: suggestions, recent/trending, filters, results.
const { Icon, Thumb, Chip, ProductCard, Badge, money, LIVA_DATA, LIVA_I18N } = window;
const { useState, useRef, useEffect } = React;
const TS = (k, v) => LIVA_I18N.t(k, v);

const RATINGS = [4.5, 4.0, 3.0];

function SearchScreen({ onClose, onOpen, onBuy }) {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(['Smartwatch', 'Perfume']);
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState(100);
  const [minRating, setMinRating] = useState(0);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const all = LIVA_DATA.PRODUCTS;
  const allColors = [...new Map(all.flatMap(p => p.colors).map(c => [c.hex, c])).values()];
  const allSizes = [...new Set(all.flatMap(p => p.sizes))];

  const ql = q.trim().toLowerCase();
  const submitted = q.length > 0;
  // suggestions (names + brands) while typing
  const suggestions = ql ? [...new Set(all.flatMap(p => [LIVA_I18N.name(p), p.brand, p.sub]).filter(x => x && x.toLowerCase().includes(ql)))].slice(0, 6) : [];

  // results
  let results = all.filter(p => {
    if (ql && !(`${p.name} ${p.nameAr} ${p.brand} ${p.sub} ${p.type}`.toLowerCase().includes(ql))) return false;
    if (p.price > priceMax) return false;
    if (minRating && p.rating < minRating) return false;
    if (brands.length && !brands.includes(p.brand)) return false;
    if (colors.length && !p.colors.some(c => colors.includes(c.hex))) return false;
    if (sizes.length && !p.sizes.some(s => sizes.includes(s))) return false;
    return true;
  });

  const activeFilters = (priceMax < 100 ? 1 : 0) + (minRating ? 1 : 0) + brands.length + colors.length + sizes.length;
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  function reset() { setPriceMax(100); setMinRating(0); setBrands([]); setColors([]); setSizes([]); }
  function run(term) { setQ(term); if (term && !recent.includes(term)) setRecent([term, ...recent].slice(0, 6)); }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 92, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* search bar */}
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <Icon name="search" size={18} color="var(--text-dim)" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder={TS('searchMarket')} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit' }} />
          {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Icon name="close" size={16} color="var(--text-dim)" /></button>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--accent1)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{TS('done')}</button>
      </div>

      <div className="liva-screen" style={{ flex: 1, overflowY: 'auto', padding: '0 0 30px' }}>
        {/* typing suggestions */}
        {ql && suggestions.length > 0 && (
          <div style={{ padding: '0 8px 10px' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => run(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start' }}>
                <Icon name="search" size={16} color="var(--text-dim)" />
                <span style={{ flex: 1, fontSize: 14.5, color: 'var(--text)' }}>{s}</span>
                <Icon name="arrowUR" size={15} color="var(--text-dim)" />
              </button>
            ))}
          </div>
        )}

        {/* empty state: recent + trending */}
        {!submitted && (
          <div style={{ padding: '6px 18px' }}>
            {recent.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 11 }}>{TS('recent')}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {recent.map(r => <Chip key={r} onClick={() => run(r)}>{r}</Chip>)}
                </div>
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
                <Icon name="flame" size={16} color="var(--accent2)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{TS('trendingSearch')}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LIVA_DATA.TRENDING_SEARCHES.map(r => <Chip key={r} onClick={() => run(r)}>{r}</Chip>)}
              </div>
            </div>
          </div>
        )}

        {/* results */}
        {submitted && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 12px' }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{results.length} {TS('results')}</span>
              <button onClick={() => setShowFilters(f => !f)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                border: '1px solid ' + (activeFilters ? 'var(--accent1)' : 'var(--border)'), background: activeFilters ? 'rgba(139,92,246,.12)' : 'var(--surface)', color: activeFilters ? 'var(--accent1)' : 'var(--text)' }}>
                <Icon name="filter" size={15} color={activeFilters ? 'var(--accent1)' : 'var(--text)'} />{TS('filters')}{activeFilters > 0 && ` · ${activeFilters}`}</button>
            </div>

            {showFilters && (
              <div style={{ margin: '0 18px 16px', padding: 16, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {/* price */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{TS('priceRange')}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--accent1)' }}>{money(0)} – {money(priceMax)}</span></div>
                  <input type="range" min="20" max="100" value={priceMax} onChange={e => setPriceMax(+e.target.value)} className="liva-range" style={{ width: '100%' }} />
                </div>
                {/* rating */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{TS('rating')}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {RATINGS.map(r => (
                      <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
                        border: '1px solid ' + (minRating === r ? 'var(--accent1)' : 'var(--border)'), background: minRating === r ? 'rgba(139,92,246,.12)' : 'var(--surface-2)', color: 'var(--text)' }}>
                        <Icon name="star" size={12} color="#FFB339" />{r} {TS('andUp')}</button>
                    ))}
                  </div>
                </div>
                {/* brand */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{TS('brand')}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {LIVA_DATA.BRANDS.slice(0, 8).map(b => (
                      <button key={b} onClick={() => toggle(brands, setBrands, b)} style={{ padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                        border: '1px solid ' + (brands.includes(b) ? 'var(--accent1)' : 'var(--border)'), background: brands.includes(b) ? 'rgba(139,92,246,.12)' : 'var(--surface-2)', color: 'var(--text)' }}>{b}</button>
                    ))}
                  </div>
                </div>
                {/* color */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{TS('color')}</div>
                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                    {allColors.map(c => (
                      <button key={c.hex} onClick={() => toggle(colors, setColors, c.hex)} style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', background: c.hex, border: '2px solid ' + (colors.includes(c.hex) ? 'var(--accent1)' : 'var(--border)') }} />
                    ))}
                  </div>
                </div>
                {/* size */}
                {allSizes.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{TS('size')}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {allSizes.map(s => (
                        <button key={s} onClick={() => toggle(sizes, setSizes, s)} style={{ minWidth: 40, padding: '7px 10px', borderRadius: 'calc(var(--radius)*.7)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
                          border: '1px solid ' + (sizes.includes(s) ? 'var(--accent1)' : 'var(--border)'), background: sizes.includes(s) ? 'rgba(139,92,246,.12)' : 'var(--surface-2)', color: 'var(--text)' }}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={reset} style={{ flex: 1, padding: '11px 0', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{TS('reset')}</button>
                  <button onClick={() => setShowFilters(false)} style={{ flex: 2, padding: '11px 0', borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent-grad)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{TS('apply')}</button>
                </div>
              </div>
            )}

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 30px', color: 'var(--text-dim)' }}>
                <Icon name="search" size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{TS('noResults')}</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 18px' }}>
                {results.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen} onBuy={onBuy} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SearchScreen });
