/* Presentation owner for Chinh chiến. Rewards and battles keep their domain owners. */
const sceneState = { root: null, canvas: null, active: false, scope: null, resizeObserver: null,
  raf: 0, rafRelease: null, timer: 0, timerRelease: null, booted: false,
  lastFrame: 0, farmTime: 0, width: 390, height: 300, draft: null, slot: 0, checkpoint: null, launching: false,
  claiming: false, activationGeneration: 0 };
const sceneImages = new Map();
const sceneDiagnosticsEnabled = (() => {
  try {
    return typeof window !== 'undefined' && new URLSearchParams(window.location?.search || '').get('qaL04b') === 'scene-lifetime';
  } catch (_) {
    return false;
  }
})();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let preparationDrag = null, suppressSlotClick = false;
function clearPreparationDrag() {
  const drag = preparationDrag;
  preparationDrag = null;
  // Release after clearing the owner: capture loss can fire during cleanup.
  if (drag?.button.hasPointerCapture(drag.pointer)) drag.button.releasePointerCapture(drag.pointer);
  if (drag?.moved && reducedMotion.matches) drawScene(performance.now());
}
function preparationEnemies() {
  const encounter = DATA.encounters[sceneState.checkpoint?.battleId];
  if (!Array.isArray(encounter)) return [];
  const seen = new Set();
  const enemies = encounter.map(enemy => ({ ...enemy, stats: { ...enemy.stats },
    id: enemy.sourceHeroId || enemy.heroId || enemy.id, row: enemy.row || 'front',
    archetype: inferArchetype(enemy), enemy: true })).filter(enemy => {
      if (seen.has(enemy.id)) return false;
      seen.add(enemy.id); return true;
    }).slice(0, 6);
  assignFormationSlots(enemies, 'foe');
  return enemies.sort((a, b) => a.slot - b.slot);
}
function preparationEnemyPower() {
  if (!Array.isArray(DATA.encounters[sceneState.checkpoint?.battleId])) return null;
  const enemies = preparationEnemies();
  if (!enemies.length || enemies.some(e => ['hp','atk','def','spd'].some(k => !Number.isFinite(e.stats[k])))) return null;
  // Same displayed-score formula as heroPower, but only encounter-owned stats.
  return enemies.reduce((sum, e) => sum + Math.round(e.stats.hp / 8 + e.stats.atk * 4 + e.stats.def * 3 + e.stats.spd * 2), 0);
}
function preparationEnemyArt(pick, enemies) {
  // Match drawGeneratedHero's enemy idle row and duplicate-role slot fallback.
  const poses = { guardian: '05', ranger: '06', healer: '07', striker: '08', duelist: '09', mystic: '10' };
  const repeated = enemies.some(e => e.slot < pick.slot && e.archetype === pick.archetype);
  if (!repeated && poses[pick.archetype]) return {
    src: 'assets/battle-runtime/embedded-' + poses[pick.archetype] + '.webp',
    cols: 4, rows: 2, column: 0, row: 1, mirror: true
  };
  return { src: 'assets/battle-runtime/embedded-04.webp', cols: 3, rows: 2,
    column: pick.slot % 3, row: Math.floor(pick.slot / 3), mirror: false };
}
const escapeScene = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sceneNumber = value => new Intl.NumberFormat('vi-VN').format(Math.max(0, Number(value) || 0));
const sceneClock = value => { const s = Math.max(0, Math.floor(value)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':'); };
const sceneRewards = [
  ['gold', 'Vàng', 'assets/result-icons-art/gold-imagen.png'],
  ['tinh', 'Tinh thông', 'assets/result-icons-art/mastery-imagen.png'],
  ['hoat', 'Hoạt lực', 'assets/ui/menu-v3233/icons/resource-energy-imagen.png']
];
const sceneDock = [['hub', 'hub', 'Thành Chính'], ['heroes', 'heroes', 'Tướng'], ['team', 'team', 'Trợ trận'], ['daily', 'daily', 'Lịch Luyện'], ['campaign', 'expedition', 'Chinh chiến']];
const spriteSpecs = {
  ong_hang_pho: { src: 'assets/battle-runtime/embedded-12.png', frames: 48, cols: 8, cellW: 240, cellH: 135, ms: 120, pivot: 100, foot: 128, body: 124 },
  luc_anh: { ...LUC_ANH_IDLE_1080, pivot: 240, foot: 427, body: 398 },
  thay_mo: { src: 'assets/characters/thay-mo/idle-v3193-atlas.png', frames: 96, cols: 12, cellW: 235, cellH: 264, strideW: 241, strideH: 270, pad: 3, durations: AFK_THAY_MO_IDLE_DURATIONS, pivot: 117.5, foot: 260, body: 250 },
  dinh_loi: { src: 'assets/characters/dinh-loi/idle-atlas.png', frames: 64, cols: 8, cellW: 480, cellH: 270, ms: 62.5, pivot: 265, foot: 258, body: 233 }
};

// Authored Basic atlases. Fixed pivots measured once, never recentered per frame.
const farmAttackSpecs = {
  ong_hang_pho: { src:'assets/battle-runtime/embedded-11.png', frames:61, cols:10, cellW:240, cellH:135, ms:2500/61, pivot:100, foot:125, body:119 },
  luc_anh: { src:'assets/characters/luc-anh/basic-atlas.webp', frames:64, cols:8, cellW:240, cellH:240, ms:38, pivot:120, foot:190, body:148 },
  thay_mo: { src:'assets/characters/thay-mo/basic-cast-v3198-atlas.png', frames:96, cols:12, cellW:307, cellH:270, strideW:313, strideH:276, pad:3, durations:[60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60], ms:62.5, pivot:117.5, foot:265, body:263 },
  dinh_loi: { src:'assets/characters/dinh-loi/basic-cast-atlas.png', frames:64, cols:8, cellW:480, cellH:270, ms:62.5, pivot:265, foot:255, body:235 }
};

