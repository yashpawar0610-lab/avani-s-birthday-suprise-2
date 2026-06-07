/* =====================================================
   AVANI'S BIRTHDAY WEBSITE — Main Script
   ===================================================== */

'use strict';

// ─── State ───────────────────────────────────────────
let currentPage = 1;
let musicPlaying = false;        // FIX: was true but no music was started, causing mismatch
let envelopeOpened = false;      // FIX: was true, so envelope could never be opened
let audioCtx = null;
let bgmGain = null;
let musicMode = 'synth';         // 'synth' | 'birthday'
let synthTimeout = null;
let activeOscillators = [];
let hbSongTimeout = null;        // timeout handle for Happy Birthday song loop
let chordIntervalId = null;      // interval handle for ambient chords

// ─── DOM Ready ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initParticleCanvas();
  initScrollReveal();
  spawnButterflies();
  loadUserData();
  loadMusicSettings(); // Load the saved music configuration
  initLoading();

  // Auto-save whenever user types in contenteditable elements
  document.addEventListener('input', (e) => {
    if (e.target.hasAttribute('contenteditable')) {
      saveUserData();
    }
  });
});

// =====================================================
//  LOADING SCREEN
// =====================================================
function initLoading() {
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    ls.classList.add('hidden');
    setTimeout(() => {
      ls.style.display = 'none';
      showPage(1);
      triggerConfetti(60);
      setTimeout(() => spawnFloatingHearts(10), 600);
    }, 800);
  }, 2800);
}

// =====================================================
//  PAGE NAVIGATION
// =====================================================
function showPage(num) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page${num}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  currentPage = num;

  // Sync back button
  const backNav = document.getElementById('back-nav');
  if (num > 1) backNav.classList.add('visible');
  else backNav.classList.remove('visible');

  // Sync page dots
  document.querySelectorAll('.page-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i + 1 === num);
  });

  setTimeout(checkReveal, 100);
}

function goToPage(num) {
  const transition = document.getElementById('page-transition');
  transition.classList.add('active');

  // Hearts burst on transition
  spawnFloatingHearts(15);

  // Auto-start music when surprise is opened
  if (num === 2 && !musicPlaying) {
    toggleMusic();
  }

  setTimeout(() => {
    showPage(num);
    setTimeout(() => {
      transition.classList.remove('active');
    }, 400);
  }, 500);
}

function goBack() {
  if (currentPage > 1) goToPage(currentPage - 1);
}

// =====================================================
//  CUSTOM CURSOR + MOUSE HEARTS
// =====================================================
function initCursor() {
  const cursor = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  let mx = 0, my = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    setTimeout(() => {
      trail.style.left = mx + 'px';
      trail.style.top = my + 'px';
    }, 80);
    // occasional heart trail
    if (Math.random() < 0.08) spawnMouseHeart(mx, my);
  });

  document.addEventListener('mousedown', () => {
    cursor.style.width = '14px';
    cursor.style.height = '14px';
    spawnSparklesBurst(mx, my);
  });
  document.addEventListener('mouseup', () => {
    cursor.style.width = '20px';
    cursor.style.height = '20px';
  });
}

