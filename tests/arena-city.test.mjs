import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L100: đấu trường city 3 ô + FAB ‹, không document click', () => {
  const ui = read('src/ui/arena-3d-runtime.js');
  const css = read('src/ui/arena-3d.css');
  assert.match(ui, /hvArenaCity/);
  assert.match(ui, /hvArenaBackFab/);
  assert.match(ui, /syncOpen\('hub'\)/);
  assert.match(css, /#hvArenaRoot \.hv-ar-back\{/);
  assert.match(css, /#hvArenaBackFab\{display:none!important\}/);
  assert.match(css, /grid-template-columns:repeat\(3/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  for (const f of ['mua', 'dau-hang', 'vo-dai']) {
    const p = join(root, 'assets/ui/arena/tiles', f + '.jpg');
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 40000, f);
  }
});
