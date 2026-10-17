/* Presentation owner for Chinh chiến. Rewards and battles keep their domain owners. */
const sceneState = { root: null, canvas: null, active: false, scope: null, resizeObserver: null,
  raf: 0, rafRelease: null, timer: 0, timerRelease: null, booted: false,
  lastFrame: 0, farmTime: 0, farmReady: true, width: 390, height: 300, draft: null, slot: 0, checkpoint: null, launching: false,
  claiming: false, activationGeneration: 0 };
const sceneResourceCache = typeof createCampaignResourcePackCache === 'function'
  ? createCampaignResourcePackCache({
      maxDecodedBytes: 96 * 1024 * 1024,
      maxLoading: 2,
      clearDelayMs: 10_000,
      makeImage: () => { const image = new Image(); image.decoding = 'async'; return image; },
      load: (pack, image) => new Promise((resolve, reject) => {
        if (!image) { reject(new Error('campaign image unavailable')); return; }
        image.onload = () => resolve({ image, decodedBytes: pack.decodedBytes });
        image.onerror = () => reject(new Error('campaign asset failed: ' + pack.src));
        image.src = pack.src;
      })
    })
  // Legacy VM-only fallback: production always injects the 3Q-derived cache
  // source before this file. It keeps old isolated scene tests self-contained.
  : { ensure: pack => { const image = new Image(); image.src = pack.src; return { key: pack.src, image, promise: Promise.resolve({ image, bytes: pack.decodedBytes }) }; }, release() {}, purge() {}, inspect: () => ({ bytes: 0, entries: [] }) };
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
    column: pick.slot % 3, row: Math.floor(pick.slot / 3), mirror: true };
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
function campaignActorArtId(value) {
  const id=String(value||'').replace(/-/g,'_');
  return id==='hero_splus_linh_dong'?'linh_dong':id==='hero_splus_bach_dien'?'bach_dien':id;
}
const spriteSpecs = {
  // Same fixed cell and bottom-center pivot as the authored combat pack.
  // Idle occupies 240px of the 320px cell; portrait/master is a bust, not a body.
  // Native-size Blender atlas: render down to the same body footprint instead of upscaling a 347×320 cell.
  linh_dong: { src: 'assets/characters/linh-dong/campaign-lite/idle-atlas.webp', frames: 96, cols: 8, cellW: 240, cellH: 220, ms: 42, pivot: 120, foot: 220, body: 165 },
  bach_dien: { src: 'assets/characters/bach-dien/campaign-lite/idle-atlas.webp', frames: 32, cols: 6, cellW: 240, cellH: 220, ms: 1000 / 30, pivot: 120, foot: 220, body: 165 },
  ong_hang_pho: { src: 'assets/battle-runtime/embedded-12.png', frames: 48, cols: 8, cellW: 240, cellH: 135, ms: 120, pivot: 100, foot: 128, body: 124 },
  luc_anh: { ...LUC_ANH_IDLE_1080, src: 'assets/characters/luc-anh/campaign-lite/idle-atlas.webp', cellW: 240, cellH: 240, pivot: 120, foot: 213.5, body: 199, atlasWidth: 1920, atlasHeight: 2880 },
  thay_mo: { src: 'assets/characters/thay-mo/idle-v3193-atlas.png', frames: 96, cols: 12, cellW: 235, cellH: 264, strideW: 241, strideH: 270, pad: 3, durations: AFK_THAY_MO_IDLE_DURATIONS, pivot: 117.5, foot: 260, body: 250 },
  dinh_loi: { src: 'assets/characters/dinh-loi/campaign-lite/idle-atlas.webp', frames: 64, cols: 8, cellW: 240, cellH: 135, ms: 62.5, pivot: 132.5, foot: 129, body: 116.5 }
};

// Filled by the build from the final authored descriptors. Each page preserves
// complete source cells; only current/next pages and one small idle are leased.
const preparationIdlePacks = {};
function preparationSpriteFor(pick, time) {
  const base = spriteSpecs[campaignActorArtId(pick.id)], pack = preparationIdlePacks[campaignActorArtId(pick.id)];
  if (!base || !pack) return { spec: base };
  const frame = frameAt(base, time), page = Math.floor(frame / pack.pageFrames);
  return {
    spec: { ...base, ...pack.pages[page], frameIndex: frame % pack.pageFrames },
    next: { ...base, ...pack.pages[(page + 1) % pack.pages.length] },
    poster: { ...base, ...pack.poster, frameIndex: 0, loadPriority: 1 }
  };
}

// Authored Basic atlases. Fixed pivots measured once, never recentered per frame.
const farmAttackPacks = {};
const farmVfxPacks = {};
const farmRunPacks = {};
const farmAttackSpecs = {
  linh_dong: {src:'assets/characters/linh-dong/basic-atlas.webp',frames:44,cols:8,cellW:480,cellH:440,ms:34,pivot:240,foot:424,body:335,moveToTarget:true},
  bach_dien: {src:'assets/characters/bach-dien/basic-atlas.webp',frames:30,cols:6,cellW:480,cellH:440,ms:1000/30,pivot:253.5,foot:415,body:395,moveToTarget:true},
  ong_hang_pho: { src:'assets/battle-runtime/embedded-11.png', frames:61, cols:10, cellW:240, cellH:135, ms:2500/61, pivot:100, foot:125, body:119 },
  luc_anh: { src:'assets/characters/luc-anh/basic-atlas.webp', frames:64, cols:8, cellW:240, cellH:240, ms:38, pivot:120, foot:190, body:148 },
  thay_mo: { src:'assets/characters/thay-mo/basic-cast-v3198-atlas.png', frames:96, cols:12, cellW:307, cellH:270, strideW:313, strideH:276, pad:3, durations:[60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60,60,70,60,60], ms:62.5, pivot:117.5, foot:265, body:263 },
  dinh_loi: { src:'assets/characters/dinh-loi/basic-cast-atlas.png', frames:64, cols:8, cellW:480, cellH:270, ms:62.5, pivot:265, foot:255, body:235 }
};

