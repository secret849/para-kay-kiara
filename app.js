'use strict';

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readCssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
    .replace(/^["']|["']$/g, '');
}

const herName = readCssVar('--her-name') || 'You';
const senderName = readCssVar('--sender-name') || 'A quiet admirer';
const secretMessage = 'Libre kita McDo once na malaman mo kung sino ako.';
const ntfyTopic = 'CHANGE-THIS-TO-SOMETHING-ONLY-YOU-KNOW';

const bouquetStage = $('bouquet-stage');
const bouquetBtn = $('bouquet-btn');

const envelopeStage = $('envelope-stage');
const letterStage = $('letter-stage');
const letterCard = $('letter-card');
const closeLetterBtn = $('close-letter');

const greeting = $('greeting');
const signature = $('signature');
const secretText = $('secret-text');
const secretBtn = $('secret-btn');
const secretMessageEl = $('secret-message');
const skipTypeBtn = $('skip-type');
const endingBtn = $('ending-btn');
const endingScene = $('ending-scene');
const endingClose = $('ending-close');
const restartBtn = $('restart-btn');

const heartCanvas = $('heart-canvas');
const petalsContainer = $('petals');
const heartsLayer = $('hearts-layer');
const endingHearts = $('ending-hearts');

const musicDock = $('music-dock');
const musicToggle = $('music-toggle');
const musicExpand = $('music-expand');
const musicPanel = $('music-panel');
const musicClose = $('music-close');
const audio = $('music-audio');
const musicProgress = $('music-progress');
const musicCurrent = $('music-current');
const musicDuration = $('music-duration');
const musicVolume = $('music-volume');
const musicMute = $('music-mute');
const musicLoop = $('music-loop');
const musicStatus = $('music-status');
const musicFile = $('music-file');

greeting.textContent = herName ? `To ${herName}` : 'To you';
signature.textContent = senderName;
secretText.textContent = secretMessage;

const originalParagraphs = Array.from(document.querySelectorAll('#letter-body p')).map(p => p.textContent.trim());
const letterParagraphNodes = Array.from(document.querySelectorAll('#letter-body p'));

let appState = 'bouquet';
let notified = false;
let typingRAF = 0;
let drawingRAF = 0;
let typingDone = false;
let soundContext = null;
let temporaryUrl = null;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, reducedMotion ? 0 : ms));
}
function musicTime(s) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  s = Math.floor(s);
  return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
function openMusicPanel(open) {
  musicPanel.hidden = !open;
  musicExpand.setAttribute('aria-expanded', String(open));
  musicExpand.setAttribute('aria-label', open ? 'Hide music controls' : 'Open music controls');
}
function syncMusicButton() {
  const playing = !audio.paused && !audio.ended;
  musicDock.classList.toggle('is-playing', playing);
  musicToggle.textContent = playing ? 'Ⅱ' : '▶';
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
}
function syncMusicProgress() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  musicProgress.disabled = duration <= 0;
  musicProgress.value = duration ? String(Math.round(audio.currentTime / duration * 1000)) : '0';
  musicCurrent.textContent = musicTime(audio.currentTime);
  musicDuration.textContent = musicTime(duration);
}
async function toggleMusic() {
  if (!audio.paused) { audio.pause(); return; }
  musicStatus.textContent = 'Loading audio…';
  try { await audio.play(); musicStatus.textContent = 'Enjoy listening ♡'; }
  catch {
    openMusicPanel(true);
    musicStatus.textContent = 'Song unavailable. Add music/love.mp3 to the repository, or choose a local audio file.';
  }
}
musicToggle.addEventListener('click', toggleMusic);
musicExpand.addEventListener('click', () => openMusicPanel(musicPanel.hidden));
musicClose.addEventListener('click', () => openMusicPanel(false));
audio.addEventListener('play', syncMusicButton);
audio.addEventListener('pause', syncMusicButton);
audio.addEventListener('ended', syncMusicButton);
audio.addEventListener('loadedmetadata', () => { syncMusicProgress(); musicStatus.textContent='Ready when you are ♡'; });
audio.addEventListener('timeupdate', syncMusicProgress);
audio.addEventListener('durationchange', syncMusicProgress);
audio.addEventListener('error', () => {
  if (!audio.error) return;
  musicStatus.textContent = 'Audio not found. Add music/love.mp3 or select an audio file for preview.';
  syncMusicButton();
});
musicProgress.addEventListener('input', () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(musicProgress.value)/1000*audio.duration;
});
musicVolume.addEventListener('input', () => {
  audio.volume=Number(musicVolume.value);
  audio.muted=false;
  musicMute.textContent=audio.volume ? '♫' : '×';
  musicMute.setAttribute('aria-pressed','false');
  try { localStorage.setItem('letterMusicVolume', musicVolume.value); } catch {}
});
musicMute.addEventListener('click', () => {
  audio.muted=!audio.muted;
  musicMute.textContent=audio.muted ? '×' : '♫';
  musicMute.setAttribute('aria-label',audio.muted?'Unmute music':'Mute music');
  musicMute.setAttribute('aria-pressed',String(audio.muted));
});
musicLoop.addEventListener('click', () => {
  audio.loop=!audio.loop;
  musicLoop.setAttribute('aria-pressed', String(audio.loop));
});
musicFile.addEventListener('change', () => {
  const file=musicFile.files?.[0];
  if(!file) return;
  if(!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)) {
    musicStatus.textContent='Please select an audio file.';
    return;
  }
  audio.pause();
  if(temporaryUrl) URL.revokeObjectURL(temporaryUrl);
  temporaryUrl=URL.createObjectURL(file);
  audio.src=temporaryUrl;
  audio.load();
  musicStatus.textContent='Local preview: '+file.name;
  toggleMusic();
});
window.addEventListener('pagehide',()=>{ if(temporaryUrl) URL.revokeObjectURL(temporaryUrl); });
try {
  const saved=localStorage.getItem('letterMusicVolume');
  if(saved!==null && Number(saved)>=0 && Number(saved)<=1) musicVolume.value=String(Number(saved));
} catch {}
audio.volume=Number(musicVolume.value);
syncMusicButton();
syncMusicProgress();

function playOpenSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!soundContext) soundContext = new AudioContextClass();
    if (soundContext.state === 'suspended') soundContext.resume();

    const now = soundContext.currentTime;
    const notes = [587.33, 783.99, 987.77];

    notes.forEach((freq, index) => {
      const osc = soundContext.createOscillator();
      const gain = soundContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, now + index * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.015 + index * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45 + index * 0.075);

      osc.connect(gain);
      gain.connect(soundContext.destination);

      osc.start(now + index * 0.075);
      osc.stop(now + 0.5 + index * 0.075);
    });
  } catch (err) {
    /* sound is optional */
  }
}

function notifyOpenOnce() {
  if (notified) return;
  if (!ntfyTopic || ntfyTopic === 'CHANGE-THIS-TO-SOMETHING-ONLY-YOU-KNOW') return;

  notified = true;
  fetch(`https://ntfy.sh/${encodeURIComponent(ntfyTopic)}`, {
    method: 'POST',
    body: 'She opened the envelope 💌'
  }).catch(() => {});
}

function spawnHeartBurst() {
  if (reducedMotion) return;

  const rect = envelopeStage.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2 - 40;
  const hearts = ['❤️', '💖', '💘', '💕'];

  for (let i = 0; i < 24; i++) {
    const heart = document.createElement('span');
    const angle = (Math.PI * 2 * i) / 24;
    const radius = 80 + Math.random() * 165;

    heart.className = 'heart-burst';
    heart.textContent = hearts[i % hearts.length];
    heart.style.left = centerX + 'px';
    heart.style.top = centerY + 'px';
    heart.style.fontSize = (18 + Math.random() * 18) + 'px';
    heart.style.setProperty('--dx', (Math.cos(angle) * radius) + 'px');
    heart.style.setProperty('--dy', (Math.sin(angle) * radius - 80) + 'px');
    heart.style.setProperty('--spin', ((Math.random() * 120) - 60) + 'deg');

    heartsLayer.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  }
}

function spawnEndingHearts(count = 22) {
  if (reducedMotion) return;

  const emojis = ['❤️', '💖', '💘', '💕'];
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart-ending';
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    heart.style.left = (Math.random() * window.innerWidth) + 'px';
    heart.style.top = (window.innerHeight + 10) + 'px';
    heart.style.fontSize = (18 + Math.random() * 20) + 'px';
    heart.style.setProperty('--drift', ((Math.random() * 140) - 70) + 'px');

    endingHearts.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  }
}

