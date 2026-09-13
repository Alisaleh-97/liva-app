// Prisma client singleton — one instance per process. Import this everywhere
// that needs DB access; do NOT construct new PrismaClient() elsewhere or you
// leak connections on hot-reload.

import { PrismaClient } from '@prisma/client';

// In dev, `node --watch` re-imports modules on file change — re-using the
// existing client across reloads prevents the "too many connections" flurry.
const globalForPrisma = /** @type {{ prisma?: PrismaClient }} */ (globalThis);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
