import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L42-T1: live domain and lacquer runtime stay frozen', () => {
  const ui = read('src/ui/festival-runtime.js');
  assert.match(ui, /function /);
  assert.match(ui, /hvFestivalRoot/);
  const frozenCss = read('src/ui/festival-screen.css');
  assert.match(frozenCss, /#hvFestivalRoot/);
});

test('L42-T2: #hvFestivalRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/festival-3d.css');
  assert.match(css, /#hvFestivalRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvFestivalRoot\.is-open\{display:flex/);
  assert.match(css, /#hvFestivalRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvFestivalRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/festival\/festival-hall\.jpg/);
});

test('L42-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /renderFestival/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L42-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/festival-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0052-festival.mjs');
  assert.match(build, /lanes\/tkt-0052-festival\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/festival-3d-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/festival-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/festival-3d\.css/);
});

test('L42-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/festival/festival-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/festival-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
