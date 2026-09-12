import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L69-T1: #hvChallengeRoot is a body overlay with overflow auto and wrap showScreen/startChallenge', () => {
  const css = read('src/ui/challenge-3d.css');
  assert.match(css, /#hvChallengeRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvChallengeRoot\.is-open\{display:flex/);
  assert.match(css, /#hvChallengeRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvChallengeRoot\{[^}]*overflow:hidden/);
  assert.match(css, /width:100vw;height:100vh;min-height:100vh/);
  assert.match(css, /body\.challenge-3d-active\{filter:none\}/);
  const ui = read('src/ui/challenge-3d-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /startChallenge = function honVietStartChallenge/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L69-T2: hall jpg is dedicated and larger than 50KB', () => {
  const hall = join(root, 'assets/ui/challenge/challenge-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/challenge-3d.css');
  assert.match(css, /assets\/ui\/challenge\/challenge-hall\.jpg/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /#0d1226/);
});

test('L69-T3: back navTo hub; fight calls baseStart; settleChallenge untouched', () => {
  const ui = read('src/ui/challenge-3d-runtime.js');
  assert.match(ui, /navTo\('hub'\)/);
  assert.match(ui, /data-challenge-back/);
  assert.match(ui, /baseStart/);
  assert.match(ui, /data-challenge-fight/);
  assert.doesNotMatch(ui, /settleChallenge\s*=/);
  assert.doesNotMatch(ui, /expedition-3d/);
  assert.doesNotMatch(ui, /battle\.html/);
});

test('L69-T4: stub lane loads runtime; build-static keeps reserved import; no expedition-3d or battle.html', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/challenge-3d-v1.mjs');
  const stub = read('scripts/lanes/tkt-0069-challenge.mjs');
  assert.match(build, /lanes\/tkt-0069-challenge\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/challenge-3d-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/challenge-3d-runtime\.js/);
  assert.match(inject, /src\/ui\/challenge-3d\.css/);
  assert.doesNotMatch(inject, /battle\.html/);
  assert.doesNotMatch(inject, /expedition-3d/);
  assert.doesNotMatch(read('src/ui/challenge-3d-runtime.js'), /expedition-3d|battle\.html/);
});
