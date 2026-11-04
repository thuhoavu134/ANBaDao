// Owner 2026-10-25: lò rèn chỉ ra s/ss/ssr; b/a chỉ rơi ở phó bản.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGE_DROP } from '../src/domain/equipment/gear-drops.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('lò rèn có bảng tỉ lệ riêng, chỉ s/ss/ssr, không đụng GACHA của triệu hồi', () => {
  const html = read('index.html');
  const line = html.match(/const FORGE_RARITY=\[.*?\];/)?.[0];
  assert.ok(line, 'phải có FORGE_RARITY');
  const table = [...line.matchAll(/\['([a-z]+)',\s*(\d+)\]/g)].map(m => [m[1], Number(m[2])]);
  assert.deepEqual(table.map(([rar]) => rar), ['ssr', 'ss', 's'], 'lò rèn không được roll b/a');
  assert.equal(table.reduce((sum, [, w]) => sum + w, 0), 100, 'tổng trọng số phải bằng 100');
  // rollForgeRarity phải dùng bảng mới, không dùng GACHA.rates nữa
  const from = html.indexOf('function rollForgeRarity(');
  const to = html.indexOf('function forgeCandidate(', from);
  const fn = from >= 0 && to > from ? html.slice(from, to) : '';
  assert.ok(fn, 'phải tìm thấy rollForgeRarity');
  assert.match(fn, /FORGE_RARITY/);
  assert.doesNotMatch(fn, /GACHA\.rates/, 'không được dùng bảng của triệu hồi');
  assert.doesNotMatch(fn, /\['a','b','s'\]/, 'nhánh pity cũ cho a/b phải bỏ');
  // GACHA của triệu hồi tướng: owner 2026-11-04 chốt 3 bậc SSR/SS/S (bỏ A/B)
  assert.match(html, /rates:\[\['ssr',3\],\['ss',12\],\['s',85\]\]/);
});

test('trận thường/tinh anh rơi b/a; trận cuối chương để boss chương', () => {
  const html = read('index.html');
  const blk = html.slice(html.indexOf('function endBattle()'), html.indexOf('function endBattle()') + 3200);
  assert.match(blk, /ST\.mode==='campaign'/);
  assert.match(blk, /rollStageDrop/);
  assert.match(blk, /stage===last-1\?'elite':'normal'/, 'sát boss là tinh anh');
  assert.match(blk, /stage!==last/, 'trận cuối chương không rơi đồ phó bản');
  assert.match(blk, /tx\.commit/, 'phải lưu qua transaction');
  // bảng phó bản chỉ có b/a cho quái thường
  assert.deepEqual(Object.keys(STAGE_DROP.normal.table).sort(), ['a', 'b']);
});

test('không còn hook rơi đồ trong hàm chết của player-progress', () => {
  const src = read('src/ui/player-progress-runtime.js');
  assert.doesNotMatch(src, /rollStageDrop/, 'hvCampaignSettlementXp không được gọi ở đâu nên đừng nhét logic vào');
});
