# LIVA — Deployment Runbook

One-page reference for every "go live" operation. Assumes you already have
Expo, Apple Developer, Google Play Developer, and Railway/Fly accounts.

---

## Prerequisites (one-time)

```bash
# Install CLIs
npm i -g eas-cli
brew install flyctl                # or: iwr https://fly.io/install.ps1 -useb | iex

# Log in
eas login                          # Expo
fly auth login                     # Fly.io
```

Then in [liva-app/app.json](../liva-app/app.json):
- Replace `REPLACE_WITH_EAS_ACCOUNT_HANDLE` with your Expo owner slug
- Replace `REPLACE_WITH_EAS_PROJECT_ID` with the project id from `eas init`

In [liva-app/eas.json](../liva-app/eas.json) `submit.production`:
- Set your real Apple ID email, ASC App ID, Apple Team ID
- Drop `secrets/play-service-account.json` next to `eas.json` (gitignored) —
  download from Google Play Console → Setup → API access

---

## Backend — deploy to Fly.io

```bash
cd server

# First time only — creates the app, prompts for a region
fly launch --no-deploy

# Set the secrets (never commit these)
fly secrets set \
  JWT_SECRET="$(openssl rand -hex 32)" \
  OPENAI_API_KEY=sk-... \
  STRIPE_SECRET_KEY=sk_live_... \
  CORS_ORIGINS=https://liva.app,https://www.liva.app

# For production, swap SQLite → Postgres:
fly postgres create --name liva-db --region fra
fly postgres attach --app liva-api liva-db          # sets DATABASE_URL

# Deploy
fly deploy

# Verify
curl https://liva-api.fly.dev/health
```

## Backend — deploy to Railway (alternative)

1. Push to GitHub.
2. Railway → New Project → Deploy from GitHub → pick `server/`.
3. Add env vars: `JWT_SECRET`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`,
   `CORS_ORIGINS`, `DATABASE_URL` (attach a Postgres plugin).
4. Railway auto-detects [server/railway.json](../server/railway.json)
   and builds from [server/Dockerfile](../server/Dockerfile).

---

## Mobile app — build & submit

```bash
cd liva-app

# Set the production API URL as an EAS secret so it's baked into the build
eas secret:create --scope project --name EXPO_PUBLIC_API_URL \
  --value https://api.liva.app --type string
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value https://...
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_KEY --value phc_...

# Production build (both platforms)
eas build --profile production --platform all

# When the build finishes, submit to the stores
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

- iOS build → shows up in App Store Connect → TestFlight in ~30 min → submit
  for review from there.
- Android build → uploaded to Play Console → Internal testing → promote to
  Closed → Open → Production tracks as you validate.

---

## Over-the-air updates (no store round trip)

For JS-only fixes on already-published binaries:

```bash
cd liva-app
eas update --branch production --message "Fix wishlist share button"
```

Native code changes (new modules, permission strings) still require a new
build. `runtimeVersion.policy = "appVersion"` in app.json ensures OTA
updates only reach binaries with the matching app version.

---

## Store assets to prepare

- Icon 1024×1024 (opaque, no alpha) → `liva-app/assets/icon.png`
- Adaptive icon foreground 1024×1024 (transparent bg) → `assets/adaptive-icon.png`
- Splash 1284×2778 with subject centered in the safe area → `assets/splash.png`
- Notification icon 96×96 monochrome white on transparent → `assets/notification-icon.png`
- Favicon 48×48 → `assets/favicon.png`
- App Store screenshots: see [STORE_LISTING.md](./STORE_LISTING.md) sizes
- 30-second preview video (optional, big conversion win)

---

## Pre-flight checklist

- [ ] `npm test` green in [liva-app](../liva-app)
- [ ] `npx tsc --noEmit` green in [liva-app](../liva-app)
- [ ] Server smoke test: `curl https://api.liva.app/health` → `{ ok: true }`
- [ ] Real Stripe **test** transaction works end-to-end
- [ ] Real Stripe **live** transaction works end-to-end (test with your own card, refund yourself)
- [ ] Push notification arrives on a real device
- [ ] Sign-out clears both `SecureStore` token AND local user cache
- [ ] Auth rate limit returns 429 after 10 login attempts in 15 min
- [ ] `docs/PRIVACY.md` published at `https://liva.app/privacy` and reachable
- [ ] `docs/TERMS.md` published at `https://liva.app/terms` and reachable
- [ ] Support inbox alive at `support@liva.app`
- [ ] EAS project id + Expo owner handle set in `app.json`
- [ ] `secrets/play-service-account.json` present (gitignored)

---

## Rollback

- **OTA:** `eas update:list` → find the previous update id → `eas update:republish --id <id>`
- **Full binary:** re-submit the last-known-good build from EAS build history
- **Backend:** `fly releases` → `fly releases rollback <version>` (Fly), or Railway → deployments → previous → redeploy

---

## Post-launch monitoring

| Signal              | Where                                            | Threshold                        |
| ------------------- | ------------------------------------------------ | -------------------------------- |
| Crash-free sessions | Sentry Releases                                  | > 99.5 %                         |
| API latency p95     | Fly/Railway metrics                              | < 400 ms                         |
| API error rate      | Sentry (backend)                                 | < 0.5 % of requests              |
| Sign-up funnel      | PostHog: `sign_up` after `app_open`              | Track weekly                     |
| Purchase funnel     | PostHog: `product_view → checkout_started → purchase` | Investigate any 20 %+ drop step |
| Store reviews       | App Store Connect + Play Console                 | Respond within 48h to anything ≤ 3★ |
