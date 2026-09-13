import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

async function pngCenter(rel) {
  const { data, info } = await sharp(join(root, rel)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const x = Math.floor(info.width / 2);
  const y = Math.floor(info.height / 2);
  const i = (info.width * y + x) * info.channels;
  return {
    w: info.width,
    h: info.height,
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
    a: data[i + 3],
    cornerA: data[3]
  };
}

test('L121-T1: túi Đạo cụ dùng PNG chung, không lửa Hoạt lực', () => {
  const ui = read('src/ui/bag-hall-runtime.js');
  assert.match(ui, /hv-bag-ico/);
  assert.match(ui, /assets\/items\/materials\/gold\.png/);
  assert.match(ui, /assets\/ui\/festival\/bbr\/gems\.png/);
  assert.match(ui, /assets\/items\/materials\/tinh-luc\.png/);
  assert.match(ui, /assets\/items\/materials\/hoat-luc\.png/);
  assert.match(ui, /assets\/ui\/festival\/bbr\/so\.png/);
  assert.doesNotMatch(ui, /cell\('t-mat',\s*'🔥'/);
  assert.doesNotMatch(ui, /ic:\s*'🔥'/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});

test('L121-T2: Hoạt lực là bình đỏ cùng dáng Tinh, không đống lửa', async () => {
  const hoatPath = 'assets/items/materials/hoat-luc.png';
  const bbrPath = 'assets/ui/festival/bbr/hoat.png';
  const tinhPath = 'assets/items/materials/tinh-luc.png';
  assert.equal(existsSync(join(root, hoatPath)), true);
  assert.equal(existsSync(join(root, bbrPath)), true);
  const hoat = await pngCenter(hoatPath);
  const bbr = await pngCenter(bbrPath);
  const tinh = await pngCenter(tinhPath);
  assert.equal(hoat.w, 256);
  assert.equal(hoat.h, 256);
  assert.equal(tinh.w, 256);
  assert.equal(hoat.cornerA, 0);
  assert.ok(hoat.r > 180, 'tâm Hoạt phải đỏ');
  assert.ok(hoat.r > hoat.g + 40, 'đỏ hơn lục — không cam lửa');
  assert.ok(hoat.g < 140, 'không vàng lửa');
  assert.ok(bbr.r > 180 && bbr.r > bbr.g + 40 && bbr.g < 140);
  const bbrUi = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(bbrUi, /hoat:\s*'assets\/(?:items\/materials\/hoat-luc|ui\/festival\/bbr\/hoat)\.png'/);
});

test('L121-T3: ô túi icon to; Chợ Tinh/Hoạt local path', () => {
  const css = read('src/ui/bag-hall.css');
  assert.match(css, /\.hv-bag-ico\{[^}]*width:\s*(7[8-9]|8[0-9]|9[0-6])%/);
  assert.match(css, /\.hv-bag-ico\{[^}]*object-fit:\s*contain/);
  const shop = read('src/ui/shop-runtime.js');
  assert.match(shop, /assets\/items\/materials\/tinh-luc\.png/);
  assert.match(shop, /assets\/items\/materials\/hoat-luc\.png/);
  assert.doesNotMatch(shop, /luc-than\.vercel\.app\/assets\/items\/materials/);
});

test('L121-T4: không document click; giá shop điểm đóng băng', () => {
  const bag = read('src/ui/bag-hall-runtime.js');
  const bbr = read('src/ui/bach-bao-ruong-runtime.js');
  assert.doesNotMatch(bag, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.match(bbr, /pts:\s*100/);
  assert.match(bbr, /pts:\s*250/);
  assert.match(bbr, /pts:\s*400/);
  assert.match(bbr, /pts:\s*800/);
  assert.match(bbr, /pts:\s*1500/);
  assert.match(bbr, /pts:\s*3000/);
});
