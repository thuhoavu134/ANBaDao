import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(existsSync('dist/index.html') ? 'dist/index.html' : 'baseline/index.html', 'utf8');
const hostQa = readFileSync('scripts/qa-host-battle-entry.mjs', 'utf8');
const reentryQa = readFileSync('scripts/qa-formation-entry-p0.mjs', 'utf8');
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
function hostAssets() {
  const requests = [], images = [];
  class Image {
    constructor() { this.complete = false; this.naturalWidth = 0; images.push(this); }
    set src(value) { this.source = value; if (value) requests.push(value); }
    get src() { return this.source; }
    removeAttribute(name) { if (name === 'src') this.source = ''; }
  }
  const start = html.includes('/* HV_HOST_BATTLE_ATLASES_V1 */')
    ? html.indexOf('/* HV_HOST_BATTLE_ATLASES_V1 */') : html.indexOf('const imgLacViet =');
  const end = html.indexOf('const LINH_DONG_ANIMS=', start);
  assert.ok(start >= 0 && end > start);
  const context = { Image, window: {}, document: { getElementById: () => null }, Object };
  vm.runInNewContext(html.slice(start, end) + '\nwindow.testImages=LUC_ANH_IMAGES;', context);
  return { context, requests, images, owner: context.window.__HV_HOST_ATLASES };
}

test('browser QA matches direct-iPhone P0 transport and requires two successful entries', () => {
  assert.doesNotMatch(hostQa, /iphone-path/, 'host iframe lifecycle QA must not pretend direct iPhone still owns an iframe');
  assert.match(reentryQa, /for\s*\(let cycle\s*=\s*1;\s*cycle\s*<=\s*2;\s*cycle\+\+\)/, 'P0 QA must enter battle twice');
  assert.match(reentryQa, /actionCount\s*>=\s*2/, 'each entry must prove real action progression');
  assert.match(reentryQa, /battle-abort|exitBattleButton|hvBattleReturn/, 'P0 QA must exercise a real return path between entries');
  assert.match(ciWorkflow, /node scripts\/qa-formation-entry-p0\.mjs/, 'two-entry P0 QA must be part of CI');
});

test('host does not request combat atlas sets at boot', () => {
  const { requests } = hostAssets();
  assert.equal(requests.length, 0, 'host must load only the art currently displayed');
});

test('host releases detached Image instances and blocks reloads until resume', () => {
  const { context, requests, owner } = hostAssets();
  assert.ok(owner, 'host atlas lifetime owner must exist');
  const first = context.window.testImages.idle;
  assert.equal(requests.length, 1);
  assert.equal(context.window.testImages.idle, first);
  owner.suspend();
  assert.equal(first.src, '');
  assert.equal(owner.inspect().entries, 0);
  assert.equal(context.window.testImages.idle, null);
  assert.equal(requests.length, 1);
  owner.resume();
  assert.equal(requests.length, 1, 'resume is lazy');
  assert.notEqual(context.window.testImages.idle, first);
  assert.equal(requests.length, 2);
  owner.suspend(); owner.suspend(); owner.resume();
  assert.equal(owner.inspect().entries, 0);
});

test('hidden legacy host battle does no rendering while integrated battle is open', () => {
  const start = html.indexOf('function renderLoop(now){');
  const end = html.indexOf('\nfunction drawSpatialMap()', start);
  assert.ok(start >= 0 && end > start);
  let draws = 0, frames = 0;
  const context = { last: 0, Math, ST: { screen: 'battle' }, S: { allies: [], foes: [] },
    document: { getElementById: () => ({ classList: { contains: () => true } }) },
    window: { __HV_HOST_ATLASES: { suspended: true } },
    drawVnStars: () => draws++, drawBattle: () => draws++,
    requestAnimationFrame: () => frames++, stepAnims() {}, updateWeaponVfx() {},
    shake: 0, slashes: [], sparks: [], floats: [], repositionBubbles() {} };
  vm.runInNewContext(html.slice(start, end) + '\nrenderLoop(16);', context);
  assert.equal(draws, 0, 'legacy draw loop must not decode and draw behind the iframe');
  assert.equal(frames, 1, 'resume keeps one animation loop');
});

