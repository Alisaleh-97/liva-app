// Auth helpers — bcrypt password hashing, JWT sign/verify, and an Express
// middleware that requires a valid Bearer token for protected routes.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { findById, publicUser } from './userStore.js';

const BCRYPT_ROUNDS = 12; // Balanced: ~250ms per hash — resists offline attacks

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

// Sign a 30-day access token. For real production, split into short access +
// refresh tokens and rotate.
export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, env.JWT_SECRET); }
  catch { return null; }
}

// Express middleware — reads Bearer token, looks up the user, attaches to req.
// On failure returns 401 without leaking why (invalid vs expired vs missing).
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const payload = verifyToken(token);
  if (!payload?.sub) return res.status(401).json({ error: 'Unauthorized' });
  const user = await findById(payload.sub);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  req.userPublic = publicUser(user);
  next();
}
