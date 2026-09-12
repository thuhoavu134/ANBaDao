import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L50-T1: live team screen and Bày trận stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /id="teamScreen"/);
  assert.match(html, /class="screen art-game-screen team-art-screen"/);
  assert.match(html, /id="fieldPrev"/);
  assert.match(html, /id="teamGrid"/);
  assert.match(html, /id="petStrip"/);
  assert.match(html, /id="bondBar"/);
  assert.match(html, /id="teamSave"/);
  assert.match(html, /id="teamQuick"/);
  assert.match(html, /function renderTeam\(\)/);
  const ui = read('src/ui/campaign-scene.js');
  assert.match(ui, /function openPreparation\(/);
  assert.match(ui, /class="cs-prepare"/);
  const frozenCss = read('src/ui/campaign-scene.css');
  assert.match(frozenCss, /#hvCampaignScene \.cs-prepare\{/);
});

test('L50-T2: #hvTeamRoot is a body overlay with overflow auto and 100vh filter fix', () => {
  const css = read('src/ui/team-3d.css');
  assert.match(css, /#hvTeamRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvTeamRoot\.is-open\{display:flex/);
  assert.match(css, /#hvTeamRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvTeamRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/team\/team-hall\.jpg/);
  assert.match(css, /width:100vw;height:100vh;min-height:100vh/);
  assert.match(css, /body\.team-3d-active\{filter:none\}/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /\.cs-prepare/);
  assert.doesNotMatch(css, /#04070c/);
});

test('L50-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/team-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]teamScreen['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.doesNotMatch(ui, /openPreparation/);
  assert.doesNotMatch(ui, /cs-prepare/);
});

test('L50-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/team-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0060-team.mjs');
  assert.match(build, /lanes\/tkt-0060-team\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/team-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/team-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/team-3d\.css/);
});

test('L50-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/team/team-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/team-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /campaign-scene/);
});
