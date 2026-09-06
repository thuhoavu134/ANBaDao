import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import sharp from 'sharp';
import { LUC_ANH_BASIC_GEOMETRY as BASIC, LUC_ANH_IDLE_REFERENCE as IDLE } from '../src/domain/character/luc-anh-spatial.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const audioSource = read('src/ui/audio-sfx-runtime.js');
function audioFixture({ suspended = false, hold = false, parentBus = null } = {}) {
  const listeners = {}, dataset = {}, requests = [], sources = [];
  let release, now = 100;
  const pending = hold ? new Promise(resolve => { release = resolve; }) : Promise.resolve(new ArrayBuffer(1));
  const context = {
    state: suspended ? 'suspended' : 'running', destination: {},
    resume() { this.state = 'running'; return Promise.resolve(); },
    decodeAudioData: async () => ({ duration: 1 }),
    createGain() { return { gain: {}, connect() {}, disconnect() {} }; },
    createBufferSource() { const source = { connect() {}, disconnect() {}, stop() { this.stopped = true; }, start() { this.started = true; } }; sources.push(source); return source; }
  };
  const window = { HonVietAudio: { context: () => context }, addEventListener() {} };
  window.parent = parentBus ? { HonVietSfx: parentBus } : window;
  vm.runInNewContext(audioSource, {
    window, URL, console: { warn() {} }, performance: { now: () => now },
    document: { baseURI: 'https://game.example/index.html', documentElement: { dataset },
      addEventListener(name, fn) { (listeners[name] ||= []).push(fn); } },
    fetch: async url => { requests.push(url); return { ok: true, arrayBuffer: () => pending }; }
  });
  return { bus: window.HonVietSfx, context, requests, sources, listeners, dataset,
    advance: () => { now += 1500; }, release: () => release?.(new ArrayBuffer(1)) };
}

