// One installer for every hero described by assets/characters/<slug>/hero.json.
// Adding a hero = add its folder (hero.json + runtime-meta.json + presentation.json
// + atlases), add its domain rules, run `npm test`. No per-hero patch script.
// Rules enforced here (each one was a real regression on a previous hero):
//  - roster/save/formation/detail/battle all come from the SAME hero.json;
//  - atlases go through the shared battle atlas cache (no private LRU that thrashes);
//  - every SFX cue is registered in HonVietSfx and decoded before the first action;
//  - patches are idempotent, anchored once, and never use broad regex replacement.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MARK_BATTLE = '/* AUTHORED_HERO_RUNTIME_V1 */';
const MARK_HOST = '/* AUTHORED_HERO_HOST_V1 */';
const SFX_PLACEHOLDER = '/*HV_AUTHORED_SFX*/{}/*HV_AUTHORED_SFX_END*/';

export function once(text, anchor, replacement, label = anchor.slice(0, 80)) {
  const count = text.split(anchor).length - 1;
  if (count !== 1) throw new Error(`AUTHORED_HERO_ANCHOR(${count}) ${label}`);
  return text.replace(anchor, () => replacement);
}

export function loadAuthoredHeroes(root) {
  const dir = join(root, 'assets/characters');
  const heroes = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(dir, entry.name, 'hero.json');
    if (!entry.isDirectory() || !existsSync(file)) continue;
    const hero = JSON.parse(readFileSync(file, 'utf8'));
    if (hero.schema !== 'luc-than-authored-hero/v1') throw new Error(`${entry.name}/hero.json: unsupported schema ${hero.schema}`);
    if (hero.slug !== entry.name) throw new Error(`${entry.name}/hero.json: slug must equal folder name`);
    const meta = JSON.parse(readFileSync(join(dir, entry.name, hero.clipsMeta || 'runtime-meta.json'), 'utf8'));
    const vfx = hero.vfxMeta ? JSON.parse(readFileSync(join(root, hero.vfxMeta), 'utf8')) : { clips: {} };
    heroes.push({ hero, meta, vfx, base: `assets/characters/${entry.name}/` });
  }
  return heroes;
}

// Battle-side descriptor: absolute-ish asset paths + pages, consumed by src/runtime/authored-hero.js.
export function battleDescriptor({ hero, meta, vfx, base }) {
  const clips = {};
  for (const [key, c] of Object.entries(meta.clips)) {
    clips[key] = { frames: c.frames, cellW: c.cellW, cellH: c.cellH, pivot: c.pivot, foot: c.foot, body: c.body,
      durationMs: c.durationMs, pageFrames: c.pageFrames || c.frames,
      pages: c.pages.map(p => ({ src: base + p.file, cols: p.cols || c.cols, rows: p.rows || Math.ceil(p.frames / (p.cols || c.cols)),
        atlasWidth: p.atlasWidth, atlasHeight: p.atlasHeight, frames: p.frames })) };
  }
  for (const [key, c] of Object.entries(vfx.clips || {})) {
    if (clips[key]) throw new Error(`${hero.slug}: VFX ${key} collides with a character clip`);
    clips[key] = { frames: c.frames, cellW: c.cellW, cellH: c.cellH, pivot: c.pivot, foot: c.foot, frameMs: c.frameMs, blend: c.blend || null,
      pageFrames: c.frames, pages: [{ src: hero.vfxBase + c.file, cols: c.cols, rows: c.rows, atlasWidth: c.atlasWidth, atlasHeight: c.atlasHeight, frames: c.frames }] };
  }
  return { id: hero.id, sourceId: hero.sourceId, slug: hero.slug, name: hero.host.name, portrait: hero.art.portrait,
    battle: hero.battle, sfxCues: Object.keys(hero.sfx || {}), clips };
}

export function authoredSfxMap(heroes) {
  const map = {};
  for (const { hero } of heroes) for (const [cue, file] of Object.entries(hero.sfx || {})) {
    if (map[cue]) throw new Error(`SFX cue ${cue} declared twice`);
    map[cue] = file;
  }
  return map;
}

export function patchAuthoredSfx(html, sfx) {
  return once(html, SFX_PLACEHOLDER, JSON.stringify(sfx), 'HonVietSfx authored placeholder');
}

