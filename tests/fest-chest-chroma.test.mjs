import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L126-T1: Hoa Đăng sáng hơn', () => {
  const css = read('src/ui/festival-3d.css');
  const m = css.match(/data-fcity="lamp"\] \.hv-fest-panel\{[^}]*filter:brightness\(([0-9.]+)\)/);
  assert.ok(m && Number(m[1]) >= 1.2, 'brightness ≥1.2');
});

test('L126-T2: Blender chroma PNG + webp 60fps, rương rung', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  const css = read('src/ui/festival-3d.css');
  assert.match(ui, /hv-chest-fx-seq/);
  assert.match(ui, /const FX_FPS = 60/);
  assert.doesNotMatch(ui, /keyGreen|hv-chest-fx-cv/);
  assert.match(css, /hvChestShake/);
  assert.match(css, /\.hv-chest-fx-stage\.is-shake/);
  assert.match(read('scripts/blender-chest-chroma.py'), /CompositorNodeKeying/);
});

test('L126-T3: rương nhỏ, icon có khung to', () => {
  const css = read('src/ui/festival-3d.css');
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.match(ui, /hv-chest-fx-frame/);
  const stage = css.match(/\.hv-chest-fx-stage\{[^}]*width:(\d+)px/);
  assert.ok(stage && Number(stage[1]) <= 220, 'rương ≤220px');
  const frame = css.match(/\.hv-chest-fx-frame\{[^}]*width:(\d+)px/);
  assert.ok(frame && Number(frame[1]) >= 104, 'khung icon ≥104px');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(bbr, /const BETS = \[2, 10, 50\]/);
});

test('L126-T4: PNG alpha sạch, webp 60fps, không document click', async () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  for (const f of ['chest-open.webp', 'supreme-open.webp']) {
    const p = join(root, 'assets/ui/festival/fx', f);
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 80000, f);
  }
  for (const f of ['chest-0001.png', 'supreme-0001.png']) {
    const p = join(root, 'assets/ui/festival/fx/png', f);
    const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const i = ((info.height - 6) * info.width + 6) * 4;
    const cornerA = data[3];
    const botA = data[i + 3];
    assert.ok(cornerA < 8, f + ' corner alpha ' + cornerA);
    assert.ok(botA < 40, f + ' bottom alpha ' + botA);
  }
});