test('close clears child before restoring host images', () => {
  const close = html.slice(html.indexOf('  function closeOverlay() {'), html.indexOf('  function finishIntegratedBattle('));
  assert.ok(close.indexOf('frame.src = "about:blank";') >= 0);
  assert.ok(close.indexOf('window.__HV_BATTLE_HOST_MEMORY_RESTORE?.();') > close.indexOf('frame.src = "about:blank";'));
});

test('iPhone entry keeps the iframe first and hands off only after twelve seconds', () => {
  const start = html.indexOf('      activeBattle.loadWatchdog = setTimeout(() => {');
  const marker = '      }, 12000);';
  const end = html.indexOf(marker, start);
  assert.ok(start >= 0 && end > start, 'twelve-second iOS fallback must be present in built host');
  const watchdog = html.slice(start, end + marker.length);

  function run(isIos) {
    let callback, delay, navigation = null;
    const scope = {
      activeBattle: { sessionId: 'session-1' }, sessionId: 'session-1',
      loading: { hidden: false, firstChild: { textContent: '' } },
      __HV_IOS_DIRECT_BATTLE: isIos, serializedBattleConfig: '{"sessionId":"session-1"}',
      url: 'battle.html?embedded=1&session=session-1&autostart=1',
      window: {}, encodeURIComponent,
      location: { assign: value => { navigation = value; } },
      setTimeout: (fn, ms) => { callback = fn; delay = ms; return 1; }
    };
    vm.runInNewContext(watchdog, scope);
    callback();
    return { delay, navigation, windowName: scope.window.name, copy: scope.loading.firstChild.textContent };
  }

  const ios = run(true);
  assert.equal(ios.delay, 12000);
  assert.equal(ios.navigation, 'battle.html?embedded=1&session=session-1&autostart=1');
  assert.match(ios.windowName, /^hvBattleConfig:/);

  const desktop = run(false);
  assert.equal(desktop.delay, 12000);
  assert.equal(desktop.navigation, null);
  assert.match(desktop.copy, /vui lòng chờ thêm/);
});

test('iPhone Xuất chiến enters battle.html directly while desktop keeps the iframe', () => {
  const ownerStart = html.indexOf('function openIntegratedBattle()');
  const start = html.indexOf('    if (window.parent !== window || __HV_IOS_DIRECT_BATTLE) {', ownerStart);
  const end = html.indexOf('    window.__HV_HOST_ATLASES.suspend();', start);
  assert.ok(ownerStart >= 0 && start > ownerStart && end > start, 'direct iOS entry must run before iframe setup');
  const handoff = html.slice(start, end);

  function run(isIos, nested = false) {
    let navigation = null;
    const window = {};
    window.parent = nested ? {} : window;
    const location = { assign: value => { navigation = value; } };
    const enter = new Function(
      'window', 'location', 'serializedBattleConfig', 'url', '__HV_IOS_DIRECT_BATTLE', 'encodeURIComponent',
      '(() => {' + handoff + '})()'
    );
    enter(window, location, '{"sessionId":"session-1"}',
      'battle.html?embedded=1&session=session-1&autostart=1', isIos, encodeURIComponent);
    return { navigation, windowName: window.name || '' };
  }

  const ios = run(true);
  assert.equal(ios.navigation, 'battle.html?embedded=1&session=session-1&autostart=1');
  assert.match(ios.windowName, /^hvBattleConfig:/);

  const desktop = run(false);
  assert.equal(desktop.navigation, null);
  assert.equal(desktop.windowName, '');

  const nested = run(false, true);
  assert.equal(nested.navigation, 'battle.html?embedded=1&session=session-1&autostart=1');
});