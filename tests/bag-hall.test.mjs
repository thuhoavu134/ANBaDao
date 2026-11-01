import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L27-T1: live commands stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /stamCap:120/);
  assert.match(html, /function renderBag\(\)/);
});

test('L27-T2: #hvBagRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/bag-hall.css');
  assert.match(css, /#hvBagRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvBagRoot\.is-open\{display:flex/);
  assert.match(css, /#hvBagRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvBagRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/bag\/bag-hall\.jpg/);
});

test('L27-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/bag-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]bagBody['"]\)/);
  assert.match(ui, /hvShowItemTip/);
  assert.match(ui, /how:/);
  assert.match(ui, /data-bag-i/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L27-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/bag-hall-v1.mjs');
  const stub = read('scripts/lanes/tkt-0037-bag.mjs');
  assert.match(build, /lanes\/tkt-0037-bag\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/bag-hall-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/bag-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/bag-hall\.css/);
});

test('L27-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/bag/bag-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/bag-hall.css');
  assert.doesNotMatch(css, /menu-v3233/);
});

test('L27-T6: popup dùng thẳng khung concept 4 cột, chữ và ô vật phẩm là phần tử thật', async () => {
  const png = 'assets/ui/bag/bag-lacquer-frame.png';
  assert.equal(existsSync(join(root, png)), true, 'frame png missing');
  const meta = await sharp(join(root, png)).metadata();
  assert.equal(meta.width, 768);
  assert.equal(meta.height, 1376);
  assert.equal(meta.hasAlpha, true);

  const css = read('src/ui/bag-hall.css');
  assert.match(css, /bag-lacquer-frame\.png/);
  assert.match(css, /aspect-ratio:768\/1376/);
  assert.match(css, /container-type:inline-size/);
  assert.doesNotMatch(css, /#f3e4c4/, 'nền kem cũ không còn');

  const ui = read('src/ui/bag-hall-runtime.js');
  assert.match(ui, /class="hv-bag-frame"/);
  assert.equal((ui.match(/data-bag-tab="/g) || []).length, 4, 'đúng 4 tab thật');
  assert.match(ui, /data-bag-detail/);
  assert.match(ui, /data-bag-act/);
  assert.match(ui, /<b>Túi đồ<\/b>/);
  // everything outside the wooden frame is transparent: corner alpha = 0
  const { data, info } = await sharp(join(root, png)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(data[3], 0, 'góc trên trái phải trong suốt');
  const cx = Math.floor(info.width / 2), cy = Math.floor(info.height / 2);
  assert.equal(data[(info.width * cy + cx) * info.channels + 3], 255, 'thân khung phải đục');
});
