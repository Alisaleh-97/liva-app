// i18n.jsx — bilingual (EN/AR) + currency (USD/AED) engine for LIVA.
// Prices are stored in USD; `price()` converts + formats for the active currency.
// Exports to window: LIVA_I18N = { t, price, name, setLocale, state, isRTL }

const AED_RATE = 3.6725;

// module-level locale state; App sets it each render before children read it
const _state = { lang: 'en', ccy: 'USD' };
function setLocale(lang, ccy) { _state.lang = lang; _state.ccy = ccy; }
function isRTL() { return _state.lang === 'ar'; }

const DICT = {
  en: {
    // nav
    home: 'Home', shop: 'Shop', live: 'Live', earn: 'Earn', ai: 'AI',
    // home
    search_ph: 'Search products, hosts, drops…', liveNow: 'Live now', seeAll: 'See all',
    aiPicks: 'AI picks', forYou: 'for you', updates60: 'updates 60s', flashDeals: 'Flash deals',
    trending: 'Trending products', topSellers: 'Top sellers', watchNow: 'Watch now', liveBadge: 'Live Now',
    recommended: 'Recommended for you', categories: 'Categories',
    trust_ship: 'Fast shipping', trust_ship_s: 'Worldwide', trust_pay: 'Secure pay', trust_pay_s: '100% protected',
    trust_guard: 'Guarantee', trust_guard_s: '14-day returns', trust_help: '24/7 support', trust_help_s: 'Always on',
    // categories
    cat_all: 'All', cat_women: 'Women', cat_men: 'Men', cat_kids: 'Kids', cat_clothing: 'Clothing',
    cat_accessories: 'Accessories', cat_electronics: 'Electronics', cat_beauty: 'Beauty', cat_home: 'Home & Living', cat_sport: 'Sport',
    // shop
    shopTitle: 'Shop', rerank: 'Re-rank', searchMarket: 'Search the marketplace…',
    aiRecommended: 'AI Recommended', rankedBlurb: 'Ranked live by demand spikes, your behavior & regional trends.',
    // pdp
    buyNow: 'Buy now', addCart: 'Add to cart', wishlist: 'Wishlist', saved: 'Saved', inStock: 'In stock',
    lowStock: 'Only {n} left', outStock: 'Out of stock', color: 'Color', size: 'Size', selectSize: 'Select size',
    verifiedSeller: 'Verified seller', delivery: 'Delivery', returns: 'Free 14-day returns', reviews: 'Reviews',
    photoReviews: 'Photo reviews', verifiedPurchase: 'Verified purchase', helpful: 'Helpful', mostHelpful: 'Most helpful',
    writeReview: 'Write a review', allReviews: 'See all reviews', from: 'from', orPay: 'or {n}/mo', installments: 'Installments available',
    addedToCart: 'Added to cart', priceDrop: 'Price drop alert on', dropAlertOn: 'Alerts on', dropAlertSet: 'Price-drop alert set',
    // search
    searchTitle: 'Search', recent: 'Recent', suggestions: 'Suggestions', trendingSearch: 'Trending searches',
    filters: 'Filters', priceRange: 'Price range', brand: 'Brand', rating: 'Rating', anyColor: 'Any color',
    apply: 'Apply', reset: 'Reset', results: 'results', noResults: 'No results', andUp: '& up',
    // checkout
    confirmOrder: 'Confirm order', subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', total: 'Total',
    continue: 'Continue', payment: 'Payment', pay: 'Pay', payWith: 'Pay in full', payMonthly: 'Pay monthly',
    months: 'months', perMonth: '/mo', interest: 'interest', interestFree: '0% interest', orderPlaced: 'Order placed',
    arriving: 'Arriving in {a}–{b} days', trackOrder: 'Track order', done: 'Done', secureReturns: 'Secure · 14-day returns',
    qty: 'Qty', applePay: 'Apple Pay', card: 'Card', tappy: 'Tappy Payments', cod: 'Cash on delivery', livaBalance: 'LIVA balance',
    instant: 'instant', codSub: 'pay when it arrives',
    // tracking
    trackingTitle: 'Track order', orderNo: 'Order', processing: 'Processing', confirmed: 'Confirmed',
    shipped: 'Shipped', outForDelivery: 'Out for delivery', delivered: 'Delivered', estArrival: 'Estimated arrival',
    courier: 'Courier', liveLocation: 'Live location', orderItems: 'Items', reorder: 'Reorder', contactSeller: 'Contact seller',
    // wishlist
    wishlistTitle: 'Wishlist', emptyWishlist: 'Nothing saved yet', emptyWishlistSub: 'Tap the heart on any product to save it here.',
    priceDropAlerts: 'Price-drop alerts', dropped: 'dropped', browse: 'Browse products',
    // earn
    earnTitle: 'Earn', currentBalance: 'Current balance', totalEarned: 'Total earned', withdraw: 'Withdraw',
    transfer: 'Transfer', details: 'Details', performance: 'Performance', revenueBreakdown: 'Revenue breakdown', referrals: 'Referrals',
    // ai
    aiTitle: 'Intelligence', aiOnline: 'Online · replies in seconds', aiPlaceholder: 'Ask what to buy, sell, or when to go live…',
    goLiveNow: 'Go Live Now', buyTrending: 'Buy Trending', promoteProduct: 'Promote a Product', analyzeMarket: 'Analyze Market',
    // misc
    follow: 'Follow', followers: 'followers', addComment: 'Add a comment…', flashUnlocked: 'FLASH SALE UNLOCKED',
    demandSpiking: 'demand spiking', left: 'left', endsSoon: 'ends soon', sales: 'sales', viewItem: 'View item',
  },
  ar: {
    home: 'الرئيسية', shop: 'المتجر', live: 'مباشر', earn: 'أرباح', ai: 'الذكاء',
    search_ph: 'ابحث عن منتجات أو متاجر…', liveNow: 'بث مباشر الآن', seeAll: 'عرض الكل',
    aiPicks: 'اختيارات الذكاء', forYou: 'لك', updates60: 'يتحدث كل ٦٠ث', flashDeals: 'عروض سريعة',
    trending: 'منتجات رائجة', topSellers: 'أفضل البائعين', watchNow: 'شاهد الآن', liveBadge: 'مباشر الآن',
    recommended: 'موصى به لك', categories: 'التصنيفات',
    trust_ship: 'شحن سريع', trust_ship_s: 'لكل الدول', trust_pay: 'دفع آمن', trust_pay_s: 'حماية ١٠٠٪',
    trust_guard: 'ضمان المنتجات', trust_guard_s: 'إرجاع ١٤ يوم', trust_help: 'دعم ٢٤/٧', trust_help_s: 'متاح دائماً',
    cat_all: 'الكل', cat_women: 'نساء', cat_men: 'رجال', cat_kids: 'أطفال', cat_clothing: 'ملابس',
    cat_accessories: 'إكسسوارات', cat_electronics: 'إلكترونيات', cat_beauty: 'الجمال', cat_home: 'المنزل', cat_sport: 'رياضة',
    shopTitle: 'المتجر', rerank: 'إعادة ترتيب', searchMarket: 'ابحث في المتجر…',
    aiRecommended: 'ترشيح الذكاء', rankedBlurb: 'مُرتّبة آنياً حسب الطلب وسلوكك والاتجاهات في منطقتك.',
    buyNow: 'اشترِ الآن', addCart: 'أضف للسلة', wishlist: 'المفضلة', saved: 'محفوظ', inStock: 'متوفر',
    lowStock: 'بقي {n} فقط', outStock: 'غير متوفر', color: 'اللون', size: 'المقاس', selectSize: 'اختر المقاس',
    verifiedSeller: 'بائع موثّق', delivery: 'التوصيل', returns: 'إرجاع مجاني ١٤ يوم', reviews: 'التقييمات',
    photoReviews: 'تقييمات بالصور', verifiedPurchase: 'شراء موثّق', helpful: 'مفيد', mostHelpful: 'الأكثر فائدة',
    writeReview: 'اكتب تقييماً', allReviews: 'كل التقييمات', from: 'من', orPay: 'أو {n}/شهر', installments: 'تقسيط متاح',
    addedToCart: 'أضيف للسلة', priceDrop: 'تنبيه انخفاض السعر', dropAlertOn: 'التنبيهات مفعّلة', dropAlertSet: 'تم ضبط تنبيه السعر',
    searchTitle: 'بحث', recent: 'الأخيرة', suggestions: 'اقتراحات', trendingSearch: 'الأكثر بحثاً',
    filters: 'تصفية', priceRange: 'نطاق السعر', brand: 'العلامة', rating: 'التقييم', anyColor: 'أي لون',
    apply: 'تطبيق', reset: 'إعادة ضبط', results: 'نتيجة', noResults: 'لا نتائج', andUp: 'فأكثر',
    confirmOrder: 'تأكيد الطلب', subtotal: 'المجموع', shipping: 'الشحن', free: 'مجاني', total: 'الإجمالي',
    continue: 'متابعة', payment: 'الدفع', pay: 'ادفع', payWith: 'دفع كامل', payMonthly: 'دفع شهري',
    months: 'أشهر', perMonth: '/شهر', interest: 'فائدة', interestFree: 'بدون فوائد', orderPlaced: 'تم الطلب',
    arriving: 'يصل خلال {a}–{b} أيام', trackOrder: 'تتبع الطلب', done: 'تم', secureReturns: 'آمن · إرجاع ١٤ يوم',
    qty: 'الكمية', applePay: 'Apple Pay', card: 'بطاقة', tappy: 'Tappy للدفع', cod: 'الدفع عند الاستلام', livaBalance: 'رصيد ليفا',
    instant: 'فوري', codSub: 'ادفع عند الوصول',
    trackingTitle: 'تتبع الطلب', orderNo: 'طلب', processing: 'قيد التجهيز', confirmed: 'تم التأكيد',
    shipped: 'تم الشحن', outForDelivery: 'خرج للتوصيل', delivered: 'تم التسليم', estArrival: 'الوصول المتوقع',
    courier: 'المندوب', liveLocation: 'الموقع المباشر', orderItems: 'المنتجات', reorder: 'إعادة الطلب', contactSeller: 'تواصل مع البائع',
    wishlistTitle: 'المفضلة', emptyWishlist: 'لا شيء محفوظ بعد', emptyWishlistSub: 'اضغط القلب على أي منتج لحفظه هنا.',
    priceDropAlerts: 'تنبيهات انخفاض السعر', dropped: 'انخفض', browse: 'تصفّح المنتجات',
    earnTitle: 'الأرباح', currentBalance: 'الرصيد الحالي', totalEarned: 'إجمالي الأرباح', withdraw: 'سحب',
    transfer: 'تحويل', details: 'تفاصيل', performance: 'الأداء', revenueBreakdown: 'توزيع الإيرادات', referrals: 'الإحالات',
    aiTitle: 'الذكاء', aiOnline: 'متصل · يرد خلال ثوانٍ', aiPlaceholder: 'اسأل عمّا تشتري أو تبيع أو متى تبثّ…',
    goLiveNow: 'ابدأ البث', buyTrending: 'اشترِ الرائج', promoteProduct: 'روّج منتجاً', analyzeMarket: 'حلّل السوق',
    follow: 'متابعة', followers: 'متابع', addComment: 'اكتب تعليقاً…', flashUnlocked: 'تم فتح عرض سريع',
    demandSpiking: 'الطلب يرتفع', left: 'متبقٍ', endsSoon: 'ينتهي قريباً', sales: 'مبيعات', viewItem: 'عرض المنتج',
  },
};

function t(key, vars) {
  let s = (DICT[_state.lang] && DICT[_state.lang][key]) || DICT.en[key] || key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}

function fmtNum(n, dec) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
// usd → formatted string in active currency
function price(usd, opts = {}) {
  if (_state.ccy === 'AED') {
    const v = usd * AED_RATE;
    const num = fmtNum(v, opts.dec != null ? opts.dec : 0);
    return _state.lang === 'ar' ? `${num} د.إ` : `AED ${num}`;
  }
  return '$' + fmtNum(usd, opts.dec != null ? opts.dec : 2);
}
// product display name honoring language
function name(p) { return (_state.lang === 'ar' && p.nameAr) ? p.nameAr : p.name; }

Object.assign(window, { LIVA_I18N: { t, price, name, setLocale, state: _state, isRTL, AED_RATE } });
