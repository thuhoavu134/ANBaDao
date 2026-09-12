import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L28-T1: live commands stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /function claimMail\(id\)/);
  assert.match(html, /function claimAllMail\(/);
});

test('L28-T2: #hvMailRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/mail-hall.css');
  assert.match(css, /#hvMailRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvMailRoot\.is-open\{display:flex/);
  assert.match(css, /#hvMailRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvMailRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/mail\/mail-hall\.jpg/);
});

test('L28-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/mail-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]mailBody['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L28-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/mail-hall-v1.mjs');
  const stub = read('scripts/lanes/tkt-0038-mail.mjs');
  assert.match(build, /lanes\/tkt-0038-mail\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/mail-hall-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/mail-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/mail-hall\.css/);
});

test('L28-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/mail/mail-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/mail-hall.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
