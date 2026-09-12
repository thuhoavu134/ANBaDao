import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L45-T1: live campaign scene and Bày trận stay frozen', () => {
  const ui = read('src/ui/campaign-scene.js');
  assert.match(ui, /function openPreparation\(/);
  assert.match(ui, /class="cs-prepare"/);
  assert.match(ui, /function onSceneRoute\(/);
  const frozenCss = read('src/ui/campaign-scene.css');
  assert.match(frozenCss, /#hvCampaignScene \.cs-prepare\{/);
});

test('L45-T2: #hvCampaignScene home is a 3D overlay with overflow auto', () => {
  const css = read('src/ui/campaign-3d.css');
  assert.match(css, /#hvCampaignScene\{[^}]*position:fixed;[^}]*inset:0/);
  assert.match(css, /#hvCampaignScene\.is-open\{display:flex/);
  assert.match(css, /assets\/ui\/campaign\/campaign-hall\.jpg/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /\.cs-prepare/);
});

test('L45-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/campaign-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]hvCampaignScene['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.doesNotMatch(ui, /openPreparation/);
});

test('L45-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/campaign-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0055-campaign.mjs');
  assert.match(build, /lanes\/tkt-0055-campaign\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/campaign-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/campaign-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/campaign-3d\.css/);
});

test('L45-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/campaign/campaign-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/campaign-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /mong-lo-background-v1/);
});