function spawnMouseHeart(x, y) {
  const el = document.createElement('div');
  el.textContent = ['💗', '💖', '💕', '✨', '🌸'][Math.floor(Math.random() * 5)];
  el.style.cssText = `
    position:fixed; left:${x}px; top:${y}px; font-size:${10 + Math.random() * 10}px;
    pointer-events:none; z-index:99990; transform:translate(-50%,-50%);
    animation: floatUp ${1.5 + Math.random()}s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function spawnSparklesBurst(x, y) {
  const starEmojis = ['✨', '⭐', '💫', '🌟', '✦'];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 360;
    const dist = 25 + Math.random() * 50;
    const tx = Math.cos(angle * Math.PI / 180) * dist;
    const ty = Math.sin(angle * Math.PI / 180) * dist;

    if (i % 3 === 0) {
      // Emoji star
      const el = document.createElement('div');
      el.className = 'sparkle-star';
      el.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
      el.style.cssText = `left:${x}px; top:${y}px; --tx:${tx}px; --ty:${ty}px; transform:translate(-50%,-50%);`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1300);
    } else {
      // Dot particle
      const el = document.createElement('div');
      el.className = 'sparkle-particle';
      el.style.cssText = `
        left:${x}px; top:${y}px; --tx:${tx}px; --ty:${ty}px;
        background: ${['#f4a7bb', '#d8b4fe', '#ffd700', '#ff6b9d', '#a5f3fc'][Math.floor(Math.random() * 5)]};
        width:${5 + Math.random() * 7}px; height:${5 + Math.random() * 7}px;
        transform:translate(-50%,-50%);
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 950);
    }
  }
}

// =====================================================
//  PARTICLE CANVAS — Background sparkles & orbs
// =====================================================
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['rgba(244,167,187,', 'rgba(216,180,254,', 'rgba(252,228,236,', 'rgba(255,215,0,'];

  for (let i = 0; i < 55; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 1.5 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.2 + Math.random() * 0.5),
      alpha: 0.3 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.twinkle += 0.04;
      const tw = 0.5 + 0.5 * Math.sin(p.twinkle);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + (p.alpha * tw) + ')';
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// =====================================================
//  CONFETTI
// =====================================================
function triggerConfetti(count = 80) {
  const colors = ['#f4a7bb', '#e8759a', '#d8b4fe', '#c084fc', '#ffd700', '#ff6b9d', '#fff0f5', '#c9517a'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const size = 6 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const delay = Math.random() * 0.5;
      const dur = 2.5 + Math.random() * 2;
      el.style.cssText = `
        left: ${Math.random() * 100}vw;
        width: ${size}px; height: ${size * (0.4 + Math.random() * 0.8)}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
        --dur: ${dur}s; --delay: ${delay}s;
        animation-delay: ${delay}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (dur + delay + 0.5) * 1000);
    }, i * 25);
  }
}

// =====================================================
//  FLOATING HEARTS
// =====================================================
function spawnFloatingHearts(count = 8) {
  const emojis = ['💗', '💖', '💕', '🌸', '✨', '💝', '🌺', '💓'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'float-heart';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.cssText = `
        left: ${10 + Math.random() * 80}vw;
        top: ${40 + Math.random() * 40}vh;
        font-size: ${1 + Math.random() * 2}rem;
        animation-duration: ${2 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.3}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }, i * 120);
  }
}

// =====================================================
//  BUTTERFLIES
// =====================================================
function spawnButterflies() {
  const items = [
    { emoji: '🦋', x: 8, top: 15, dur: 7 },
    { emoji: '🌸', x: 40, top: 8, dur: 9 },
    { emoji: '🦋', x: 72, top: 20, dur: 6 },
    { emoji: '🌺', x: 88, top: 12, dur: 8 },
  ];
  items.forEach((b, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'butterfly';
      el.textContent = b.emoji;
      el.style.cssText = `
        left: ${b.x}vw;
        top: ${b.top}vh;
        animation-duration: ${b.dur}s;
        animation-delay: ${i * 0.8}s;
        font-size: ${1.5 + Math.random() * 0.8}rem;
      `;
      document.body.appendChild(el);
    }, i * 500);
  });
}

// =====================================================
//  SCROLL REVEAL
// =====================================================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Timeline items
        if (entry.target.classList.contains('timeline-item')) {
          entry.target.style.transitionDelay = '0.1s';
        }
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-reveal], .timeline-item, .note-card, .flip-card, .polaroid-card').forEach(el => {
    observer.observe(el);
  });
}

