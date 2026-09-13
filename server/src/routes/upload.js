// Image upload endpoint — accepts multipart uploads (10MB cap, images only)
// and stores them locally under server/uploads/. Returns a public URL that
// the client can save in Product.imageUrls.
//
// To swap to Cloudinary/S3: replace the disk-write branch with a call to
// their SDK, keyed off CLOUDINARY_URL / S3 env vars.

import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { requireAuth } from '../lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure the upload directory exists at startup rather than on first upload
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per file
  fileFilter(_req, file, cb) {
    // Only accept images — reject everything else at the multer layer
    if (/^image\/(jpe?g|png|webp|gif|heic|heif)$/i.test(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type — images only'));
  },
});

const router = Router();

// POST /api/upload/image  (auth required — you can't upload anonymously)
// FormData field name: "file"
router.post('/image', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name must be "file")' });

    // Generate a random filename to avoid overwrites and to prevent guessable URLs
    const ext = (req.file.mimetype.split('/')[1] || 'bin').toLowerCase();
    const name = crypto.randomBytes(16).toString('hex') + '.' + ext;
    const dest = path.join(UPLOAD_DIR, name);
    await fs.writeFile(dest, req.file.buffer);

    // Absolute URL so mobile clients (which don't share our host) can hit it
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      url:  `${baseUrl}/uploads/${name}`,
      size: req.file.size,
      type: req.file.mimetype,
    });
  } catch (err) { next(err); }
});

// Static file server for the uploads directory — separate export so index.js
// can mount it at the /uploads path.
export const uploadsStatic = express.static(UPLOAD_DIR, {
  maxAge: '7d',
  immutable: true,
  fallthrough: false,
});

export default router;
