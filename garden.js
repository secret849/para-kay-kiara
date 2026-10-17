/* Animated bouquet inspired by an interactive flower garden.
   Everything is drawn locally with Canvas 2D. No external libraries. */
(() => {
  'use strict';

  const canvas = document.getElementById('bouquet-canvas');
  const scene = document.getElementById('bouquet-stage');
  if (!canvas || !scene) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 420, H = 440;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base = { x: 212, y: 400 };
  const flowers = [
    { x: 82,  y: 184, bend: 112, size: 26, kind: 'rose',  color: '#e978a7', dark: '#9c3f79', delay: .60 },
    { x: 134, y: 119, bend: 153, size: 25, kind: 'tulip', color: '#ffce4e', dark: '#d38a27', delay: .85 },
    { x: 203, y: 90,  bend: 193, size: 29, kind: 'rose',  color: '#ff8dad', dark: '#bf4471', delay: 1.0 },
    { x: 279, y: 119, bend: 259, size: 27, kind: 'tulip', color: '#ffe174', dark: '#e5a83c', delay: 1.15 },
    { x: 338, y: 187, bend: 302, size: 25, kind: 'rose',  color: '#e34c91', dark: '#922c70', delay: 1.40 },
    { x: 146, y: 221, bend: 151, size: 24, kind: 'tulip', color: '#ff8eae', dark: '#b74477', delay: 1.55 },
    { x: 269, y: 208, bend: 268, size: 23, kind: 'rose',  color: '#ffbf49', dark: '#db7537', delay: 1.65 },
    { x: 208, y: 181, bend: 200, size: 22, kind: 'tulip', color: '#ff649d', dark: '#c43d7e', delay: 1.75 }
  ];

  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = t => 1 - Math.pow(1 - clamp(t), 3);
  const point = (f, t) => {
    const a = 1 - t;
    return {
      x: a * a * base.x + 2 * a * t * f.bend + t * t * f.x,
      y: a * a * base.y + 2 * a * t * ((base.y + f.y) * .46) + t * t * f.y
    };
  };

  function leaf(x, y, angle, length, progress, tone) {
    if (progress <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(ease(progress), ease(progress));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-length * .28, -length * .24, -length * .58, -length * .74, -length * .25, -length);
    ctx.bezierCurveTo(length * .18, -length * .63, length * .16, -length * .29, 0, 0);
    ctx.fillStyle = tone;
    ctx.shadowColor = '#4baf80';
    ctx.shadowBlur = 7;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(177,237,178,.55)';
    ctx.lineWidth = .7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-length * .12, -length * .56, -length * .25, -length);
    ctx.stroke();
    ctx.restore();
  }

  function stem(f, index, time) {
    const growth = ease((time - .22 - index * .11) / 1.35);
    if (growth <= 0) return;
    ctx.beginPath();
    const origin = point(f, 0);
    ctx.moveTo(origin.x, origin.y);
    for (let i = 1; i <= 26; i++) {
      const p = point(f, growth * i / 26);
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = '#4b8654';
    ctx.lineWidth = 4.3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#4b9a59';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    [.43, .65].forEach((t, n) => {
      const p = point(f, t);
      const left = (index + n) % 2 === 0;
      leaf(p.x, p.y, left ? -.92 : .95, n === 0 ? 33 : 26,
        clamp((growth - t) * 5), left ? '#477a4f' : '#78a766');
    });
  }

  function petal(radius, color, length = 1) {
    const gradient = ctx.createLinearGradient(0, -radius * 1.7, 0, 4);
    gradient.addColorStop(0, '#fff2bb');
    gradient.addColorStop(.24, color);
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-radius * .55, -radius * .34,
      -radius * .80, -radius * length, 0, -radius * length * 1.46);
    ctx.bezierCurveTo(radius * .72, -radius * length,
      radius * .50, -radius * .35, 0, 3);
    ctx.fill();
  }

  function rose(f) {
    const s = f.size;
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 4);
      ctx.translate(0, -s * .18);
      petal(s * .77, i % 2 ? f.dark : f.color, 1.05);
      ctx.restore();
    }
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 3 + .22);
      ctx.translate(0, -s * .04);
      petal(s * .49, f.color, .81);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, s * .29, 0, Math.PI * 2);
    ctx.fillStyle = f.dark;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-1, 0, s * .14, -Math.PI * .2, Math.PI * 1.5);
    ctx.strokeStyle = '#ffd3df';
    ctx.lineWidth = 2.1;
    ctx.stroke();
  }

  function tulip(f) {
    const s = f.size;
    ctx.save();
    ctx.translate(0, 4);
    const g = ctx.createLinearGradient(-s, -s * 1.7, s, s * .3);
    g.addColorStop(0, '#fff3af');
    g.addColorStop(.48, f.color);
    g.addColorStop(1, f.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-s * .7, 0);
    ctx.bezierCurveTo(-s * .95, -s * .7, -s * .64, -s * 1.5, -s * .31, -s * 1.24);
    ctx.lineTo(0, -s * 1.02);
    ctx.lineTo(s * .33, -s * 1.28);
    ctx.bezierCurveTo(s * .78, -s * 1.46, s * .94, -s * .65, s * .69, 0);
    ctx.quadraticCurveTo(0, s * .38, -s * .7, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,248,198,.48)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-s * .25, -s * .94);
    ctx.quadraticCurveTo(-s * .18, -s * .35, -s * .08, s * .06);
    ctx.moveTo(s * .31, -s * 1.04);
    ctx.quadraticCurveTo(s * .25, -s * .34, s * .12, s * .06);
    ctx.stroke();
    ctx.restore();
  }

  function blossom(f, index, time) {
    const growth = ease((time - f.delay - .25) / 1.18);
    if (growth <= 0) return;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(Math.sin(time * 1.2 + index) * .045);
    ctx.scale(growth, growth);
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 17;
    if (f.kind === 'tulip') tulip(f);
    else rose(f);
    ctx.restore();
  }

  function wrapBouquet(time) {
    const visibility = ease((time - 1.4) / 1.0);
    if (!visibility) return;
    ctx.save();
    ctx.globalAlpha = visibility;
    // Translucent pink craft paper below the flowers.
    const paper = ctx.createLinearGradient(93, 258, 315, 414);
    paper.addColorStop(0, 'rgba(255,216,225,.93)');
    paper.addColorStop(.55, 'rgba(230,159,188,.95)');
    paper.addColorStop(1, '#a95b7f');
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.moveTo(116, 256);
    ctx.quadraticCurveTo(192, 298, 304, 254);
    ctx.lineTo(237, 416);
    ctx.quadraticCurveTo(207, 427, 190, 413);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,244,237,.48)';
    ctx.beginPath();
    ctx.moveTo(108, 265);
    ctx.lineTo(206, 336);
    ctx.lineTo(203, 408);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(170,91,119,.34)';
    ctx.beginPath();
    ctx.moveTo(308, 260);
    ctx.lineTo(207, 337);
    ctx.lineTo(220, 410);
    ctx.closePath();
    ctx.fill();

    // Satin tie and trailing ribbons.
    ctx.shadowColor = '#8d4567';
    ctx.shadowBlur = 9;
    ctx.fillStyle = '#e978a7';
    ctx.beginPath();
    ctx.ellipse(200, 345, 35, 10, -.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(231, 345, 34, 11, .22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bd4e82';
    ctx.beginPath();
    ctx.moveTo(211, 350);
    ctx.quadraticCurveTo(195, 380, 182, 399);
    ctx.lineTo(205, 391);
    ctx.quadraticCurveTo(223, 362, 220, 348);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(221, 349);
    ctx.quadraticCurveTo(242, 382, 253, 391);
    ctx.lineTo(234, 395);
    ctx.quadraticCurveTo(209, 366, 212, 349);
    ctx.fill();
    ctx.fillStyle = '#f6b6c8';
    ctx.beginPath();
    ctx.arc(213, 345, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const stars = Array.from({ length: 24 }, (_, i) => ({
    x: 19 + (i * 73 % 390),
    y: 23 + (i * 97 % 330),
    radius: i % 5 === 0 ? 1.6 : .8,
    phase: i * 1.24
  }));
  function glowAndStars(time) {
    const glow = ctx.createRadialGradient(210, 193, 18, 210, 193, 230);
    glow.addColorStop(0, 'rgba(231,116,160,.10)');
    glow.addColorStop(1, 'rgba(231,116,160,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    for (const star of stars) {
      ctx.globalAlpha = .18 + .44 * (1 + Math.sin(time * 2.1 + star.phase)) / 2;
      ctx.fillStyle = '#f8dcb6';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  let frameId = 0, started = null, lastPaint = 0;
  function paint(time) {
    ctx.clearRect(0, 0, W, H);
    glowAndStars(time);
    flowers.forEach((f, i) => stem(f, i, time));
    flowers.forEach((f, i) => blossom(f, i, time));
    wrapBouquet(time);
  }

  function frame(now) {
    if (scene.hidden || document.hidden) { frameId = 0; return; }
    if (started === null) started = now;
    if (now - lastPaint >= 33) {
      paint(Math.min(6, (now - started) / 1000));
      lastPaint = now;
    }
    // Stop after the reveal. Canvas remains visible without eating CPU.
    if (now - started < 5800) frameId = requestAnimationFrame(frame);
    else frameId = 0;
  }

  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
  function restart() {
    stop();
    started = null;
    lastPaint = 0;
    if (reduced) paint(6);
    else frameId = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!scene.hidden && !frameId) {
      if (started === null) restart();
      else paint(6);
    }
  });
  window.BouquetGarden = { restart, stop };
  restart();
})();

