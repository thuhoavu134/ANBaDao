import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L25-T1: forge costs, pity and +15 stay frozen', () => {
  const html = read('index.html');
  const commands = read('src/domain/equipment/forge-commands.mjs');
  assert.match(html, /const CRAFT=\{tinh:20,gold:200\}/);
  assert.match(html, /const DUAL_FORGE=\{tinh:42,gold:420\}/);
  assert.match(html, /craftPitySSR:30/);
  assert.match(commands, /export const FORGE_MAX_LEVEL = 15/);
});

test('L25-T2: #hvForgeRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/forge-hall.css');
  assert.match(css, /#hvForgeRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvForgeRoot\.is-open\{display:flex/);
  assert.match(css, /#hvForgeRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvForgeRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/forge\/forge-hall\.jpg/);
});

test('L25-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/forge-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]forgeBody['"]\)/);
  assert.match(ui, /window\.HonVietSfx\?\.unlock/);
  assert.match(ui, /data-forge-so/);
  assert.match(ui, /hvCraftSo/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L25-T4: forge hall injects after daily and keeps one forgeCommand owner', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/forge-hall-v1.mjs');
  assert.match(build, /daily-runtime-v1\.mjs[\s\S]*forge-hall-v1\.mjs/);
  assert.match(inject, /src\/ui\/forge-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/forge-hall\.css/);
  const commands = read('src/ui/forge-command-runtime.js');
  assert.match(commands, /function forgeCommand\(action/);
});

test('L25-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/forge/forge-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/forge-hall.css');
  assert.doesNotMatch(css, /menu-v3233\/icons\/forge\.png/);
});
