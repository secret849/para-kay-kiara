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
const musicMiniStatus = $('music-mini-status');
const musicMiniProgress = $('music-mini-progress');

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
  if (playing) {
    musicMiniStatus.textContent = 'Now playing ♡';
    musicDock.classList.remove('music-missing');
  } else if (!musicDock.classList.contains('music-missing')) {
    musicMiniStatus.textContent = 'Tap to play';
  }
}
function syncMusicProgress() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  musicProgress.disabled = duration <= 0;
  musicProgress.value = duration ? String(Math.round(audio.currentTime / duration * 1000)) : '0';
  musicCurrent.textContent = musicTime(audio.currentTime);
  musicDuration.textContent = musicTime(duration);
  musicMiniProgress.style.transform = 'scaleX(' + (duration ? Math.min(1, audio.currentTime / duration) : 0) + ')';
}
async function toggleMusic() {
  if (!audio.paused) { audio.pause(); return; }
  musicStatus.textContent = 'Loading audio…';
  try { await audio.play(); musicStatus.textContent = 'Enjoy listening ♡'; }
  catch {
    openMusicPanel(true);
    musicStatus.textContent = 'Audio file is not on this website. Choose your MP3 below for local preview. A hosted song needs an audio file at music/love.mp3.';
    musicDock.classList.add('music-missing');
    musicMiniStatus.textContent = 'Audio file missing';
  }
}
musicToggle.addEventListener('click', toggleMusic);
musicExpand.addEventListener('click', () => openMusicPanel(musicPanel.hidden));
musicClose.addEventListener('click', () => openMusicPanel(false));
audio.addEventListener('play', syncMusicButton);
audio.addEventListener('pause', syncMusicButton);
audio.addEventListener('ended', syncMusicButton);
audio.addEventListener('loadedmetadata', () => {
  syncMusicProgress();
  musicStatus.textContent = 'Ready when you are ♡';
  musicDock.classList.remove('music-missing');
  musicMiniStatus.textContent = 'Ready to play';
});
audio.addEventListener('timeupdate', syncMusicProgress);
audio.addEventListener('durationchange', syncMusicProgress);
audio.addEventListener('error', () => {
  if (!audio.error) return;
  musicStatus.textContent = 'The website cannot find music/love.mp3. Select your MP3 below to play it on this device.';
  musicDock.classList.add('music-missing');
  syncMusicButton();
  musicMiniStatus.textContent = 'Audio file missing';
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
  musicDock.classList.remove('music-missing');
  musicMiniStatus.textContent = 'Loading your MP3';
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

  const { width, height } = heartCanvas;
  const phrase = 'I love you';
  ctx.font = "600 7px 'Jost', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const distance = Math.max(21, ctx.measureText(phrase).width + 2);
  const inks = ['#d58e9b', '#c97d92', '#f0bac4'];
  const strokes = [];

  // Three concentric paths made entirely out of the handwritten message.
  for (const scale of [1, .86, .73]) {
    let previous = null, travelled = 0;
    for (let i = 0; i <= 800; i++) {
      const t = i / 800 * Math.PI * 2;
      const x = width / 2 + 16 * Math.sin(t) ** 3 * 4.65 * scale;
      const y = height / 2 + 3 - (13 * Math.cos(t)
        - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t)
        - Math.cos(4 * t)) * 4.65 * scale;
      if (previous) travelled += Math.hypot(x - previous.x, y - previous.y);
      if (travelled >= distance) {
        strokes.push({ x, y, color: inks[strokes.length % inks.length] });
        travelled = 0;
      }
      previous = { x, y };
    }
  }

  heartCanvas.classList.add('visible');
  const render = (count, progress) => {
    ctx.clearRect(0, 0, width, height);
    // A tiny glowing pen tip traces the phrase as the heart takes shape.
    for (let i = 0; i < count; i++) {
      const p = strokes[i];
      ctx.fillStyle = p.color;
      ctx.fillText(phrase, p.x, p.y);
    }
    if (count > 0 && progress < 1) {
      const tip = strokes[count - 1];
      ctx.save();
      ctx.shadowColor = '#ffb9d3';
      ctx.shadowBlur = 11;
      ctx.fillStyle = 'rgba(255,228,238,.95)';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  if (reducedMotion) {
    render(strokes.length, 1);
    return;
  }
  let started = null;
  function frame(now) {
    if (appState !== 'letter') return;
    if (started === null) started = now;
    const progress = Math.min(1, (now - started) / 2900);
    const count = Math.min(strokes.length, Math.ceil(progress * strokes.length));
    render(count, progress);
    if (progress < 1) drawingRAF = requestAnimationFrame(frame);
  }
  drawingRAF = requestAnimationFrame(frame);
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
  window.BouquetGarden?.stop();
  envelopeStage.hidden = false;
  appState = 'envelope';
}

async function openEnvelope() {
  if (appState !== 'envelope') return;

  appState = 'opening';
  envelopeStage.classList.add('opening');

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
  window.BouquetGarden?.restart();
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
