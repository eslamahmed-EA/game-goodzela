document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // Prevent page scroll while touching controls/canvas
  const blockTouch = (e) => {
    const target = e.target;
    if (target.tagName === 'CANVAS' || target.closest && target.closest('#controls')) {
      e.preventDefault();
    }
  };
  document.addEventListener('touchstart', blockTouch, { passive:false });
  document.addEventListener('touchmove', blockTouch, { passive:false });

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const restartBtn = document.getElementById('restart');
  const attackBtn = document.getElementById('btn-attack');
  const jumpBtn = document.getElementById('btn-jump');

  // ---------- ضبط المقاس / الأرض ----------
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    let cssW, cssH;
    if (window.innerWidth <= 700) {
      cssW = window.innerWidth;
      cssH = Math.max(220, Math.round(window.innerWidth * 9 / 16));
    } else {
      cssW = Math.max(320, (canvas.clientWidth || parseInt(getComputedStyle(canvas).width,10) || 2000));
      cssH = Math.max(200, (canvas.clientHeight || parseInt(getComputedStyle(canvas).height,10) || 600));
    }
    canvas.width = Math.floor(cssW * ratio);
    canvas.height = Math.floor(cssH * ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }

  const ground = { y: 0, h: 4 };

  function updateGround() {
    ground.y = Math.floor((parseInt(getComputedStyle(canvas).height,10) || 270) - 40);
  }

  function handleResize() {
    resize();
    updateGround();
    buildScenery();
    updateCityArray();
  }

  const scenery = { stars: [], farSeeds: [], nearSeeds: [], farStep: 160, nearStep: 120, glow: [] };

  let city;
  function updateCityArray() {
    const baseCount = Math.ceil(canvas.width / 110) + 2;
    const spacing = canvas.width / Math.max(1, baseCount - 1);
    city = Array.from({ length: baseCount }, (_, i) => {
      const width = 60 + Math.random() * 80;
      const height = Math.max(60, ground.y * (0.25 + Math.random() * 0.35));
      const windowCols = Math.max(2, Math.round(width / 18));
      const windowRows = Math.max(2, Math.round(height / 28));
      const windows = [];
      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          if (Math.random() < 0.6) {
            windows.push({
              x: c * (width / windowCols) + 6 + Math.random() * 4,
              y: r * (height / windowRows) + 8 + Math.random() * 6,
              w: 6 + Math.random() * 6,
              h: 8 + Math.random() * 8,
              phase: Math.random() * Math.PI * 2,
              pulse: 0.3 + Math.random() * 0.7
            });
          }
        }
      }
      return {
        x: i * spacing,
        w: width,
        h: height,
        tone: 0.25 + Math.random() * 0.45,
        windows
      };
    });
  }

  handleResize();
  window.addEventListener('resize', handleResize);
  let clouds = Array.from({length:6}, ()=> ({
    x: Math.random()*canvas.width, y: 30 + Math.random()*90, w: 60+Math.random()*80, h: 18+Math.random()*12, s: .2 + Math.random()*.4
  }));

  function roundedRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  const colorCache = new Map();
  function hexToRgb(hex){
    const normalized = hex.length === 4
      ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
      : hex.toLowerCase();
    if (colorCache.has(normalized)) return colorCache.get(normalized);
    const value = normalized.replace('#','');
    const r = parseInt(value.slice(0,2),16);
    const g = parseInt(value.slice(2,4),16);
    const b = parseInt(value.slice(4,6),16);
    const arr = [r,g,b];
    colorCache.set(normalized, arr);
    return arr;
  }
  function mixColor(a,b,t){
    const clamped = Math.min(1, Math.max(0, t));
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    const r = Math.round(ca[0] + (cb[0]-ca[0]) * clamped);
    const g = Math.round(ca[1] + (cb[1]-ca[1]) * clamped);
    const bVal = Math.round(ca[2] + (cb[2]-ca[2]) * clamped);
    return 'rgb(' + r + ',' + g + ',' + bVal + ')';
  }
  function easeInOut(t){
    return t * t * (3 - 2 * t);
  }

  function buildScenery(){
    const w = canvas.width;
    const horizon = Math.max(ground.y, canvas.height * 0.6);
    const starCount = Math.max(48, Math.round(w / 14));
    scenery.stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * horizon * 0.65,
      radius: 0.5 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.8 + Math.random() * 0.6
    }));

    const farCount = Math.max(8, Math.round(w / 160));
    const nearCount = Math.max(10, Math.round(w / 140));
    scenery.farSeeds = Array.from({ length: farCount }, () => Math.random());
    scenery.nearSeeds = Array.from({ length: nearCount }, () => Math.random());
    scenery.farStep = w / Math.max(1, farCount);
    scenery.nearStep = w / Math.max(1, nearCount);

    const glowCount = Math.max(14, Math.round(w / 110));
    scenery.glow = Array.from({ length: glowCount }, () => ({
      x: Math.random() * w,
      y: horizon - 40 - Math.random() * 90,
      radius: 2 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
      pulse: 0.4 + Math.random() * 0.6
    }));
  }

  function drawRidgeLayer(seeds, step, baseY, amplitude, speed, fill, alpha, frame){
    if (!seeds.length || !step) return;
    const wrapWidth = step * seeds.length;
    const offset = (frame * speed) % wrapWidth;
    ctx.save();
    ctx.fillStyle = fill;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(-offset - step, canvas.height);
    for (let i = -1; i <= seeds.length; i++){
      const index = (i + seeds.length) % seeds.length;
      const seed = seeds[index];
      const x = i * step - offset;
      const noise = Math.sin((i + seed) * 0.9) * 0.35 + Math.cos((i + seed) * 1.6) * 0.2;
      const peakY = baseY - amplitude * (0.4 + seed * 0.6 + noise * 0.2);
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(wrapWidth - offset + step, canvas.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSkyObjects(cycle, frame){
    const travel = (frame % 3600) / 3600;
    const orbitX = -120 + (canvas.width + 240) * travel;
    const orbitY = ground.y * 0.18 + Math.sin(travel * Math.PI) * (ground.y * 0.3);

    ctx.save();
    const sunAlpha = Math.max(0, 0.7 - cycle * 0.9);
    if (sunAlpha > 0.01){
      const sunGrad = ctx.createRadialGradient(orbitX, orbitY, 0, orbitX, orbitY, 90);
      sunGrad.addColorStop(0, 'rgba(255,234,170,0.9)');
      sunGrad.addColorStop(0.45, 'rgba(255,180,80,0.6)');
      sunGrad.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.globalAlpha = sunAlpha;
      ctx.fillStyle = sunGrad;
      ctx.fillRect(orbitX - 100, orbitY - 100, 200, 200);
    }
    ctx.restore();

    ctx.save();
    const moonAlpha = Math.pow(cycle, 1.2);
    if (moonAlpha > 0.01){
      const moonX = canvas.width - orbitX;
      const moonY = ground.y * 0.22 + Math.sin(travel * Math.PI + Math.PI/3) * (ground.y * 0.28);
      ctx.globalAlpha = moonAlpha;
      ctx.fillStyle = 'rgba(226,235,255,0.8)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(12,15,28,0.8)';
      ctx.beginPath();
      ctx.arc(moonX - 8, moonY - 3, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function renderCityBuilding(building, x, baseY, cycle, frame){
    if (x + building.w < -40 || x > canvas.width + 40) return;
    const topY = baseY - building.h;
    const grad = ctx.createLinearGradient(0, topY, 0, baseY);
    grad.addColorStop(0, mixColor('#2d4480', '#141c37', cycle * 0.6 + building.tone * 0.2));
    grad.addColorStop(1, mixColor('#141f38', '#090d1a', cycle * 0.4 + building.tone * 0.2));
    ctx.save();
    ctx.beginPath();
    const radius = Math.min(12, Math.max(6, building.w * 0.12));
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, topY + radius);
    ctx.quadraticCurveTo(x, topY, x + radius, topY);
    ctx.lineTo(x + building.w - radius, topY);
    ctx.quadraticCurveTo(x + building.w, topY, x + building.w, topY + radius);
    ctx.lineTo(x + building.w, baseY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (building.windows && building.windows.length){
      ctx.clip();
      const litStrength = Math.pow(1 - cycle, 1.35);
      ctx.globalAlpha = 0.45 + litStrength * 0.55;
      for (let w of building.windows){
        const intensity = 0.6 + Math.sin(frame * 0.03 + w.phase) * w.pulse;
        const wx = x + w.x;
        const wy = topY + w.y;
        const winGrad = ctx.createLinearGradient(wx, wy, wx, wy + w.h);
        winGrad.addColorStop(0, 'rgba(255,240,200,' + (0.65 + 0.25 * intensity) + ')');
        winGrad.addColorStop(1, 'rgba(255,170,80,' + (0.55 + 0.25 * intensity) + ')');
        ctx.fillStyle = winGrad;
        ctx.fillRect(wx, wy, w.w, w.h);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    const roofAlpha = 0.18 + Math.pow(1 - cycle, 1.5) * 0.55;
    ctx.fillStyle = 'rgba(82,196,255,' + roofAlpha + ')';
    ctx.fillRect(x + 6, topY + 4, building.w - 12, 3);
  }

  function drawBackground(frame){
    ctx.save();
    const cycleRaw = (Math.sin(frame / 900) + 1) / 2;
    const cycle = easeInOut(cycleRaw);
    const skyTop = mixColor('#6fb6ff', '#050922', cycle);
    const skyBottom = mixColor('#1c2f66', '#0b122d', cycle);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ground.y);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(1, skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, ground.y + 80);

    drawSkyObjects(cycle, frame);

    if (scenery.stars.length){
      ctx.save();
      ctx.globalAlpha = Math.pow(1 - cycle, 1.2);
      ctx.fillStyle = '#cbd5ff';
      for (let star of scenery.stars){
        const flicker = 0.6 + Math.sin(frame * 0.04 + star.phase) * star.twinkle * 0.35;
        const radius = star.radius * flicker;
        ctx.beginPath();
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const horizonGlow = ctx.createRadialGradient(canvas.width * 0.5, ground.y, 10, canvas.width * 0.5, ground.y, ground.y * 1.2);
    horizonGlow.addColorStop(0, 'rgba(96,149,255,' + (0.18 + 0.22 * (1 - cycle)) + ')');
    horizonGlow.addColorStop(1, 'rgba(16,22,45,0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(-50, 0, canvas.width + 100, ground.y + 120);

    drawRidgeLayer(scenery.farSeeds, scenery.farStep, ground.y - ground.y * 0.45, ground.y * 0.22, 0.12, mixColor('#2f3f69', '#121732', cycle * 0.9), 0.55, frame);
    drawRidgeLayer(scenery.nearSeeds, scenery.nearStep, ground.y - ground.y * 0.28, ground.y * 0.28, 0.18, mixColor('#1b2947', '#0a0f21', cycle * 0.8), 0.7, frame);

    const baseY = ground.y + 1;
    const speed = 0.35;
    for (let b of city){
      let bx = b.x - ((frame * speed) % canvas.width);
      while (bx > canvas.width) bx -= canvas.width;
      while (bx < -b.w) bx += canvas.width;
      renderCityBuilding(b, bx, baseY, cycle, frame);
      renderCityBuilding(b, bx - canvas.width, baseY, cycle, frame);
    }

    ctx.save();
    ctx.globalAlpha = 0.35 + (1 - cycle) * 0.15;
    ctx.fillStyle = mixColor('#dbeafe', '#64748b', cycle * 0.5);
    for (let c of clouds){
      let x = (c.x - frame * c.s) % canvas.width;
      if (x < -c.w) x += canvas.width;
      roundedRect(Math.round(x), Math.round(c.y), Math.round(c.w), Math.round(c.h), 12);
      ctx.fill();
      if (x + c.w > canvas.width){
        const wrapX = x - canvas.width;
        roundedRect(Math.round(wrapX), Math.round(c.y), Math.round(c.w), Math.round(c.h), 12);
        ctx.fill();
      }
    }
    ctx.restore();

    const groundHeight = Math.max(ground.h, 28);
    const trackGrad = ctx.createLinearGradient(0, ground.y, 0, ground.y + groundHeight + 24);
    trackGrad.addColorStop(0, mixColor('#243453', '#1a1032', cycle));
    trackGrad.addColorStop(0.55, mixColor('#151f38', '#090a16', cycle));
    trackGrad.addColorStop(1, '#05070d');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, ground.y, canvas.width, groundHeight + 30);

    ctx.strokeStyle = 'rgba(36,48,77,0.85)';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, ground.y, canvas.width, 18);

    const stripeColor = mixColor('#5eead4', '#f472b6', cycle * 0.6);
    ctx.save();
    ctx.shadowColor = mixColor('#22d3ee', '#fda4af', cycle * 0.6);
    ctx.shadowBlur = 12;
    const stripeStep = 60;
    for (let i = -1; i <= Math.ceil(canvas.width / stripeStep) + 1; i++){
      const gx = (i * stripeStep - (frame * 2 % stripeStep));
      ctx.fillStyle = stripeColor;
      ctx.fillRect(Math.round(gx), ground.y + 20, 44, 4);
    }
    ctx.restore();

    if (scenery.glow.length){
      ctx.save();
      ctx.globalAlpha = 0.45 + (1 - cycle) * 0.35;
      for (let glow of scenery.glow){
        const flicker = 0.5 + Math.sin(frame * 0.03 + glow.phase) * glow.pulse;
        const radius = glow.radius * (1 + flicker * 0.6);
        const grad = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, radius * 3.2);
        grad.addColorStop(0, 'rgba(255,225,150,0.9)');
        grad.addColorStop(0.4, 'rgba(255,170,90,0.45)');
        grad.addColorStop(1, 'rgba(255,140,60,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(glow.x - radius * 3.2, glow.y - radius * 3.2, radius * 6.4, radius * 6.4);
      }
      ctx.restore();
    }

    ctx.restore();
  }
  // ---------- الأصول: فريمات منفصلة ← شيت 4×4 ← صورة ----------
  const STATES = { IDLE:'idle', RUN:'run', JUMP:'jump', ATTACK:'attack' }; // شيلنا CROUCH
  const FRAME_PATH = 'frames';
  const MAX_TRIAL = 12;
  const FALLBACK_SHEET = 'goodzela_sheet.png';
  const FALLBACK_SINGLE= 'goodzela.png';

  const framesMap = { idle:[], run:[], jump:[], attack:[] };
  let usingFrames = false, usingSheet = false, usingSingle = false;

  function loadImage(src){
    return new Promise((resolve, reject)=>{
      const im = new Image();
      im.onload = ()=> resolve(im);
      im.onerror = reject;
      im.src = src + '?v=' + Date.now();
    });
  }
  async function tryLoadActionFrames(action){
    for (let i=0;i<MAX_TRIAL;i++){
      const name = `${action}_${String(i).padStart(2,'0')}.png`;
      const url = `${FRAME_PATH}/${action}/${name}`;
      try{ framesMap[action].push(await loadImage(url)); }
      catch(e){ if (framesMap[action].length>0) break; }
    }
  }
  async function loadAssets(){
    await Promise.all([
      tryLoadActionFrames('idle'),
      tryLoadActionFrames('run'),
      tryLoadActionFrames('jump'),
      tryLoadActionFrames('attack')
    ]);
    usingFrames = Object.values(framesMap).some(a=>a.length>0);
    if (!usingFrames){
      try{
        spriteSheet.img = await loadImage(FALLBACK_SHEET);
        usingSheet = true; spriteSheet.ok=true;
        spriteSheet.cols = 4; spriteSheet.rows = 4;
        spriteSheet.fw = Math.floor(spriteSheet.img.width / spriteSheet.cols);
        spriteSheet.fh = Math.floor(spriteSheet.img.height / spriteSheet.rows);
      }catch(e){
        try{ singleImg = await loadImage(FALLBACK_SINGLE); usingSingle = true; }
        catch(e2){ usingSingle = false; }
      }
    }
  }

  const spriteSheet = { img:null, ok:false, fw:0, fh:0, cols:4, rows:4 };
  let singleImg = null;

  // ---------- اللاعب ----------
  const cfg = {
    speeds: { idle:10, run:5, jump:8, attack:6 },
    fitToCanvasHeight: 0.28,
    baselinePad: 2,
    hitboxShrinkX: 0.30, // قلص منطقة التصادم أفقياً أكثر
    hitboxShrinkY: 0.35  // قلص المنطقة عمودياً أيضًا
  };

  // ضبط hitbox على الموبايل
  if (window.innerWidth <= 700) {
      cfg.hitboxShrinkX = 0.30; // قلص منطقة التصادم أفقياً أكثر
      cfg.hitboxShrinkY = 0.35; // قلص المنطقة عمودياً أيضًا
  }

  // ضبط hitbox على الشاشات الكبيرة (اجعل الضربات أقل احتمالًا)
  if (window.innerWidth > 700) {
    cfg.hitboxShrinkX = 0.22;
    cfg.hitboxShrinkY = 0.26;
  }

// شخصية بارزة جدًا
let dino;
function setDinoSize() {
  if (window.innerWidth <= 700) {
    // على الموبايل: قفزة أعلى
    dino = { x: 72, y: ground.y, w: 120, h: 150, vy:0, gravity:1.2, jump:-100, grounded:true };
  } else {
    // على الشاشات الكبيرة: قفزة أعلى
    dino = { x: 72, y: ground.y, w: 160, h: 200, vy:0, gravity:1.4, jump:-160, grounded:true };
  }
}
setDinoSize();
window.addEventListener('resize', setDinoSize);
  let state = STATES.RUN;
  let frameIdx = 0, tick = 0;

  function setState(s){ if (state!==s){ state=s; frameIdx=0; tick=0; } }

  function targetSizeFrom(imgW, imgH, scaleY=1){
    const targetH = Math.round(canvas.height * cfg.fitToCanvasHeight * scaleY);
    const aspect = imgW / imgH;
    const h = Math.max(24, targetH);
    const w = Math.max(24, Math.round(h * aspect));
    return {w,h};
  }

  function drawFrames(arr, scaleY=1){
    const size = targetSizeFrom(arr[0].width, arr[0].height, scaleY);
    dino.w = size.w; dino.h = size.h;
    drawDinoShadow(dino.w, dino.h);
    drawPowerAura(dino.w, dino.h);
    ctx.drawImage(arr[frameIdx], Math.round(dino.x), Math.round(dino.y - dino.h - cfg.baselinePad), dino.w, dino.h);
    tick++; const spd = cfg.speeds[state] || 6;
    if (tick % spd === 0) frameIdx = (frameIdx + 1) % arr.length;
  }

  function drawDinoShadow(width, height){
    const shadowWidth = Math.max(60, width * 0.75);
    const shadowHeight = Math.max(14, height * 0.18);
    const sx = dino.x + width * 0.45;
    const sy = ground.y + shadowHeight * 0.2;
    ctx.save();
    ctx.globalAlpha = 0.35;
    const grad = ctx.createRadialGradient(sx, sy, shadowHeight * 0.3, sx, sy, shadowWidth);
    grad.addColorStop(0, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, sy, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPowerAura(width, height){
    if (!powerUpActive) return;
    const cx = dino.x + width * 0.55;
    const cy = dino.y - height * 0.55;
    const radius = Math.max(width, height) * 0.75;
    const endingSoon = frame > powerUpEndFrame - 60;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const inner = Math.max(12, radius * 0.3);
    const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, radius);
    if (endingSoon){
      grad.addColorStop(0, 'rgba(255,215,134,0.9)');
      grad.addColorStop(0.5, 'rgba(255,100,100,0.5)');
    } else {
      grad.addColorStop(0, 'rgba(190,255,210,0.85)');
      grad.addColorStop(0.5, 'rgba(64,224,150,0.55)');
    }
    grad.addColorStop(1, 'rgba(10,18,28,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  function drawDino(){
    if (usingFrames){
      let arr = framesMap[state];
      if (!arr.length){
        arr = framesMap.run.length? framesMap.run : framesMap.idle;
      }
      return drawFrames(arr, 1);
    }

    if (usingSheet && spriteSheet.ok){
      const rowMap = { idle:0, run:1, jump:2, attack:3 };
      const row = rowMap[state] ?? 0;
      const sx = frameIdx * spriteSheet.fw, sy = row * spriteSheet.fh;
      const size = targetSizeFrom(spriteSheet.fw, spriteSheet.fh, 1);
      dino.w = size.w; dino.h = size.h;
      drawDinoShadow(dino.w, dino.h);
      drawPowerAura(dino.w, dino.h);
      ctx.drawImage(spriteSheet.img, sx, sy, spriteSheet.fw, spriteSheet.fh, Math.round(dino.x), Math.round(dino.y - dino.h - cfg.baselinePad), dino.w, dino.h);
      tick++; if (tick % (cfg.speeds[state]||6)===0) frameIdx = (frameIdx + 1) % spriteSheet.cols;
      return;
    }

    if (singleImg){
      const size = targetSizeFrom(singleImg.width, singleImg.height, 1);
      dino.w = size.w; dino.h = size.h;
      drawDinoShadow(dino.w, dino.h);
      drawPowerAura(dino.w, dino.h);
      ctx.drawImage(singleImg, Math.round(dino.x), Math.round(dino.y - dino.h - cfg.baselinePad), dino.w, dino.h);
      return;
    }

    if (!dino.w || !dino.h){
      const mobileSizing = window.innerWidth <= 700;
      dino.w = mobileSizing ? 120 : 160;
      dino.h = mobileSizing ? 150 : 200;
    }

    drawDinoShadow(dino.w, dino.h);
    drawPowerAura(dino.w, dino.h);
    ctx.save();
    const bodyTop = dino.y - dino.h;
    const bodyGrad = ctx.createLinearGradient(dino.x, bodyTop, dino.x + dino.w, dino.y);
    bodyGrad.addColorStop(0, powerUpActive ? '#facc15' : '#60a5fa');
    bodyGrad.addColorStop(0.55, powerUpActive ? '#fb923c' : '#3b82f6');
    bodyGrad.addColorStop(1, powerUpActive ? '#f97316' : '#1d4ed8');

    ctx.beginPath();
    ctx.moveTo(dino.x + dino.w * 0.12, dino.y);
    ctx.lineTo(dino.x + dino.w * 0.04, bodyTop + dino.h * 0.55);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.1, bodyTop + dino.h * 0.15, dino.x + dino.w * 0.28, bodyTop + dino.h * 0.12);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.55, bodyTop, dino.x + dino.w * 0.74, bodyTop + dino.h * 0.18);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.92, bodyTop + dino.h * 0.32, dino.x + dino.w * 0.92, bodyTop + dino.h * 0.45);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.84, bodyTop + dino.h * 0.55, dino.x + dino.w * 0.9, bodyTop + dino.h * 0.62);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.68, dino.y - dino.h * 0.1, dino.x + dino.w * 0.4, dino.y - dino.h * 0.08);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.2, dino.y, dino.x + dino.w * 0.12, dino.y);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 18;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = powerUpActive ? 'rgba(254,249,195,0.9)' : 'rgba(148,197,255,0.8)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dino.x + dino.w * 0.42, dino.y - dino.h * 0.08);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.38, bodyTop + dino.h * 0.45, dino.x + dino.w * 0.56, bodyTop + dino.h * 0.52);
    ctx.quadraticCurveTo(dino.x + dino.w * 0.52, dino.y - dino.h * 0.02, dino.x + dino.w * 0.42, dino.y - dino.h * 0.08);
    ctx.fillStyle = powerUpActive ? 'rgba(255,238,186,0.32)' : 'rgba(255,255,255,0.18)';
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#0f172a';
    ctx.arc(dino.x + dino.w * 0.72, bodyTop + dino.h * 0.32, Math.max(4, dino.w * 0.04), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(dino.x + dino.w * 0.73, bodyTop + dino.h * 0.30, Math.max(2, dino.w * 0.018), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = powerUpActive ? 'rgba(249,115,22,0.8)' : 'rgba(96,165,250,0.8)';
    for (let i = 0; i < 4; i++){
      const sx = dino.x + dino.w * (0.18 + i * 0.16);
      const sy = bodyTop + dino.h * (0.22 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dino.w * 0.08, sy - dino.h * 0.18);
      ctx.lineTo(sx + dino.w * 0.13, sy + dino.h * 0.02);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  // ---------- العوائق (Blocks على مستوى الشخصية فقط) + الهجمات ----------
  let obstacles = [];
  let fires = [];
  const startSpeed = 12.0; // سرعة أعلى للـ block
  let speed = startSpeed;
   let spawnMin=200, spawnMax=320, nextSpawn=60 + Math.floor(Math.random()*120);

  // ضبط الصعوبة على الموبايل
  if (window.innerWidth <= 700) {
    speed = 7.0; // سرعة أعلى على الموبايل أيضًا
    spawnMin = 200; // فترات أطول بين العوائق
    spawnMax = 320;
  }

  let powerUpActive = false;
  let powerUpEndFrame = 0;
  let lastMilestone = 0;

  function spawnObstacle(frame, currentSpawnMin, currentSpawnMax){
    if (frame >= nextSpawn){
      // أنواع: block عادي، block2 أكبر شوية، drone طائرة، drink شراب
      const rtype = Math.random();
      let obj;
      let scale = 1;
      if (window.innerWidth <= 700) scale = 0.6;
      if (rtype < 0.35){ // block عادي
        const w = 60 * scale, h = 40 * scale;
        // لا تجعل block أعلى من الكركتر
        const maxBlockTop = ground.y - dino.h + 30; // 30 بكسل سماحية من الأعلى
        const minBlockTop = ground.y - h; // أسفل الأرضية
        // blockY يكون بين minBlockTop و maxBlockTop فقط
        const blockY = maxBlockTop + Math.random() * (minBlockTop - maxBlockTop);
        obj = { type:'block', x:canvas.width+40, y:blockY, w, h };
      } else if (rtype < 0.6){ // block2 (أعرض وأعلى بسيطًا)
        const w = 80 * scale, h = 54 * scale;
        const maxHeight = window.innerWidth > 700 ? 40 : 60;
        const blockY = ground.y - Math.random() * maxHeight;
        obj = { type:'block2', x:canvas.width+40, y:blockY, w, h };
      } else if (rtype < 0.85){ // drone
        const alt = ground.y - (70 + Math.random()*80);
        obj = { type:'drone', x:canvas.width+40, y:alt, w:66 * scale, h:28 * scale, t:Math.random()*Math.PI*2 };
      } else { // drink شراب
        const drinkY = ground.y - (30 + Math.random()*50);
        obj = { type:'drink', x:canvas.width+40, y:drinkY, w:30 * scale, h:40 * scale };
      }
      obstacles.push(obj);
      const interval = Math.floor(currentSpawnMin + Math.random()*(currentSpawnMax - currentSpawnMin));
      nextSpawn = frame + Math.max(60, interval);
    }
  }
  function updateObstacles(currentSpeed){
    for (let o of obstacles){
      o.x -= currentSpeed;
    }
    obstacles = obstacles.filter(o => o.x + o.w > -60);
  }
  // procedural jagged rock with per-rock variation, gradient and subtle shadow
  function drawRock(x, y, w, h) {
    // deterministic-ish noise based on position
    function noise(a, b, seed){
      return Math.abs(Math.sin(a*12.9898 + b*78.233 + seed*0.12345) * 43758.5453) % 1;
    }
    ctx.save();
    // shadow
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    const cx = x + w/2, cy = y + h/2;
    const pts = 6 + Math.floor(noise(x,y,1)*3); // 6-8 points
    ctx.beginPath();
    for (let i=0;i<pts;i++){
      const ang = (i/pts) * Math.PI * 2;
      const rBase = Math.min(w,h) * 0.45;
      const r = rBase * (0.75 + noise(x,y,i) * 0.65);
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r * (0.85 + noise(x,y,i+7)*0.3); // slight vertical squash
      if (i===0) ctx.moveTo(Math.round(px), Math.round(py)); else ctx.lineTo(Math.round(px), Math.round(py));
    }
    ctx.closePath();

    // gradient fill for volume
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#8b5a31');
    grad.addColorStop(0.5, '#6b4324');
    grad.addColorStop(1, '#4b2f1a');
    ctx.fillStyle = grad;
    ctx.fill();

    // light edge highlight
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, Math.round(Math.min(w,h) * 0.06));
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();
    // small inner highlight to give shape
    ctx.beginPath();
    ctx.ellipse(cx - w*0.15, cy - h*0.18, Math.max(6, w*0.18), Math.max(4, h*0.12), -0.4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.restore();
  }

  function drawObstacles(){
    for (let o of obstacles){
      if (o.type === 'drink'){
        ctx.fillStyle = '#ff6b35'; // لون برتقالي للشراب
        roundedRect(Math.round(o.x), Math.round(o.y - o.h), o.w, o.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#ff4500'; ctx.lineWidth=3; ctx.stroke();
        // رسم كوب
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(o.x + o.w*0.2), Math.round(o.y - o.h*0.7), o.w*0.6, o.h*0.4);
      } else {
  // use procedural rock drawing for block/block2/drone base
  drawRock(Math.round(o.x), Math.round(o.y - o.h), o.w+10, o.h+10);
      }
    }
  }

  // Projectiles
  function shoot(){
    if (!powerUpActive) return;
    const mouthX = dino.x + dino.w * 0.78;
    const mouthY = dino.y - dino.h * 0.6;
    const scale = window.innerWidth > 700 ? 1.15 : 0.95;
    const radius = 18 * scale * (powerUpActive ? 1.1 : 1);
    const fw = radius * 1.6;
    const fh = radius * 1.4;
    const baseSpeed = window.innerWidth > 700 ? 10.5 : 8.6;
    fires.push({
      x: mouthX - fw * 0.5,
      y: mouthY - fh * 0.5,
      w: fw,
      h: fh,
      vx: baseSpeed + (powerUpActive ? 2.2 : 0),
      vy: -1.2,
      gravity: 0.05,
      life: 120,
      radius,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: 0.15 + Math.random() * 0.08,
      shimmer: Math.random() * Math.PI * 2,
      history: [],
      kind: 'nova'
    });
  }
  function updateFires(){
    for (let f of fires){
      f.x += f.vx;
      f.y += f.vy;
      if (f.gravity) f.vy += f.gravity;
      f.life--;
      f.spin = (f.spin || 0) + (f.spinSpeed || 0);
      if (!f.history) f.history = [];
      f.history.unshift({ x: f.x + f.w * 0.5, y: f.y + f.h * 0.5 });
      if (f.history.length > 18) f.history.length = 18;
    }
    for (let f of fires){
      for (let i = obstacles.length - 1; i >= 0; i--){
        const o = obstacles[i];
        const hit = f.x < (o.x + o.w) && (f.x + f.w) > o.x && f.y < o.y && (f.y + f.h) > (o.y - o.h);
        if (hit){
          obstacles.splice(i, 1);
          f.life = 0;
        }
      }
    }
    fires = fires.filter(f => f.life > 0 && f.x < (canvas.width + 120) && (f.y + f.h) > -40);
  }

  function drawNovaProjectile(f){
    const warn = powerUpActive && frame > powerUpEndFrame - 60;
    const baseRadius = f.radius || 18;
    const cx = f.x + f.w * 0.5;
    const cy = f.y + f.h * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (f.history && f.history.length){
      const len = f.history.length;
      for (let i = 0; i < len; i++){
        const point = f.history[i];
        const t = 1 - i / len;
        const alpha = warn ? 0.14 * t : 0.18 * t;
        const trailColor = warn ? 'rgba(250,185,100,' : 'rgba(104,216,255,';
        ctx.fillStyle = trailColor + alpha + ')';
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, baseRadius * (0.38 + t * 0.55), baseRadius * (0.22 + t * 0.4), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const glowRadius = baseRadius * 2.4;
    const glow = ctx.createRadialGradient(cx, cy, baseRadius * 0.25, cx, cy, glowRadius);
    if (warn){
      glow.addColorStop(0, 'rgba(255,241,197,0.95)');
      glow.addColorStop(0.45, 'rgba(252,165,125,0.6)');
    } else {
      glow.addColorStop(0, 'rgba(209,250,255,0.95)');
      glow.addColorStop(0.45, 'rgba(103,232,249,0.62)');
    }
    glow.addColorStop(1, 'rgba(10,18,28,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(f.spin || 0);
    const shardCount = 6;
    const shardLen = baseRadius * 1.35;
    const shardColor = warn ? '#fb923c' : '#38bdf8';
    for (let i = 0; i < shardCount; i++){
      const angle = (Math.PI * 2 / shardCount) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * baseRadius * -0.25, Math.sin(angle) * baseRadius * -0.25);
      ctx.lineTo(Math.cos(angle) * shardLen, Math.sin(angle) * shardLen);
      ctx.lineTo(Math.cos(angle + 0.12) * baseRadius * 0.5, Math.sin(angle + 0.12) * baseRadius * 0.5);
      ctx.closePath();
      ctx.globalAlpha = warn ? 0.9 : 0.8;
      ctx.fillStyle = shardColor;
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.fillStyle = warn ? '#fde68a' : '#c4f4ff';
    ctx.arc(cx, cy, baseRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = warn ? '#fb923c' : '#60f5ff';
    const shimmer = (f.shimmer || 0) + frame * 0.12;
    ctx.arc(cx + Math.cos(shimmer) * baseRadius * 0.22, cy + Math.sin(shimmer) * baseRadius * 0.2, baseRadius * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFires(){
    for (let f of fires){
      if (f.kind === 'nova'){
        drawNovaProjectile(f);
      }
    }
  }
// ---------- فيزياء & تصادم ----------
  function physics(){
    if (!dino.grounded){
      dino.vy += dino.gravity;
      dino.y += dino.vy;
      if (dino.y >= ground.y){
        /* dino.y fixed: no reset here */ dino.vy = 0; dino.grounded = true; setState(STATES.RUN);
      }
    }
  }
  function getHit(){
    const shrinkX = cfg.hitboxShrinkX;
    const shrinkY = cfg.hitboxShrinkY;
    const hb = {
      x: Math.round(dino.x + dino.w*shrinkX*0.5),
      y: Math.round((dino.y - dino.h) + dino.h*shrinkY*0.5),
      w: Math.round(dino.w*(1-shrinkX)),
      h: Math.round(dino.h*(1-shrinkY))
    };
    for (let i = obstacles.length - 1; i >= 0; i--){
      const o = obstacles[i];
        const ox1 = o.x, oy1 = o.y - o.h, ox2 = o.x + o.w, oy2 = o.y;
        if (hb.x < ox2 && hb.x + hb.w > ox1 && hb.y < oy2 && hb.y + hb.h > oy1) {
          // حساب كمية التداخل الرأسي بين الضربة والعائق
          const overlapTop = Math.max(hb.y, oy1);
          const overlapBottom = Math.min(hb.y + hb.h, oy2);
          const overlapH = Math.max(0, overlapBottom - overlapTop);
          // إذا كان الجسم من نوع 'drink' فنجمعه دائماً (لا يموت اللاعب)
          if (o.type === 'drink'){
            powerUpActive = true;
            powerUpEndFrame = frame + 10 * 60; // 10 ثواني عند 60 fps
            obstacles.splice(i, 1);
            return false;
          }
          // أي تداخل يعتبر قاتلًا مباشرة
          return true;
        }
    }
    return false;
  }

  // ---------- لوب ----------
  let running = true, frame = 0, score = 0;
  const hs = Number(localStorage.getItem('gz_hs')||0); bestEl.textContent = 'أفضل: '+hs;

  loadAssets().then(()=> { if (!usingFrames && !usingSheet) { usingSingle = true; singleImg = new Image(); singleImg.onload = ()=> loop(); singleImg.src = 'goodzela.png?v=' + Date.now(); } else { loop(); } }); /* FORCE_SINGLE_FALLBACK */

  function loop(){
  frame++;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // تحقق من انتهاء الشراب
  if (frame > powerUpEndFrame) powerUpActive = false;

  // زيادة الصعوبة عند نقاط معينة
  const currentScore = Math.floor(score / 6);
  if (currentScore >= lastMilestone + 300) {
    speed += 0.5;
    lastMilestone += 300;
  }

  // زيادة الصعوبة تدريجيًا
  let currentSpeed = speed + (frame / 3000); // زيادة بطيئة في السرعة
  let currentSpawnMin = Math.max(50, spawnMin - Math.floor(frame / 800));
  let currentSpawnMax = Math.max(100, spawnMax - Math.floor(frame / 800));

  drawBackground(frame);
  spawnObstacle(frame, currentSpawnMin, currentSpawnMax);
  updateObstacles(currentSpeed);
  updateFires();
  drawObstacles();
  drawFires();
  physics();
  drawDino();
  if (getHit()) return end();

    if (running){
      score++;
      if (frame % 6 === 0){
        const disp = Math.floor(score/6);
        scoreEl.textContent = 'Score: ' + disp;
      }
      requestAnimationFrame(loop);
    }
  }

  function end(){
  function restart(){
    obstacles = []; fires = []; score = 0; frame = 0;
    dino.y = ground.y; dino.vy = 0; dino.grounded = true;
    setState(STATES.RUN); running = true; restartBtn.hidden = true;
    nextSpawn = 60 + Math.floor(Math.random()*120); // إعادة تعيين nextSpawn
    powerUpActive = false; powerUpEndFrame = 0; lastMilestone = 0; speed = startSpeed;
    if (window.innerWidth <= 700) speed = 5.0;
    requestAnimationFrame(loop);
  }

    running = false;
    restartBtn.hidden = false;
    const finalScore = Math.floor(score/6);
    const best = Number(localStorage.getItem('gz_hs')||0);
    if (finalScore > best) localStorage.setItem('gz_hs', finalScore);
    scoreEl.textContent = 'Score: ' + finalScore;
    bestEl.textContent = 'Best: ' + Math.max(finalScore, best);
  }

  // ---------- تحكم ----------
  function jump(){
    if (!running) return;
    if (dino.grounded){
      dino.vy = cfg.jump ?? -26;
      dino.grounded = false;
      setState(STATES.JUMP);
    }
  }
  function performAttack(){
    if (!running || !powerUpActive) return;
    setState(STATES.ATTACK);
    shoot();
    setTimeout(() => {
      if (dino.grounded) setState(STATES.RUN);
    }, 340);
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW'){ e.preventDefault(); jump(); }
    if (e.code === 'KeyA' || e.code === 'KeyJ'){ e.preventDefault(); performAttack(); }
    if ((e.code === 'Enter' || e.code === 'Space') && !running){ e.preventDefault(); if (typeof restart==='function'){ restart(); } else { location.reload(); } }
  });
  attackBtn.addEventListener('click', performAttack);
  if (jumpBtn) jumpBtn.addEventListener('click', () => jump());

  // موبايل: لمسة = قفز، لمسة مطولة = انتشار
  let touchTimer = null;
  let touchAttack = false;
  canvas.addEventListener('touchstart', (e)=>{
    e.preventDefault();
    if (!running) return;
    touchAttack = false;
    if (touchTimer) clearTimeout(touchTimer);
    touchTimer = setTimeout(()=>{
      touchTimer = null;
      performAttack();
      touchAttack = true;
    }, 260);
  }, {passive:false});
  const handleTouchRelease = (e)=>{
    e.preventDefault();
    if (touchTimer){
      clearTimeout(touchTimer);
      touchTimer = null;
      if (!touchAttack) jump();
    } else if (!touchAttack){
      jump();
    }
    touchAttack = false;
  };
  canvas.addEventListener('touchend', handleTouchRelease, {passive:false});
  canvas.addEventListener('touchcancel', handleTouchRelease, {passive:false});
});


















