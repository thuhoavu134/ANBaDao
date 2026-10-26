// Owner 2026-10-26: né cho trận thường.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

function loadHit() {
  const from = html.indexOf('function hvHitChanceVs(');
  const to = html.indexOf('}\n', html.indexOf('return Math.max(0.60', from));
  const block = html.slice(from, html.indexOf('\n}', from) + 2);
  assert.ok(from > 0 && block.includes('return Math.max'), 'phải tìm thấy hvHitChanceVs');
  return new Function(block + '\nreturn hvHitChanceVs;')();
}

const hit = loadHit();
const u = (extra = {}) => ({ accuracy: 100, evasion: 0, spd: 100, ...extra });

test('né cao thì trượt nhiều, chính xác cao thì trượt ít', () => {
  const base = hit(u(), u({ evasion: 5 }));
  const dodger = hit(u(), u({ evasion: 40 }));
  const veryHigh = hit(u(), u({ evasion: 80 }));
  assert.ok(dodger < base, 'né 40 phải khó trúng hơn né 5');
  assert.ok(veryHigh < dodger, 'né 80 còn khó hơn');
  const sniper = hit(u({ accuracy: 160 }), u({ evasion: 40 }));
  assert.ok(sniper > dodger, 'chính xác 160 phải trúng nhiều hơn chính xác 100');
});

test('tỉ lệ trúng luôn trong khoảng 60% - 99%', () => {
  assert.equal(hit(u({ accuracy: 999 }), u({ evasion: 0 })), 0.99, 'trần 99%');
  assert.equal(hit(u({ accuracy: 0, spd: 0 }), u({ evasion: 9999 })), 0.60, 'sàn 60%');
});

test('bỏ qua né kéo tỉ lệ trúng lên', () => {
  const plain = hit(u(), u({ evasion: 80 }));
  const pierced = hit(u({ boQuaNe: 90 }), u({ evasion: 80 }));
  assert.ok(pierced > plain + 0.3, 'bỏ qua né 90% phải trúng gần như chắc chắn');
});

test('chiêu lớn không bị né, đòn thường mới bị', () => {
  assert.match(html, /if\(power<1\.5 && !S\.neverMiss && Math\.random\(\)>hvHitChanceVs\(actor,t\)\)/, 'phải chặn né cho power >= 1.5');
  assert.match(html, /floatText\(t,'NÉ'/, 'phải hiện chữ NÉ khi trượt');
});

test('né và chính xác từ trang bị cộng vào chỉ số tướng', () => {
  assert.match(html, /out\.evasion\+=a\.evasion\|\|0; out\.accuracy\+=a\.accuracy\|\|0;/);
  assert.match(html, /evasion:5\+\(eq\.evasion\|\|0\), accuracy:100\+\(eq\.accuracy\|\|0\)/);
  assert.match(html, /evasion:Number\(st\.evasion\)\|\|0, accuracy:Number\(st\.accuracy\)\|\|100/);
});
