import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

async function contentFill(rel) {
  const { data, info } = await sharp(join(root, rel)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * info.channels + 3];
      if (a > 12) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  return {
    w: info.width,
    h: info.height,
    side: Math.max(cw / info.width, ch / info.height)
  };
}

test('L123-T1: stack n1/n2/n3 gần full ô, contain không crop', () => {
  const css = read('src/ui/bach-bao-ruong.css');
  assert.match(css, /\.hv-bbr-stack img\{[^}]*object-fit:\s*contain/);
  assert.doesNotMatch(css, /\.hv-bbr-stack[^{]*\{[^}]*object-fit:\s*cover/);
  const n1 = css.match(/\.hv-bbr-stack\.n1 img(?::nth-child\(1\))?\{[^}]*width:\s*(\d+)%/);
  const n2 = css.match(/\.hv-bbr-stack\.n2 img\{[^}]*width:\s*(\d+)%/);
  const n3 = css.match(/\.hv-bbr-stack\.n3 img\{[^}]*width:\s*(\d+)%/);
  assert.ok(n1 && Number(n1[1]) >= 96, 'n1 ≥96%');
  assert.ok(n2 && Number(n2[1]) >= 84, 'n2 ≥84%');
  assert.ok(n3 && Number(n3[1]) >= 74, 'n3 ≥74%');
});

test('L123-T2: PNG vành cạnh vẽ ≥82% canvas', async () => {
  const files = [
    'assets/items/materials/gold.png',
    'assets/items/materials/tinh-luc.png',
    'assets/items/materials/hoat-luc.png',
    'assets/ui/festival/bbr/gems.png',
    'assets/ui/festival/bbr/sh_ss.png',
    'assets/ui/festival/bbr/sh_ssr.png',
    'assets/ui/festival/bbr/chest.png',
    'assets/ui/festival/bbr/supreme.png',
    'assets/ui/festival/bbr/so.png'
  ];
  for (const rel of files) {
    const m = await contentFill(rel);
    assert.equal(m.w, 256, rel);
    assert.equal(m.h, 256, rel);
    assert.ok(m.side >= 0.82, rel + ' side=' + m.side.toFixed(3));
  }
});

test('L123-T3: cược/pay đóng băng; không document click', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
  assert.match(ui, /gold: \[0, 180, 480, 1200, 3600, 10000, 36000\]/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
});

test('L123-T4: ART.tinh cùng bình túi', () => {
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /tinh:\s*'assets\/items\/materials\/tinh-luc\.png'/);
});
