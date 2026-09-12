import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L33-T1: live commands stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /function clanIdleMult\(\)\{return clanRoleId\('steward'\)\?1\.05:1;\}/);
  assert.match(html, /function clanAtkBonus\(/);
});

test('L33-T2: #hvClanRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/clan-hall.css');
  assert.match(css, /#hvClanRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvClanRoot\.is-open\{display:flex/);
  assert.match(css, /#hvClanRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvClanRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/clan\/clan-hall\.jpg/);
});

test('L33-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/clan-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]clanBody['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L33-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/clan-hall-v1.mjs');
  const stub = read('scripts/lanes/tkt-0043-clan.mjs');
  assert.match(build, /lanes\/tkt-0043-clan\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/clan-hall-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/clan-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/clan-hall\.css/);
});

test('L33-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/clan/clan-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/clan-hall.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
