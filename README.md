# LIVA — Expo (React Native + TypeScript) + Node/Express backend

A first-pass MVP wired from the LIVA design files. The mobile app runs on a
real phone via **Expo Go**. The OpenAI key lives on a tiny Express backend so
it never ships inside the phone bundle.

```
LIVA App/
├── liva-app/        # Expo React Native + TypeScript (the mobile app)
├── server/          # Node + Express backend (Open AI integration)
├── app/             # the original web design files (kept for reference)
├── frames/
└── screenshots/
```

## What's in the MVP

- Tab navigation: **Home · Shop · Live · Earn · AI** (Live + Earn stubbed
  with a "coming soon" screen for this pass).
- Theme system + dark/light + EN/AR translation strings + USD/AED currency,
  ported from the original design.
- **Home**: header, banner slider, categories, hero live, AI picks, flash
  deals, trending grid, top sellers, trust strip.
- **Shop**: chip filters + AI re-rank + product grid.
- **PDP**: gallery, brand/price, color/size pickers, installments badge,
  seller card, trust rows, sticky buy bar.
- **Checkout**: 3-step bottom sheet (confirm → payment → success), full /
  monthly installments, multiple payment methods.
- **AI tab**: live chat wired to `POST /api/ai/chat` (OpenAI commerce
  assistant) **and** an "Add by link" sheet wired to `POST /api/ai/extract`
  (URL → product → added to your local Shop catalog).
- **AsyncStorage** for wishlist, orders, and AI-extracted products
  (everything survives restarts).

## Prerequisites

1. **Node.js 20.x LTS** — install from https://nodejs.org/. Restart your
   shell after installing so `node` and `npm` are on PATH.
2. **Expo Go** on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
3. Your computer and your phone must be on the **same Wi-Fi network**.
4. An **OpenAI API key** (https://platform.openai.com/api-keys).

## One-time setup

```bash
# from the LIVA App/ folder

cd server
npm install
cp .env.example .env       # then open .env and paste your real OPENAI_API_KEY

cd ../liva-app
npm install
cp .env.example .env       # then edit EXPO_PUBLIC_API_URL — see next section
```

### Setting `EXPO_PUBLIC_API_URL`

Your phone needs to reach the backend over the LAN. Do **not** use
`localhost` — that points to the phone itself.

Find your computer's LAN IP:

- Windows: `ipconfig` → look for the IPv4 address under your active adapter
  (usually starts with `192.168.` or `10.`).
- macOS / Linux: `ifconfig` or `ip addr`.

Then in `liva-app/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:3001
```

(Replace `192.168.1.42` with your actual IP.)

## Running it

Open **two terminals**.

### Terminal 1 — backend

```bash
cd server
npm run dev
```

Expected output:

```
[liva-server] listening on http://localhost:3001
[liva-server] OpenAI key configured: true
```

### Terminal 2 — mobile app

```bash
cd liva-app
npm start
```

A QR code appears in the terminal. On your phone:

- **iOS**: open the Camera, point it at the QR, tap the Expo Go banner.
- **Android**: open Expo Go, tap "Scan QR code".

The app builds the first time (takes ~30 seconds) and opens on your phone.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `node: command not found` | Install Node 20.x LTS, restart your shell. |
| Phone can't load the app | Same Wi-Fi? Disable Windows Firewall briefly to test, or use `npm run tunnel` in `liva-app/`. |
| AI tab says "I couldn't reach the assistant" | Backend not running, or `EXPO_PUBLIC_API_URL` is `localhost` / wrong IP. Hit `http://<your-ip>:3001/health` in your phone's browser — should return JSON. |
| AI replies but no product cards | Normal — the model only attaches products when it makes sense for the query. |
| Add-by-link extraction fails | Many real sites block bot traffic. Try a simpler site (e.g. a small Shopify store). |
| `OPENAI_API_KEY is not set` warning | You forgot to copy `.env.example` to `.env` in `server/` and paste your key. |

## What's not in this pass (next build pass)

- Live stream room (the central tab) — currently a stub.
- Earn screen (sparklines, breakdown, referrals) — stub.
- Search screen with filters — currently goes straight to Shop.
- Wishlist screen — wishlist state works (heart toggles persist), no
  dedicated screen yet.
- Order tracking screen — orders are saved to AsyncStorage but no UI yet.
- Tweaks panel (theme/font/accent live editor) — the theme system is in
  place; the UI to switch values isn't wired.
- 360° / pinch-zoom in PDP gallery — currently a paging carousel.
- Reviews distribution bars on PDP.
- Pixel-perfect typography (Sora/Manrope/Space Mono are loaded via system
  font fallbacks; `expo-font` wiring is the next step).