export function patchAuthoredBattle(input, runtime, descriptors) {
  if (input.includes(MARK_BATTLE)) return input;
  const table = Object.fromEntries(descriptors.map(d => [d.sourceId, d]));
  const ids = Object.fromEntries(descriptors.map(d => [d.id, d.sourceId]));
  let s = once(input, 'async function performSplusAction(actor, action, target) {',
    // var (not const): the battle reads its embedded config and resets state BEFORE this point
    // executes; a const here was in its temporal dead zone and aborted the whole battle script.
    `${MARK_BATTLE}\nvar AUTHORED_HEROES=${JSON.stringify(table)};\nvar AUTHORED_HERO_IDS=${JSON.stringify(ids)};\n${runtime}\nasync function performSplusAction(actor, action, target) {`);
  s = once(s, '  const e=splusCombat(),battleId=state.battleId;',
    '  const e=splusCombat(),battleId=state.battleId;\n  if(isAuthoredHero(actor))return performAuthoredAction(actor,action,target,e,battleId);');
  // The legacy AI validates intents with the LEGACY Core.canUseAction, then this S+ gate
  // silently returned when the S+ engine disagreed (e.g. S+ stun/cooldown/rage), leaving
  // state.locked=true forever: the battle froze on that hero's turn. For authored heroes the
  // engine's own chooseAction decides; with no legal action the turn is consumed explicitly.
  s = once(s, "      if(state.locked||state.mode!=='battle'||actor.id!==state.currentId||!splusCombat().canUse(actor,action))return;",
    "      if(isAuthoredHero(actor)&&!state.locked&&state.mode==='battle'&&actor.id===state.currentId&&!splusCombat().canUse(actor,action)){const chosen=splusCombat().chooseAction(actor);authoredLog.push(actor.id+':gate:'+action+'->'+(chosen||'none'));if(!chosen)return authoredSkipTurn(actor);action=chosen;target=splusCombat().targets(actor,action)[0]||target;}\n      if(state.locked||state.mode!=='battle'||actor.id!==state.currentId||!splusCombat().canUse(actor,action))return;");
  s = once(s, 'function drawSplusToken(context, unit, time) {',
    'function drawSplusToken(context, unit, time) {\n  if(isAuthoredHero(unit))return drawAuthoredHero(context,unit,time);');
  s = once(s, 'function splusReset(){', 'function splusReset(){cancelAuthoredHeroes();');
  s = once(s, 'function splusEvent(event) {', 'function splusEvent(event) {authoredHeroEvent(event);');
  s = once(s, 'function splusHeroConfig(raw, index) {',
    `function splusHeroConfig(raw, index) {\n {const authoredIds=${JSON.stringify(ids)},key=String(raw?.sourceId||raw?.id||'').replace(/-/g,'_');if(authoredIds[key])raw={...raw,sourceId:authoredIds[key]};}`);
  s = once(s, '    drawEffects(ctx, time);', '    drawEffects(ctx, time);\n    drawAuthoredHeroVfx(ctx,time);');
  s = once(s, 'const slots=isBeAn(actor)||', 'const slots=isAuthoredHero(actor)||isBeAn(actor)||');
  s = once(s, 'const authoredFallMs=', 'const authoredFallMs=isAuthoredHero(unit)?authoredHeroFallMs(unit)/Math.max(1,state.speed):');
  s = once(s, 'unit.defeatHideDuration = ', 'unit.defeatHideDuration = isAuthoredHero(unit)?authoredFallMs+120/Math.max(1,state.speed):');
  s = once(s, 'const STATUS_ICON_SOURCES = Object.freeze({',
    'const STATUS_ICON_SOURCES = Object.freeze({\n inkMark:"assets/ui/status/ink-mark.svg",');
  s = once(s, "      if(status.type==='sealPaw'||status.type==='sealSulks'){",
    "      if(status.type==='inkMark'){context.fillStyle='#fff';context.font='bold 11px sans-serif';context.textAlign='center';context.fillText(String(status.stacks||1),sx+size*.3,sy+size*.4);}\n      if(status.type==='sealPaw'||status.type==='sealSulks'){");
  return s;
}

