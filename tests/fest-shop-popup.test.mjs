import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BBR_SHOP } from '../src/domain/festival/bach-bao-ruong.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L119-T1: 3 ô Lễ Hội là icon hoạt động lantern / wheel / chest', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  assert.match(ui, /data-fact="\$\{t\.fact\}"|data-fact="\$\{t\.id\}"/);
  assert.match(ui, /fact:\s*'lantern'/);
  assert.match(ui, /fact:\s*'wheel'/);
  assert.match(ui, /fact:\s*'chest'/);
  const css = read('src/ui/festival-3d.css');
  assert.match(css, /#hvFestCity \.hv-ftile img\{[^}]*object-fit:contain/);
  for (const f of ['hoa-dang', 'bach-bao', 'ruong']) {
    const p = join(root, 'assets/ui/festival/tiles', f + '.jpg');
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 40000, f + ' too small');
  }
});

test('L119-T2: Shop điểm là popup lưới thẻ có icon', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(ui, /hvBbrShop/);
  assert.match(ui, /hv-bbr-good/);
  assert.match(ui, /shop-keep\.jpg/);
  assert.match(css, /#hvFestivalRoot > #hvBbrShop/);
  assert.match(css, /#hvBbrShop\.is-open/);
  assert.match(css, /\.hv-bbr-good img/);
  assert.match(css, /hv-bbr-meta/);
  assert.doesNotMatch(ui, /hv-bbr-shop">\$\{SHOP\.map/);
});

test('L119-T3: panel quay giữ nút Quay; shop không nuốt side', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /hv-bbr-side[\s\S]*data-bbr-step/);
  assert.match(read('src/ui/shop-3d-runtime.js'), /Shop điểm/);
  assert.doesNotMatch(ui, /pane === 'shop' \? `/);
});

test('L119-T4: không document click; giá shop đóng băng', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  const fest = read('src/ui/festival-3d-runtime.js');
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.doesNotMatch(fest, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.deepEqual(BBR_SHOP.map(x => x.pts), [100, 250, 400, 800, 1500, 3000]);
  assert.ok(existsSync(join(root, 'assets/ui/festival/shop-keep.jpg')));
  assert.ok(statSync(join(root, 'assets/ui/festival/shop-keep.jpg')).size > 40000);
});
