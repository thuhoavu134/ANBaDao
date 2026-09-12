import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L30-T1: live commands stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /function joinGuild\(id\)/);
  assert.match(html, /function guildIdleMult\(/);
});

test('L30-T2: #hvGuildRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/guild-hall.css');
  assert.match(css, /#hvGuildRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvGuildRoot\.is-open\{display:flex/);
  assert.match(css, /#hvGuildRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvGuildRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/guild\/guild-hall\.jpg/);
});

test('L30-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/guild-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]guildBody['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L30-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/guild-hall-v1.mjs');
  const stub = read('scripts/lanes/tkt-0040-guild.mjs');
  assert.match(build, /lanes\/tkt-0040-guild\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/guild-hall-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/guild-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/guild-hall\.css/);
});

test('L30-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/guild/guild-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/guild-hall.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
