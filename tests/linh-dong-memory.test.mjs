import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const patchUrl = new URL('scripts/linh-dong-memory-v1.mjs', root);
const patch = fs.existsSync(patchUrl) ? (await import(patchUrl)).patchLinhDongMemory : h => h;

function harness(surface = 'battle') {
  const html = patch(read(surface === 'battle' ? 'battle.html' : 'index.html'), surface);
  const made = [], requests = [];
  class Image {
    constructor() { this.complete = false; this.naturalWidth = 0; made.push(this); }
    set src(src) { this._src = src; if (src) requests.push(src); }
    get src() { return this._src; }
    removeAttribute(name) { if (name === 'src') this._src = ''; }
  }
  const box = { Image, window: {}, Map, Set, Object };
  vm.createContext(box);
  const start = html.indexOf(surface === 'battle' ? 'const LINH_DONG_IDS=' : 'const LINH_DONG_ANIMS=');
  const end = html.indexOf(surface === 'battle' ? 'let linhDongFx=' : 'let lucAnhBattleVfx=', start);
  assert.ok(start > 0 && end > start);
  vm.runInContext(html.slice(start, end) + ';this.images=LINH_DONG_IMAGES;this.cache=window.__HV_LINH_DONG_CACHE;', box);
  const ready = (image, w, h) => { image.complete = true; image.naturalWidth = w; image.naturalHeight = h; image.onload?.(); };
  return { ...box, html, made, requests, ready };
}

test('L144-T1 host and battle boot without requesting Linh Dong atlases', () => {
  for (const surface of ['host', 'battle']) {
    const h = harness(surface);
    assert.equal(h.requests.length, 0, surface + ' must not eager-load animation clips');
    assert.equal(h.made.length, 0);
  }
});

test('L144-T2 attack and skill1 share one Image; two in-flight loads maximum', () => {
  const h = harness();
  const attack = h.images.attack;
  assert.equal(h.images.skill1, attack);
  const idle = h.images.idle;
  assert.ok(idle);
  assert.equal(h.images.ultimateVfx, null);
  assert.equal(h.requests.length, 2);
  h.ready(attack, 3840, 2640); h.ready(idle, 3840, 5280);
  assert.ok(h.images.ultimateVfx);
  assert.equal(h.requests.length, 3);
});

test('L144-T2 long action sequence stays within the decoded RGBA byte budget', () => {
  const h = harness();
  for (let pass = 0; pass < 4; pass++) {
    for (const key of ['idle','attack','skill1Vfx','hurt','run','ultimate','ultimateVfx','defeated']) {
      const im = h.images[key]; assert.ok(im, key);
      const m = h.cache.inspect().entries.find(e => e.src === im.src);
      h.ready(im, m.width, m.height);
      assert.ok(h.cache.inspect().bytes <= 128 * 1024 * 1024);
      assert.ok(h.cache.inspect().loading <= 2);
    }
  }
  assert.ok(h.made.some(im => im.src === ''), 'eviction releases the image source');
});

test('L144-T3 failed and malformed atlases do not retry on every animation frame', () => {
  const h = harness();
  const idle = h.images.idle; idle.onerror();
  for (let n = 0; n < 100; n++) assert.equal(h.images.idle, null);
  assert.equal(h.requests.length, 1);
  const attack = h.images.attack; h.ready(attack, 1, 1);
  assert.equal(h.images.skill1, null);
  assert.equal(h.cache.inspect().bytes, 0);
  assert.equal(h.requests.length, 2);
});

test('L144-T3 clear cancels outstanding sources and makes stale load callbacks harmless', () => {
  const h = harness(); const idle = h.images.idle; const lateLoad = idle.onload;
  h.cache.clear();
  assert.equal(idle.src, ''); assert.equal(idle.onload, null); assert.equal(idle.onerror, null);
  assert.equal(h.cache.inspect().bytes, 0);
  lateLoad();
  assert.equal(h.cache.inspect().bytes, 0);
  assert.notEqual(h.images.idle, idle, 'a later scene can request the atlas again');
});

test('L144-T4 battle renderer returns false before loading and uses idle during action loading', () => {
  const h = harness();
  const start = h.html.indexOf('function drawLinhDongHero(');
  const end = h.html.indexOf('function startLinhDongFx(', start);
  const calls = []; let ready = false;
  const box = { isLinhDong: () => true, linhDongFrame: () => 0,
    drawLinhDongAtlas: (_c, key) => { calls.push(key); return ready && key === 'idle'; } };
  vm.createContext(box); vm.runInContext(h.html.slice(start,end) + ';this.draw=drawLinhDongHero;', box);
  const context = { save(){}, restore(){} };
  assert.equal(box.draw(context, {hp:10,state:'attack'}, 500), false);
  ready = true; calls.length = 0;
  assert.equal(box.draw(context, {hp:10,state:'attack'}, 500), true);
  assert.deepEqual(calls, ['attack','idle']);
});

test('L144-T4 profile keeps atlas aspect ratio and stops when its screen is hidden', () => {
  const h = harness('host'), html = h.html;
  const start = html.indexOf('function startLinhDongDetailIdle(');
  const end = html.indexOf('/* ---------- KHO MỘNG', start);
  const draws = []; let next;
  const cv = {isConnected:true,style:{},getContext:()=>({setTransform(){},clearRect(){},drawImage(...a){draws.push(a);}})};
  const box = {window:{devicePixelRatio:3},document:{hidden:false,getElementById:()=>cv},ST:{screen:'heroDetail'},
    LINH_DONG_ANIMS:{idle:{w:480,h:440,cols:8}},LINH_DONG_IMAGES:{idle:{complete:true,naturalWidth:3840}},
    performance:{now:()=>0},lucFrame:()=>0,_lucDetailRaf:0,
    cancelAnimationFrame(){},requestAnimationFrame(fn){next=fn;return 1;}};
  vm.createContext(box);vm.runInContext(html.slice(start,end)+';startLinhDongDetailIdle();',box);
  if (draws.length === 0 && next) next(); // First browser animation frame, after showScreen.
  assert.equal(draws.length,1);
  const a=draws[0];assert.ok(Math.abs(a[7]/a[8]-480/440)<1e-9);
  box.ST.screen='campaign';next();assert.equal(draws.length,1);
});

test('L144-T5 campaign and preparation select the full-body idle atlas, not master portrait', () => {
  const scene = read('src/ui/campaign-scene.js');
  const start=scene.indexOf('const spriteSpecs =');const end=scene.indexOf('// Authored Basic',start);
  const box={LUC_ANH_IDLE_1080:{},AFK_THAY_MO_IDLE_DURATIONS:[]};vm.createContext(box);
  vm.runInContext(scene.slice(start,end)+';this.spec=spriteSpecs.linh_dong;',box);
  assert.ok(box.spec, 'missing Linh Dong sprite entry sends both screens to portraitSrc(master)');
  const s=box.spec;assert.equal(s.src,'assets/characters/linh-dong/campaign-lite/idle-atlas.webp');
  assert.equal(s.frames,96);assert.equal(s.cellW,240);assert.equal(s.cellH,220);
  assert.equal(s.pivot,120);assert.equal(s.foot,220);assert.equal(s.body,165);
});