function currentCheckpoint() { return campaignCheckpoint(P, DATA.chapters, chapterBattleSequence); }
function ownedSceneHeroIds() { return OFFICIAL_ROSTER_12_IDS.filter(id => DATA.heroes[id] && P.heroes[id]?.owned); }
function savedSceneSquad() {
  const picks = normalizeSquad(P.squad, P, false).map(pick => ({ ...pick }));
  // Combat copies may fill missing slots; keep authored holes when slot is unique.
  if (!picks.every(pick => Number.isInteger(Number(pick.slot)))) assignFormationSlots(picks, 'ally');
  return compactCampaignBoard(expandCampaignBoard(picks));
}
function scenePower(squad) { return squad.reduce((sum, pick) => sum + heroPower(pick.id), 0); }
function setSceneText(selector, value) { const el = sceneState.root?.querySelector(selector); if (el && el.textContent !== String(value)) el.textContent = value; }
function imageForScene(src) {
  let image = sceneImages.get(src);
  if (!image) {
    image = new Image(); image.decoding = 'async';
    const onload = () => { if (sceneState.active && reducedMotion.matches) drawScene(0); };
    image.onload = onload;
    image.src = src; sceneImages.set(src, image);
    sceneState.scope?.add(() => {
      if (image.onload === onload) image.onload = null;
      if (!image.complete) image.src = '';
      if (sceneImages.get(src) === image) sceneImages.delete(src);
    });
  }
  return image;
}
function frameAt(spec, time) {
  if (reducedMotion.matches) return 0;
  if (spec.durations) {
    let elapsed = time % spec.durations.reduce((sum, ms) => sum + ms, 0);
    for (let frame = 0; frame < spec.durations.length; frame++) {
      if (elapsed < spec.durations[frame]) return frame;
      elapsed -= spec.durations[frame];
    }
    return 0;
  }
  return Math.floor(time / spec.ms) % spec.frames;
}
function specForAfk(pick) {
  if (sceneState.draft) return spriteSpecs[pick.id];
  const run = window.HonVietCampaignRunSpecs?.[pick.id];
  if (run && run.src && Number(run.frames) > 0 && run.cellW && run.cellH && run.pivot && run.foot && run.body) return run;
  return spriteSpecs[pick.id];
}
const HOME_SLOT = [
  { x: 0.32, y: 0.57, s: 1.00 },
  { x: 0.45, y: 0.535, s: 1.00 },
  { x: 0.58, y: 0.50, s: 1.00 },
  { x: 0.32, y: 0.525, s: 0.88 },
  { x: 0.45, y: 0.49, s: 0.88 },
  { x: 0.58, y: 0.455, s: 0.88 }
];
// Authored map coordinates, independent of chapter progress and reward time.
// No camera travel until the owner supplies the party's Run assets.
function campaignMapView(w, h) {
  const width = Math.max(w, Math.min(Math.max(w, h * 9 / 16) * 1.8, h * 2.4 * 9 / 16));
  const height = width * 16 / 9;
  const left = w / 2 - .45 * width;
  const top = h * .625 - .515 * height;
  return { width, height, left, top,
    viewport: { x: -left / width, y: -top / height, width: w / width, height: h / height } };
}
function homePartyPose(pick, w, h) {
  const slot = Number.isInteger(Number(pick.slot)) ? Math.max(0, Math.min(5, Number(pick.slot))) : (pick.row === 'back' ? 3 : 0);
  const pose = HOME_SLOT[slot];
  const map = campaignMapView(w, h);
  const plaza = {
    x: map.left + pose.x * map.width,
    y: map.top + pose.y * map.height,
    worldX: pose.x, worldY: pose.y,
    bodyH: Math.min(118, w * .24, h * .19) * pose.s
  };
  return plaza;
}
function syncCampaignMap(w, h) {
  const map = campaignMapView(w, h);
  const landscape = sceneState.root?.querySelector('.cs-landscape');
  if (!landscape) return;
  landscape.style.setProperty('--cs-map-size', map.width + 'px ' + map.height + 'px');
  landscape.style.setProperty('--cs-map-position', map.left + 'px ' + map.top + 'px');
  const squad = savedSceneSquad();
  const center = squad.reduce((p, hero) => {
    const pose = homePartyPose(hero, w, h);
    return { x: p.x + pose.worldX, y: p.y + pose.worldY };
  }, {x:0,y:0});
  for (const marker of sceneState.root.querySelectorAll('[data-map-party]')) {
    marker.hidden = !squad.length;
    marker.style.left = (center.x / (squad.length || 1) * 100) + '%';
    marker.style.top = (center.y / (squad.length || 1) * 100) + '%';
  }
  for (const viewport of sceneState.root.querySelectorAll('[data-map-viewport]')) {
    Object.assign(viewport.style, {left:map.viewport.x*100+'%',top:map.viewport.y*100+'%',
      width:map.viewport.width*100+'%',height:map.viewport.height*100+'%'});
  }
}
// Pure visual timeline: never touches inventory, progression, RNG or battle scheduling.
function sampleCampaignFarm(time, squad, quiet = false, specs = {}) {
  if (quiet || !squad.length) return null;
  const tick = Math.max(0, Number(time) || 0);
  const cycle = Math.floor(tick / 10000), elapsed = tick % 10000;
  const hero = squad[cycle % squad.length];
  const spec = specs[hero.id];
  const duration = spec ? spec.frames * spec.ms : 1200;
  const hitAt = 1600 + duration * .68;
  const dissolveAt = hitAt + 250;
  const phase = elapsed < 1400 ? 'spawn' : elapsed < dissolveAt ? 'attack' : elapsed < dissolveAt+1200 ? 'dissolve' : 'rest';
  const alpha = phase === 'spawn' ? Math.min(1, elapsed / 650) : phase === 'dissolve' ? 1-(elapsed-dissolveAt)/1200 : phase === 'rest' ? 0 : 1;
  const attackTime = elapsed - 1600;
  return { hero, cycle, elapsed, phase, alpha, attackTime, duration,
    hp: elapsed < hitAt ? 1 : 0 };
}
function drawCampaignFarm(ctx, farm, w, h) {
  if (!farm || farm.phase === 'rest') return;
  if (farmAttackSpecs[farm.hero.id]) imageForScene(farmAttackSpecs[farm.hero.id].src);
  const hero = homePartyPose(farm.hero, w, h);
  const size = hero.bodyH * .60;
  const x = Math.min(w - size * .55, hero.x + hero.bodyH * .76);
  const y = hero.y + hero.bodyH * .18;
  const approach = farm.phase === 'spawn' ? (1-Math.min(1,farm.elapsed/1400))*size*.4 : 0;
  const hop = farm.phase === 'spawn' ? Math.abs(Math.sin(farm.elapsed/1400*Math.PI*2))*size*.14 : 0;
  const pulse = Math.sin(farm.elapsed / 240) * .025;
  const image = imageForScene('assets/ui/campaign/farm-moss-v1.webp');
  if (!image.complete || !image.naturalWidth) return;
  ctx.save(); ctx.globalAlpha = farm.alpha;
  ctx.fillStyle='rgba(20,35,22,.22)'; ctx.beginPath(); ctx.ellipse(x+approach,y,size*.36,size*.075,0,0,Math.PI*2);ctx.fill();
  // Original RGBA bounds: body x248..1015, y135..1093 in a 1254px canvas.
  const scale = size / 958;
  const shrink = farm.phase === 'dissolve' ? Math.max(.05,farm.alpha) : 1;
  ctx.translate(x+approach,y-hop);ctx.scale(1+pulse,shrink*(1-pulse));
  ctx.drawImage(image,-631*scale,-1093*scale,1254*scale,1254*scale);
  ctx.restore();
  if (farm.phase === 'attack') {
    // Health is a local visual cue, not a combat HP value.
    ctx.save();ctx.fillStyle='#302d26aa';ctx.fillRect(x-size*.32,y-size-7,size*.64,3);
    ctx.fillStyle='#c25c3f';ctx.fillRect(x-size*.32,y-size-7,size*.64*farm.hp,3);ctx.restore();
    const spec = farmAttackSpecs[farm.hero.id];
    const duration = spec ? spec.frames * spec.ms : 1200;
    const beat = farm.attackTime / duration;
    const impact = Math.max(0,1-Math.abs(beat-.68)/.08);
    if (impact > 0) {
      ctx.save();ctx.globalAlpha=impact;ctx.strokeStyle='#fff4b5';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y-size*.48,size*.32*(2-impact),0,Math.PI*2);ctx.stroke();
      for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*size*.15,y-size*.48+Math.sin(a)*size*.15);ctx.lineTo(x+Math.cos(a)*size*.46,y-size*.48+Math.sin(a)*size*.46);ctx.stroke();}
      ctx.restore();
    }
    // A short trail links the acting hero to the target; it carries no reward.
    if (beat>.48 && beat<.68) {
      const t=(beat-.48)/.2, sx=hero.x+hero.bodyH*.22, sy=hero.y-hero.bodyH*.45;
      ctx.save();ctx.strokeStyle='#ffe9a6';ctx.lineWidth=2;ctx.globalAlpha=.8;
      ctx.beginPath();ctx.moveTo(sx+(x-sx)*Math.max(0,t-.14),sy+(y-size*.48-sy)*Math.max(0,t-.14));ctx.lineTo(sx+(x-sx)*t,sy+(y-size*.48-sy)*t);ctx.stroke();ctx.restore();
    }
  }
}
function drawScene(time) {
  const canvas = sceneState.canvas;
  if (!canvas || !sceneState.active) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const w = sceneState.width, h = sceneState.height, dpr = canvas.width / w;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const preparing = Boolean(sceneState.draft);
  const enemies = preparing ? preparationEnemies() : [];
  const picks = preparing ? [...sceneState.draft, ...enemies] : savedSceneSquad();
  const farm = preparing ? null : sampleCampaignFarm(sceneState.farmTime, picks, reducedMotion.matches, farmAttackSpecs);
  const rowCounts = { front: 0, back: 0, enemyfront: 0, enemyback: 0 };
  picks.map(pick => {
    const key = (pick.enemy ? 'enemy' : '') + pick.row;
    const slot = Number(pick.slot);
    const rowIndex = preparing && Number.isInteger(slot) ? slot % 3 : rowCounts[key]++;
    return { ...pick, rowIndex };
  })
    .sort((a, b) => preparing
      ? (a.row === 'back' ? 0 : 1) - (b.row === 'back' ? 0 : 1)
      : (homePartyPose(a, w, h).y - homePartyPose(b, w, h).y) || (homePartyPose(a, w, h).x - homePartyPose(b, w, h).x))
    .forEach(pick => {
      let x, y, bodyH;
      if (preparing) {
        x = w * (pick.enemy ? (pick.row === 'front' ? .65 : .88) : (pick.row === 'front' ? .35 : .12));
        y = h * (.38 + .27 * pick.rowIndex);
        bodyH = Math.min(w * .23, h * .28);
      } else {
        const plaza = homePartyPose(pick, w, h);
        x = plaza.x; y = plaza.y; bodyH = plaza.bodyH;
      }
      if (preparing && !pick.enemy && preparationDrag?.heroId === pick.id && preparationDrag.moved) {
        x += preparationDrag.dx || 0; y += preparationDrag.dy || 0;
      }
      ctx.fillStyle = 'rgba(15,30,23,.24)'; ctx.beginPath(); ctx.ellipse(x, y, bodyH * .31, bodyH * .075, 0, 0, Math.PI * 2); ctx.fill();
      const attack = farm && farm.attackTime >= 0 && farm.hero.id === pick.id && farm.attackTime < (farmAttackSpecs[pick.id]?.frames * farmAttackSpecs[pick.id]?.ms || 0);
      const attackImage = attack ? imageForScene(farmAttackSpecs[pick.id].src) : null;
      const readyAttack = attackImage?.complete && attackImage.naturalWidth > 0;
      const spec = readyAttack ? farmAttackSpecs[pick.id] : farm ? spriteSpecs[pick.id] : specForAfk(pick);
      const enemyArt = pick.enemy && !spec ? preparationEnemyArt(pick, enemies) : null;
      const image = imageForScene(spec?.src || enemyArt?.src || portraitSrc(pick.id, 'master'));
      if (!image.complete || image.naturalWidth < 1) return;
      ctx.save();
      if (farm?.hero.id === pick.id && !farmAttackSpecs[pick.id] && farm.attackTime > 0 && farm.attackTime < farm.duration) {
        const lean = Math.sin(farm.attackTime / farm.duration * Math.PI) * .055;
        ctx.translate(x,y); ctx.rotate(lean); ctx.translate(-x,-y);
      }
      if (pick.enemy && (!enemyArt || enemyArt.mirror)) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
      if (spec) {
        const frame = frameAt(spec, readyAttack ? farm.attackTime : time), scale = bodyH / spec.body;
        const sx = frame % spec.cols * (spec.strideW || spec.cellW) + (spec.pad || 0);
        const sy = Math.floor(frame / spec.cols) * (spec.strideH || spec.cellH) + (spec.pad || 0);
        ctx.drawImage(image, sx, sy, spec.cellW, spec.cellH, x - spec.pivot * scale, y - spec.foot * scale, spec.cellW * scale, spec.cellH * scale);
      } else if (enemyArt) {
        const cw = image.naturalWidth / enemyArt.cols, ch = image.naturalHeight / enemyArt.rows;
        const drawW = bodyH * cw / ch;
        ctx.drawImage(image, enemyArt.column * cw, enemyArt.row * ch, cw, ch, x - drawW / 2, y - bodyH, drawW, bodyH);
      } else {
        const scale = bodyH / image.naturalHeight;
        ctx.drawImage(image, x - image.naturalWidth * scale / 2, y - bodyH, image.naturalWidth * scale, bodyH);
      }
      ctx.restore();
    });
  drawCampaignFarm(ctx, farm, w, h);
}
function sceneTick(time) {
  sceneState.rafRelease?.(); sceneState.rafRelease = null;
  sceneState.raf = 0;
  if (!sceneState.active || document.hidden) return;
  if (time - sceneState.lastFrame >= 32) {
    if (!sceneState.draft && !reducedMotion.matches) sceneState.farmTime += Math.min(100, time - sceneState.lastFrame);
    drawScene(time); sceneState.lastFrame = time;
  }
  if (!reducedMotion.matches) sceneState.raf = scheduleSceneFrame();
}
function resizeScene() {
  if (!sceneState.canvas || !sceneState.active) return;
  const box = sceneState.canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  sceneState.width = box.width; sceneState.height = box.height;
  if (!sceneState.draft) syncCampaignMap(box.width, box.height);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(box.width * dpr), height = Math.round(box.height * dpr);
  if (sceneState.canvas.width !== width || sceneState.canvas.height !== height) {
    sceneState.canvas.width = width; sceneState.canvas.height = height;
  }
  drawScene(performance.now());
}
function stopSceneClock() {
  if (sceneState.raf) cancelAnimationFrame(sceneState.raf);
  if (sceneState.timer) clearInterval(sceneState.timer);
  sceneState.rafRelease?.(); sceneState.rafRelease = null;
  sceneState.timerRelease?.(); sceneState.timerRelease = null;
  sceneState.raf = 0; sceneState.timer = 0;
}
function scheduleSceneFrame() {
  if (!sceneState.scope?.isActive()) return 0;
  const handle = requestAnimationFrame(sceneTick);
  sceneState.rafRelease = sceneState.scope.add(() => cancelAnimationFrame(handle));
  return handle;
}
function trackSceneTimer() {
  const timer = setInterval(updateSceneNumbers, 1000);
  sceneState.timer = timer;
  sceneState.timerRelease = sceneState.scope?.add(() => clearInterval(timer)) || null;
}
function sceneDiagnosticSnapshot() {
  const roots = [...document.querySelectorAll('#hvCampaignScene')];
  const scope = sceneState.scope?.snapshot();
  const snapshot = {
    schema: 'hon-viet-campaign-scene-diagnostics/v1',
    active: sceneState.active,
    rootCount: roots.length,
    visibleRootCount: roots.filter(root => !root.hidden).length,
    activationGeneration: sceneState.activationGeneration,
    scopeGeneration: scope?.generation ?? null,
    scopeDisposed: scope?.disposed ?? true,
    pendingResources: scope?.pending ?? 0,
    timerActive: Number(Boolean(sceneState.timer)),
    rafActive: Number(Boolean(sceneState.raf)),
    resizeObserverActive: Number(Boolean(sceneState.resizeObserver)),
    imageCacheSize: sceneImages.size
  };
  if (sceneDiagnosticsEnabled && sceneState.root) {
    sceneState.root.dataset.qaL04bSnapshot = JSON.stringify(snapshot);
  }
  return snapshot;
}
if (sceneDiagnosticsEnabled) {
  window.__HV_CAMPAIGN_SCENE_DIAGNOSTICS = Object.freeze({ snapshot: sceneDiagnosticSnapshot });
}
function startSceneClock() {
  stopSceneClock();
  if (!sceneState.active || document.hidden) return;
  sceneState.lastFrame = performance.now();
  resizeScene(); updateSceneNumbers();
  trackSceneTimer();
  if (!reducedMotion.matches) sceneState.raf = scheduleSceneFrame();
}
function ensureSceneChest() {
  if (!P.hvAfkChest || P.hvAfkChest.schema !== AFK_CHEST_SCHEMA) {
    P.hvAfkChest = normalizeAfkChestState(P.hvAfkChest, { now: Date.now() });
    if (!persist()) toast('Chưa lưu được rương. Hãy kiểm tra dung lượng lưu trữ.');
  }
  return P.hvAfkChest;
}
function updateSceneNumbers() {
  if (!sceneState.active || !P) return;
  const view = getAfkChestView(ensureSceneChest(), { now: Date.now() });
  const clock = sceneClock(view.storedSeconds);
  for (const el of sceneState.root.querySelectorAll('[data-afk-time]')) if (el.textContent !== clock) el.textContent = clock;
  setSceneText('[data-afk-status]', view.isFull ? 'Rương đã đầy · nhận để tích tiếp' : view.claimable ? 'Có thưởng — chạm rương để nhận' : 'Chưa có thưởng');
  sceneState.root.dataset.chestState = view.isFull ? 'full' : view.claimable ? 'ready' : 'empty';
  for (const [key] of sceneRewards) {
    const n = sceneNumber(view.pendingReward[key] || 0);
    for (const el of sceneState.root.querySelectorAll('[data-afk-amount="' + key + '"]')) if (el.textContent !== n) el.textContent = n;
  }
  for (const progress of sceneState.root.querySelectorAll('[data-afk-progress]')) {
    progress.value = view.storedSeconds; progress.max = view.capSeconds;
    progress.setAttribute('aria-valuetext', clock + ' / 15 giờ');
  }
  const claim = sceneState.root.querySelector('[data-hv-afk-claim]');
  if (claim) {
    claim.disabled = !view.claimable;
    claim.textContent = view.isFull ? 'Nhận thưởng · rương đầy' : view.claimable ? 'Nhận thưởng' : 'Chưa có thưởng';
  }
  sceneState.root.querySelector('.cs-chest-fab')?.classList.toggle('is-ready', view.claimable);
  sceneState.root.querySelector('.cs-chest-fab')?.classList.toggle('is-full', view.isFull);
  setSceneText('[data-scene-gold]', sceneNumber(P.gold)); setSceneText('[data-scene-gems]', sceneNumber(P.gems));
  refreshStamina();
  setSceneText('[data-scene-stamina]', P.stamina + '/' + DATA.daily.stamCap);
  if (sceneState.draft) updateLaunchState();
}
function mountScene() {
  if (sceneState.root) { observeSceneCanvas(); return; }
  const root = document.createElement('section'); root.id = 'hvCampaignScene'; root.hidden = true;
  root.setAttribute('aria-label', 'Chinh chiến');
  root.innerHTML = `<div class="cs-home"><header class="cs-header"><img class="cs-avatar" data-scene-avatar src="assets/ui/menu-v3233/icons/profile-ong-pho-imagen.png" alt=""><div><span class="cs-eyebrow">LỤC THẦN</span><b class="cs-leader" data-scene-leader></b><small>Lực chiến <strong data-scene-power></strong></small></div><div class="cs-wallet"><span><img src="assets/ui/menu-v3233/icons/resource-gold-imagen.png" alt="Vàng"><b data-scene-gold></b></span><span><img src="assets/ui/menu-v3233/icons/resource-gem-imagen.png" alt="Ngọc"><b data-scene-gems></b></span><span><img src="assets/ui/menu-v3233/icons/resource-energy-imagen.png" alt="Thể lực"><b data-scene-stamina></b></span></div></header>
    <main class="cs-scroll"><section class="cs-landscape"><div class="cs-route"><span class="cs-eyebrow" data-scene-chapter></span><h1 data-scene-title></h1><button type="button" class="cs-stage-pill" data-scene-action="open-stages" aria-label="Xem tiến độ ải">Ải <b data-scene-stage-label>—</b></button></div><button type="button" class="cs-minimap" data-scene-action="open-map" aria-label="Mở bản đồ hành quân"><span class="cs-map-art"><img src="assets/ui/campaign/campaign-map-v3.webp" alt="Tuyến đường qua làng và cổng thành"><i data-map-viewport aria-hidden="true"></i><i data-map-party aria-hidden="true"></i></span><span>Bản đồ</span></button><canvas class="cs-canvas" aria-label="Đội tướng đang thám hiểm"></canvas><div class="cs-hud"><button type="button" class="cs-chest-fab" data-scene-action="open-chest" aria-label="Rương treo máy"><img src="assets/ui/campaign-v1/afk-chest-v1.webp" alt=""><time data-afk-time>00:00:00</time><progress data-afk-progress value="0" max="54000" aria-label="Thời gian tích lũy"></progress></button><button type="button" class="cs-swap" data-scene-action="prepare">Đổi đội hình</button><button type="button" class="cs-primary" data-hv-afk-challenge>Khiêu chiến</button></div></section></main>
    <nav class="cs-dock" aria-label="Điều hướng game">${sceneDock.map(([target, icon, label]) => `<button data-scene-nav="${target}" ${target === 'campaign' ? 'aria-current="page"' : ''}><img src="assets/ui/menu-v3233/icons/${icon}.png" alt="">${label}</button>`).join('')}</nav></div>
    <section class="cs-prepare" hidden aria-labelledby="csPrepareTitle"></section>
    <dialog class="cs-chest-sheet" aria-labelledby="csChestTitle"><button type="button" class="cs-sheet-close" data-scene-action="close-chest" aria-label="Đóng">×</button><span class="cs-eyebrow">THU HOẠCH TREO MÁY</span><h2 id="csChestTitle">Rương treo máy</h2><p data-afk-status></p><div class="cs-time"><time data-afk-time>00:00:00</time><span>/ 15:00:00</span></div><progress data-afk-progress value="0" max="54000" aria-label="Thời gian tích lũy"></progress><p class="cs-cap-note">Tối đa 15 giờ</p><div class="cs-rewards">${sceneRewards.map(([key, name, src]) => `<div><img src="${src}" alt=""><b data-afk-amount="${key}">0</b><small>${name}</small></div>`).join('')}</div><button type="button" class="cs-secondary cs-claim" data-hv-afk-claim disabled>Nhận thưởng</button></dialog>
    <dialog class="cs-map-sheet" aria-labelledby="csMapTitle"><button type="button" class="cs-sheet-close" data-scene-action="close-map" aria-label="Đóng bản đồ">×</button><h2 id="csMapTitle">Đường hành quân</h2><span class="cs-map-art"><img src="assets/ui/campaign/campaign-map-v3.webp" alt="Tuyến đường qua làng và cổng thành"><i data-map-viewport aria-hidden="true"></i><i data-map-party aria-hidden="true"></i></span><p>Điểm vàng: đội hình · Khung sáng: vùng đang xem</p></dialog>
    <dialog class="cs-stages-sheet" aria-labelledby="csStagesTitle"><button type="button" class="cs-sheet-close" data-scene-action="close-stages" aria-label="Đóng">×</button><h2 id="csStagesTitle">Tiến độ chương</h2><ol class="cs-milestones" aria-label="Tiến độ chương" data-scene-stages></ol></dialog>
    <dialog class="cs-receipt" aria-labelledby="csReceiptTitle"><span class="cs-eyebrow">THU HOẠCH TREO MÁY</span><h2 id="csReceiptTitle">Đã nhận thưởng</h2><p>Hành trang đã được bổ sung.<br>Đội tiếp tục tích lũy cho chuyến đi mới.</p><div class="cs-rewards" data-claim-receipt></div><button type="button" class="cs-primary" data-scene-action="close-receipt">Tiếp tục</button></dialog>`;
  document.body.appendChild(root); sceneState.root = root; sceneState.canvas = root.querySelector('canvas');
  mountPreparationView();
  root.addEventListener('click', sceneClick);
  root.querySelector('.cs-receipt')?.addEventListener('close', () => { if (sceneState.active) root.querySelector('[data-hv-afk-challenge]')?.focus(); });
  observeSceneCanvas();
}
function observeSceneCanvas() {
  sceneState.resizeObserver?.disconnect(); sceneState.resizeObserver = null;
  if (!sceneState.scope?.isActive() || !sceneState.canvas || typeof ResizeObserver === 'undefined') return;
  const observer = new ResizeObserver(resizeScene);
  observer.observe(sceneState.canvas);
  sceneState.resizeObserver = observer;
  sceneState.scope.add(() => {
    observer.disconnect();
    if (sceneState.resizeObserver === observer) sceneState.resizeObserver = null;
  });
}
function mountPreparationView() {
  const panel = sceneState.root.querySelector('.cs-prepare');
  panel.innerHTML = `<header class="cs-prep-header"><button class="cs-back" data-scene-action="cancel" aria-label="Về Chinh chiến">‹</button><div><small data-prep-stage></small><h2 id="csPrepareTitle">Bày trận</h2></div><span aria-label="Lực chiến hai đội">Ta <b data-prep-power></b><br>Địch <b data-prep-enemy-power></b></span><b class="cs-team-count"></b></header>
    <div class="cs-battlefield"><div data-prep-slots class="cs-slots"></div><div class="cs-enemy-labels" data-prep-enemy-labels></div></div>
    <div class="cs-prep-scroll"><p class="cs-instruction">Bấm tướng trên sân để gỡ. Chọn ô trống rồi chọn dự bị để thêm. Kéo tướng trên sân để đổi chỗ.</p><div class="cs-element-filter" role="group" aria-label="Lọc hệ"></div><div class="cs-bench" data-prep-bench></div></div>
    <footer class="cs-prep-footer"><p data-prep-status role="status"></p><div class="cs-prep-actions"><button class="cs-primary" data-scene-action="quick">Ra trận nhanh</button><button class="cs-primary" data-scene-action="launch">Xuất chiến</button></div><small>Đội hình được lưu khi Xuất chiến.</small></footer>`;
  const filter = panel.querySelector('.cs-element-filter');
  const elements = [...new Set(ownedSceneHeroIds().map(id => DATA.heroes[id].he))];
  for (const he of ['all', ...elements]) {
    const button = document.createElement('button'); button.type = 'button';
    button.dataset.sceneElement = he; button.setAttribute('aria-pressed', String(he === 'all'));
    button.textContent = he === 'all' ? 'Tất cả' : HE[he]?.nm || he;
    filter.append(button);
  }
  panel.addEventListener('pointerdown', event => {
    const button = event.target.closest('[data-scene-slot]');
    if (!button || event.button !== 0 || event.isPrimary === false || preparationDrag || !sceneState.draft) return;
    const from = Number(button.dataset.sceneSlot);
    const heroId = expandCampaignBoard(sceneState.draft)[from]?.id;
    suppressSlotClick = false;
    if (!heroId) return;
    preparationDrag = { pointer: event.pointerId, button, from, heroId, x: event.clientX, y: event.clientY, moved: false };
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
  });
  panel.addEventListener('pointermove', event => {
    if (!preparationDrag || preparationDrag.pointer !== event.pointerId) return;
    preparationDrag.moved ||= Math.hypot(event.clientX - preparationDrag.x, event.clientY - preparationDrag.y) > 8;
    preparationDrag.dx = event.clientX - preparationDrag.x; preparationDrag.dy = event.clientY - preparationDrag.y;
    if (preparationDrag.moved) { event.preventDefault(); if (reducedMotion.matches) drawScene(performance.now()); }
  });
  panel.addEventListener('pointerup', event => {
    const drag = preparationDrag;
    if (!drag || drag.pointer !== event.pointerId) return;
    clearPreparationDrag();
    if (!drag.moved || !sceneState.draft) return;
    suppressSlotClick = true;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-scene-slot]');
    if (target) {
      sceneState.draft = swapCampaignPositions(sceneState.draft, drag.from, Number(target.dataset.sceneSlot));
      sceneState.slot = -1;
      renderPreparation();
    }
  });
  const cancelDrag = event => { if (preparationDrag?.pointer === event.pointerId) clearPreparationDrag(); };
  panel.addEventListener('pointercancel', cancelDrag);
  panel.addEventListener('lostpointercapture', cancelDrag);
}