function checkReveal() {
  // Re-observe after page switch
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('[data-reveal], .timeline-item, .note-card, .flip-card, .polaroid-card').forEach(el => {
    observer.observe(el);
    // Immediately show elements already in viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => el.classList.add('visible'), 100);
    }
  });
}

// Smooth fade in for data-reveal elements
const styleReveal = document.createElement('style');
styleReveal.textContent = `
  [data-reveal] { opacity: 0; transform: translateY(25px); transition: opacity 0.7s ease, transform 0.7s ease; }
  [data-reveal].visible { opacity: 1; transform: translateY(0); }
  .note-card { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease; }
  .note-card.visible { opacity: 1; transform: translateY(0); }
  .flip-card { opacity: 0; transform: scale(0.9); transition: opacity 0.5s ease, transform 0.5s ease; }
  .flip-card.visible { opacity: 1; transform: scale(1); }
  .polaroid-card { opacity: 0; transform: translateY(20px) rotate(var(--tilt,-2deg)); transition: opacity 0.6s ease, transform 0.4s ease, box-shadow 0.3s ease; }
  .polaroid-card.visible { opacity: 1; transform: rotate(var(--tilt,-2deg)) translateY(0); }
  .polaroid-card.visible:hover { transform: rotate(0deg) scale(1.06) translateY(-8px); }
`;
document.head.appendChild(styleReveal);

// =====================================================
//  PHOTO UPLOAD (add extra photos)
// =====================================================
function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);
  const grid = document.getElementById('polaroid-grid');
  const captions = [
    'A beautiful memory 🌸', 'Just the best 💕', 'Forever cherished ✨',
    'Pure happiness 🎀', 'My favourite 💖', 'Golden moment 🌟'
  ];

  files.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const card = document.createElement('div');
      card.className = 'polaroid-card';
      const src = e.target.result;
      card.innerHTML = `
        <img src="${src}" alt="Memory" class="polaroid-img" onclick="openLightboxSrc('${src}')" />
        <div class="polaroid-caption" contenteditable="true" data-placeholder="Your caption here...">
          ${captions[i % captions.length]}
        </div>
      `;
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      grid.appendChild(card);
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = `rotate(${(Math.random() * 6 - 3).toFixed(1)}deg) translateY(0)`;
        spawnFloatingHearts(3);
      }, 100 + i * 150);
    };
    reader.readAsDataURL(file);
  });
}

// =====================================================
//  LIGHTBOX
// =====================================================
function openLightbox(src, card) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  img.src = src;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (card) spawnFloatingHearts(5);
}

function openLightboxSrc(src) {
  openLightbox(src, null);
  spawnFloatingHearts(5);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// =====================================================
//  ENVELOPE
// =====================================================
function openEnvelope() {
  if (envelopeOpened) return;     // FIX: now correctly guards; starts as false
  envelopeOpened = true;

  const wrapper = document.getElementById('envelope-wrapper');
  const hint = document.getElementById('envelope-hint');
  const letter = document.getElementById('letter-section');

  wrapper.classList.add('opened');
  hint.style.opacity = '0';

  // Sparkle burst
  const rect = wrapper.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  spawnSparklesBurst(cx, cy);
  spawnSparklesBurst(cx - 30, cy + 20);
  spawnSparklesBurst(cx + 30, cy + 20);

  spawnFloatingHearts(8);

  setTimeout(() => {
    letter.classList.add('visible');
    letter.scrollIntoView({ behavior: 'smooth', block: 'start' });
    startTypewriterEffect();
  }, 900);
}

// =====================================================
//  TYPEWRITER EFFECT for Letter
// =====================================================
function startTypewriterEffect() {
  const bodyEl = document.getElementById('letter-body');
  if (!bodyEl) return;

  // Save and clear the text
  const fullText = bodyEl.innerText.trim();
  bodyEl.innerText = '';
  bodyEl.style.minHeight = '300px';

  // Glow pulse on paper
  const paper = document.querySelector('.letter-paper');
  if (paper) {
    paper.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1), 0 0 60px rgba(232,117,154,0.18)';
    setTimeout(() => {
      paper.style.transition = 'box-shadow 2s ease';
      paper.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1), 0 0 20px rgba(232,117,154,0.08)';
    }, 1500);
  }

  // Type character by character
  let i = 0;
  const speed = 18; // ms per char
  function typeNext() {
    if (i < fullText.length) {
      bodyEl.innerText += fullText[i];
      i++;
      // Scroll letter into view as it types
      bodyEl.scrollIntoView({ block: 'nearest' });
      setTimeout(typeNext, speed + (fullText[i - 1] === '\n' ? 250 : 0));
    } else {
      // Re-enable editing once done
      bodyEl.contentEditable = 'true';
    }
  }

  bodyEl.contentEditable = 'false';
  setTimeout(typeNext, 400);
}

