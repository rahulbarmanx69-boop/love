// ============================================================
// server.js - Main backend server for "Will You Date Me?" 💕
// ============================================================
// This file handles:
//   - Serving the frontend pages (HTML/CSS/JS)
//   - API routes for photos (get, upload, delete)
//   - Cloudinary integration for image storage
//   - Simple file-based database (db.json) for persistence
// ============================================================

require('dotenv').config(); // Load .env variables

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve everything inside /public as static files
// (profile photos, music, etc. go here)
app.use(express.static(path.join(__dirname, 'public')));

// ── Simple JSON "database" ─────────────────────────────────
// Photos are stored in db.json as an array of objects:
//   { id, url, public_id, uploadedAt }
const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ photos: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Cloudinary Setup ───────────────────────────────────────
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

// Multer — store files in memory, then stream to Cloudinary
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload a Buffer to Cloudinary and return the result
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ── Admin Auth Middleware ──────────────────────────────────
// Checks the X-Admin-Password header or query param "password"
function requireAdmin(req, res, next) {
  const pwd = req.headers['x-admin-password'] || req.query.password;
  if (pwd === process.env.ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// ══════════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════════

// GET /api/photos  ─ Public: returns all photos for the gallery
app.get('/api/photos', (req, res) => {
  const db = readDB();
  res.json(db.photos);
});

// POST /api/photos ─ Admin only: upload one or more photos
app.post('/api/photos', requireAdmin, upload.array('photos', 20), async (req, res) => {
  try {
    const db = readDB();
    const newPhotos = [];

    for (const file of req.files) {
      // Upload buffer to Cloudinary
      const result = await uploadToCloudinary(file.buffer, 'will-you-date-me');
      newPhotos.push({
        id         : result.public_id,
        url        : result.secure_url,
        public_id  : result.public_id,
        uploadedAt : new Date().toISOString(),
      });
    }

    db.photos.push(...newPhotos);
    writeDB(db);

    res.json({ success: true, photos: newPhotos });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// DELETE /api/photos/:id ─ Admin only: delete a photo
app.delete('/api/photos/:id', requireAdmin, async (req, res) => {
  try {
    const db       = readDB();
    const publicId = decodeURIComponent(req.params.id);

    // Find photo in DB
    const idx = db.photos.findIndex(p => p.public_id === publicId || p.id === publicId);
    if (idx === -1) return res.status(404).json({ error: 'Photo not found' });

    const photo = db.photos[idx];

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(photo.public_id);

    // Remove from DB
    db.photos.splice(idx, 1);
    writeDB(db);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

// POST /api/admin/login ─ Verify admin password
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// ══════════════════════════════════════════════════════════
//  PAGE ROUTES
//  All page HTML is served from /public
//  - /         → public/index.html  (landing + gallery SPA)
//  - /admin    → public/admin.html  (admin panel)
// ══════════════════════════════════════════════════════════

// Catch-all: serve index.html for unknown routes (SPA behaviour)
app.get('*', (req, res) => {
  const adminFile = path.join(__dirname, 'public', 'admin.html');
  const indexFile = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexFile);
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n💕 Will You Date Me? is running!`);
  console.log(`   Open: http://localhost:${PORT}`);
  console.log(`   Admin: http://localhost:${PORT}/admin.html`);
  console.log(`   Press Ctrl+C to stop.\n`);
});
