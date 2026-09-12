import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L48-T1: live story markup and startStory stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /id="storyScreen"/);
  assert.match(html, /class="vnstage"/);
  assert.match(html, /function startStory\(/);
  assert.match(html, /function playScene\(/);
  assert.match(html, /function showChoice\(/);
  assert.match(html, /id="vnStars"/);
});

test('L48-T2: #hvStoryRoot is a body overlay with overflow auto and 100vh filter fix', () => {
  const css = read('src/ui/story-3d.css');
  assert.match(css, /#hvStoryRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvStoryRoot\.is-open\{display:flex/);
  assert.match(css, /#hvStoryRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvStoryRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/story\/story-hall\.jpg/);
  assert.match(css, /width:100vw;height:100vh;min-height:100vh/);
  assert.match(css, /body\.story-3d-active\{filter:none\}/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /#0d1226/);
});

test('L48-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/story-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /\.vnstage/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L48-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/story-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0058-story.mjs');
  assert.match(build, /lanes\/tkt-0058-story\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/story-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/story-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/story-3d\.css/);
});

test('L48-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/story/story-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/story-3d.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