function renderPreparationField() {
  const draft = sceneState.draft, board = expandCampaignBoard(draft);
  setSceneText('.cs-team-count', draft.length + ' / 6');
  sceneState.root.querySelector('[data-prep-slots]').innerHTML = board.map((pick, index) => {
    const left = index < 3 ? 35 : 12, top = 38 + (index % 3) * 27;
    const selected = sceneState.slot === index ? ' is-selected' : '';
    if (!pick) {
      return `<button class="cs-field-unit is-empty${selected}" data-scene-slot="${index}" style="left:${left}%;top:${top}%" aria-label="Ô trống ${index < 3 ? 'hàng trước' : 'hàng sau'} ${(index % 3) + 1}"></button>`;
    }
    return `<button class="cs-field-unit${selected}" data-scene-slot="${index}" style="left:${left}%;top:${top}%" aria-label="Gỡ ${escapeScene(DATA.heroes[pick.id].name)} khỏi đội hình"><span>${'★'.repeat(heroStars(pick.id))} · Lv${heroLevel(pick.id)}</span><small>${escapeScene(DATA.heroes[pick.id].name)}</small></button>`;
  }).join('');
  sceneState.root.querySelector('[data-prep-enemy-labels]').innerHTML = preparationEnemies().map(enemy => {
    const rowIndex = Number.isInteger(Number(enemy.slot)) ? Number(enemy.slot) % 3 : 0;
    return `<span class="cs-field-enemy" style="left:${enemy.row === 'front' ? 65 : 88}%;top:${38 + rowIndex * 27}%">${escapeScene(enemy.name)}</span>`;
  }).join('');
  for (const button of sceneState.root.querySelectorAll('[data-scene-hero]')) {
    const id = button.dataset.sceneHero, deployed = draft.some(pick => pick.id === id);
    button.setAttribute('aria-pressed', String(deployed));
    button.setAttribute('aria-label', (deployed ? 'Gỡ ' : 'Ra trận ') + DATA.heroes[id].name);
    const tick = document.createElement('span'); tick.className = 'cs-deployed-tick';
    tick.textContent = deployed ? '✓' : ''; tick.setAttribute('aria-hidden','true'); button.append(tick);
  }
  const selectedElement = sceneState.root.querySelector('[data-scene-element][aria-pressed="true"]')?.dataset.sceneElement || 'all';
  for (const button of sceneState.root.querySelectorAll('[data-scene-hero]')) button.hidden = selectedElement !== 'all' && DATA.heroes[button.dataset.sceneHero].he !== selectedElement;
  resizeScene();
}
function renderScene() {
  if (!P) return;
  mountScene(); ensureSceneChest();
  const checkpoint = currentCheckpoint(), squad = savedSceneSquad();
  setSceneText('[data-scene-leader]', DATA.heroes[squad[0]?.id]?.name || 'Người dẫn đường');
  setSceneText('[data-scene-power]', sceneNumber(scenePower(squad)));
  if (squad[0]) sceneState.root.querySelector('[data-scene-avatar]').src = portraitSrc(squad[0].id, 'avatar');
  setSceneText('[data-scene-chapter]', checkpoint ? 'CHƯƠNG ' + (checkpoint.chapterIndex + 1) + (checkpoint.replay ? ' · ÔN LẠI' : ' · CHINH CHIẾN') : 'CHINH CHIẾN');
  setSceneText('[data-scene-title]', checkpoint?.title || 'Lộ Ấn');
  setSceneText('[data-scene-stage-label]', checkpoint ? (checkpoint.chapterIndex + 1) + '–' + (checkpoint.stageIndex + 1) : '—');
  setSceneText('[data-scene-objective]', checkpoint ? 'Ải ' + (checkpoint.chapterIndex + 1) + '–' + (checkpoint.stageIndex + 1) : 'Chưa có ải được mở');
  sceneState.root.querySelector('[data-scene-stages]').innerHTML = checkpoint ? Array.from({ length: checkpoint.stageCount }, (_, i) => `<li ${i === checkpoint.stageIndex ? 'aria-current="step"' : ''} class="${i < checkpoint.stageIndex ? 'is-complete' : ''}"><span>${i < checkpoint.stageIndex ? '✓' : i + 1}</span><small>${i === checkpoint.stageCount - 1 ? 'Thủ lĩnh' : 'Ải ' + (i + 1)}</small></li>`).join('') : '';
  sceneState.canvas.setAttribute('aria-label', 'Đội đang thám hiểm: ' + squad.map(pick => DATA.heroes[pick.id].name).join(', '));
  sceneState.root.querySelector('[data-hv-afk-challenge]').disabled = !checkpoint;
  updateSceneNumbers();
}
function onSceneRoute(name) {
  sceneState.active = name === 'campaign';
  document.body.classList.toggle('hv-campaign-active', sceneState.active);
  if (!sceneState.active) {
    clearPreparationDrag(); suppressSlotClick = false;
    stopSceneClock(); sceneState.draft = null; sceneState.launching = false;
    sceneState.scope?.dispose(); sceneState.scope = null;
    if (sceneState.root) {
      const dialogs = sceneState.root.querySelectorAll?.('dialog');
      if (dialogs) dialogs.forEach(dialog => { try { dialog.close(); } catch (_) {} });
      else sceneState.root.querySelector?.('dialog')?.close?.();
      sceneState.root.hidden = true;
    }
    sceneDiagnosticSnapshot();
    return;
  }
  if (!sceneState.scope?.isActive()) {
    sceneState.scope = createSceneLifetime('campaign');
    sceneState.activationGeneration += 1;
    sceneState.farmTime = 0;
  }
  sceneState.draft = null; sceneState.checkpoint = null; sceneState.launching = false;
  renderScene(); sceneState.root.hidden = false;
  sceneState.root.querySelector('.cs-home').hidden = false;
  sceneState.root.querySelector('.cs-prepare').hidden = true;
  sceneState.root.querySelector('.cs-landscape').append(sceneState.canvas);
  startSceneClock();
  sceneDiagnosticSnapshot();
}
function openPreparation() {
  if (!sceneState.active || sceneState.launching) return;
  const checkpoint = currentCheckpoint();
  if (!checkpoint) { toast('Chưa có ải nào được mở.'); return; }
  sceneState.checkpoint = checkpoint; sceneState.draft = savedSceneSquad().map(pick => ({ ...pick })); sceneState.slot = -1;
  sceneState.root.querySelector('.cs-home').hidden = true;
  sceneState.root.querySelector('.cs-prepare').hidden = false;
  sceneState.root.querySelector('.cs-battlefield').prepend(sceneState.canvas);
  const background = selectBattleBackground(checkpoint.battleId);
  sceneState.root.querySelector('.cs-battlefield').style.backgroundImage = `url('${background.source}')`;
  setSceneText('[data-prep-stage]', 'ẢI ' + (checkpoint.chapterIndex + 1) + '–' + (checkpoint.stageIndex + 1));
  setSceneText('[data-prep-title]', checkpoint.title);
  const encounter = DATA.encounters[checkpoint.battleId];
  // Do not execute dynamic encounter factories just to preview a screen.
  const names = Array.isArray(encounter) ? [...new Set(encounter.map(enemy => enemy.name))] : [];
  setSceneText('[data-prep-enemies]', names.length ? 'Đối thủ: ' + names.join(' · ') : 'Đối thủ sẽ xuất hiện trên chiến trường.');
  renderPreparation(); startSceneClock(); sceneState.root.querySelector('.cs-back').focus();
}
function renderPreparation(focusSelector) {
  const draft = sceneState.draft; if (!draft) return;
  setSceneText('[data-prep-power]', sceneNumber(scenePower(draft)));
  const enemyPower = preparationEnemyPower();
  setSceneText('[data-prep-enemy-power]', enemyPower === null ? '—' : sceneNumber(enemyPower));

  const owned = ownedSceneHeroIds();
  setSceneText('[data-prep-owned-count]', owned.length + ' tướng');
  sceneState.root.querySelector('[data-prep-bench]').innerHTML = owned.map(id => `<button data-scene-hero="${escapeScene(id)}" class="cs-bench-hero ${draft.some(pick => pick.id === id) ? 'is-deployed' : ''}" aria-label="Đổi vị trí ${sceneState.slot + 1} thành ${escapeScene(DATA.heroes[id].name)}"><img src="${escapeScene(portraitSrc(id, 'card'))}" alt=""><b>${escapeScene(DATA.heroes[id].name)}</b><small>${draft.some(pick => pick.id === id) ? 'Đang ra trận' : 'Cấp ' + heroLevel(id)}</small></button>`).join('');
  updateLaunchState();
  renderPreparationField();
  if (focusSelector) sceneState.root.querySelector(focusSelector)?.focus();
}
function updateLaunchState() {
  const button = sceneState.root.querySelector('[data-scene-action="launch"]');
  const cost = DATA.daily.costCampaign || DATA.daily.chapterCost || 6;
  const validation = prepareFormationChange(P, DATA.heroes, sceneState.draft, { allowPartial: true });
  const enough = P.stamina >= cost;
  button.disabled = sceneState.launching || !validation.ok || !enough;
  button.textContent = sceneState.launching ? 'Đang xuất chiến…' : 'Xuất chiến · ' + cost + ' thể lực';
  setSceneText('[data-prep-status]', !validation.ok ? validation.message : !enough ? 'Cần thêm ' + (cost - P.stamina) + ' thể lực để xuất chiến.' : 'Sẵn sàng · thể lực hiện có ' + P.stamina + '/' + DATA.daily.stamCap);
}
function cancelPreparation() {
  clearPreparationDrag(); suppressSlotClick = false;
  sceneState.draft = null; sceneState.checkpoint = null;
  sceneState.root.querySelector('.cs-prepare').hidden = true;
  sceneState.root.querySelector('.cs-home').hidden = false;
  sceneState.root.querySelector('.cs-landscape').append(sceneState.canvas);
  renderScene(); startSceneClock(); sceneState.root.querySelector('[data-hv-afk-challenge]').focus();
}
function launchPreparedBattle() {
  if (sceneState.launching || !sceneState.draft || !sceneState.active) return;
  refreshStamina(); const checkpoint = currentCheckpoint();
  if (!checkpoint || checkpoint.key !== sceneState.checkpoint?.key) { toast('Tiến độ đã thay đổi. Hãy kiểm tra lại ải.'); cancelPreparation(); return; }
  const valid = prepareFormationChange(P, DATA.heroes, sceneState.draft, { allowPartial: true });
  if (!valid.ok || P.stamina < (DATA.daily.costCampaign || DATA.daily.chapterCost || 6)) { updateLaunchState(); return; }
  sceneState.launching = true; updateLaunchState();
  try {
    if (JSON.stringify(P.squad) !== JSON.stringify(valid.squad)) {
      const result = saveFormationCommand(valid.squad, undefined, { allowPartial: true });
      if (!result.ok) { toast(result.message || 'Chưa lưu được đội hình.'); return; }
    }
    // startChapter remains the sole owner of stamina, encounter and continuation.
    startChapter(checkpoint.chapterIndex, { fromAfkChest: true });
  } finally {
    sceneState.launching = false;
    if (sceneState.active && sceneState.draft) updateLaunchState();
  }
}
function grantSceneClaim() {
  if (!sceneState.active || sceneState.claiming) return;
  const state = ensureSceneChest(), now = Date.now(), view = getAfkChestView(state, { now });
  if (!view.claimable) { updateSceneNumbers(); return; }
  const transaction = window.HonVietTransaction;
  if (!transaction?.commit) { toast('Hệ thống lưu thưởng chưa sẵn sàng.'); return; }
  sceneState.claiming = true;
  try {
    let outcome;
    const result = transaction.commit({ commandId: 'afk.chest.claim:' + (state.claimCount || 0) + ':' + (state.lastAccruedAt || now),
      cost: {}, balances: {}, source: 'afk-chest', reason: 'claim-afk-reward', reward: view.pendingReward,
      applyRewardFn: reward => applyReward(reward),
      mutate: draft => { outcome = claimAfkChest(draft.hvAfkChest, { now }); if (!outcome.changed) return { ok: false, code: outcome.reason }; draft.hvAfkChest = outcome.state; return { ok: true, claimCount: outcome.state.claimCount }; }
    });
    updateSceneNumbers();
    if (!result?.ok) { toast(result?.message || 'Chưa nhận được thưởng AFK.'); return; }
    refreshResbar();
    if (!result.duplicate && outcome?.changed) {
      sceneState.root.querySelector('.cs-chest-sheet')?.close();
      sceneState.root.querySelector('[data-claim-receipt]').innerHTML = sceneRewards.filter(([key]) => outcome.reward[key] > 0).map(([key, name, src]) => `<div><img src="${src}" alt=""><b>+${sceneNumber(outcome.reward[key])}</b><small>${name}</small></div>`).join('');
      sceneState.root.querySelector('.cs-receipt')?.showModal();
    }
  } finally {
    sceneState.claiming = false;
  }
}
function sceneClick(event) {
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.sceneNav) { navTo(button.dataset.sceneNav); return; }
  if (button.hasAttribute('data-hv-afk-claim')) { grantSceneClaim(); return; }
  if (button.dataset.sceneAction === 'open-chest') {
    const sheet = sceneState.root.querySelector('.cs-chest-sheet');
    if (sheet && !sheet.open) sheet.showModal();
    return;
  }
  if (button.dataset.sceneAction === 'close-chest') { sceneState.root.querySelector('.cs-chest-sheet')?.close(); return; }
  if (button.dataset.sceneAction === 'open-map') {
    const sheet = sceneState.root.querySelector('.cs-map-sheet');
    if (sheet && !sheet.open) sheet.showModal();
    return;
  }
  if (button.dataset.sceneAction === 'close-map') { sceneState.root.querySelector('.cs-map-sheet')?.close(); return; }
  if (button.dataset.sceneAction === 'open-stages') {
    const sheet = sceneState.root.querySelector('.cs-stages-sheet');
    if (sheet && !sheet.open) sheet.showModal();
    return;
  }
  if (button.dataset.sceneAction === 'close-stages') { sceneState.root.querySelector('.cs-stages-sheet')?.close(); return; }
  if (button.hasAttribute('data-hv-afk-challenge') || button.dataset.sceneAction === 'prepare') { openPreparation(); return; }
  if (button.dataset.sceneAction === 'cancel') { cancelPreparation(); return; }
  if (button.dataset.sceneAction === 'launch') { launchPreparedBattle(); return; }
  if (button.dataset.sceneAction === 'close-receipt') { sceneState.root.querySelector('.cs-receipt')?.close(); return; }
  if (!sceneState.draft) return;
  if (button.dataset.sceneElement) {
    for (const filter of sceneState.root.querySelectorAll('[data-scene-element]')) filter.setAttribute('aria-pressed', String(filter === button));
    renderPreparation(); return;
  }
  if (button.dataset.sceneAction === 'quick') {
    sceneState.draft = ownedSceneHeroIds().sort((a,b) => heroPower(b) - heroPower(a)).slice(0,6).map((id,i) => ({ id, row: i < 3 ? 'front' : 'back', slot: i }));
    renderPreparation(); return;
  }
  if (button.hasAttribute('data-scene-slot')) {
    if (suppressSlotClick) { suppressSlotClick = false; return; }
    const index = Number(button.dataset.sceneSlot);
    const pick = expandCampaignBoard(sceneState.draft)[index];
    if (pick) {
      sceneState.draft = toggleCampaignHero(sceneState.draft, pick.id, ownedSceneHeroIds());
      sceneState.slot = -1;
      renderPreparation();
      return;
    }
    sceneState.slot = index;
    renderPreparation('[data-scene-slot="' + index + '"]');
  }
  else if (button.hasAttribute('data-scene-row')) { const index = Number(button.dataset.sceneRow); sceneState.draft = swapCampaignRows(sceneState.draft, index); sceneState.slot = index < 3 ? index + 3 : index - 3; renderPreparation('[data-scene-row="' + sceneState.slot + '"]'); }
  else if (button.dataset.sceneHero) {
    const id = button.dataset.sceneHero;
    const board = expandCampaignBoard(sceneState.draft);
    const selected = sceneState.slot;
    if (Number.isInteger(selected) && selected >= 0 && selected < 6 && !board[selected] && !sceneState.draft.some(pick => pick.id === id)) {
      if (sceneState.draft.length === 6) { toast('Số lượng tướng ra trận đã đủ.'); return; }
      sceneState.draft = replaceCampaignSlot(sceneState.draft, selected, id, ownedSceneHeroIds());
      sceneState.slot = -1;
      renderPreparation('[data-scene-hero="' + id + '"]');
      return;
    }
    if (sceneState.draft.length === 6 && !sceneState.draft.some(pick => pick.id === id)) { toast('Số lượng tướng ra trận đã đủ.'); return; }
    sceneState.draft = toggleCampaignHero(sceneState.draft, id, ownedSceneHeroIds());
    sceneState.slot = Math.min(sceneState.slot, 5);
    renderPreparation('[data-scene-hero="' + id + '"]');
  }
}
window.HonVietCampaignScene = Object.freeze({ render: renderScene, onRoute: onSceneRoute, prepare: openPreparation });
// Preserve the existing AFK debug contract for saves and QA tools.
window.__HV_AFK_CHEST_RUNTIME_V1 = { module: { AFK_CHEST_SCHEMA, AFK_CAP_SECONDS, createAfkChestState, normalizeAfkChestState, accrueAfkChest, getAfkChestView, claimAfkChest }, render: renderScene, claim: grantSceneClaim, challenge: openPreparation };
function bootCampaignScene() {
  if (sceneState.booted) return;
  sceneState.booted = true;
  window.renderCampaign = renderScene;
  onSceneRoute(ST.screen);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSceneClock();
    else if (sceneState.active) startSceneClock();
  });
  reducedMotion.addEventListener('change', () => { if (sceneState.active) startSceneClock(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sceneState.active && sceneState.draft) { event.preventDefault(); cancelPreparation(); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootCampaignScene, { once: true }); else bootCampaignScene();
