import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L67-T1: #hvTrainRoot is a body overlay with overflow auto and wrap showScreen/startTraining', () => {
  const css = read('src/ui/train-3d.css');
  assert.match(css, /#hvTrainRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvTrainRoot\.is-open\{display:flex/);
  assert.match(css, /#hvTrainRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvTrainRoot\{[^}]*overflow:hidden/);
  assert.match(css, /width:100vw;height:100vh;min-height:100vh/);
  assert.match(css, /body\.train-3d-active\{filter:none\}/);
  const ui = read('src/ui/train-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /startTraining = function honVietStartTraining/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L67-T2: hall jpg is dedicated and larger than 50KB', () => {
  const hall = join(root, 'assets/ui/train/train-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/train-3d.css');
  assert.match(css, /assets\/ui\/train\/train-hall\.jpg/);
  assert.doesNotMatch(css, /menu-v3233/);
});

test('L67-T3: Luyện spends stamina + runBattle luyen_tap; back navTo hub; after battle openHall', () => {
  const ui = read('src/ui/train-3d-runtime.js');
  assert.match(ui, /spendStamina/);
  assert.match(ui, /runBattle\('luyen_tap'/);
  assert.match(ui, /navTo\('hub'\)/);
  assert.match(ui, /data-train-back/);
  assert.match(ui, /data-train-fight/);
  assert.match(ui, /openHall\(\)/);
  assert.doesNotMatch(ui, /runBattle\('luyen_tap'[\s\S]{0,80}navTo\('hub'\)/);
  const html = read('index.html');
  assert.match(html, /function startTraining\(\)/);
});

test('L67-T4: stub lane loads runtime; build-static keeps reserved import; no battle.html', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/train-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0067-train.mjs');
  assert.match(build, /lanes\/tkt-0067-train\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/train-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/train-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/train-3d\.css/);
  assert.doesNotMatch(inject, /battle\.html/);
});

test('L67-T5: does not unlock the five locked lich spokes', () => {
  const ui = read('src/ui/train-3d-runtime.js');
  const css = read('src/ui/train-3d.css');
  for (const key of ['hold', 'forgegate', 'abyss', 'palace', 'drill']) {
    assert.doesNotMatch(ui, new RegExp(key));
    assert.doesNotMatch(css, new RegExp(key));
  }
});
