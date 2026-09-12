import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L49-T1: live net commands stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /function renderNet\(\)/);
  assert.match(html, /function netOnline\(\)/);
  assert.match(html, /async function api\(/);
  assert.match(html, /const NET=/);
  assert.match(html, /function netAuth\(/);
  assert.match(html, /function netLogout\(\)/);
  assert.match(html, /id="netScreen"/);
  assert.match(html, /id="netBody"/);
});

test('L49-T2: #hvNetRoot is a body overlay with overflow auto and 100vh filter fix', () => {
  const css = read('src/ui/net-3d.css');
  assert.match(css, /#hvNetRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvNetRoot\.is-open\{display:flex/);
  assert.match(css, /#hvNetRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvNetRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/net\/net-hall\.jpg/);
  assert.match(css, /width:100vw;height:100vh;min-height:100vh/);
  assert.match(css, /body\.net-3d-active\{filter:none\}/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.match(css, /!important/);
});

test('L49-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/net-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]netBody['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L49-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/net-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0059-net.mjs');
  assert.match(build, /lanes\/tkt-0059-net\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/net-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/net-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/net-3d\.css/);
});

test('L49-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/net/net-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/net-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
