import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L40-T1: live domain and lacquer runtime stay frozen', () => {
  const ui = read('src/ui/arena-runtime.js');
  assert.match(ui, /function /);
  assert.match(ui, /hvArenaRoot/);
  const frozenCss = read('src/ui/arena-screen.css');
  assert.match(frozenCss, /#hvArenaRoot/);
});

test('L40-T2: #hvArenaRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/arena-3d.css');
  assert.match(css, /#hvArenaRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvArenaRoot\.is-open\{display:flex/);
  assert.match(css, /#hvArenaRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvArenaRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/arena\/arena-hall\.jpg/);
});

test('L40-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/arena-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /renderArena/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L40-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/arena-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0050-arena.mjs');
  assert.match(build, /lanes\/tkt-0050-arena\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/arena-3d-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/arena-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/arena-3d\.css/);
});

test('L40-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/arena/arena-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/arena-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
