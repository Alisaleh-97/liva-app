#!/usr/bin/env bash
# LIVA pre-flight — run before every production build/deploy.
# Fails loudly on the first red step so you don't ship on a broken foundation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/liva-app"
SERVER="$ROOT/server"

echo "▶ LIVA pre-flight"
echo "  root: $ROOT"
echo ""

step() { echo ""; echo "── $1 ──"; }
ok()   { echo "  ✓ $1"; }
warn() { echo "  ⚠ $1"; }

# ── 1. Mobile app ─────────────────────────────────────────────────────
step "1/6  liva-app · TypeScript"
(cd "$APP" && npx tsc --noEmit)
ok "typecheck clean"

step "2/6  liva-app · Tests"
(cd "$APP" && npm test -- --silent)
ok "all tests pass"

# ── 2. Server ────────────────────────────────────────────────────────
step "3/6  server · Prisma schema"
(cd "$SERVER" && npx prisma validate)
ok "schema valid"

step "4/6  server · Env sanity"
[ -f "$SERVER/.env" ] || { echo "  ✗ server/.env missing"; exit 1; }
grep -q '^JWT_SECRET=' "$SERVER/.env" || { echo "  ✗ JWT_SECRET missing"; exit 1; }
JWT=$(grep '^JWT_SECRET=' "$SERVER/.env" | cut -d= -f2- | tr -d '"')
[ ${#JWT} -ge 32 ] || { echo "  ✗ JWT_SECRET must be ≥ 32 chars"; exit 1; }
grep -q '^JWT_SECRET=dev-only' "$SERVER/.env" && warn "JWT_SECRET is still the dev value — rotate before deploy"
ok "env looks sane"

step "5/6  server · Smoke boot"
(cd "$SERVER" && timeout 20 node src/index.js &) || true
sleep 4
if curl -fsS http://localhost:3001/health >/dev/null 2>&1; then
  ok "/health responded 200"
else
  warn "server didn't answer /health — is another process on :3001?"
fi
pkill -f "node src/index.js" 2>/dev/null || true

# ── 3. Docs sanity ───────────────────────────────────────────────────
step "6/6  Docs · Privacy + Terms + Store copy"
for f in "$ROOT/docs/PRIVACY.md" "$ROOT/docs/TERMS.md" "$ROOT/docs/STORE_LISTING.md" "$ROOT/docs/DEPLOYMENT.md"; do
  [ -f "$f" ] || { echo "  ✗ missing $f"; exit 1; }
done
if grep -RIl "REPLACE_WITH_" "$ROOT/docs" >/dev/null; then
  warn "some docs still contain REPLACE_WITH_ placeholders — fill them in before publishing"
else
  ok "docs have no placeholders"
fi

echo ""
echo "▶ Pre-flight complete. Ready to build."
