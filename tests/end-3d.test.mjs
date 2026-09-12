import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L47-T1: live end screen and reward veil stay frozen in index', () => {
  const html = read('index.html');
  assert.match(html, /id="endScreen"/);
  assert.match(html, /id="endNextBtn"/);
  assert.match(html, /id="rewardVeil"/);
  assert.match(html, /function showRewardCeremony\(/);
});

test('L47-T2: #hvEndRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/end-3d.css');
  assert.match(css, /#hvEndRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvEndRoot\.is-open\{display:flex/);
  assert.match(css, /#hvEndRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvEndRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/end\/end-hall\.jpg/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /#121118/);
});

test('L47-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/end-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]endScreen['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L47-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/end-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0057-end.mjs');
  assert.match(build, /lanes\/tkt-0057-end\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/end-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/end-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/end-3d\.css/);
});

test('L47-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/end/end-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000);
  const css = read('src/ui/end-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