// =====================================================
//  FLIP CARDS
// =====================================================
function flipCard(card) {
  card.classList.toggle('flipped');
  if (card.classList.contains('flipped')) {
    spawnFloatingHearts(3);
  }
}

// =====================================================
//  TIMELINE — Add Memory
// =====================================================
function addTimelineItem() {
  const timeline = document.getElementById('timeline');
  const emojis = ['🌟', '💫', '🎀', '✨', '💗', '🌺', '🎊', '🥰', '😂', '💜'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `
    <div class="timeline-dot">${emoji}</div>
    <div class="timeline-content">
      <div class="timeline-date" contenteditable="true" data-placeholder="When?">A Memory</div>
      <div class="timeline-title" contenteditable="true" data-placeholder="Memory title...">Our Moment Together ✨</div>
      <div class="timeline-text" contenteditable="true" data-placeholder="Write your memory here...">Click to write about this special memory...</div>
    </div>
  `;
  item.style.opacity = '0';
  item.style.transform = 'translateY(30px)';
  timeline.appendChild(item);

  setTimeout(() => {
    item.style.transition = 'all 0.6s ease';
    item.style.opacity = '1';
    item.style.transform = 'translateY(0)';
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    saveUserData();
  }, 50);
}

// =====================================================
//  FINAL SURPRISE
// =====================================================
function triggerFinalSurprise() {
  const btn = document.getElementById('final-btn');
  const msg = document.getElementById('final-message');

  btn.style.transform = 'scale(0.95)';
  btn.disabled = true;

  // Mega confetti
  triggerConfetti(150);

  // Floating hearts storm
  for (let i = 0; i < 5; i++) {
    setTimeout(() => spawnFloatingHearts(12), i * 400);
  }

  // Sparkle storm
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      spawnSparklesBurst(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight
      );
    }, i * 150);
  }

  // Show final message
  setTimeout(() => {
    msg.classList.add('visible');
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Screen glow pulse
    document.body.style.transition = 'background 0.5s ease';
    document.body.style.background = 'linear-gradient(135deg, #fce4ec, #ede9fe, #fce4ec)';
    setTimeout(() => {
      document.body.style.background = '';
    }, 2000);
  }, 800);

  // More confetti waves
  setTimeout(() => triggerConfetti(80), 1500);
  setTimeout(() => triggerConfetti(60), 3000);
}

// =====================================================
//  MUSIC — Web Audio API
//  Includes: Happy Birthday Avani song + ambient chords
// =====================================================

/**
 * Ensures AudioContext is created (requires user gesture first).
 */
function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Creates a convolver node simulating reverb.
 */
function createReverb(ctx) {
  const convolver = ctx.createConvolver();
  const length = ctx.sampleRate * 2.5;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8);
    }
  }
  convolver.buffer = impulse;
  return convolver;
}

