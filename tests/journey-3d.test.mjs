import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L46-T1: live journey screen and render stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /id="journeyScreen"/);
  assert.match(html, /id="journeyBody"/);
  assert.match(html, /function renderJourney\(/);
});

test('L46-T2: #hvJourneyRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/journey-3d.css');
  assert.match(css, /#hvJourneyRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvJourneyRoot\.is-open\{display:flex/);
  assert.match(css, /#hvJourneyRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvJourneyRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/journey\/journey-hall\.jpg/);
  assert.doesNotMatch(css, /menu-v3233/);
});

test('L46-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/journey-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]journeyBody['"]\)/);
  assert.match(ui, /renderJourney/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L46-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/journey-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0056-journey.mjs');
  assert.match(build, /lanes\/tkt-0056-journey\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/journey-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/journey-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/journey-3d\.css/);
});

test('L46-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/journey/journey-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000);
  const css = read('src/ui/journey-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
