import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L24-D3: sharp stays off the production install', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies?.sharp, undefined);
  assert.equal(pkg.devDependencies?.sharp, '0.34.3');
  const vercel = JSON.parse(read('vercel.json'));
  assert.match(String(vercel.installCommand || ''), /omit=dev/);
  assert.equal(vercel.outputDirectory, 'dist');
  assert.equal(vercel.buildCommand, 'npm run build');
});

test('L24-D1: production copy list ships the game, not QA docs', () => {
  const build = read('scripts/build-static.mjs');
  assert.match(build, /'index\.html'/);
  assert.match(build, /'battle\.html'/);
  assert.match(build, /'assets'/);
  assert.doesNotMatch(build, /'docs'/);
  assert.doesNotMatch(build, /'artifacts'/);
  if (existsSync(join(root, 'dist/index.html'))) {
    assert.equal(existsSync(join(root, 'dist/docs')), false);
    assert.equal(existsSync(join(root, 'dist/index.html')), true);
    assert.equal(existsSync(join(root, 'dist/battle.html')), true);
    assert.equal(existsSync(join(root, 'dist/assets')), true);
  }
});

test('L24-D2: embedded battle payload still matches the built battle file', () => {
  const index = read('scripts/build-static.mjs');
  assert.match(index, /BATTLE_HTML_BASE64/);
  assert.match(index, /embeddedBattle/);
  if (!existsSync(join(root, 'dist/index.html'))) return;
  const html = read('dist/index.html');
  const battle = readFileSync(join(root, 'dist/battle.html'));
  const match = html.match(/const BATTLE_HTML_BASE64 = "([A-Za-z0-9+/=]+)";/);
  assert.ok(match, 'embedded payload marker');
  assert.equal(Buffer.from(match[1], 'base64').equals(battle), true);
});
