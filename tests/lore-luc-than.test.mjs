import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L108: Lục Thần lore overlay — sáu ấn, không sửa index.html', () => {
  const ui = read('src/ui/lore-luc-than-runtime.js');
  const css = read('src/ui/lore-luc-than.css');
  const build = read('scripts/build-static.mjs');
  const lane = read('scripts/lanes/tkt-0108-lore.mjs');
  const lore = read('docs/COT-TRUYEN-LUC-THAN.md');
  // Owner 09/11: cốt truyện v4.1 kiếm hiệp — Ba là Bạch Diện (Vô Danh Kiếm)
  assert.match(ui, /Trấn Đình Làng/);
  assert.match(ui, /Hắc Liên Đài/);
  assert.match(ui, /Vô Danh Kiếm/);
  assert.match(ui, /FOE_NAMES/);
  assert.match(ui, /AN Bá Đạo/);
  assert.match(ui, /Không ai trên thế giới này yêu thương con gái bằng ba của cô ấy\./);
  assert.match(ui, /document\.title = 'AN Bá Đạo'/); // Owner 09/11: tên game viết AN Bá Đạo
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.match(css, /\.hv-lore-title/);
  assert.match(lane, /lore-luc-than-v1/);
  assert.match(build, /tkt-0108-lore/);
  assert.ok(build.indexOf('tkt-0108-lore') > build.indexOf('tkt-0083-profile'));
  assert.match(ui, /SEAL_STAGES = 18/);
  assert.match(ui, /lt_seal_/);
  assert.match(ui, /chapterBattleSequence/);
  assert.match(ui, /stageLoot/);
  assert.match(ui, /guildBoss/);
  assert.match(ui, /guildWar/);
  assert.match(ui, /prepareHuntSettle/);
  assert.match(read('docs/ECONOMY-LUC-THAN.md'), /Bậc giá trị/);
  assert.doesNotMatch(read('index.html').slice(0, 200), /id="hv-lore-js"/);
});
