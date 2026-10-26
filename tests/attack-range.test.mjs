// Owner 2026-10-26: tầm đánh do TƯỚNG quyết định (không theo hàng) — đánh xa đứng tại chỗ, đánh gần áp sát.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const battle = readFileSync(join(root, 'battle.html'), 'utf8');
const authored = readFileSync(join(root, 'src/runtime/authored-hero.js'), 'utf8');

function loadTable() {
  const from = html.indexOf('const HERO_ATTACK_RANGE=');
  const to = html.indexOf('function integratedConfig(', from);
  assert.ok(from > 0 && to > from, 'phải tìm thấy bảng tầm đánh');
  return new Function(html.slice(from, to) + '\nreturn { HERO_ATTACK_RANGE, attackRangeFor };')();
}

test('bảng tầm đánh: xạ thủ/pháp sư đánh xa, đấu sĩ/hộ vệ đánh gần', () => {
  const { attackRangeFor } = loadTable();
  for (const id of ['lac_yen', 'cung_thu_tre', 'nang_tien_ca_can', 'thay_mo', 'linh_dong', 'hon_cay_bang']) {
    assert.equal(attackRangeFor(id), 'ranged', id + ' phải đánh xa');
  }
  for (const id of ['ong_hang_pho', 'dinh_loi', 'thach_quyen', 'phong_tu', 'lang-van', 'lang-chan']) {
    assert.equal(attackRangeFor(id), 'melee', id + ' phải đánh gần');
  }
});

test('id authored được chuẩn hoá trước khi tra bảng', () => {
  const { attackRangeFor } = loadTable();
  for (const id of ['lang-nguyet', 'lang_nguyet', 'hero_splus_lang_nguyet', 'hero_lang_nguyet']) {
    assert.equal(attackRangeFor(id), 'ranged', id + ' phải nhận ra là đánh xa');
  }
  assert.equal(attackRangeFor('hero_splus_lang_van'), 'melee');
});

test('tướng lạ: đoán theo archetype, không mặc định sai', () => {
  const { attackRangeFor } = loadTable();
  assert.equal(attackRangeFor('ai_do', { archetype: 'ranger' }), 'ranged');
  assert.equal(attackRangeFor('ai_do', { archetype: 'marksman' }), 'ranged');
  assert.equal(attackRangeFor('ai_do', { archetype: 'striker' }), 'melee');
  assert.equal(attackRangeFor('ai_do', {}), 'melee');
});

test('trận đánh: tướng đánh xa đứng tại chỗ, đánh gần mới áp sát', () => {
  assert.match(battle, /function unitAttackRange\(actor\)/, 'phải có unitAttackRange');
  assert.match(battle, /if \(unitAttackRange\(actor\) === "ranged"\) return \{ x: actor\.baseX, y: actor\.baseY \}/,
    'approachPoint phải cho tướng đánh xa đứng yên');
  // không được quyết định theo hàng
  assert.doesNotMatch(battle, /actor\?\.row\s*\)\s*\.toLowerCase\(\)\s*===\s*"back"\)\s*return/,
    'không được chặn theo hàng sau');
});

test('tướng authored đánh xa không lao tới mục tiêu', () => {
  assert.match(authored, /const rangedActor=String\(actor\?\.range\|\|''\)\.toLowerCase\(\)==='ranged';/);
  assert.match(authored, /const lungeSpec=rangedActor\?null:spec\.lunge/);
});

test('tầm đánh được truyền từ trang chủ vào cấu hình trận', () => {
  assert.match(html, /range:attackRangeFor\(sourceId,\{archetype\}\)/);
  assert.match(html, /const attackRange = combatant\.range \|\| \(typeof attackRangeFor === "function" \? attackRangeFor\(sourceId, definition\) : "melee"\);/);
  assert.match(html, /\n      range: attackRange,/);
});
