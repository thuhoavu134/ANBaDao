import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L66-T1: wrap showScreen; chip data-hv-hub goes hub on battle/result/gear', () => {
  const ui = read('src/ui/hub-back-runtime.js');
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /data-hv-hub/);
  assert.match(ui, /navTo\('hub'\)/);
  assert.match(ui, /abortIntegratedBattle/);
  assert.match(ui, /hvGearRoot/);
  assert.match(ui, /hvLichRoot/);
  assert.match(ui, /integratedResultV6|endScreen/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L66-T2: does not touch prepare visual, journey-3d, end-3d, campaign-scene', () => {
  const ui = read('src/ui/hub-back-runtime.js');
  assert.doesNotMatch(ui, /cs-prepare|campaign-scene|journey-3d|end-3d/);
  assert.doesNotMatch(read('src/ui/campaign-scene.js'), /hvHubBackChip|data-hv-hub/);
  assert.doesNotMatch(read('src/ui/journey-3d-runtime.js'), /hvHubBackChip|data-hv-hub/);
  assert.doesNotMatch(read('src/ui/end-3d-runtime.js'), /hvHubBackChip|data-hv-hub/);
});

test('L66-T3: does not add a second listener on existing hall close-hub buttons', () => {
  const ui = read('src/ui/hub-back-runtime.js');
  assert.doesNotMatch(ui, /data-tower-back|data-bag-close|data-gear-close|data-lich-back/);
  assert.match(ui, /chip\.addEventListener\('click'/);
});

test('L66-T4: stub lane loads runtime; build-static keeps reserved import; no battle.html', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/hub-back-v1.mjs');
  const stub = read('scripts/lanes/tkt-0066-hub-back.mjs');
  assert.match(build, /lanes\/tkt-0066-hub-back\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/hub-back-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/hub-back-runtime\.js/);
  assert.match(inject, /src\/ui\/hub-back\.css/);
  assert.doesNotMatch(inject, /battle\.html/);
  assert.doesNotMatch(read('src/ui/hub-back-runtime.js'), /battle\.html|index\.html|campaign-scene/);
});

test('L66-T5: Lịch Luyện hides chip; keeps existing ‹ back arrow', () => {
  const ui = read('src/ui/hub-back-runtime.js');
  const css = read('src/ui/hub-back.css');
  const daily = read('src/ui/daily-runtime.js');
  assert.match(daily, /class="hv-lich-back"[^>]*data-lich-back[^>]*>‹/);
  assert.match(ui, /if \(lichOpen\(\)\) return false/);
  assert.match(css, /body\.hv-lich-open #hvHubBackChip\{display:none/);
  assert.doesNotMatch(ui, /data-lich-back/);
});
