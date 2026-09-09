/* Presentation owner for Chinh chiến. Rewards and battles keep their domain owners. */
const sceneState = { root: null, canvas: null, active: false, scope: null, resizeObserver: null,
  raf: 0, rafRelease: null, timer: 0, timerRelease: null, booted: false,
  lastFrame: 0, width: 390, height: 300, draft: null, slot: 0, checkpoint: null, launching: false,
  activationGeneration: 0 };
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
function preparationEnemies() {
  const encounter = DATA.encounters[sceneState.checkpoint?.battleId];
  return Array.isArray(encounter) ? encounter.slice(0,6).map(enemy => ({ ...enemy, id: enemy.sourceHeroId || enemy.heroId || enemy.id, enemy: true })) : [];
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

function currentCheckpoint() { return campaignCheckpoint(P, DATA.chapters, chapterBattleSequence); }
function ownedSceneHeroIds() { return OFFICIAL_ROSTER_12_IDS.filter(id => DATA.heroes[id] && P.heroes[id]?.owned); }
function savedSceneSquad() {
  const picks = normalizeSquad(P.squad, P, false).map(pick => ({ ...pick }));
  // Use the combat owner's six-slot layout on copies, never change the save here.
  assignFormationSlots(picks, 'ally');
  return picks.sort((a, b) => a.slot - b.slot).map(({ id, row }) => ({ id, row }));
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
function drawScene(time) {
  const canvas = sceneState.canvas;
  if (!canvas || !sceneState.active) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const w = sceneState.width, h = sceneState.height, dpr = canvas.width / w;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const preparing = Boolean(sceneState.draft);
  const picks = preparing ? [...sceneState.draft, ...preparationEnemies()] : savedSceneSquad();
  const rowCounts = { front: 0, back: 0, enemyfront: 0, enemyback: 0 };
  picks.map(pick => ({ ...pick, rowIndex: rowCounts[(pick.enemy ? 'enemy' : '') + pick.row]++ }))
    .sort((a, b) => (a.row === 'back' ? 0 : 1) - (b.row === 'back' ? 0 : 1))
    .forEach(pick => {
      const count = rowCounts[pick.row];
      let x = preparing ? w * (pick.enemy ? (pick.row === 'front' ? .65 : .88) : (pick.row === 'front' ? .35 : .12)) : w * (.2 + .6 * (pick.rowIndex + .5) / Math.max(3, count)) + (pick.row === 'front' ? w * .09 : 0);
      let y = preparing ? h * (.38 + .27 * pick.rowIndex) : h * (pick.row === 'front' ? .81 : .60);
      if (preparing && !pick.enemy && preparationDrag?.heroId === pick.id && preparationDrag.moved) {
        x += preparationDrag.dx || 0; y += preparationDrag.dy || 0;
      }
      const bodyH = preparing ? Math.min(w * .23, h * .28) : Math.min(108, w * .24, h * .34) * (pick.row === 'back' ? .86 : 1);
      ctx.fillStyle = 'rgba(15,30,23,.24)'; ctx.beginPath(); ctx.ellipse(x, y, bodyH * .31, bodyH * .075, 0, 0, Math.PI * 2); ctx.fill();
      const spec = spriteSpecs[pick.id];
      const image = imageForScene(spec?.src || portraitSrc(pick.id, 'master'));
      if (!image.complete || image.naturalWidth < 1) return;
      ctx.save();
      if (pick.enemy) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
      if (spec) {
        const frame = frameAt(spec, time), scale = bodyH / spec.body;
        const sx = frame % spec.cols * (spec.strideW || spec.cellW) + (spec.pad || 0);
        const sy = Math.floor(frame / spec.cols) * (spec.strideH || spec.cellH) + (spec.pad || 0);
        ctx.drawImage(image, sx, sy, spec.cellW, spec.cellH, x - spec.pivot * scale, y - spec.foot * scale, spec.cellW * scale, spec.cellH * scale);
      } else {
        const scale = bodyH / image.naturalHeight;
        ctx.drawImage(image, x - image.naturalWidth * scale / 2, y - bodyH, image.naturalWidth * scale, bodyH);
      }
      ctx.restore();
    });
}
function sceneTick(time) {
  sceneState.rafRelease?.(); sceneState.rafRelease = null;
  sceneState.raf = 0;
  if (!sceneState.active || document.hidden) return;
  if (time - sceneState.lastFrame >= 32) { drawScene(time); sceneState.lastFrame = time; }
  if (!reducedMotion.matches) sceneState.raf = scheduleSceneFrame();
}
function resizeScene() {
  if (!sceneState.canvas || !sceneState.active) return;
  const box = sceneState.canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  sceneState.width = box.width; sceneState.height = box.height;
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
  setSceneText('[data-afk-time]', sceneClock(view.storedSeconds));
  setSceneText('[data-afk-status]', view.isFull ? 'Rương đã đầy · nhận để tích tiếp' : 'Tích lũy cả khi anh vắng mặt');
  sceneState.root.dataset.chestState = view.isFull ? 'full' : view.claimable ? 'ready' : 'empty';
  for (const [key] of sceneRewards) setSceneText('[data-afk-amount="' + key + '"]', sceneNumber(view.pendingReward[key] || 0));
  const progress = sceneState.root.querySelector('[data-afk-progress]');
  progress.value = view.storedSeconds; progress.max = view.capSeconds;
  progress.setAttribute('aria-valuetext', sceneClock(view.storedSeconds) + ' / 15 giờ');
  const claim = sceneState.root.querySelector('[data-hv-afk-claim]');
  claim.disabled = !view.claimable;
  claim.textContent = view.isFull ? 'Nhận thưởng · rương đầy' : 'Nhận thưởng';
  setSceneText('[data-scene-gold]', sceneNumber(P.gold)); setSceneText('[data-scene-gems]', sceneNumber(P.gems));
  refreshStamina();
  setSceneText('[data-scene-stamina]', P.stamina + '/' + DATA.daily.stamCap);
  if (sceneState.draft) updateLaunchState();
}
function mountScene() {
  if (sceneState.root) { observeSceneCanvas(); return; }
  const root = document.createElement('section'); root.id = 'hvCampaignScene'; root.hidden = true;
  root.setAttribute('aria-label', 'Chinh chiến');
  root.innerHTML = `<div class="cs-home"><header class="cs-header"><img class="cs-avatar" data-scene-avatar src="assets/ui/menu-v3233/icons/profile-ong-pho-imagen.png" alt=""><div><span class="cs-eyebrow">HỒN VIỆT · MỘNG GIỚI</span><b class="cs-leader" data-scene-leader></b><small>Lực chiến <strong data-scene-power></strong></small></div><div class="cs-wallet"><span><img src="assets/ui/menu-v3233/icons/resource-gold-imagen.png" alt="Vàng"><b data-scene-gold></b></span><span><img src="assets/ui/menu-v3233/icons/resource-gem-imagen.png" alt="Ngọc"><b data-scene-gems></b></span><span><img src="assets/ui/menu-v3233/icons/resource-energy-imagen.png" alt="Thể lực"><b data-scene-stamina></b></span></div></header>
+    <main class="cs-scroll"><section class="cs-landscape"><div class="cs-route"><span class="cs-eyebrow" data-scene-chapter></span><h1 data-scene-title></h1><ol class="cs-milestones" aria-label="Tiến độ chương" data-scene-stages></ol></div><canvas class="cs-canvas" aria-label="Đội tướng đang thám hiểm"></canvas><div class="cs-field-caption"><span class="cs-live-dot"></span> Đội đang thám hiểm <button data-scene-action="prepare">Đổi đội hình <span aria-hidden="true">›</span></button></div></section>
+    <div class="cs-content"><section class="cs-chest" aria-labelledby="csChestTitle"><div class="cs-chest-heading"><img src="assets/ui/campaign-v1/afk-chest-v1.webp" alt=""><div><span class="cs-eyebrow">THU HOẠCH TRÊN MỘNG LỘ</span><h2 id="csChestTitle">Rương treo máy</h2><p data-afk-status></p></div><span class="cs-cap">15 giờ<small>tối đa</small></span></div><div class="cs-time"><time data-afk-time>00:00:00</time><span>/ 15:00:00</span></div><progress data-afk-progress value="0" max="54000" aria-label="Thời gian tích lũy"></progress><div class="cs-rewards">${sceneRewards.map(([key, name, src]) => `<div><img src="${src}" alt=""><b data-afk-amount="${key}">0</b><small>${name}</small></div>`).join('')}</div><button class="cs-secondary cs-claim" data-hv-afk-claim disabled>Nhận thưởng</button></section>
+    <section class="cs-next"><div><span class="cs-eyebrow">MỤC TIÊU TIẾP THEO</span><b data-scene-objective></b></div><button class="cs-primary" data-hv-afk-challenge>Khiêu chiến <span aria-hidden="true">→</span></button></section><p class="cs-footnote">Nhận thưởng để giải phóng rương. Thời gian vượt 15 giờ không cộng bù.</p></div></main>
+    <nav class="cs-dock" aria-label="Điều hướng game">${sceneDock.map(([target, icon, label]) => `<button data-scene-nav="${target}" ${target === 'campaign' ? 'aria-current="page"' : ''}><img src="assets/ui/menu-v3233/icons/${icon}.png" alt="">${label}</button>`).join('')}</nav></div>
+    <section class="cs-prepare" hidden aria-labelledby="csPrepareTitle"></section>
+    <dialog class="cs-receipt" aria-labelledby="csReceiptTitle"><span class="cs-eyebrow">THU HOẠCH MỘNG LỘ</span><h2 id="csReceiptTitle">Đã nhận thưởng</h2><p>Hành trang đã được bổ sung.<br>Đội tiếp tục tích lũy cho chuyến đi mới.</p><div class="cs-rewards" data-claim-receipt></div><button class="cs-primary" data-scene-action="close-receipt">Tiếp tục</button></dialog>`.replace(/^\+/gm, '');
  document.body.appendChild(root); sceneState.root = root; sceneState.canvas = root.querySelector('canvas');
  mountPreparationView();
  root.addEventListener('click', sceneClick);
  root.querySelector('dialog').addEventListener('close', () => { if (sceneState.active) root.querySelector('[data-hv-afk-challenge]').focus(); });
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
  panel.innerHTML = `<header class="cs-prep-header"><button class="cs-back" data-scene-action="cancel" aria-label="Về Chinh chiến">‹</button><div><small data-prep-stage></small><h2 id="csPrepareTitle">Bày trận</h2></div><span>Lực chiến <b data-prep-power></b></span><b class="cs-team-count"></b></header>
    <div class="cs-battlefield"><div data-prep-slots class="cs-slots"></div><div class="cs-enemy-labels" data-prep-enemy-labels></div></div>
    <div class="cs-prep-scroll"><p class="cs-instruction">Bấm tích xanh để gỡ tướng. Chọn dự bị để thêm. Kéo tướng trên sân để đổi chỗ.</p><div class="cs-element-filter" role="group" aria-label="Lọc hệ"></div><div class="cs-bench" data-prep-bench></div></div>
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
    if (!button || event.button !== 0 || !sceneState.draft) return;
    suppressSlotClick = false;
    preparationDrag = { pointer: event.pointerId, from: Number(button.dataset.sceneSlot), heroId: sceneState.draft[Number(button.dataset.sceneSlot)]?.id, x: event.clientX, y: event.clientY, moved: false };
    button.setPointerCapture(event.pointerId);
  });
  panel.addEventListener('pointermove', event => {
    if (!preparationDrag || preparationDrag.pointer !== event.pointerId) return;
    preparationDrag.moved ||= Math.hypot(event.clientX - preparationDrag.x, event.clientY - preparationDrag.y) > 8;
    preparationDrag.dx = event.clientX - preparationDrag.x; preparationDrag.dy = event.clientY - preparationDrag.y;
    if (preparationDrag.moved) { event.preventDefault(); if (reducedMotion.matches) drawScene(performance.now()); }
  });
  panel.addEventListener('pointerup', event => {
    const drag = preparationDrag; preparationDrag = null;
    if (!drag || drag.pointer !== event.pointerId || !drag.moved || !sceneState.draft) return;
    suppressSlotClick = true;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-scene-slot]');
    if (target) {
      sceneState.draft = swapCampaignPositions(sceneState.draft, drag.from, Number(target.dataset.sceneSlot));
      renderPreparation();
    }
  });
  panel.addEventListener('pointercancel', () => { preparationDrag = null; });
}

function renderPreparationField() {
  const draft = sceneState.draft, counts = { front: 0, back: 0 };
  setSceneText('.cs-team-count', draft.length + ' / 6');
  sceneState.root.querySelector('[data-prep-slots]').innerHTML = draft.map((pick,index) => {
    const rowIndex = counts[pick.row]++;
    return `<button class="cs-field-unit" data-scene-slot="${index}" style="left:${pick.row === 'front' ? 35 : 12}%;top:${38 + rowIndex * 27}%" aria-label="Đổi vị trí ${escapeScene(DATA.heroes[pick.id].name)}"><span>${'★'.repeat(heroStars(pick.id))} · Lv${heroLevel(pick.id)}</span><small>${escapeScene(DATA.heroes[pick.id].name)}</small></button>`;
  }).join('');
  const enemyCounts = { front: 0, back: 0 };
  sceneState.root.querySelector('[data-prep-enemy-labels]').innerHTML = preparationEnemies().map(enemy => {
    const rowIndex = enemyCounts[enemy.row]++;
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
  setSceneText('[data-scene-leader]', DATA.heroes[squad[0]?.id]?.name || 'Người dẫn mộng');
  setSceneText('[data-scene-power]', sceneNumber(scenePower(squad)));
  if (squad[0]) sceneState.root.querySelector('[data-scene-avatar]').src = portraitSrc(squad[0].id, 'avatar');
  setSceneText('[data-scene-chapter]', checkpoint ? 'CHƯƠNG ' + (checkpoint.chapterIndex + 1) + (checkpoint.replay ? ' · ÔN LẠI' : ' · CHINH CHIẾN') : 'CHINH CHIẾN');
  setSceneText('[data-scene-title]', checkpoint?.title || 'Mộng lộ');
  setSceneText('[data-scene-objective]', checkpoint ? 'Ải ' + (checkpoint.chapterIndex + 1) + '–' + (checkpoint.stageIndex + 1) + ' · ' + (checkpoint.stageIndex + 1 === checkpoint.stageCount ? 'Thử thách cuối chương' : 'Tiếp bước Mộng lộ') : 'Chưa có ải được mở');
  sceneState.root.querySelector('[data-scene-stages]').innerHTML = checkpoint ? Array.from({ length: checkpoint.stageCount }, (_, i) => `<li ${i === checkpoint.stageIndex ? 'aria-current="step"' : ''} class="${i < checkpoint.stageIndex ? 'is-complete' : ''}"><span>${i < checkpoint.stageIndex ? '✓' : i + 1}</span><small>${i === checkpoint.stageCount - 1 ? 'Thủ lĩnh' : 'Ải ' + (i + 1)}</small></li>`).join('') : '';
  sceneState.canvas.setAttribute('aria-label', 'Đội đang thám hiểm: ' + squad.map(pick => DATA.heroes[pick.id].name).join(', '));
  sceneState.root.querySelector('[data-hv-afk-challenge]').disabled = !checkpoint;
  updateSceneNumbers();
}
function onSceneRoute(name) {
  sceneState.active = name === 'campaign';
  document.body.classList.toggle('hv-campaign-active', sceneState.active);
  if (!sceneState.active) {
    preparationDrag = null; suppressSlotClick = false;
    stopSceneClock(); sceneState.draft = null; sceneState.launching = false;
    sceneState.scope?.dispose(); sceneState.scope = null;
    if (sceneState.root) { sceneState.root.querySelector('dialog').close(); sceneState.root.hidden = true; }
    sceneDiagnosticSnapshot();
    return;
  }
  if (!sceneState.scope?.isActive()) {
    sceneState.scope = createSceneLifetime('campaign');
    sceneState.activationGeneration += 1;
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
  preparationDrag = null; suppressSlotClick = false;
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
  if (!sceneState.active) return;
  const state = ensureSceneChest(), now = Date.now(), view = getAfkChestView(state, { now });
  if (!view.claimable) { updateSceneNumbers(); return; }
  const transaction = window.HonVietTransaction;
  if (!transaction?.commit) { toast('Hệ thống lưu thưởng chưa sẵn sàng.'); return; }
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
    sceneState.root.querySelector('[data-claim-receipt]').innerHTML = sceneRewards.filter(([key]) => outcome.reward[key] > 0).map(([key, name, src]) => `<div><img src="${src}" alt=""><b>+${sceneNumber(outcome.reward[key])}</b><small>${name}</small></div>`).join('');
    sceneState.root.querySelector('dialog').showModal();
  }
}
function sceneClick(event) {
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.sceneNav) { navTo(button.dataset.sceneNav); return; }
  if (button.hasAttribute('data-hv-afk-claim')) { grantSceneClaim(); return; }
  if (button.hasAttribute('data-hv-afk-challenge') || button.dataset.sceneAction === 'prepare') { openPreparation(); return; }
  if (button.dataset.sceneAction === 'cancel') { cancelPreparation(); return; }
  if (button.dataset.sceneAction === 'launch') { launchPreparedBattle(); return; }
  if (button.dataset.sceneAction === 'close-receipt') { sceneState.root.querySelector('dialog').close(); return; }
  if (!sceneState.draft) return;
  if (button.dataset.sceneElement) {
    for (const filter of sceneState.root.querySelectorAll('[data-scene-element]')) filter.setAttribute('aria-pressed', String(filter === button));
    renderPreparation(); return;
  }
  if (button.dataset.sceneAction === 'quick') {
    sceneState.draft = ownedSceneHeroIds().sort((a,b) => heroPower(b) - heroPower(a)).slice(0,6).map((id,i) => ({ id, row: i < 3 ? 'front' : 'back' }));
    renderPreparation(); return;
  }
  if (button.hasAttribute('data-scene-slot')) {
    if (suppressSlotClick) { suppressSlotClick = false; return; }
    const index = Number(button.dataset.sceneSlot);
    if (sceneState.slot >= 0 && sceneState.slot !== index) { sceneState.draft = swapCampaignPositions(sceneState.draft, sceneState.slot, index); sceneState.slot = -1; }
    else sceneState.slot = index;
    renderPreparation('[data-scene-slot="' + index + '"]');
  }
  else if (button.hasAttribute('data-scene-row')) { const index = Number(button.dataset.sceneRow); sceneState.draft = swapCampaignRows(sceneState.draft, index); sceneState.slot = index < 3 ? index + 3 : index - 3; renderPreparation('[data-scene-row="' + sceneState.slot + '"]'); }
  else if (button.dataset.sceneHero) {
    const id = button.dataset.sceneHero;
    if (sceneState.draft.length === 6 && !sceneState.draft.some(pick => pick.id === id)) { toast('Số lượng tướng ra trận đã đủ.'); return; }
    sceneState.draft = toggleCampaignHero(sceneState.draft, id, ownedSceneHeroIds());
    sceneState.slot = Math.min(sceneState.slot, Math.max(0, sceneState.draft.length - 1));
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