/**
 * Play a single note using an oscillator.
 * @param {AudioContext} ctx
 * @param {AudioNode} dest  - destination node (reverb or master gain)
 * @param {number} freq     - frequency in Hz (0 = rest/silence)
 * @param {number} start    - start time (ctx.currentTime offset)
 * @param {number} duration - note duration in seconds
 * @param {number} volume   - gain 0..1
 * @param {string} type     - oscillator type
 */
function scheduleNote(ctx, dest, freq, start, duration, volume = 0.25, type = 'sine') {
  if (freq === 0) return; // rest

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

  // Envelope: attack / sustain / release
  const attack = 0.05;
  const release = Math.min(0.12, duration * 0.3);
  gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + attack);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime + start + duration - release);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

  osc.connect(gainNode);
  gainNode.connect(dest);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);

  activeOscillators.push(osc);
}

/**
 * "Happy Birthday to You" — pitched for Avani
 *
 * Standard melody in C major. Notes:
 * C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00,
 * A4=440.00, B4=493.88, C5=523.25, D5=587.33, E5=659.25,
 * F5=698.46, G5=783.99
 *
 * The song goes (simplified solfège → C key):
 * "Hap-py Birth-day to you" (×2), "Hap-py Birth-day dear A-va-ni", "Hap-py Birth-day to you!"
 */
function playHappyBirthdaySong(masterGain) {
  const ctx = audioCtx;
  const reverb = createReverb(ctx);
  reverb.connect(masterGain);

  // Frequencies
  const C4 = 261.63, D4 = 293.66, E4 = 329.63,
        F4 = 349.23, G4 = 392.00, A4 = 440.00,
        B4 = 493.88, C5 = 523.25, D5 = 587.33,
        E5 = 659.25, F5 = 698.46, G5 = 783.99;

  // Tempo: quarter note = 0.5s (120 BPM)
  const q = 0.5;   // quarter note
  const h = 1.0;   // half note
  const dq = 0.75; // dotted quarter
  const e = 0.25;  // eighth note
  const dh = 1.5;  // dotted half

  // [freq, duration] pairs
  const melody = [
    // "Hap-py Birth-day to you"
    [C4, e],  [C4, e],  [D4, q],  [C4, q],  [F4, q],  [E4, h],
    // "Hap-py Birth-day to you"
    [C4, e],  [C4, e],  [D4, q],  [C4, q],  [G4, q],  [F4, h],
    // "Hap-py Birth-day dear A-va-ni"
    [C4, e],  [C4, e],  [C5, q],  [A4, q],  [F4, q],  [E4, q],  [D4, h],
    // "Hap-py Birth-day to you!"
    [B4, e],  [B4, e],  [A4, q],  [F4, q],  [G4, q],  [F4, dh],
  ];

  // Harmony (lower octave, simpler chord tones) — adds richness
  const harmony = [
    [E4 / 2, e],  [E4 / 2, e],  [F4 / 2, q],  [E4 / 2, q],  [A4 / 2, q],  [G4 / 2, h],
    [E4 / 2, e],  [E4 / 2, e],  [F4 / 2, q],  [E4 / 2, q],  [C4 / 2, q],  [A4 / 2, h],
    [E4 / 2, e],  [E4 / 2, e],  [G4 / 2, q],  [E4 / 2, q],  [A4 / 2, q],  [G4 / 2, q],  [F4 / 2, h],
    [G4 / 2, e],  [G4 / 2, e],  [E4 / 2, q],  [A4 / 2, q],  [C4, q],      [A4 / 2, dh],
  ];

  // Schedule melody
  let t = 0.1; // slight lead-in
  melody.forEach(([freq, dur]) => {
    scheduleNote(ctx, reverb, freq, t, dur * 0.92, 0.28, 'sine');
    t += dur;
  });

  // Schedule harmony (softer, triangle wave)
  let th = 0.1;
  harmony.forEach(([freq, dur]) => {
    scheduleNote(ctx, reverb, freq, th, dur * 0.88, 0.10, 'triangle');
    th += dur;
  });

  // Total song duration
  const totalDuration = melody.reduce((acc, [, d]) => acc + d, 0);
  return totalDuration + 0.5; // extra half-second buffer
}

