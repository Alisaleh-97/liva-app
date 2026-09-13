# Multi-stage Node build for the LIVA API. Keeps the runtime image small
# by dropping devDependencies + build tooling before the final layer.

# ── build stage — installs everything, generates Prisma client ─────────
FROM node:20-alpine AS build
WORKDIR /app

# Only copy manifest first so `npm ci` caches across code-only changes
COPY package.json package-lock.json ./
RUN npm ci

# Prisma needs the schema at generate-time
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# ── runtime stage — slim image, prod deps only ────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install prod deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Carry over the generated Prisma client + code + schema
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=build /app/prisma                ./prisma
COPY --from=build /app/src                   ./src

# Non-root user for defense-in-depth
RUN addgroup -S liva && adduser -S liva -G liva && chown -R liva:liva /app
USER liva

EXPOSE 3001

# Push schema on boot so a fresh env just works; swap for `prisma migrate deploy`
# once you have committed migrations.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
