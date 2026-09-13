import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L125-T1: chữ banner Lễ Hội màu đỏ', () => {
  const css = read('src/ui/festival-3d.css');
  assert.match(css, /#hvFestivalRoot\.hv-city \.hv-fest-title\{[^}]*color:#c4161c/);
  assert.match(css, /#hvFestivalRoot\.hv-city \.hv-fest-kicker/);
  assert.match(css, /#hvFestivalRoot\.hv-city \.hv-fest-best/);
  assert.match(css, /color:#b71c1c/);
});

test('L125-T2: Hoa Đăng sông đêm + đèn nổi', () => {
  const css = read('src/ui/festival-3d.css');
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.match(css, /assets\/ui\/festival\/lamp-river\.jpg/);
  assert.match(css, /hv-float-lamp/);
  assert.match(css, /data-fcity="lamp"[^}]*\.hv-fest-copy/);
  assert.match(ui, /hv-lamp-sky/);
  const river = join(root, 'assets/ui/festival/lamp-river.jpg');
  assert.equal(existsSync(river), true);
  assert.ok(statSync(river).size > 40000, 'sông đêm');
});

test('L125-T3: video mở rương + icon loot; tỉ lệ đóng băng', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  const domain = read('src/domain/festival/festival-run.mjs');
  assert.match(ui, /assets\/ui\/festival\/fx\/chest-(open|sheet)\.(mp4|webp)/);
  assert.match(ui, /assets\/ui\/festival\/fx\/supreme-(open|sheet)\.(mp4|webp)/);
  assert.match(ui, /hvChestFx/);
  assert.match(ui, /sh_ssr\.png/);
  assert.match(bbr, /const BETS = \[2, 10, 50\]/);
  assert.match(domain, /if \(r < 35\) return giveHeroShards\('ss', 30/);
  assert.match(domain, /if \(r < 45\) return giveHeroShards\('ssr', 40/);
  for (const f of ['chest-open.mp4', 'supreme-open.mp4']) {
    const p = join(root, 'assets/ui/festival/fx', f);
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 80000, f);
  }
});

test('L125-T4: không document click; giữ ô sự kiện khi render', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.match(ui, /dataset\.fcity/);
  assert.match(ui, /is-tile-open/);
});