/**
 * Beautiful dreamy ambient chords (C major → Am → F → G).
 */
function playAmbientMusic(masterGain) {
  const chordSets = [
    [261.63, 329.63, 392.00, 523.25], // C major
    [220.00, 261.63, 329.63, 440.00], // A minor
    [174.61, 220.00, 261.63, 349.23], // F major
    [196.00, 246.94, 293.66, 392.00], // G major
  ];

  const reverb = createReverb(audioCtx);
  reverb.connect(masterGain);

  let chordIndex = 0;
  let oscillators = [];

  function playChord(notes) {
    oscillators.forEach(osc => {
      try { osc.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1); }
      catch (e) { }
      setTimeout(() => { try { osc.osc.stop(); } catch (e) { } }, 1500);
    });
    oscillators = [];

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.018 + (i === 0 ? 0.01 : 0), audioCtx.currentTime + 1.5);
      osc.connect(g);
      g.connect(reverb);
      osc.start();
      oscillators.push({ osc, gain: g });
    });
  }

  // Gentle melody on top
  const melodyNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33];
  let melodyIdx = 0;

  function playMelodyNote() {
    if (!musicPlaying) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(melodyNotes[melodyIdx % melodyNotes.length], audioCtx.currentTime);
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.1);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
    osc.connect(g);
    g.connect(reverb);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
    melodyIdx++;
    if (musicPlaying) setTimeout(playMelodyNote, 700 + Math.random() * 300);
  }

  playChord(chordSets[0]);
  setTimeout(playMelodyNote, 2000);

  chordIntervalId = setInterval(() => {
    if (!musicPlaying) { clearInterval(chordIntervalId); return; }
    chordIndex = (chordIndex + 1) % chordSets.length;
    playChord(chordSets[chordIndex]);
  }, 4000);
}

/**
 * Main toggle — cycles: OFF → Happy Birthday → Ambient chords → OFF
 */
function toggleMusic() {
  const btn = document.getElementById('music-btn');
  ensureAudioCtx();

  if (musicPlaying) {
    // Stop everything
    stopAllMusic();
    btn.textContent = '🎵';
    btn.classList.remove('playing');
    btn.title = 'Play Music';
    musicPlaying = false;
    musicMode = 'off';
  } else if (musicMode === 'off' || musicMode === 'ambient') {
    // Play Happy Birthday song first
    stopAllMusic();
    startMusicSession('birthday');
  } else if (musicMode === 'birthday') {
    // Switch to ambient
    stopAllMusic();
    startMusicSession('ambient');
  }
}

function startMusicSession(mode) {
  const btn = document.getElementById('music-btn');
  ensureAudioCtx();

  // Master gain
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 1.5);
  masterGain.connect(audioCtx.destination);
  bgmGain = masterGain;

  musicPlaying = true;
  musicMode = mode;

  if (mode === 'birthday') {
    btn.textContent = '🎂';
    btn.classList.add('playing');
    btn.title = 'Playing: Happy Birthday Avani 🎂 (tap to switch to ambient)';

    const songDuration = playHappyBirthdaySong(masterGain);

    // After song finishes, auto-loop it or switch to ambient
    hbSongTimeout = setTimeout(() => {
      if (musicPlaying) {
        stopAllMusic();
        startMusicSession('ambient'); // switch to ambient after song
      }
    }, songDuration * 1000);

  } else {
    btn.textContent = '🔊';
    btn.classList.add('playing');
    btn.title = 'Playing: Ambient Music 🎶 (tap to stop)';
    playAmbientMusic(masterGain);
  }
}

