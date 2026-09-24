import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(existsSync('dist/index.html') ? 'dist/index.html' : 'baseline/index.html', 'utf8');
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
