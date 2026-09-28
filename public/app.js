// ============================================================
// app.js — Frontend logic for "Will You Date Me?" 💕
// ============================================================
// Sections:
//   1. Floating hearts background
//   2. No-button dodging logic
//   3. Yes button → celebration → gallery transition
//   4. Gallery page: fetch + render photos
//   5. Lightbox (fullscreen photo viewer)
//   6. Music controls
// ============================================================

// ─── State ────────────────────────────────────────────────
let noClickCount  = 0;      // How many times "No" has dodged
let yesScale      = 1;      // Growing scale of Yes button
let photos        = [];     // All gallery photos from API
let currentPhotoIndex = 0;  // For lightbox navigation
let isMuted       = false;

// ══════════════════════════════════════════════════════════
// 1. FLOATING HEARTS BACKGROUND
// ══════════════════════════════════════════════════════════
const HEARTS = ['💗', '💕', '💖', '💓', '🌸', '✨', '💝', '🌺', '💞', '🫶'];

function createFloatingHearts(containerId, count = 18) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const el   = document.createElement('span');
    el.className = 'float-heart';
    el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];

    // Random horizontal position
    el.style.left     = `${Math.random() * 100}%`;
    // Random speed (5s – 14s)
    el.style.animationDuration = `${5 + Math.random() * 9}s`;
    // Stagger start so they don't all appear at once
    el.style.animationDelay   = `${Math.random() * 8}s`;
    el.style.fontSize = `${0.9 + Math.random() * 1.4}rem`;

    container.appendChild(el);
  }
}

// Init hearts for landing page
createFloatingHearts('hearts-bg', 22);


// ══════════════════════════════════════════════════════════
// 2. NO-BUTTON DODGING LOGIC
// ══════════════════════════════════════════════════════════
const btnNo  = document.getElementById('btn-no');
const btnYes = document.getElementById('btn-yes');
const hintEl = document.getElementById('hint-text');

// We'll track whether the No button has been positioned initially
let noInitialized = false;

// Messages that appear after dodging multiple times
const HINTS = [
  'Hmm, it keeps running away! 😂',
  'I think you know the answer... 😏',
  'Maybe try the other button? 💝',
  'The no button is scared of you 🐭',
  'Just click YES already! 💘',
  'Come on, say yes! 🥺',
  'Pretty please? 🙏💕',
];

function dodgeNoButton() {
  const margin  = 80;  // keep away from edges
  const btnW    = btnNo.offsetWidth  || 120;
  const btnH    = btnNo.offsetHeight || 50;
  const maxX    = window.innerWidth  - btnW - margin;
  const maxY    = window.innerHeight - btnH - margin;

  const newX = margin + Math.random() * maxX;
  const newY = margin + Math.random() * maxY;

  // Use fixed positioning so it can go anywhere on screen
  btnNo.style.position  = 'fixed';
  btnNo.style.left      = newX + 'px';
  btnNo.style.top       = newY + 'px';
  // Clear the relative position references
  btnNo.style.marginLeft = '0';

  noClickCount++;

  // Grow Yes button (max ~1.5×)
  yesScale = Math.min(1.5, 1 + noClickCount * 0.06);
  btnYes.style.fontSize  = `${1.35 * yesScale}rem`;
  btnYes.style.padding   = `${14 * yesScale}px ${42 * yesScale}px`;

  // Show hints
  if (noClickCount <= HINTS.length) {
    hintEl.textContent = HINTS[noClickCount - 1];
  }
}

// Move No button when cursor gets near it (within 120px)
document.addEventListener('mousemove', (e) => {
  if (!btnNo) return;

  // Initialize position on first mouse move
  if (!noInitialized) {
    noInitialized = true;
    dodgeNoButton();
    return;
  }

  const rect = btnNo.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

  if (dist < 130) {
    dodgeNoButton();
  }
});

// Also dodge on touchstart (mobile)
btnNo.addEventListener('touchstart', (e) => {
  e.preventDefault();
  dodgeNoButton();
}, { passive: false });


// ══════════════════════════════════════════════════════════
// 3. YES BUTTON → CELEBRATION → GALLERY
// ══════════════════════════════════════════════════════════
function onYes() {
  const overlay = document.getElementById('celebration-overlay');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  // Spawn celebration hearts
  spawnCelebrationHearts();

  // After 2.8s, transition to gallery page
  setTimeout(() => {
    overlay.classList.add('hidden');
    showGalleryPage();
  }, 2800);
}

