import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L51-T1: live night filter, overflow-x and Bày trận stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /body\.night\{filter:saturate/);
  assert.match(html, /html,body\{[^}]*overflow-x:hidden/);
  const ui = read('src/ui/campaign-scene.js');
  assert.match(ui, /function openPreparation\(/);
  assert.match(ui, /class="cs-prepare"/);
});

test('L51-T2: Safari overlay CSS pins viewport and drops the night containing-block', () => {
  const css = read('src/ui/overlay-safari.css');
  assert.match(css, /html\.hv-overlay-open,body\.hv-overlay-open\{[^}]*filter:none!important/);
  assert.match(css, /100dvh/);
  assert.match(css, /-webkit-fill-available/);
  assert.match(css, /overflow-x:clip/);
  assert.doesNotMatch(css, /\.cs-prepare/);
  assert.doesNotMatch(css, /menu-v3233/);
});

test('L51-T3: pin uses visualViewport, wraps showScreen, no second document click', () => {
  const ui = read('src/ui/overlay-safari-runtime.js');
  assert.match(ui, /visualViewport/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /hv-overlay-open/);
  assert.match(ui, /\[id\^="hv"\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.doesNotMatch(ui, /openPreparation/);
});

test('L51-T4: hotfix injects after Wave G stubs without touching hall lanes', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/overlay-safari-hotfix-v1.mjs');
  assert.match(build, /lanes\/tkt-0063-skill-seals-c\.mjs[\s\S]*overlay-safari-hotfix-v1\.mjs/);
  assert.match(inject, /src\/ui\/overlay-safari-runtime\.js/);
  assert.match(inject, /src\/ui\/overlay-safari\.css/);
  assert.match(inject, /viewport-fit=cover/);
});
