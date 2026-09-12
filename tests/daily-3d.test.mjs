import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L44-T1: live daily domain and lacquer runtime stay frozen', () => {
  const ui = read('src/ui/daily-runtime.js');
  assert.match(ui, /function renderLacquer\(/);
  assert.match(ui, /id="hvDailyRoot"/);
  const frozenCss = read('src/ui/daily-screen.css');
  assert.match(frozenCss, /#hvDailyRoot\{/);
  assert.match(frozenCss, /night-journal\.jpg/);
});

test('L44-T2: #hvDailyRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/daily-3d.css');
  assert.match(css, /#hvDailyRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvDailyRoot\.is-open\{display:flex/);
  assert.match(css, /#hvDailyRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvDailyRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/daily\/daily-hall\.jpg/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /#100c08/);
});

test('L44-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/daily-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /renderDaily/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L44-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/daily-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0054-daily.mjs');
  assert.match(build, /lanes\/tkt-0054-daily\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/daily-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/daily-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/daily-3d\.css/);
});

test('L44-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/daily/daily-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/daily-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /night-journal\.jpg/);
});