const farmBasicVfxSpecs = {
  linh_dong:{src:'assets/characters/linh-dong/skill1_vfx-atlas.webp',frames:120,cols:10,cellW:440,cellH:248,ms:33,pivot:220,foot:124,body:248},
  bach_dien:{src:'assets/characters/bach-dien/skill1_vfx-atlas.webp',frames:36,cols:6,cellW:440,cellH:248,ms:1000/30,pivot:220,foot:124,body:248},
  luc_anh:{src:'assets/characters/luc-anh/basic_projectile-atlas.webp',frames:64,cols:8,cellW:320,cellH:220,ms:28,pivot:160,foot:110,body:220},
  dinh_loi:{src:'assets/characters/dinh-loi/basic-projectile-atlas.png',frames:64,cols:8,cellW:480,cellH:270,ms:62.5,pivot:240,foot:135,body:270},
  thay_mo:{src:'assets/characters/thay-mo/projectile-v3201-atlas.png',frames:24,cols:6,cellW:480,cellH:90,strideW:488,strideH:98,pad:4,ms:60,pivot:240,foot:45,body:90}
};
function campaignPagedSprite(base, pack, time) {
  if(!base||!pack)return {spec:base};
  let frame=0,elapsed=Math.max(0,time);
  if(base.durations){for(;frame<base.frames-1&&elapsed>=base.durations[frame];frame++)elapsed-=base.durations[frame];}
  else frame=Math.min(base.frames-1,Math.floor(elapsed/Math.max(1,base.ms||1)));
  const page=Math.floor(frame/pack.pageFrames);
  return {spec:{...base,...pack.pages[page],frameIndex:frame%pack.pageFrames},poster:pack.poster?{...base,...pack.poster,frameIndex:0}:null};
}
const runSpecs = {
  luc_anh: { src: 'assets/characters/luc-anh/run-atlas.webp', frames:61, cols:8, cellW:240, cellH:240, ms:28, pivot:120, foot:213.5, body:199 },
  dinh_loi: { src:'assets/characters/dinh-loi/run-atlas.png', frames:64, cols:8, cellW:480, cellH:270, ms:63, pivot:265, foot:258, body:233 },
  ong_hang_pho: { src:'assets/battle-runtime/embedded-11.png', frames:9, startFrame:28, cols:10, cellW:240, cellH:135, ms:41, pivot:100, foot:125, body:119 },
  linh_dong: { src: 'assets/characters/linh-dong/campaign-lite/run-atlas.webp', frames: 96, cols: 8, cellW: 240, cellH: 220, ms: 42, pivot: 120, foot: 220, body: 165 },
  bach_dien: { src: 'assets/characters/bach-dien/campaign-lite/run-atlas.webp', frames: 45, cols: 6, cellW: 240, cellH: 220, ms: 1000 / 30, pivot: 120, foot: 220, body: 165 }
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
function campaignPackFor(src, spec) {
  if (!spec || !src.startsWith('assets/characters/')) return null;
  const rows = spec.rows || Math.ceil(spec.frames / spec.cols);
  return {
    heroId: src,
    clip: src.includes('/run-') ? 'run' : 'idle',
    tier: 'campaign-lite',
    src,
    decodedBytes: (spec.atlasWidth || spec.cols * spec.cellW) * (spec.atlasHeight || rows * spec.cellH) * 4
  };
}
function campaignBattleOpen() {
  try { return !!document.getElementById('hvBattleOverlay')?.classList.contains('is-open'); }
  catch (_) { return false; }
}
function dropSceneStored(stored) {
  const image = stored?.image || stored;
  if (!image) return;
  try { image.onload = null; image.onerror = null; } catch (_) {}
  try { if (image.removeAttribute) image.removeAttribute('src'); else if ('src' in image) image.src = ''; } catch (_) {}
}
function releaseSceneAtlases() {
  for (const [, stored] of Array.from(sceneImages)) dropSceneStored(stored);
  sceneImages.clear();
  try { sceneResourceCache.purge(); } catch (_) {}
}
try { window.__HV_CAMPAIGN_RELEASE_ATLASES = releaseSceneAtlases; } catch (_) {}
function emptySceneImage() {
  return { complete: false, naturalWidth: 0, naturalHeight: 0 };
}
function imageForScene(src, spec = null) {
  // Rendering itself pauses while a battle overlay is genuinely open. Do not
  // turn a stale overlay class into a permanent empty image for a hero.
  const existing = sceneImages.get(src);
  if (existing) return existing.image || existing;
  const pack = campaignPackFor(src, spec);
  if (pack) {
    const handle = sceneResourceCache.ensure(pack, 'campaign');
    sceneImages.set(src, handle);
    handle.promise.then(() => { if (sceneState.active) drawScene(performance.now()); }).catch(() => {
      // Failed admission is retryable after another asset releases. Never cache
      // a dead handle forever and silently erase this actor.
      if (sceneImages.get(src) === handle) sceneImages.delete(src);
      if (sceneState.active) drawScene(performance.now());
    });
    sceneState.scope?.add(() => {
      sceneResourceCache.release(handle.key, 'campaign', Date.now());
      if (sceneImages.get(src) === handle) sceneImages.delete(src);
    });
    return handle.image;
  }
  let image = new Image(); image.decoding = 'async';
  const onload = () => { if (sceneState.active && reducedMotion.matches) drawScene(0); };
  image.onload = onload;
  image.src = src; sceneImages.set(src, image);
  sceneState.scope?.add(() => {
    if (image.onload === onload) image.onload = null;
    if (image.removeAttribute) image.removeAttribute('src'); else image.src = '';
    if (sceneImages.get(src) === image) sceneImages.delete(src);
  });
  return image;
}
function frameAt(spec, time) {
  time *= spec.playbackRate ?? 1;
  if (reducedMotion.matches) return 0;
  if (spec.durations) {
    let elapsed = time % spec.durations.reduce((sum, ms) => sum + ms, 0);
    for (let frame = 0; frame < spec.durations.length; frame++) {
      if (elapsed < spec.durations[frame]) return frame;
      elapsed -= spec.durations[frame];
    }
    return 0;
  }
  return (spec.startFrame || 0) + Math.floor(time / spec.ms) % spec.frames;
}
function specForAfk(pick) {
  if (sceneState.draft) return spriteSpecs[campaignActorArtId(pick.id)];
  const run = runSpecs[campaignActorArtId(pick.id)] || window.HonVietCampaignRunSpecs?.[campaignActorArtId(pick.id)] || window.HonVietCampaignRunSpecs?.[pick.id];
  if (run && run.src && Number(run.frames) > 0 && run.cellW && run.cellH && run.pivot && run.foot && run.body) return {...run, playbackRate:0.65};
  return spriteSpecs[campaignActorArtId(pick.id)];
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
// Linh Đồng Run on the road; Idle stays for Bày trận and standing farm hits.
function campaignMapView(w, h, focus = null) {
  const width = Math.max(w, Math.min(Math.max(w, h * 9 / 16) * (focus ? 2.3 : 1.8), h * (focus ? 3.1 : 2.4) * 9 / 16));
  const height = width * 16 / 9;
  const left = focus ? Math.max(w-width,Math.min(0,w*.5-focus.x*width)) : w / 2 - .45 * width;
  const top = focus ? Math.max(h-height,Math.min(0,h*.60-focus.y*height)) : h * .625 - .515 * height;
  return { width, height, left, top,
    viewport: { x: -left / width, y: -top / height, width: w / width, height: h / height } };
}
function homePartyPose(pick, w, h, farm = null) {
  const slot = Number.isInteger(Number(pick.slot)) ? Math.max(0, Math.min(5, Number(pick.slot))) : (pick.row === 'back' ? 3 : 0);
  const pose = HOME_SLOT[slot];
  if (farm) {
    const map=campaignMapView(w,h,farm.center);
    const worldX=farm.center.x+(slot%3-1)*.048;
    const worldY=farm.center.y+(slot<3?.016:-.018);
    return {x:map.left+worldX*map.width,y:map.top+worldY*map.height,worldX,worldY,
      bodyH:Math.min(80,w*.145,h*.12)*(slot<3?1:.9)};
  }
  const map = campaignMapView(w, h);
  const plaza = {
    x: map.left + pose.x * map.width,
    y: map.top + pose.y * map.height,
    worldX: pose.x, worldY: pose.y,
    bodyH: Math.min(118, w * .24, h * .19) * pose.s
  };
  return plaza;
}
function syncCampaignMap(w, h, farm = null) {
  const map = campaignMapView(w, h, farm?.center);
  const landscape = sceneState.root?.querySelector('.cs-landscape');
  if (!landscape) return;
  landscape.style.setProperty('--cs-map-size', map.width + 'px ' + map.height + 'px');
  landscape.style.setProperty('--cs-map-position', map.left + 'px ' + map.top + 'px');
  const squad = savedSceneSquad();
  const center = squad.reduce((p, hero) => {
    const pose = homePartyPose(hero, w, h, farm);
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
const CAMPAIGN_TRAVEL_PATH = [
  {x:.32,y:.72},{x:.30,y:.64},{x:.43,y:.555},
  {x:.59,y:.485},{x:.70,y:.415},{x:.755,y:.325},{x:.67,y:.245}
];
const CAMPAIGN_CHAPTER_WORLDS = [{"id":"city","name":"Ấn Phố","map":"assets/ui/campaign/campaign-map-v3.webp","path":[{"x":0.32,"y":0.72},{"x":0.3,"y":0.64},{"x":0.43,"y":0.555},{"x":0.59,"y":0.485},{"x":0.7,"y":0.415},{"x":0.755,"y":0.325},{"x":0.67,"y":0.245}],"monster":{"src":"assets/ui/campaign/farm-moss-v1.webp","width":1254,"height":1254,"pivot":631,"foot":1093,"body":958,"motion":"jelly"}},{"id":"forest","name":"Ấn Rừng","map":"assets/ui/campaign/forest-map-v1.webp","path":[{"x":0.4,"y":0.82},{"x":0.52,"y":0.72},{"x":0.62,"y":0.62},{"x":0.55,"y":0.52},{"x":0.39,"y":0.43},{"x":0.38,"y":0.34},{"x":0.61,"y":0.24}],"monster":{"src":"assets/ui/campaign/forest-mob-v1.webp","width":1295,"height":1214,"pivot":658.0,"foot":1182,"body":1165,"motion":"step"}},{"id":"sea","name":"Ấn Biển","map":"assets/ui/campaign/sea-map-v1.webp","path":[{"x":0.32,"y":0.82},{"x":0.4,"y":0.73},{"x":0.65,"y":0.64},{"x":0.69,"y":0.55},{"x":0.51,"y":0.45},{"x":0.43,"y":0.35},{"x":0.57,"y":0.25}],"monster":{"src":"assets/ui/campaign/sea-mob-v1.webp","width":1312,"height":1199,"pivot":663.0,"foot":1129,"body":1128,"motion":"step"}},{"id":"forge","name":"Ấn Lò","map":"assets/ui/campaign/forge-map-v1.webp","path":[{"x":0.39,"y":0.82},{"x":0.38,"y":0.73},{"x":0.56,"y":0.64},{"x":0.67,"y":0.53},{"x":0.56,"y":0.42},{"x":0.45,"y":0.32},{"x":0.57,"y":0.23}],"monster":{"src":"assets/ui/campaign/forge-mob-v1.webp","width":1374,"height":1145,"pivot":697.5,"foot":1085,"body":1257,"motion":"step"}},{"id":"forgotten","name":"Ấn Quên","map":"assets/ui/campaign/forgotten-map-v1.webp","path":[{"x":0.4,"y":0.82},{"x":0.6,"y":0.74},{"x":0.72,"y":0.65},{"x":0.68,"y":0.54},{"x":0.44,"y":0.43},{"x":0.35,"y":0.34},{"x":0.49,"y":0.25}],"monster":{"src":"assets/ui/campaign/forgotten-mob-v1.webp","width":1332,"height":1181,"pivot":673.0,"foot":1165,"body":1256,"motion":"hover"}},{"id":"sanctum","name":"Lục Thần","map":"assets/ui/campaign/sanctum-map-v1.webp","path":[{"x":0.32,"y":0.82},{"x":0.37,"y":0.73},{"x":0.58,"y":0.64},{"x":0.67,"y":0.54},{"x":0.57,"y":0.43},{"x":0.42,"y":0.33},{"x":0.42,"y":0.24}],"monster":{"src":"assets/ui/campaign/sanctum-mob-v1.webp","width":1312,"height":1199,"pivot":654.5,"foot":1166,"body":1201,"motion":"step"}}];
function campaignWorldForChapter(index) {
  return CAMPAIGN_CHAPTER_WORLDS[Number.isInteger(index) ? index : 0] || CAMPAIGN_CHAPTER_WORLDS[0];
}
// One shared, deterministic presentation clock; no transactions or combat state.
function sampleCampaignFarm(time, squad, quiet = false, specs = {}, world = null) {
  if (quiet || !squad.length) return null;
  const tick=Math.max(0,Number(time)||0), cycle=Math.floor(tick/24000), elapsed=tick%24000;
  const path=world?.path||CAMPAIGN_TRAVEL_PATH;
  const last=path.length-1;
  const index=n=>{const q=n%(last*2);return q<=last?q:last*2-q;};
  const from=path[index(cycle)],to=path[index(cycle+1)];
  const u=Math.min(1,elapsed/5000), ease=u*u*(3-2*u);
  const center={x:from.x+(to.x-from.x)*ease,y:from.y+(to.y-from.y)*ease};
  const length=Math.hypot(to.x-from.x,to.y-from.y);
  const direction={x:(to.x-from.x)/length,y:(to.y-from.y)/length};
  const count=Math.min(4,Math.max(1,squad.length));
  const events=[], actors=squad.map((hero,i)=>{
    const spec=specs[hero.id]||specs[String(hero.id).replace(/^hero_splus_/,'').replace(/-/g,'_')],castDuration=spec ? (spec.durations?.reduce((a,b)=>a+b,0)||spec.frames*spec.ms) : 1200,approachMs=spec&&spec.src?350:0,duration=castDuration+approachMs*2;
    const start=6200+i*110;
    let attackTime=-1;
    for(let round=0;round<2;round++) {
      const at=start+round*6500;
      if(elapsed>=at&&elapsed<at+duration)attackTime=elapsed-at;
      const crit=(cycle+i+round)%4===0,damage=Math.round((118+i*19+(cycle%5)*11)*(crit?1.8:1));
      events.push({at:at+approachMs+castDuration*.68,actorId:hero.id,lane:i,target:i%count,crit,damage});
    }
    return {...hero,attackTime,duration,castDuration,approachMs,engageAt:start,target:i%count};
  });
  const mobs=Array.from({length:count},(_,i)=>{
    const hits=events.filter(e=>e.target===i),total=hits.reduce((n,e)=>n+e.damage,0);
    const deadAt=Math.max(...hits.map(e=>e.at));
    const hurt=hits.filter(e=>e.at<=elapsed).reduce((n,e)=>n+e.damage,0);
    const spawnAt=5000+i*160;
    const alpha=Math.max(0,Math.min(1,(elapsed-spawnAt)/650,1-(elapsed-deadAt-180)/650));
    return {index:i,worldX:to.x+direction.x*.075+(i%2-.5)*.065,
      worldY:to.y+direction.y*.055+(Math.floor(i/2)-.5)*.028,
      hp:Math.max(0,1-hurt/total),deadAt,spawnAt,alpha};
  });
  const hits=events.filter(e=>elapsed>=e.at&&elapsed<e.at+1000).map(e=>({...e,age:elapsed-e.at}));
  const loot=[];
  for(const mob of mobs)for(let item=0;item<2;item++) {
    const age=elapsed-mob.deadAt-280-item*120;
    if(age>=0&&age<2100)loot.push({target:mob.index,item,age,
      phase:age<850?'drop':age<1900?'fly':'arrive',progress:Math.max(0,Math.min(1,(age-850)/1050))});
  }
  return {cycle,elapsed,center,direction,actors,mobs,hits,loot,world:world||campaignWorldForChapter(0),
    phase:elapsed<5000?'march':elapsed<6200?'spawn':elapsed<19500?'attack':elapsed<22500?'loot':'rest'};
}
function campaignFarmActorPose(pick,w,h,farm) {
  const home=homePartyPose(pick,w,h,farm),actor=farm?.actors.find(a=>a.id===pick.id);
  if(!actor||!actor.approachMs||farm.elapsed<actor.engageAt)return {...home,facing:farm?.direction.x<0?-1:1,castTime:-1};
  const map=campaignMapView(w,h,farm.center),mob=farm.mobs[actor.target];
  const tx=map.left+mob.worldX*map.width,ty=map.top+mob.worldY*map.height;
  const dx=tx-home.x,dy=ty-home.y,distance=Math.max(1,Math.hypot(dx,dy));
  const reach=home.bodyH*.85,ratio=Math.max(0,(distance-reach)/distance);
  const e=actor.attackTime,castEnd=actor.approachMs+actor.castDuration;
  // Hold the same engagement point through the pauses between authored ATKs.
  // Regroup only after the entire pack has died and the last cast has recovered.
  const packClearAt=Math.max(...farm.mobs.map(m=>m.deadAt))+180;
  const lastCastEnd=Math.max(...farm.actors.map(a=>a.engageAt+6500+a.approachMs+a.castDuration));
  const regroupAt=Math.max(packClearAt,lastCastEnd);
  const approach=Math.min(1,(farm.elapsed-actor.engageAt)/actor.approachMs);
  const returning=farm.elapsed>regroupAt;
  let blend=returning?1-(farm.elapsed-regroupAt)/actor.approachMs:approach;
  blend=Math.max(0,Math.min(1,blend));blend=blend*blend*(3-2*blend);
  return {...home,x:home.x+dx*ratio*blend,y:home.y+dy*ratio*blend,facing:dx<0?-1:1,
    moving:approach<1||(returning&&blend>0),castTime:e>=actor.approachMs&&e<=castEnd?e-actor.approachMs:-1};
}
function drawCampaignBasicVfx(ctx,actor,farm,w,h,size) {
  if(actor.attackTime<0)return;
  const key=campaignActorArtId(actor.id),base=farmBasicVfxSpecs[key];
  // Ong Pho's authored ATK already contains its contact VFX; never add a token line.
  if(!base)return;
  const castTime=actor.attackTime-(actor.approachMs||0),beat=castTime/(actor.castDuration||actor.duration);
  // Request the first small effect page during the cast, before release.
  if(beat>=0&&beat<.48){const first=campaignPagedSprite(base,farmVfxPacks[key],0).spec;imageForScene(first.src,first);}
  if(beat<.48||beat>.82)return;
  const p=Math.min(1,(beat-.48)/.20),map=campaignMapView(w,h,farm.center),mob=farm.mobs[actor.target];
  const pose=campaignFarmActorPose(actor,w,h,farm),tx=map.left+mob.worldX*map.width,ty=map.top+mob.worldY*map.height-size*.45;
  const x=pose.x+(tx-pose.x)*p,y=pose.y-pose.bodyH*.55+(ty-(pose.y-pose.bodyH*.55))*p;
  const sampled=campaignPagedSprite(base,farmVfxPacks[key],Math.min(base.frames-1,Math.floor((beat-.48)/.34*base.frames))*base.ms),spec=sampled.spec;
  const image=imageForScene(spec.src,spec);
  if(!image?.complete||image.naturalWidth<1){sceneState.farmReady=false;return;}
  const frame=spec.frameIndex??Math.min(base.frames-1,Math.floor((beat-.48)/.34*base.frames)),scale=Math.min(pose.bodyH*.8/spec.cellH,pose.bodyH*1.6/spec.cellW,w*.22/spec.cellW);
  ctx.save();ctx.translate(x,y);ctx.scale(pose.facing,1);
  ctx.drawImage(image,frame%spec.cols*(spec.strideW||spec.cellW)+(spec.pad||0),Math.floor(frame/spec.cols)*(spec.strideH||spec.cellH)+(spec.pad||0),spec.cellW,spec.cellH,-spec.pivot*scale,-spec.foot*scale,spec.cellW*scale,spec.cellH*scale);ctx.restore();
}
function drawCampaignFarm(ctx, farm, w, h, layer = 'effects') {
  if (!farm) return;
  const map=campaignMapView(w,h,farm.center);
  const project=m=>({x:map.left+m.worldX*map.width,y:map.top+m.worldY*map.height});
  const size=Math.min(52,w*.115,h*.085);
  const monster=farm.world.monster;
  const image=imageForScene(monster.src);
  const ready=image.complete&&image.naturalWidth>0;
  if(layer==='monsters-back'||layer==='monsters-front') {
    for(const actor of farm.actors)if(farmAttackSpecs[actor.id])imageForScene(farmAttackSpecs[actor.id].src);

    for(const mob of [...farm.mobs].sort((a,b)=>a.worldY-b.worldY)) {
      if(!ready||mob.alpha<=0)continue;
      if((mob.worldY<farm.center.y)!==(layer==='monsters-back'))continue;
      const p=project(mob),age=farm.elapsed-mob.spawnAt;
      const hop=monster.motion==='hover' ? size*(.10+.035*Math.sin(age/330)) : age<1000?Math.abs(Math.sin(age/1000*Math.PI*2))*size*(monster.motion==='jelly'?.15:.035):0;
      const pulse=Math.sin(age/240)*(monster.motion==='jelly'?.025:0),scale=size/monster.body;
      ctx.save();ctx.globalAlpha=mob.alpha;
      ctx.fillStyle='#14231644';ctx.beginPath();ctx.ellipse(p.x,p.y,size*.36,size*.075,0,0,Math.PI*2);ctx.fill();
      ctx.translate(p.x,p.y-hop);ctx.scale((farm.direction.x<0?-1:1)*(1+pulse),Math.max(.1,mob.alpha)*(1-pulse));
      ctx.drawImage(image,-monster.pivot*scale,-monster.foot*scale,monster.width*scale,monster.height*scale);ctx.restore();
      if(mob.hp>0&&age>650){ctx.save();ctx.globalAlpha=.85;ctx.fillStyle='#302d26';ctx.fillRect(p.x-size*.34,p.y-size-6,size*.68,3);ctx.fillStyle='#cb6845';ctx.fillRect(p.x-size*.34,p.y-size-6,size*.68*mob.hp,3);ctx.restore();}
    }
    return;
  }
  for(const actor of farm.actors) drawCampaignBasicVfx(ctx,actor,farm,w,h,size);
  for(const hit of farm.hits) {
    const target=project(farm.mobs[hit.target]);
    const t=hit.age/1000,pop=1+.24*Math.sin(Math.min(1,t*4)*Math.PI);
    ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*2);ctx.translate(target.x+(hit.lane%3-1)*12,target.y-size-9-42*t);ctx.scale(pop,pop);
    ctx.font=`900 ${hit.crit?27:18}px system-ui`;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=3.5;ctx.strokeStyle='#432821';ctx.fillStyle=hit.crit?'#ff4941':'#fff1bb';ctx.strokeText(String(hit.damage),0,0);ctx.fillText(String(hit.damage),0,0);ctx.restore();
    if(hit.age<220){ctx.save();ctx.globalAlpha=1-hit.age/220;ctx.strokeStyle=hit.crit?'#ffb16a':'#fff6bb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(target.x,target.y-size*.45,6+hit.age*.065,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  // DOM-derived chest target stays aligned when the HUD or viewport changes.
  const chest=sceneState.chestPoint||{x:w*.12,y:h-42};
  let arriving=false;
  for(const loot of farm.loot) {
    const p=project(farm.mobs[loot.target]),ox=(loot.item?1:-1)*13;
    let x=p.x+ox,y=p.y-6;
    if(loot.phase==='drop'){const t=Math.min(1,loot.age/550);x=p.x+ox*t;y=p.y-6-Math.sin(t*Math.PI)*26;}
    else if(loot.phase==='fly'){const t=loot.progress*tEase(loot.progress);x+=(chest.x-x)*t;y+=(chest.y-y)*t-Math.sin(t*Math.PI)*48;}
    else {arriving=true;continue;}
    const art=imageForScene(loot.item?'assets/result-icons-art/mastery-imagen.png':'assets/result-icons-art/gold-imagen.png');
    if(art.complete&&art.naturalWidth){const s=18*(1-loot.progress*.35);ctx.save();ctx.globalAlpha=1-loot.progress*.2;ctx.drawImage(art,x-s/2,y-s/2,s,s);ctx.restore();}
  }
  sceneState.root?.querySelector('.cs-chest-fab')?.classList.toggle('cs-loot-arrival',arriving);
}
function tEase(t) { return t*(3-2*t); }
function drawScene(time) {
  const canvas = sceneState.canvas;
  if (!canvas || !sceneState.active) return;
  if (campaignBattleOpen()) { if (sceneImages.size) releaseSceneAtlases(); return; }
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const w = sceneState.width, h = sceneState.height, dpr = canvas.width / w;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const preparing = Boolean(sceneState.draft);
  // Only the visual farm clock waits. AFK accrual still uses its domain clock.
  sceneState.farmReady=true;
  const enemies = preparing ? preparationEnemies() : [];
  const picks = preparing ? [...sceneState.draft, ...enemies] : savedSceneSquad();
  // Admit every small canonical body before any idle animation page. A cold
  // squad must not queue its later heroes behind earlier heroes' moving pages.
  const preparationBodiesReady = !preparing || picks.map(pick => {
    const poster = preparationSpriteFor(pick, time)?.poster;
    if (!poster) return true;
    const image = imageForScene(poster.src, poster);
    return image.complete && image.naturalWidth > 0;
  }).every(Boolean);
  const farm = preparing ? null : sampleCampaignFarm(reducedMotion.matches ? 0 : sceneState.farmTime, picks, false, farmAttackSpecs, sceneState.world||campaignWorldForChapter(0));
  if (!preparing) { syncCampaignMap(w,h,farm); drawCampaignFarm(ctx,farm,w,h,'monsters-back'); }
  const rowCounts = { front: 0, back: 0, enemyfront: 0, enemyback: 0 };
  picks.map(pick => {
    const key = (pick.enemy ? 'enemy' : '') + pick.row;
    const slot = Number(pick.slot);
    const rowIndex = preparing && Number.isInteger(slot) ? slot % 3 : rowCounts[key]++;
    return { ...pick, rowIndex };
  })
    .sort((a, b) => preparing
      ? (a.row === 'back' ? 0 : 1) - (b.row === 'back' ? 0 : 1)
      : (campaignFarmActorPose(a, w, h, farm).y - campaignFarmActorPose(b, w, h, farm).y) || (homePartyPose(a, w, h, farm).x - homePartyPose(b, w, h, farm).x))
    .forEach(pick => {
      let x, y, bodyH;
      if (preparing) {
        x = w * (pick.enemy ? (pick.row === 'front' ? .65 : .88) : (pick.row === 'front' ? .35 : .12));
        y = h * (.38 + .27 * pick.rowIndex);
        bodyH = Math.min(w * .23, h * .28);
      } else {
        const plaza = campaignFarmActorPose(pick, w, h, farm);
        x = plaza.x; y = plaza.y; bodyH = plaza.bodyH;
      }
      if (preparing && !pick.enemy && preparationDrag?.heroId === pick.id && preparationDrag.moved) {
        x += preparationDrag.dx || 0; y += preparationDrag.dy || 0;
      }
      ctx.fillStyle = 'rgba(15,30,23,.24)'; ctx.beginPath(); ctx.ellipse(x, y, bodyH * .31, bodyH * .075, 0, 0, Math.PI * 2); ctx.fill();
      const actor = farm?.actors.find(a=>a.id===pick.id),pose=preparing?null:campaignFarmActorPose(pick,w,h,farm);
      const artId=campaignActorArtId(pick.id),attackBase=farmAttackSpecs[artId];
      const attack=actor&&pose.castTime>=0&&attackBase;
      const attackSprite=attack?campaignPagedSprite(attackBase,farmAttackPacks[artId],pose.castTime):null;
      const attackImage=attackSprite?imageForScene(attackSprite.spec.src,attackSprite.spec):null;
      const readyAttack=attackImage?.complete&&attackImage.naturalWidth>0;
      if(attack&&!readyAttack)sceneState.farmReady=false;
      const preparation=preparing||farm?.phase!=='march'?preparationSpriteFor(pick,time):null;
      const running=pose?.moving||farm?.phase==='march';
      const runBase=running?specForAfk(pick):null,runSprite=runBase&&farmRunPacks[artId]?campaignPagedSprite(runBase,farmRunPacks[artId],(time%(runBase.frames*runBase.ms))):null;
      const spec=preparing&&!preparationBodiesReady&&preparation?.poster?preparation.poster:readyAttack?attackSprite.spec:running?(runSprite?.spec||runBase):preparation?.spec||spriteSpecs[artId];
      const enemyArt = pick.enemy && !spec ? preparationEnemyArt(pick, enemies) : null;
      let drawSpec = spec;
      // Request the small, full-body idle first; a portrait is not an idle pose.
      const standby = preparation?.poster;
      const standbyImage = standby ? imageForScene(standby.src, standby) : null;
      let image = imageForScene(spec?.src || enemyArt?.src || portraitSrc(pick.id, 'master'), spec);
      if (preparing && preparationBodiesReady && preparation?.next && !reducedMotion.matches) imageForScene(preparation.next.src, preparation.next);
      if ((!image.complete || image.naturalWidth < 1) && standbyImage?.complete && standbyImage.naturalWidth > 0) {
        image = standbyImage; drawSpec = standby;
      }
      if ((!image.complete || image.naturalWidth < 1) && spec && !pick.enemy && !preparing) {
        // A hero must not disappear while its atlas is loading or was denied by
        // budget. Use a small authored portrait as a temporary visual fallback.
        const fullBody=preparationIdlePacks[artId]?.poster;
        const fallback = imageForScene(fullBody?.src||portraitSrc(pick.id, 'master'),fullBody?{...fullBody,loadPriority:1}:null);
        if (fallback.complete && fallback.naturalWidth > 0) { image = fallback; drawSpec = fullBody?{...spriteSpecs[artId],...fullBody,frameIndex:0}:null; }
      }
      if (!image.complete || image.naturalWidth < 1) return;
      ctx.save();
      if (actor && !farmAttackSpecs[campaignActorArtId(pick.id)] && actor.attackTime >= 0) {
        const lean = Math.sin(actor.attackTime / actor.duration * Math.PI) * .08;
        ctx.translate(x,y); ctx.rotate(lean); ctx.translate(-x,-y);
      }
      if ((pose && pose.facing < 0) || pick.enemy) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
      if (drawSpec) {
        const frame = drawSpec.frameIndex ?? frameAt(drawSpec, readyAttack ? pose.castTime : time), scale = bodyH / drawSpec.body;
        const sx = frame % drawSpec.cols * (drawSpec.strideW || drawSpec.cellW) + (drawSpec.pad || 0);
        const sy = Math.floor(frame / drawSpec.cols) * (drawSpec.strideH || drawSpec.cellH) + (drawSpec.pad || 0);
        const registration=drawSpec.registration||{},registeredScale=registration.scale||1;
        ctx.drawImage(image, sx, sy, drawSpec.cellW, drawSpec.cellH, x - drawSpec.pivot * scale+drawSpec.cellW*scale*(registration.offsetX||0), y - drawSpec.foot * scale+drawSpec.cellH*scale*(registration.offsetY||0), drawSpec.cellW * scale*registeredScale, drawSpec.cellH * scale*registeredScale);
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
  drawCampaignFarm(ctx,farm,w,h,'monsters-front');
  drawCampaignFarm(ctx, farm, w, h);
}
function sceneTick(time) {
  sceneState.rafRelease?.(); sceneState.rafRelease = null;
  sceneState.raf = 0;
  if (!sceneState.active || document.hidden) return;
  if (campaignBattleOpen()) {
    if (sceneImages.size) releaseSceneAtlases();
    sceneState.raf = scheduleSceneFrame();
    return;
  }
  if (time - sceneState.lastFrame >= 32) {
    if (!sceneState.draft && !reducedMotion.matches && sceneState.farmReady!==false) sceneState.farmTime += Math.min(100, time - sceneState.lastFrame);
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
  const chest=sceneState.root?.querySelector('.cs-chest-fab')?.getBoundingClientRect();
  if(chest)sceneState.chestPoint={x:chest.left+chest.width/2-box.left,y:chest.top+chest.height/2-box.top};
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(box.width * dpr), height = Math.round(box.height * dpr);
  if (sceneState.canvas.width !== width || sceneState.canvas.height !== height) {
    sceneState.canvas.width = width; sceneState.canvas.height = height;
  }
  drawScene(performance.now());
}
function stopSceneClock() {
  sceneState.root?.classList?.add('cs-motion-paused');
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
  sceneState.root?.classList?.remove('cs-motion-paused');
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
    <main class="cs-scroll"><section class="cs-landscape"><div class="cs-route"><span class="cs-eyebrow" data-scene-chapter></span><h1 data-scene-title></h1><button type="button" class="cs-stage-pill" data-scene-action="open-stages" aria-label="Xem tiến độ ải">Ải <b data-scene-stage-label>—</b></button></div><button type="button" class="cs-minimap" data-scene-action="open-map" aria-label="Mở bản đồ hành quân"><span class="cs-map-art"><img src="assets/ui/campaign/campaign-map-v3.webp" alt="Tuyến đường qua làng và cổng thành"><i data-map-viewport aria-hidden="true"></i><i data-map-party aria-hidden="true"></i></span><span>Bản đồ</span></button><canvas class="cs-canvas" aria-label="Đội tướng đang thám hiểm"></canvas><div class="cs-hud"><button type="button" class="cs-chest-fab" data-scene-action="open-chest" aria-label="Rương treo máy"><img src="assets/ui/campaign-v1/afk-chest-v1.webp" alt=""><time data-afk-time>00:00:00</time><progress data-afk-progress value="0" max="54000" aria-label="Thời gian tích lũy"></progress></button><button type="button" class="cs-swap" data-scene-action="prepare">Đổi đội hình</button><button type="button" class="cs-primary cs-challenge" data-hv-afk-challenge aria-label="Khiêu chiến"><span class="cs-challenge-badge" aria-hidden="true"><img class="cs-sword cs-sword-left" src="assets/ui/campaign/challenge-sword-v1.webp" alt="" draggable="false"><img class="cs-sword cs-sword-right" src="assets/ui/campaign/challenge-sword-v1.webp" alt="" draggable="false"><i class="cs-sword-flash"></i></span><span class="cs-challenge-label">Khiêu chiến</span></button></div></section></main>
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
function setCampaignWorld(chapterIndex) {
  const world=campaignWorldForChapter(chapterIndex);
  if(sceneState.world?.id!==world.id)sceneState.farmTime=0;
  sceneState.world=world;
  const landscape=sceneState.root?.querySelector('.cs-landscape');
  landscape?.style.setProperty('--cs-world-map',`url('${world.map}')`);
  for(const image of sceneState.root?.querySelectorAll('.cs-map-art img')||[]) {
    if(image.getAttribute('src')!==world.map)image.setAttribute('src',world.map);
    image.alt='Đường hành quân '+world.name;
  }
}
function renderScene() {
  if (!P) return;
  mountScene(); ensureSceneChest();
  const checkpoint = currentCheckpoint(), squad = savedSceneSquad();
  setCampaignWorld(checkpoint?.chapterIndex ?? 0);
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


