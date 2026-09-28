# 💕 Will You Date Me? — Setup Guide

## Quick Start

### 1. Install & Run
```
npm install
npm start
```
Then open **http://localhost:3000** in your browser.

---

### 2. Replace Profile Photos
Put your photos in the `/public` folder:
- `me.jpg` → Your photo (left circle)
- `partner.jpg` → Her photo (right circle)

---

### 3. Add Background Music
Put your MP3 in the `/public` folder:
- `music.mp3` → Song that plays on the gallery page

---

### 4. Admin Panel
Go to **http://localhost:3000/admin.html**
- Password: `abcdef` (change it in the `.env` file)
- Upload photos → they appear in the gallery instantly
- Delete photos → removed from Cloudinary too

---

### 5. Change Admin Password
Open `.env` and change:
```
ADMIN_PASSWORD=your_new_password
```

---

### 6. Cloudinary Credentials (already set)
In `.env`:
```
CLOUDINARY_CLOUD_NAME=nulazacl
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## File Structure
```
love/
├── server.js          ← Backend server
├── .env               ← Secret config (DO NOT SHARE)
├── db.json            ← Auto-created; stores photo list
├── public/
│   ├── index.html     ← Main romantic page
│   ├── admin.html     ← Admin upload panel
│   ├── style.css      ← All styles
│   ├── app.js         ← Frontend logic
│   ├── me.jpg         ← Your photo ← REPLACE THIS
│   ├── partner.jpg    ← Her photo  ← REPLACE THIS
│   └── music.mp3      ← Background song ← ADD THIS
```

# love