function stopAllMusic() {
  // Stop chord interval
  if (chordIntervalId) {
    clearInterval(chordIntervalId);
    chordIntervalId = null;
  }
  // Stop HB song timeout
  if (hbSongTimeout) {
    clearTimeout(hbSongTimeout);
    hbSongTimeout = null;
  }
  // Fade out master gain
  if (bgmGain && audioCtx) {
    try {
      bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, audioCtx.currentTime);
      bgmGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
    } catch (e) { }
  }
  // Stop all active oscillators
  activeOscillators.forEach(osc => {
    try { osc.stop(audioCtx ? audioCtx.currentTime + 0.8 : 0); } catch (e) { }
  });
  activeOscillators = [];
  bgmGain = null;
}

// FIX: loadMusicSettings was called but never defined
function loadMusicSettings() {
  // Restore saved music preference from localStorage if any
  const savedMode = localStorage.getItem('avani_music_mode');
  if (savedMode) {
    musicMode = savedMode;
  } else {
    musicMode = 'off';
  }
  // We don't auto-play on load — user must click to comply with browser autoplay policies
}

// =====================================================
//  EXTRA: Touch sparkles for mobile
// =====================================================
document.addEventListener('touchstart', e => {
  Array.from(e.touches).forEach(touch => {
    spawnMouseHeart(touch.clientX, touch.clientY);
  });
}, { passive: true });

// =====================================================
//  EXTRA: Polaroid click prevention (don't open lightbox if editing caption)
// =====================================================
document.addEventListener('click', e => {
  if (e.target.classList.contains('polaroid-caption')) {
    e.stopPropagation();
  }
});

// =====================================================
//  SCROLL PARALLAX on page 1
// =====================================================
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const blobs = document.querySelectorAll('.bg-blob');
  blobs.forEach((b, i) => {
    b.style.transform = `translate(0, ${scrollY * (0.1 + i * 0.05)}px)`;
  });
});

