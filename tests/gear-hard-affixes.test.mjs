// Owner 2026-10-25: 3 dòng khó - bỏ qua kháng, sát thương chuẩn, bỏ qua né. Engine S+ cũng ăn khắc hệ.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { honVietCore } from '../src/domain/combat/hon-viet-core.mjs';
import { AFFIX_TIER2, affixSum } from '../src/domain/equipment/item-affixes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const unit = (extra = {}) => ({
  id: 'u', element: 'kim', hp: 5000, maxHp: 5000, atk: 400, def: 100, speed: 100,
  accuracy: 100, evasion: 5, crit: 0, critRes: 0, statuses: [], ...extra
});

test('ba dòng khó có trong bảng, đúng khoảng theo phẩm', () => {
  for (const key of ['boQuaKhang', 'stChuan', 'boQuaNe']) {
    assert.ok(AFFIX_TIER2[key], 'thiếu dòng ' + key);
    assert.deepEqual(Object.keys(AFFIX_TIER2[key].range), ['s', 'ss', 'ssr']);
    assert.equal(AFFIX_TIER2[key].special, true);
  }
  const sum = affixSum({ affixes: [{ k: 'boQuaKhang', v: 20 }, { k: 'stChuan', v: 10 }, { k: 'boQuaNe', v: 25 }] });
  assert.equal(sum.boQuaKhang, 20);
  assert.equal(sum.stChuan, 10);
  assert.equal(sum.boQuaNe, 25);
});

test('bảng ngũ hành của engine S+ khớp bảng trong index.html', () => {
  const from = html.indexOf('const HE_ALIAS=');
  const to = html.indexOf('function inferArchetype(');
  const page = new Function('HE', html.slice(from, to) + '\nreturn { HE_ALIAS, KHAC };')({ kim: {}, moc: {}, thuy: {}, hoa: {}, tho: {} });
  assert.deepEqual({ ...honVietCore.ELEMENT_COUNTER }, { ...page.KHAC });
  for (const [alias, canon] of Object.entries(page.HE_ALIAS)) {
    assert.equal(honVietCore.ELEMENT_ALIAS[alias], canon, 'alias ' + alias + ' phải giống nhau ở 2 nơi');
  }
});

test('khắc hệ áp cả trong engine S+', () => {
  const strong = honVietCore.calculateDamageDetailed(unit({ element: 'kim' }), unit({ element: 'moc' }), 1, { hit: 0, variance: 0.5, crit: 1 });
  const even = honVietCore.calculateDamageDetailed(unit({ element: 'kim' }), unit({ element: 'kim' }), 1, { hit: 0, variance: 0.5, crit: 1 });
  const weak = honVietCore.calculateDamageDetailed(unit({ element: 'kim' }), unit({ element: 'hoa' }), 1, { hit: 0, variance: 0.5, crit: 1 });
  assert.ok(strong.amount > even.amount, 'khắc hệ phải đánh mạnh hơn');
  assert.ok(weak.amount < even.amount, 'bị khắc phải đánh yếu hơn');
  assert.ok(Math.abs(strong.amount / even.amount - 1.25) < 0.03, 'hệ số khắc ~1.25');
  assert.ok(Math.abs(weak.amount / even.amount - 0.85) < 0.03, 'hệ số bị khắc ~0.85');
});

test('bỏ qua kháng chỉ xuyên kháng HỆ, không xuyên giáp', () => {
  const roll = { hit: 0, variance: 0.5, crit: 1 };
  // Bị khắc hệ: kim đánh hoả → 0,85. Bỏ qua kháng hệ phải kéo về gần 1,0.
  const countered = honVietCore.calculateDamageDetailed(unit({ element: 'kim' }), unit({ element: 'hoa', hp: 20000, maxHp: 20000 }), 1, roll).amount;
  const ignored = honVietCore.calculateDamageDetailed(unit({ element: 'kim', boQuaKhang: 90 }), unit({ element: 'hoa', hp: 20000, maxHp: 20000 }), 1, roll).amount;
  const even = honVietCore.calculateDamageDetailed(unit({ element: 'kim' }), unit({ element: 'kim', hp: 20000, maxHp: 20000 }), 1, roll).amount;
  assert.ok(ignored > countered, 'bỏ qua kháng hệ phải đỡ bị phạt: ' + ignored + ' vs ' + countered);
  assert.ok(ignored <= even + 2, 'không được vượt quá trường hợp không khắc: ' + ignored + ' vs ' + even);
  // Giáp vẫn phải tính: bỏ qua kháng KHÔNG được làm giảm tác dụng của giáp
  const fat = () => unit({ element: 'kim', def: 900, hp: 20000, maxHp: 20000 });
  const plain = honVietCore.calculateDamageDetailed(unit({ element: 'kim' }), fat(), 1, roll).amount;
  const withIgnore = honVietCore.calculateDamageDetailed(unit({ element: 'kim', boQuaKhang: 90 }), fat(), 1, roll).amount;
  assert.equal(withIgnore, plain, 'cùng hệ thì bỏ qua kháng không đổi gì, giáp vẫn nguyên');
});

test('sát thương chuẩn ăn xuyên giáp', () => {
  const roll = { hit: 0, variance: 0.5, crit: 1 };
  const tank = () => unit({ element: 'kim', def: 900, hp: 20000, maxHp: 20000 });
  const base = honVietCore.calculateDamageDetailed(unit(), tank(), 1, roll).amount;
  const trueDmg = honVietCore.calculateDamageDetailed(unit({ stChuan: 30 }), tank(), 1, roll).amount;
  assert.ok(trueDmg > base, 'sát thương chuẩn phải cao hơn: ' + trueDmg + ' vs ' + base);
  const cap = honVietCore.calculateDamageDetailed(unit({ stChuan: 100 }), tank(), 1, roll).amount;
  assert.ok(cap >= trueDmg, 'càng nhiều sát thương chuẩn càng cao');
});

test('bỏ qua né giúp đánh trúng tướng né cao', () => {
  const dodger = () => unit({ element: 'kim', evasion: 200 });
  const roll = { hit: 0.9, variance: 0.5, crit: 1 };
  const miss = honVietCore.calculateDamageDetailed(unit(), dodger(), 1, roll);
  const hit = honVietCore.calculateDamageDetailed(unit({ boQuaNe: 90 }), dodger(), 1, roll);
  assert.equal(miss.missed, true, 'né cao thì trượt');
  assert.equal(hit.missed, false, 'có bỏ qua né thì trúng');
});