function drawHeart() {
  cancelAnimationFrame(drawingRAF);
  const ctx = heartCanvas.getContext('2d');
  if (!ctx) return;

  const w = heartCanvas.width;
  const h = heartCanvas.height;
  const cx = w / 2;
  const cy = h / 2 + 14;
  const unit = 4.6;
  const colors = ['#C7828F', '#D9A5AC', '#B96F7D'];
  const pointsPerLayer = 70;

  const points = [];
  for (let s = 0; s < 6; s++) {
    const scaleFactor = (11 + s) / 16;
    for (let i = 0; i < pointsPerLayer; i++) {
      const angle = (i * Math.PI * 2) / pointsPerLayer;
      const x = 16 * Math.pow(Math.sin(angle), 3) * scaleFactor;
      const y =
        (13 * Math.cos(angle) -
          5 * Math.cos(2 * angle) -
          2 * Math.cos(3 * angle) -
          Math.cos(4 * angle)) * scaleFactor;

      points.push({ x: cx + x * unit, y: cy - y * unit });
    }
  }

  ctx.clearRect(0, 0, w, h);
  heartCanvas.classList.add('visible');
  ctx.font = "7px 'Jost', sans-serif";
  ctx.textAlign = 'center';

  if (reducedMotion) {
    points.forEach((p, i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillText('I love you', p.x, p.y);
      }
    });
    return;
  }

  let index = 0;
  function step() {
    if (appState !== 'letter') return;

    for (let n = 0; n < 10 && index < points.length; n++, index++) {
      const p = points[index];
      if (index % 2 === 0) {
        ctx.save();
        ctx.fillStyle = colors[index % colors.length];
        ctx.translate(p.x, p.y);
        ctx.rotate((Math.random() - 0.5) * 0.45);
        ctx.fillText('I love you', 0, 0);
        ctx.restore();
      }
    }

    if (index < points.length) {
      drawingRAF = requestAnimationFrame(step);
    }
  }
  drawingRAF = requestAnimationFrame(step);
}

function clearTypewriter() {
  letterParagraphNodes.forEach(p => p.textContent = '');
}

function showFullLetter() {
  cancelAnimationFrame(typingRAF);
  letterParagraphNodes.forEach((p, i) => {
    p.textContent = originalParagraphs[i];
  });
  skipTypeBtn.hidden = true;
  typingDone = true;
  endingBtn.hidden = false;
}

function typeLetter() {
  cancelAnimationFrame(typingRAF);
  typingDone = false;
  endingBtn.hidden = true;

  if (reducedMotion) {
    showFullLetter();
    return;
  }

  clearTypewriter();
  skipTypeBtn.hidden = false;

  const totalChars = originalParagraphs.reduce((sum, text) => sum + text.length, 0);
  let startTime = null;
  let lastCount = -1;

  function renderByCount(count) {
    let remaining = count;

    letterParagraphNodes.forEach((node, i) => {
      const fullText = originalParagraphs[i];
      const visibleCount = Math.max(0, Math.min(fullText.length, remaining));
      let content = fullText.slice(0, visibleCount);
      const isCurrent = visibleCount < fullText.length && remaining >= 0;

      node.innerHTML = '';
      node.append(document.createTextNode(content));

      if (isCurrent && content.length > 0) {
        const caret = document.createElement('span');
        caret.className = 'typing-caret';
        caret.textContent = '|';
        node.appendChild(caret);
      }

      remaining -= fullText.length;
    });
  }

  function frame(now) {
    if (appState !== 'letter') return;
    if (!startTime) startTime = now;

    const elapsed = now - startTime;
    const count = Math.min(totalChars, Math.floor(elapsed * 0.095));

    if (count !== lastCount) {
      renderByCount(count);
      lastCount = count;
    }

    if (count < totalChars) {
      typingRAF = requestAnimationFrame(frame);
    } else {
      showFullLetter();
    }
  }

  typingRAF = requestAnimationFrame(frame);
}

async function goToEnvelope() {
  if (appState !== 'bouquet') return;
  appState = 'transition';
  bouquetStage.classList.add('leaving');
  await wait(420);
  bouquetStage.hidden = true;
  envelopeStage.hidden = false;
  appState = 'envelope';
}

