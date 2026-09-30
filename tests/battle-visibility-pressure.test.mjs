import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createDecodedAtlasCache } from '../src/assets/decoded-atlas-cache.mjs';

const html = readFileSync('dist/battle.html', 'utf8');
function fn(name) {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name);
  let end = start;
  while ((end = html.indexOf('}', end + 1)) >= 0) {
    const source = html.slice(start, end + 1);
    try { new vm.Script('(' + source + ')'); return source; } catch {}
  }
  throw new Error('Missing complete function: ' + name);
}
class FakeImage {
  complete = false; naturalWidth = 0; naturalHeight = 0;
  removeAttribute() { this.src = ''; }
  ready(width, height) { this.complete = true; this.naturalWidth = width; this.naturalHeight = height; this.onload(); }
}
const clip = (src, bytes) => ({ src, cols: 1, rows: 1, cellW: bytes / 4, cellH: 1 });

test('released critical atlases do not outrank a recently painted idle in LRU eviction', () => {
  const cache = createDecodedAtlasCache({ maxBytes: 32, maxLoading: 1, makeImage: () => new FakeImage() });
  const old = cache.reserve(clip('old-cast', 16), { priority: 'critical' }); old.image.ready(4, 1);
  const idle = cache.reserve(clip('visible-idle', 16)); idle.image.ready(4, 1);
  cache.reserve(clip('visible-idle', 16));
  cache.reserve(clip('new-cast', 16), { priority: 'critical' });
  assert.equal(idle.state, 'ready', 'unleased old casts must yield before a visible idle');
  assert.equal(old.state, 'idle');
  cache.clear();
});

test('native cache cannot erase a visible idle when a pinned action makes admission impossible', () => {
  const start = html.indexOf('const BATTLE_NATIVE_ATLAS_CACHE=');
  const end = html.indexOf('window.__HV_NATIVE_ATLAS_CACHE=', start);
  const box = vm.createContext({ Image: FakeImage, navigator: { userAgent: 'iPhone' }, performance: { now: () => 100 } });
  const cache = vm.runInContext(html.slice(start, end) + ';BATTLE_NATIVE_ATLAS_CACHE', box);
  const mb = 1024 * 1024, release = cache.retain(['action'], 96 * mb);
  const action = cache.ensure('action', clip('action.webp', 80 * mb)); action.ready(1, 1);
  const idle = cache.ensure('idle', clip('idle.webp', 10 * mb)); idle.ready(1, 1);
  assert.equal(cache.ensure('blocked', clip('blocked.webp', 20 * mb)), null);
  assert.equal(idle.src, 'idle.webp', 'failed admission must leave usable visible pixels intact');
  assert.ok(cache.inspect().entries.some(e => e.key === 'idle'));
  release(); cache.clear();
});

function context() {
  return { calls: [], save() {}, restore() {}, translate() {}, scale() {},
    drawImage(image, ...args) { this.calls.push({ image, args }); } };
}
function renderFixture() {
  let available = true;
  const atlas = { kind: 'authored-atlas' };
  const paint = (ctx) => { if (!available) return false; ctx.drawImage(atlas, 0, 0); return true; };
  const box = vm.createContext({ TEAM_ENEMY: 'enemy', TEAM_PLAYER: 'player',
    window: { addEventListener() {} }, document: { createElement() { const ctx = context(); return { width: 0, height: 0, getContext: () => ctx }; } },
    isLinhDong: u => u.hero === 'linh-dong', isBachDien: u => u.hero === 'bach-dien',
    isLucAnh: u => u.hero === 'luc-anh', isDinhLoi: u => u.hero === 'dinh-loi',
    linhDongFrame: () => 0, bachDienFrame: () => 0, lucAnhFrame: () => 0, dinhLoiFrame: () => 0,
    bachDienImage() {}, drawLinhDongAtlas: paint, drawBachDienAtlas: paint, drawLucAnhAtlas: paint, drawDinhLoiAtlasFrame: paint,
    __hvPersistentPages: { draw: paint },
    LUC_ANH_META: { idle: {}, attack: {}, defeated: {} }, lucAnhPlaybackRate: () => 1,
    lucAnhDisplaySize: () => 330, lucAnhDisplayBaseline: () => 48, DINH_LOI_IMAGES: {},
    DINH_LOI_ACTION_MS: 4000, DINH_LOI_FALL_MS: 4000, DINH_LOI_HIT_MS: 1000, DINH_LOI_FRAMES: 64,
  });
  const start = html.indexOf('/* HV_HERO_VISIBILITY_CACHE_V1 */');
  if (start >= 0) vm.runInContext(html.slice(start, html.indexOf('/* HV_HERO_VISIBILITY_CACHE_END */', start)), box);
  for (const name of ['drawLinhDongHero', 'drawBachDienHero', 'drawLucAnhHero', 'drawDinhLoiHero']) vm.runInContext(fn(name), box);
  return { box, atlas, available: value => { available = value; } };
}
for (const [hero, render] of [['linh-dong','drawLinhDongHero'], ['bach-dien','drawBachDienHero'], ['luc-anh','drawLucAnhHero'], ['dinh-loi','drawDinhLoiHero']]) {
  for (const team of ['player', 'enemy']) test(`${hero}/${team}: real hero renderer keeps body through eviction and resumes decoded animation`, () => {
    const f = renderFixture(), ctx = context(), unit = { hero, team, hp: 100, state: 'idle', stateStarted: 1 };
    f.box[render](ctx, unit, 100); assert.ok(ctx.calls.length);
    f.available(false); ctx.calls.length = 0;
    f.box[render](ctx, unit, 200);
    assert.equal(ctx.calls.length, 1, 'visible body must survive when its atlas is evicted/loading');
    assert.notEqual(ctx.calls[0].image, f.atlas, 'backup owns its pixels, not the evicted Image reference');
    f.available(true); ctx.calls.length = 0; unit.state = 'attack';
    f.box[render](ctx, unit, 300); assert.equal(ctx.calls[0].image, f.atlas, 'ready animation immediately replaces backup');
    f.available(false); ctx.calls.length = 0; unit.hp = 0;
    f.box[render](ctx, unit, 400); assert.equal(ctx.calls.length, 0, 'never resurrect a defeated hero with its standing backup');
  });
}
