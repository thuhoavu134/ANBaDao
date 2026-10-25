// Owner 2026-10-25: dòng thuộc tính trang bị - đồ chế 2 dòng, đồ săn boss 3 dòng (dòng 3 in màu riêng).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AFFIX_TIER1, AFFIX_TIER2, affixCountFor, rollAffixes, normalizeAffixes, affixSum, affixLines
} from '../src/domain/equipment/item-affixes.mjs';

// rng tất định: luôn trả về 0 → lấy cận dưới, và pickOne luôn lấy phần tử đầu còn trống.
const first = () => 0.0001;
const last = () => 0.9999;

test('số dòng: phó bản 1, chế 2, săn boss 3', () => {
  assert.equal(affixCountFor('stage', 'b'), 1);
  assert.equal(affixCountFor('stage', 'a'), 1);
  assert.equal(affixCountFor('craft', 's'), 2);
  assert.equal(affixCountFor('craft', 'ss'), 2);
  assert.equal(affixCountFor('craft', 'ssr'), 2);
  assert.equal(affixCountFor('boss', 's'), 3);
  assert.equal(affixCountFor('boss', 'ssr'), 3);
  // đồ boss phẩm thấp chưa có pool đặc biệt thì chỉ 1 dòng
  assert.equal(affixCountFor('boss', 'b'), 1);
});

test('đồ chế 2 dòng thường, không có dòng đặc biệt', () => {
  const list = rollAffixes({ source: 'craft', rar: 'ssr', rng: first });
  assert.equal(list.length, 2);
  assert.equal(list.filter(a => a.spec).length, 0);
  for (const affix of list) assert.ok(Object.hasOwn(AFFIX_TIER1, affix.k), 'phải là dòng tầng 1');
  assert.notEqual(list[0].k, list[1].k, 'hai dòng không trùng nhau');
});

test('đồ săn boss 3 dòng, dòng thứ 3 từ pool đặc biệt', () => {
  const list = rollAffixes({ source: 'boss', rar: 'ss', rng: first });
  assert.equal(list.length, 3);
  assert.equal(list.filter(a => a.spec).length, 1);
  assert.ok(Object.hasOwn(AFFIX_TIER2, list[2].k));
  assert.match(affixLines({ affixes: list })[2].text, /^\+/);
  assert.equal(affixLines({ affixes: list })[2].special, true);
});

test('giá trị nằm trong khoảng của phẩm', () => {
  const rangeOf = key => (AFFIX_TIER1[key] || AFFIX_TIER2[key]).range;
  for (const rar of ['s', 'ss', 'ssr']) {
    for (const rng of [first, last, Math.random]) {
      for (const affix of rollAffixes({ source: 'boss', rar, rng })) {
        const range = rangeOf(affix.k)[rar];
        assert.ok(range, 'phẩm ' + rar + ' phải có khoảng cho ' + affix.k);
        assert.ok(affix.v >= range[0] && affix.v <= range[1],
          affix.k + ' phẩm ' + rar + ': ' + affix.v + ' ngoài ' + range.join('-'));
        assert.ok(Number.isInteger(affix.v), 'giá trị phải là số nguyên');
      }
    }
  }
});

test('món cũ không có affixes vẫn đọc an toàn', () => {
  assert.deepEqual(normalizeAffixes({}), []);
  assert.deepEqual(normalizeAffixes({ affixes: null }), []);
  const zero = affixSum({});
  assert.deepEqual(Object.values(zero), new Array(Object.keys(zero).length).fill(0));
  assert.equal(zero.khangHe, 0, 'dòng hệ cũng phải có mặt và bằng 0');
  assert.deepEqual(affixLines({}), []);
  // save hỏng: dòng lạ, giá trị âm, trùng khoá → bỏ hết
  const bad = normalizeAffixes({ affixes: [{ k: 'hp', v: 100 }, { k: 'hp', v: 50 }, { k: 'la', v: 9 }, { k: 'def', v: -3 }] });
  assert.deepEqual(bad, [{ k: 'hp', v: 100, spec: false }]);
});

test('affixSum cộng đúng theo chỉ số', () => {
  const item = { affixes: [{ k: 'hp', v: 300 }, { k: 'atk', v: 30 }, { k: 'lifesteal', v: 8 }] };
  const sum = affixSum(item);
  assert.equal(sum.hp, 300);
  assert.equal(sum.atk, 30);
  assert.equal(sum.lifesteal, 8);
  assert.equal(sum.def, 0);
});