async function openEnvelope() {
  if (appState !== 'envelope') return;

  appState = 'opening';
  envelopeStage.classList.add('opening');

  playOpenSound();
  spawnHeartBurst();
  notifyOpenOnce();

  await wait(760);

  envelopeStage.classList.remove('opening');
  envelopeStage.classList.add('open');
  envelopeStage.hidden = true;

  letterStage.hidden = false;
  letterStage.classList.add('visible');
  appState = 'letter';

  drawHeart();
  typeLetter();
}

async function closeLetterToEnvelope() {
  if (appState !== 'letter') return;

  appState = 'closing';

  cancelAnimationFrame(typingRAF);
  cancelAnimationFrame(drawingRAF);

  letterStage.classList.remove('visible');
  letterStage.classList.add('hiding');

  await wait(360);

  letterStage.hidden = true;
  letterStage.classList.remove('hiding');

  heartCanvas.classList.remove('visible');

  envelopeStage.hidden = false;
  envelopeStage.classList.add('open');
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  envelopeStage.classList.remove('open', 'opening');
  await wait(820);
  appState = 'envelope';
}

function openEnding() {
  endingScene.classList.add('visible');
  endingScene.setAttribute('aria-hidden', 'false');
  spawnEndingHearts(28);
  setTimeout(() => spawnEndingHearts(16), reducedMotion ? 0 : 500);
}

function closeEnding() {
  endingScene.classList.remove('visible');
  endingScene.setAttribute('aria-hidden', 'true');
}

async function restartExperience() {
  closeEnding();

  cancelAnimationFrame(typingRAF);
  cancelAnimationFrame(drawingRAF);

  letterStage.hidden = true;
  letterStage.classList.remove('visible', 'hiding');
  envelopeStage.hidden = true;
  envelopeStage.classList.remove('open', 'opening');

  heartCanvas.classList.remove('visible');
  secretMessageEl.classList.remove('shown');
  secretBtn.classList.remove('hidden');
  skipTypeBtn.hidden = true;
  endingBtn.hidden = true;

  bouquetStage.hidden = false;
  bouquetStage.classList.remove('leaving');
  appState = 'bouquet';
}

bouquetBtn.addEventListener('click', goToEnvelope);
envelopeStage.addEventListener('click', openEnvelope);

closeLetterBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeLetterToEnvelope();
});

letterCard.addEventListener('click', (e) => {
  if (e.target.closest('button, a')) return;
  closeLetterToEnvelope();
});

skipTypeBtn.addEventListener('click', showFullLetter);

secretBtn.addEventListener('click', () => {
  secretMessageEl.classList.add('shown');
  secretBtn.classList.add('hidden');
});

endingBtn.addEventListener('click', openEnding);
endingClose.addEventListener('click', closeEnding);
restartBtn.addEventListener('click', restartExperience);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (endingScene.classList.contains('visible')) {
      closeEnding();
      return;
    }
    if (appState === 'letter') {
      closeLetterToEnvelope();
    }
  }
});

const petalColors = ['#C7828F', '#E3B6BC', '#8A9A7E', '#D9A5AC'];

function spawnPetal() {
  if (reducedMotion) return;
  if (document.hidden) return;
  if (petalsContainer.childElementCount > 12) return;

  const petal = document.createElement('div');
  petal.className = 'petal';

  const size = 10 + Math.random() * 10;
  const left = Math.random() * 100;
  const duration = 7 + Math.random() * 6;
  const drift = Math.random() * 160 - 80;
  const spin = Math.random() * 300 - 150;
  const color = petalColors[Math.floor(Math.random() * petalColors.length)];

  petal.style.left = left + 'vw';
  petal.style.width = size + 'px';
  petal.style.height = size + 'px';
  petal.style.setProperty('--drift', drift + 'px');
  petal.style.setProperty('--spin', spin + 'deg');
  petal.style.animationDuration = duration + 's';

  petal.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C7 2 4 6 4 10c0 5 4 9 8 12 4-3 8-7 8-12 0-4-3-8-8-8z" fill="${color}"/></svg>`;

  petal.addEventListener('animationend', () => petal.remove(), { once: true });
  petalsContainer.appendChild(petal);
}

for (let i = 0; i < 5; i++) {
  setTimeout(spawnPetal, i * 350);
}
setInterval(spawnPetal, 1200);