function spawnCelebrationHearts() {
  const wrapper = document.getElementById('celebrate-hearts');
  wrapper.innerHTML = '';
  const celebHearts = ['💖', '💕', '💗', '🌸', '💝', '✨', '🎉', '💞'];

  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const el = document.createElement('span');
      el.className = 'celeb-heart';
      el.textContent = celebHearts[Math.floor(Math.random() * celebHearts.length)];
      el.style.left = `${Math.random() * 100}%`;
      el.style.fontSize = `${1 + Math.random() * 1.5}rem`;
      el.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
      wrapper.appendChild(el);
      // Remove after animation
      setTimeout(() => el.remove(), 2200);
    }, i * 80);
  }
}


// ══════════════════════════════════════════════════════════
// 4. GALLERY PAGE
// ══════════════════════════════════════════════════════════
function showGalleryPage() {
  const landing = document.getElementById('landing-page');
  const gallery = document.getElementById('gallery-page');
  const heartsBg = document.getElementById('hearts-bg');

  // Hide landing
  landing.classList.remove('active');
  landing.classList.add('hidden');

  // Hide landing hearts
  if (heartsBg) heartsBg.style.display = 'none';

  // Show gallery
  gallery.classList.remove('hidden');
  gallery.classList.add('active', 'fade-in');

  // Start gallery background hearts
  createFloatingHearts('gallery-bg', 14);

  // Auto-play music
  playMusic();

  // Load photos from API
  loadPhotos();
}

async function loadPhotos() {
  const grid     = document.getElementById('photo-grid');
  const emptyEl  = document.getElementById('empty-state');
  const loadEl   = document.getElementById('loading-state');

  loadEl.classList.remove('hidden');
  emptyEl.classList.add('hidden');
  grid.innerHTML = '';

  try {
    const res  = await fetch('/api/photos');
    photos     = await res.json();

    loadEl.classList.add('hidden');

    if (!photos || photos.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }

    // Render each photo card
    photos.forEach((photo, idx) => {
      const item = document.createElement('div');
      item.className = 'photo-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Memory photo ${idx + 1}`);

      const img = document.createElement('img');
      img.src     = photo.url;
      img.alt     = `Memory ${idx + 1}`;
      img.loading = 'lazy';

      item.appendChild(img);
      item.addEventListener('click', () => openLightbox(idx));
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter') openLightbox(idx); });

      grid.appendChild(item);
    });

  } catch (err) {
    console.error('Failed to load photos:', err);
    loadEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
  }
}


// ══════════════════════════════════════════════════════════
// 5. LIGHTBOX
// ══════════════════════════════════════════════════════════
function openLightbox(idx) {
  currentPhotoIndex = idx;
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lightbox-img');

  lbImg.src = photos[idx].url;
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Keyboard navigation
  document.addEventListener('keydown', lightboxKeyHandler);
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', lightboxKeyHandler);
}

function prevPhoto() {
  if (photos.length === 0) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
  document.getElementById('lightbox-img').src = photos[currentPhotoIndex].url;
}

function nextPhoto() {
  if (photos.length === 0) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
  document.getElementById('lightbox-img').src = photos[currentPhotoIndex].url;
}

function lightboxKeyHandler(e) {
  if (e.key === 'ArrowLeft')  prevPhoto();
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'Escape')     closeLightbox();
}

// Click outside image to close
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});


// ══════════════════════════════════════════════════════════
// 6. MUSIC CONTROLS
// ══════════════════════════════════════════════════════════
function updateMusicBtns() {
  const muteBtn    = document.getElementById('mute-btn');
  const landingBtn = document.getElementById('landing-music-btn');
  if (muteBtn)    muteBtn.textContent    = isMuted ? '🔇' : '🔊';
  if (landingBtn) landingBtn.textContent = isMuted ? '🔇' : '🎵';
}

function playMusic() {
  const audio = document.getElementById('bg-music');
  if (!audio) return;

  audio.volume = 0.45;
  audio.play().then(() => {
    isMuted = false;
    updateMusicBtns();
  }).catch(() => {
    // Auto-play blocked — will start on first interaction
    isMuted = true;
    updateMusicBtns();
  });
}

function toggleMute() {
  const audio = document.getElementById('bg-music');
  if (!audio) return;

  if (isMuted || audio.paused) {
    audio.volume = 0.45;
    audio.play();
    isMuted = false;
  } else {
    audio.pause();
    isMuted = true;
  }
  updateMusicBtns();
}

// Start music on first user interaction (works from landing page)
(function initLandingMusic() {
  const startMusic = () => {
    playMusic();
  };
  document.addEventListener('click',      startMusic, { once: true });
  document.addEventListener('touchstart', startMusic, { once: true });
  document.addEventListener('keydown',    startMusic, { once: true });
}());


// ══════════════════════════════════════════════════════════
// INIT: Allow direct access to gallery via URL hash
// ══════════════════════════════════════════════════════════
if (window.location.hash === '#gallery') {
  showGalleryPage();
}