test('supplied SFX preserve source hashes and serve MP3 bytes with MP3 extensions', () => {
  const manifest = JSON.parse(read('assets/audio/sfx/sources.json'));
  assert.equal(manifest.files.length, 9);
  for (const file of manifest.files) {
    const bytes = readFileSync(new URL('../assets/audio/sfx/' + file.file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    assert.ok(file.codec === 'mp3' ? file.file.endsWith('.mp3') : bytes.toString('ascii', 0, 4) === 'RIFF');
    assert.ok(audioSource.includes(file.file), file.file + ' has an event mapping');
  }
});
test('SFX plays decoded assets and debounces an AOE impact into one voice/load', async () => {
  const f = audioFixture();
  const results = await Promise.all([f.bus.play('impact'), f.bus.play('impact'), f.bus.play('impact')]);
  assert.deepEqual(results, [true, false, false]);
  assert.equal(f.requests.length, 1); assert.equal(f.sources.length, 1);
  assert.equal(f.sources[0].started, true); assert.equal(f.dataset.sfxLast, 'impact');
  f.advance(); await f.bus.play('impact'); assert.equal(f.requests.length, 1, 'decoded buffer reused');
});
test('mute stops active combat and prevents pending decode from playing later', async () => {
  const f = audioFixture({ hold: true });
  const result = f.bus.play('basic');
  f.bus.setCombatEnabled(false); f.release();
  assert.equal(await result, false); assert.equal(f.sources.length, 0);
  f.bus.setCombatEnabled(true); f.advance();
  assert.equal(await f.bus.play('basic'), true);
  f.bus.setCombatEnabled(false); assert.equal(f.sources[0].stopped, true);
  assert.equal(await f.bus.play('impact'), false);
  assert.equal(await f.bus.play('ui'), true, 'combat mute does not corrupt UI bus');
});
test('audio starts only after real gesture unlock; iframe reuses parent bus', async () => {
  const f = audioFixture({ suspended: true });
  assert.equal(await f.bus.play('basic'), false); assert.equal(f.sources.length, 0);
  await f.bus.unlock(); assert.equal(f.context.state, 'running');
  assert.equal(await f.bus.play('basic'), true);
  let event; const g = audioFixture({ parentBus: { play: async key => { event = key; return true; } } });
  assert.equal(await g.bus.play('ultimate'), true); assert.equal(event, 'ultimate'); assert.equal(g.requests.length, 0);
});
test('polyphony is bounded to six source nodes', async () => {
  const f = audioFixture();
  for (let i = 0; i < 10; i++) { f.advance(); await f.bus.play('basic'); }
  assert.equal(f.sources.filter(s => !s.stopped).length, 6);
});

async function frameBounds(file, cell) {
  const { data, info } = await sharp(new URL('../assets/characters/luc-anh/' + file, import.meta.url).pathname)
    .extract({ left: 0, top: 0, width: cell, height: cell }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minY = cell, maxY = -1;
  for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
    if (data[(y * cell + x) * info.channels + 3] >= 128) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  return { height: maxY - minY + 1, foot: maxY + 1 };
}
test('actual first-frame pixels preserve Idle-to-Basic body height and foot baseline', async () => {
  const idle = await frameBounds('idle-rgba-v1-atlas.webp', 480);
  const basic = await frameBounds('basic-atlas.webp', 240);
  assert.equal(idle.height, 398); assert.equal(basic.height, 148);
  assert.ok(Math.abs(IDLE.displaySize * idle.height / 480 - BASIC.displaySize * basic.height / 240) < 0.01);
  const idleFoot = IDLE.baseline - IDLE.displaySize * (1 - idle.foot / 480);
  const basicFoot = BASIC.baseline - BASIC.displaySize * (1 - basic.foot / 240);
  assert.ok(Math.abs(idleFoot - basicFoot) < 0.01);
  const manifest = JSON.parse(read('assets/characters/luc-anh/basic/cast/frames.json'));
  assert.equal(manifest.display.width, manifest.display.height, 'uniform XY scale');
  assert.equal(manifest.display.width, BASIC.displaySize); assert.equal(manifest.display.baseline, BASIC.baseline);
});
test('Đình Lôi retina atlases use the committed 2x source cells', async () => {
  const builtBattle = read('dist/battle.html');
  assert.match(builtBattle, /DINH_LOI_CELL_W=480, DINH_LOI_CELL_H=270/);
  assert.equal((builtBattle.match(/image\.naturalWidth\/8/g)||[]).length, 2, 'vertical VFX use full retina cells');
  for (const file of ['idle-atlas.png','run-atlas.png','hit-atlas.png','fall-atlas.png','basic-cast-atlas.png','skill1-cast-atlas.png','ultimate-cast-atlas.png','basic-projectile-atlas.png','basic-impact-atlas.png','skill1-wave-atlas.png','skill1-impact-atlas.png','skill1-shield-atlas.png']) {
    const meta = await sharp(new URL('../assets/characters/dinh-loi/' + file, import.meta.url).pathname).metadata();
    assert.deepEqual([meta.width, meta.height], [3840, 2160], file + ' keeps 2x landscape atlas dimensions');
  }
  for (const file of ['ultimate-vfx-atlas.png','ultimate-impact-atlas.png']) {
    const meta = await sharp(new URL('../assets/characters/dinh-loi/' + file, import.meta.url).pathname).metadata();
    assert.deepEqual([meta.width, meta.height], [2160, 3840], file + ' keeps 2x portrait atlas dimensions');
  }
});
test('result MVP portrait cache resolves authored Ông Phở art without a text placeholder', () => {
  const builtBattle = read('dist/battle.html');
  assert.match(builtBattle, /RESULT_PORTRAIT_CACHE/);
  assert.match(builtBattle, /resultPortraitRecord\('ong_hang_pho',\(\)=>\{\}\)/);
  assert.doesNotMatch(builtBattle, /const img=new Image\(\); img\.onload=.*ong-pho\/card\.png/);
});
test('integrated victory result paints authored Ông Phở MVP art', () => {
  const builtBattle = read('dist/battle.html');
  assert.match(builtBattle, /hv-patch:integrated-mvp-portrait-v1/);
  assert.match(builtBattle, /MVP_PORTRAIT_CACHE/);
  assert.match(builtBattle, /mvpPortraitRecord\('ong_hang_pho',\(\)=>\{\}\)/);
  assert.match(builtBattle, /paintAuthoredMvpPortrait/);
});

test('other MVP heroes reuse the loaded battle portrait renderer', () => {
  const battle = read('dist/battle.html');
  const start = battle.indexOf(' function paintHero(canvas,m){');
  const end = battle.indexOf(' function nav(target){', start);
  assert.ok(start >= 0 && end > start);
  const canvas = {}, mvp = { id: 'archer', name: 'Nữ Cung Thủ Tre', slot: 2, damage: 1552, alive: true };
  let rendered;
  const window = {};
  const engine = vm.createContext({
    window, HEROES: [{ id: 'archer', sourceId: 'cung_thu_tre', archetype: 'ranged', accent: '#d7aa57' }],
    drawReportPortrait: (target, entry) => { rendered = { target, entry }; },
    TEAM_PLAYER: 'player'
  });
  const bridgeStart = battle.indexOf('  window.__HV_DRAW_MVP_PORTRAIT=');
  const bridgeEnd = battle.indexOf("  resultPortraitRecord('ong_hang_pho',()=>{});", bridgeStart);
  assert.ok(bridgeStart >= 0 && bridgeEnd > bridgeStart);
  vm.runInContext(battle.slice(bridgeStart, bridgeEnd), engine);
  // The result UI must not depend on engine lexical globals.
  const context = vm.createContext({ window, canvas, mvp, paintAuthoredMvpPortrait: () => false });
  vm.runInContext(battle.slice(start, end) + '\npaintHero(canvas,mvp);', context);
  assert.equal(rendered.target, canvas);
  assert.equal(rendered.entry.unit.archetype, 'ranged');
  assert.equal(rendered.entry.unit.sourceId, 'cung_thu_tre');
  assert.equal(rendered.entry.unit.slot, 2);
  assert.equal(rendered.entry.unit.name, mvp.name);
  assert.equal(rendered.entry.rec.damage, 1552);
  const sourcesStart = battle.indexOf('  const RESULT_PORTRAIT_SOURCES=');
  const sourcesEnd = battle.indexOf('  const RESULT_PORTRAIT_CACHE=', sourcesStart);
  const sources = vm.runInNewContext(battle.slice(sourcesStart, sourcesEnd) + '\nRESULT_PORTRAIT_SOURCES');
  assert.equal(sources.cung_thu_tre, 'assets/heroes-concept/crops/ranger-00.png');
  for (const source of Object.values(sources)) assert.ok(readFileSync(new URL('../' + source, import.meta.url)).length > 0);
});

test('roster portal has one grid scroll owner and explicit visibility on route changes', () => {
  const ui = read('src/ui/hero-roster-runtime.js'), css = read('scripts/hero-roster-phase-a-v4.mjs');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /root\.hidden = ST\.screen !== 'heroes'/);
  assert.match(ui, /root\.querySelector\('\.v4-grid'\)/);
  assert.match(css, /grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(css, /#hvHeroRosterV4\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /position:sticky/);
});
test('built battle keeps opaque canvas and stable camera; all inline JS parses', () => {
  for (const file of ['index.html', 'battle.html', 'qa-runtime.html']) {
    const html = read('dist/' + file);
    for (const [, attributes, script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type=["'](?:application\/json|importmap)/.test(attributes) || !script.trim()) continue;
      new vm.Script(script, { filename: file });
    }
  }
  const index = read('dist/index.html'), battle = read('dist/battle.html');
  assert.ok(Buffer.from(index.match(/const BATTLE_HTML_BASE64 = "([^"]+)"/)[1], 'base64').equals(Buffer.from(battle)), 'built battle payload parity');
  assert.match(battle, /cameraFlash = 0; cameraShake = 0; cameraZoom = 0/);
  assert.match(battle, /fillRect\(0, 0, dom\.canvas\.width, dom\.canvas\.height\)/);
  assert.doesNotMatch(battle, /ctx\.clearRect\(-100/);
  assert.match(battle, /window\.__playLucAnhUltimateVoiceGuaranteed\?\.\(\);playActionSound\(actor,"ultimate"\)/);
  assert.match(battle, /if \(state\.sound\) window\.HonVietSfx\?\.play\("impact"\)/);
  assert.doesNotMatch(battle, /tone\(critical \?/);
  assert.match(battle, /attack:1\.3445945945945945/);
});