// =====================================================
//  RESIZE: Re-init canvas
// =====================================================
window.addEventListener('resize', () => {
  const canvas = document.getElementById('particle-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// =====================================================
//  HOVER: heart burst on CTA button
// =====================================================
const ctaBtn = document.getElementById('open-surprise-btn');
if (ctaBtn) {
  ctaBtn.addEventListener('mouseenter', () => {
    spawnFloatingHearts(4);
  });
}

// =====================================================
//  Auto birthday text for today's date
// =====================================================
const dateEl = document.getElementById('letter-date');
if (dateEl) {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('en-IN', options) + ' ✨';
}

// =====================================================
//  EDITOR TOOLS & AUTO-SAVE SYSTEM
// =====================================================

function toggleEditorPanel() {
  const panel = document.getElementById('editor-panel');
  if (panel) panel.classList.toggle('active');
}

// Close editor panel if clicked outside
document.addEventListener('click', (e) => {
  const panelContainer = document.getElementById('editor-panel-container');
  const panel = document.getElementById('editor-panel');
  if (panelContainer && !panelContainer.contains(e.target)) {
    if (panel && panel.classList.contains('active')) {
      panel.classList.remove('active');
    }
  }
});

function saveUserData() {
  const data = {};

  // 1. Polaroid Captions
  data.polaroidCaptions = [];
  document.querySelectorAll('.polaroid-caption').forEach(el => {
    data.polaroidCaptions.push(el.innerHTML);
  });

  // 2. Timeline Items
  data.timelineItems = [];
  document.querySelectorAll('.timeline-item').forEach(item => {
    const dotEl = item.querySelector('.timeline-dot');
    const dateEl = item.querySelector('.timeline-date');
    const titleEl = item.querySelector('.timeline-title');
    const textEl = item.querySelector('.timeline-text');

    if (dotEl && dateEl && titleEl && textEl) {
      data.timelineItems.push({
        dot: dotEl.textContent,
        date: dateEl.innerHTML,
        title: titleEl.innerHTML,
        text: textEl.innerHTML
      });
    }
  });

  // 3. Note Card Texts
  data.noteTexts = [];
  document.querySelectorAll('.note-card .note-text').forEach(el => {
    data.noteTexts.push(el.innerHTML);
  });

  // 4. Letter Fields (handling typewriter state)
  const letterBodyEl = document.getElementById('letter-body');
  let letterBodyContent = '';

  if (letterBodyEl) {
    if (letterBodyEl.contentEditable === 'true') {
      letterBodyContent = letterBodyEl.innerHTML;
    } else {
      // If currently typing, fetch from existing localStorage to avoid saving partial text
      const raw = localStorage.getItem('avani_bday_surprise_data');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          letterBodyContent = (parsed.letter && parsed.letter.body) || letterBodyEl.innerHTML;
        } catch (e) {
          letterBodyContent = letterBodyEl.innerHTML;
        }
      } else {
        letterBodyContent = letterBodyEl.innerHTML;
      }
    }
  }

  data.letter = {
    salutation: document.querySelector('.letter-salutation') ? document.querySelector('.letter-salutation').innerHTML : '',
    body: letterBodyContent,
    closing: document.querySelector('.letter-closing') ? document.querySelector('.letter-closing').innerHTML : '',
    signature: document.querySelector('.letter-signature') ? document.querySelector('.letter-signature').innerHTML : ''
  };

  localStorage.setItem('avani_bday_surprise_data', JSON.stringify(data));
  localStorage.setItem('avani_music_mode', musicMode);
}

function loadUserData() {
  const raw = localStorage.getItem('avani_bday_surprise_data');
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    // 1. Polaroid Captions
    if (data.polaroidCaptions) {
      document.querySelectorAll('.polaroid-caption').forEach((el, idx) => {
        if (data.polaroidCaptions[idx] !== undefined) {
          el.innerHTML = data.polaroidCaptions[idx];
        }
      });
    }

    // 2. Timeline Items
    if (data.timelineItems && data.timelineItems.length > 0) {
      const timeline = document.getElementById('timeline');
      if (timeline) {
        timeline.innerHTML = ''; // Clear default timeline items
        data.timelineItems.forEach(item => {
          const div = document.createElement('div');
          div.className = 'timeline-item';
          div.innerHTML = `
            <div class="timeline-dot">${item.dot}</div>
            <div class="timeline-content">
              <div class="timeline-date" contenteditable="true" data-placeholder="When?">${item.date}</div>
              <div class="timeline-title" contenteditable="true" data-placeholder="Memory title...">${item.title}</div>
              <div class="timeline-text" contenteditable="true" data-placeholder="Write your memory here...">${item.text}</div>
            </div>
          `;
          timeline.appendChild(div);
        });
      }
    }

    // 3. Note Card Texts
    if (data.noteTexts) {
      document.querySelectorAll('.note-card .note-text').forEach((el, idx) => {
        if (data.noteTexts[idx] !== undefined) {
          el.innerHTML = data.noteTexts[idx];
        }
      });
    }

    // 4. Letter Fields
    if (data.letter) {
      const salutation = document.querySelector('.letter-salutation');
      if (salutation && data.letter.salutation) salutation.innerHTML = data.letter.salutation;

      const body = document.getElementById('letter-body');
      if (body && data.letter.body) body.innerHTML = data.letter.body;

      const closing = document.querySelector('.letter-closing');
      if (closing && data.letter.closing) closing.innerHTML = data.letter.closing;

      const signature = document.querySelector('.letter-signature');
      if (signature && data.letter.signature) signature.innerHTML = data.letter.signature;
    }
  } catch (e) {
    console.error('Error loading saved birthday site data:', e);
  }
}

function resetEditorData() {
  if (confirm('Are you sure you want to reset all text edits back to their default values? 💕')) {
    localStorage.removeItem('avani_bday_surprise_data');
    localStorage.removeItem('avani_music_mode');
    alert('Reset! The page will now reload.');
    window.location.reload();
  }
}
