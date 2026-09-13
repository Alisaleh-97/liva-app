# LIVA — Store Listing Copy

Ready-to-paste text for App Store Connect and Google Play Console. Every
character count is checked against the current 2026 limits.

---

## App name  (≤ 30 chars)

```
LIVA — Live Shopping Market
```

## Subtitle / Short description  (iOS ≤ 30 chars · Play ≤ 80 chars)

**iOS:**
```
Live commerce & auctions
```

**Play:**
```
Shop live, bid live, win daily. Verified sellers, secure pay, fast delivery.
```

---

## Promotional text  (iOS ≤ 170 chars — updatable without review)

```
Daily live drops from verified sellers. Bid real-time auctions, split payments
in 4, earn LIVA Coins on every buy. New in this version: AR try-on for
clothes.
```

---

## Description  (App Store ≤ 4000 chars · Play ≤ 4000 chars)

```
LIVA is the live-shopping marketplace where verified sellers stream drops,
run auctions, and answer your questions on the spot.

WHY LIVA
• Live drops — jump into a stream, ask a question, buy in one tap
• Real auctions — bid live on curated items, win at up to 60% off retail
• AR try-on — see clothes, jewelry, and eyewear on you before buying
• Split in 4 — Buy Now, Pay Later with 0% interest on any order over $20
• LIVA Coins — 2% back on every purchase + daily spin rewards
• Compare — long-press any product to add it to a side-by-side compare
• Chat rooms — hang out with other shoppers by category (Beauty, Tech,
  Deal Hunters, Fashion, and more)

FEATURES YOU'LL USE EVERY WEEK
• Personalized "Today's picks" that learn from what you save and browse
• Price-drop alerts on your wishlist
• Follow your favorite sellers — get notified when they go live
• Voice search — say what you want, LIVA finds it
• Bilingual: English + Arabic with true RTL support
• Dark, light, and system-auto themes

FOR SELLERS
• Turn your phone into a mobile studio — no gear required
• AI copilot suggests titles, prices, and go-live windows
• Real-time analytics on sales, followers, and viewer drop-off
• Weekly payouts to your verified bank

WE TAKE PRIVACY SERIOUSLY
No third-party ads. No selling your data. Sign in with Face ID / Touch ID.
Passwords hashed with bcrypt, tokens stored in Keychain. See our full
privacy policy inside the app under Settings → About.

Ready to make shopping fun again? Download LIVA.
```

---

## Keywords  (iOS ≤ 100 chars, comma-separated)

```
live shopping,auction,marketplace,fashion,beauty,tech,BNPL,cashback,AR try-on,deals
```

---

## Category

- **Primary:** Shopping
- **Secondary:** Lifestyle

## Content rating

- **iOS:** 4+
- **Play:** Everyone (Purchases + User-generated content)

## Support URL / Marketing URL / Privacy URL

- Support:  `https://liva.app/support`
- Marketing: `https://liva.app`
- Privacy:  `https://liva.app/privacy` — must match [docs/PRIVACY.md](./PRIVACY.md) hosted content

---

## Screenshots — what to capture

Capture at least 3, up to 10, per device size. Suggested set:

1. **Home** — Stories rail + Daily Spin + Refer & Earn + LIVE AUCTION CTA
2. **Live stream** — chat, reactions, sticky Buy button, VS Battle overlay
3. **Auctions list** — Cloudstep Runners hero + rows with countdowns + Top Bidders
4. **Product page** — hero image, price, "Try it on with AR", size assistant, video reviews
5. **AR try-on** — full-screen mock with "Perfect fit detected"
6. **Compare** — side-by-side product cards with ✨ best-value highlighting
7. **Loyalty** — Bronze tier + achievements grid + $4.80 cashback
8. **Chat rooms** — the 8 topic grid
9. **Dark/light theme split** — one screen twice

### Required sizes

| Store | Device      | Resolution                    |
| ----- | ----------- | ----------------------------- |
| iOS   | 6.9" iPhone | 1290 × 2796                   |
| iOS   | 6.5" iPhone | 1284 × 2778 (fallback)        |
| iOS   | 12.9" iPad  | 2048 × 2732 (only if supported) |
| Play  | Phone       | ≥ 320 px on shortest side, 16:9 or 9:16 |
| Play  | Feature graphic | 1024 × 500                |

---

## What's new in this version  (≤ 4000 chars — per release)

**v0.1.0 — Launch 🎉**
```
Welcome to LIVA! In this first release:
• Live shopping from verified sellers
• Real-time auctions with anti-snipe timers
• AR try-on for wearables
• Split-in-4 payments with 0% interest
• LIVA Coins loyalty program with daily spin
• Chat rooms by category

Something not right? Email support@liva.app — we read every message.
```

---

## Age rating questionnaire — answers

| Question                                         | Answer |
| ------------------------------------------------ | ------ |
| Violence / mature themes                         | None   |
| Sexual content / nudity                          | None   |
| Profanity / crude humor                          | None   |
| Alcohol / tobacco / drugs                        | None   |
| Simulated gambling                               | **Yes — Daily Spin** (no real-money wager, no purchase of spins) |
| Contests / sweepstakes                           | **Yes — Flash raffles** (free to enter during live streams) |
| Unrestricted web access                          | None   |
| Location sharing                                 | **Yes** (delivery estimates) |
| User-generated content                           | **Yes** (reviews, chat, live streams — moderated) |
| Purchases                                        | **Yes** (physical goods, marketplace) |

---

## Third-party attributions

- React Native — MIT
- Expo — MIT
- Stripe React Native SDK — see Stripe terms
- Prisma — Apache-2.0
- All others: see [OSS_LICENSES.md](./OSS_LICENSES.md) generated from `npm ls`
