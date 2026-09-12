import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L36-T1: live domain and lacquer runtime stay frozen', () => {
  const ui = read('src/ui/tower-runtime.js');
  assert.match(ui, /function /);
  assert.match(ui, /hvTowerRoot/);
  const frozenCss = read('src/ui/tower-screen.css');
  assert.match(frozenCss, /#hvTowerRoot/);
});

test('L36-T2: #hvTowerRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/tower-3d.css');
  assert.match(css, /#hvTowerRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvTowerRoot\.is-open\{display:flex/);
  assert.match(css, /#hvTowerRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvTowerRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/tower\/tower-hall\.jpg/);
});

test('L36-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/tower-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /renderTower/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L36-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/tower-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0046-tower.mjs');
  assert.match(build, /lanes\/tkt-0046-tower\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/tower-3d-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/tower-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/tower-3d\.css/);
});

test('L36-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/tower/tower-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/tower-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