function campaignDescriptor(d, key) {
  const c = d.clips[key], p = c.pages[0];
  return { src: p.src, frames: c.frames, cols: p.cols, cellW: c.cellW, cellH: c.cellH, ms: c.durationMs / c.frames,
    pivot: c.pivot, foot: c.foot, body: c.body, playbackRate: 1 };
}
function idlePack(d) {
  const c = d.clips.idle;
  return { pageFrames: c.pageFrames, poster: null, pages: c.pages.map(p => ({ src: p.src, cols: p.cols, rows: p.rows,
    cellW: c.cellW, cellH: c.cellH, pivot: c.pivot, foot: c.foot, body: c.body })) };
}

export function patchAuthoredHost(input, heroes) {
  if (input.includes(MARK_HOST)) return input;
  const descriptors = heroes.map(battleDescriptor);
  const data = {}, manifest = {}, idle = {}, prep = {}, run = {}, farm = {}, ids = {}, detail = {};
  for (const [i, { hero }] of heroes.entries()) {
    const d = descriptors[i], k = hero.kit;
    data[hero.id] = { ...hero.host, passive: { name: k.passive.name, desc: k.passive.desc },
      skill: { name: k.basic.name, cost: 0, desc: k.basic.desc, fx: k.basic.fx },
      ultimate: { name: k.ultimate.name, cost: k.ultimate.cost, desc: k.ultimate.desc, fx: k.ultimate.fx } };
    manifest[hero.id] = { slug: hero.slug, displayName: hero.host.name, identityVersion: hero.identityVersion,
      reference: { master: hero.art.portrait, runtime: true },
      assets: { master: hero.art.portrait, avatar: hero.art.portrait, card: hero.art.portrait, dialogue: hero.art.portrait,
        icon: hero.art.portrait, idle: d.clips.idle.pages[0].src }, surfaces: hero.surfaces };
    idle[hero.id] = campaignDescriptor(d, 'idle');
    prep[hero.id] = idlePack(d);
    if (d.clips.run) run[hero.id] = campaignDescriptor(d, 'run');
    if (d.clips.basic) farm[hero.id] = campaignDescriptor(d, 'basic');
    ids[hero.sourceId] = hero.id;
    // Hero-detail shows one hero on the host page: use the full-resolution detail atlas when present
    // (battle atlases are budget-scaled and looked blurry when enlarged here).
    const c = d.clips.idle, full = heroes[i].meta.detail;
    detail[hero.id] = full
      ? { src: heroes[i].base + full.file, cols: full.cols, frames: full.frames, cellW: full.cellW, cellH: full.cellH, durationMs: full.durationMs, name: hero.host.name }
      : { src: c.pages[0].src, cols: c.pages[0].cols, frames: c.frames, cellW: c.cellW, cellH: c.cellH, durationMs: c.durationMs, name: hero.host.name };
  }
  const list = Object.keys(data);
  let s = once(input, 'let P=null, MEMORY_ONLY=false;',
    // Canonical shape `Object.assign(DATA.heroes,{\n...\n});` — content audits (campaign-progression-audit)
    // evaluate exactly that block in isolation, so nothing else may share it.
    `${MARK_HOST}\nObject.assign(DATA.heroes,{\n${JSON.stringify(data).slice(1, -1)}\n});\nObject.assign(CHARACTER_MANIFEST,${JSON.stringify(manifest)});\nvar AUTHORED_DETAIL_IDLE=${JSON.stringify(detail)};\nlet P=null, MEMORY_ONLY=false;`);
  const init = 'const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,stars:1};';
  s = once(s, init, `${init}\n${JSON.stringify(list)}.forEach(id=>{if(heroes[id])heroes[id].owned=true;});`);
  const mig = 'for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,stars:1};';
  // One starter flag per hero so later heroes are granted to existing saves exactly once.
  s = once(s, mig, `${mig}\n${JSON.stringify(list)}.forEach(id=>{const flag='authoredStarter:'+id;p.flags=p.flags||{};if(!p.flags[flag]&&p.heroes[id]){p.heroes[id].owned=true;p.flags[flag]=true;}});`);
  // Official roster lists: JS array literals ending with the last registered legacy id.
  const tail = '"be_an"]';
  const arrays = [...s.matchAll(/\[(?:"[a-z0-9_]+",)+"be_an"\]/g)];
  if (arrays.length < 3) throw new Error(`AUTHORED_HERO_ROSTER_ARRAYS ${arrays.length}`);
  s = s.replace(/\[((?:"[a-z0-9_]+",)+"be_an")\]/g, (_, body) => `[${body},${list.map(id => JSON.stringify(id)).join(',')}]`);
  if (!s.includes(`"be_an",${JSON.stringify(list[0])}]`)) throw new Error('AUTHORED_HERO_ROSTER_PATCH');
  void tail;
  // Inline literal: tests and other owners evaluate this normalizer standalone.
  s = once(s, "if(id==='hero_splus_be_an')return 'be_an';", `if(id==='hero_splus_be_an')return 'be_an';{const authoredIds=${JSON.stringify(ids)};if(authoredIds[id])return authoredIds[id];}`);
  s = once(s, 'function preparationSpriteFor(pick, time) {',
    `Object.assign(spriteSpecs,${JSON.stringify(idle)});\nObject.assign(preparationIdlePacks,${JSON.stringify(prep)});\nfunction preparationSpriteFor(pick, time) {`);
  s = once(s, 'function frameAt(spec, time) {',
    `Object.assign(runSpecs,${JSON.stringify(run)});\nObject.assign(farmAttackSpecs,${JSON.stringify(farm)});\nfunction frameAt(spec, time) {`);
  s = once(s, "if(id==='bach_dien'){ startBachDienDetailIdle(); }",
    "if(id==='bach_dien'){ startBachDienDetailIdle(); }\nif(typeof AUTHORED_DETAIL_IDLE!=='undefined'&&AUTHORED_DETAIL_IDLE[id])startAuthoredDetailIdle(id);");
  s = once(s, "id==='be_an'?'<canvas id=",
    "(typeof AUTHORED_DETAIL_IDLE!=='undefined'&&AUTHORED_DETAIL_IDLE[id])?'<canvas id=\"authoredDetailIdle\" data-hero-id=\"'+id+'\" width=\"'+AUTHORED_DETAIL_IDLE[id].cellW+'\" height=\"'+AUTHORED_DETAIL_IDLE[id].cellH+'\" aria-label=\"'+AUTHORED_DETAIL_IDLE[id].name+' idle\"></canvas>':id==='be_an'?'<canvas id=");
  s = once(s, 'function startBachDienDetailIdle(){', `function startAuthoredDetailIdle(id){
 cancelAnimationFrame(_lucDetailRaf);const cv=document.getElementById('authoredDetailIdle'),m=AUTHORED_DETAIL_IDLE[id];if(!cv||!m)return;
 const ctx=cv.getContext('2d'),image=new Image();image.decoding='async';image.src=m.src;const start=performance.now();
 function tick(){if(!cv.isConnected){image.src='';return;}const frame=Math.floor((performance.now()-start)*m.frames/m.durationMs)%m.frames;
  if(image.complete&&image.naturalWidth){ctx.clearRect(0,0,m.cellW,m.cellH);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,(frame%m.cols)*m.cellW,Math.floor(frame/m.cols)*m.cellH,m.cellW,m.cellH,0,0,m.cellW,m.cellH);}
  _lucDetailRaf=requestAnimationFrame(tick);}
 tick();
}
function startBachDienDetailIdle(){`);
  const css = list.map(id => `#hdBody .hstage[data-hero-id="${id}"]{position:relative!important;padding-top:400px!important}#hdBody .hstage[data-hero-id="${id}"]>.hsava{display:none!important}`).join('');
  s = once(s, '</head>', `<style id="authored-hero-detail">${css}#authoredDetailIdle{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:420px;max-width:100%;height:auto;pointer-events:none}</style></head>`);
  return s;
}

export function installAuthoredHeroes(root) {
  const heroes = loadAuthoredHeroes(root);
  if (!heroes.length) return [];
  const descriptors = heroes.map(battleDescriptor);
  const runtime = readFileSync(join(root, 'src/runtime/authored-hero.js'), 'utf8');
  const sfx = authoredSfxMap(heroes);
  const battle = join(root, 'dist/battle.html'), host = join(root, 'dist/index.html');
  writeFileSync(battle, patchAuthoredSfx(patchAuthoredBattle(readFileSync(battle, 'utf8'), runtime, descriptors), sfx));
  writeFileSync(host, patchAuthoredSfx(patchAuthoredHost(readFileSync(host, 'utf8'), heroes), sfx));
  return heroes.map(h => h.hero.id);
}
