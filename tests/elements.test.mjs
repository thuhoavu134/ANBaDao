// Owner 2026-10-25: ngũ hành tương khắc - 5 hệ chuẩn, Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thuỷ, Thuỷ khắc Hoả, Hoả khắc Kim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

function loadElements() {
  const from = html.indexOf('const HE_ALIAS=');
  const to = html.indexOf('function inferArchetype(');
  assert.ok(from > 0 && to > from, 'phải tìm thấy khối ngũ hành');
  const block = html.slice(from, to);
  const HE = { kim: {}, moc: {}, thuy: {}, hoa: {}, tho: {} };
  const api = new Function('HE', block + '\nreturn { heOf, KHAC, SINH, counterMult, HE_ALIAS };')(HE);
  return { ...api, HE };
}

test('đúng 5 hệ và đủ alias cũ', () => {
  const { HE, heOf } = loadElements();
  for (const canon of ['kim', 'moc', 'thuy', 'hoa', 'tho']) assert.ok(HE[canon], 'thiếu hệ ' + canon);
  assert.equal(Object.keys(HE).length, Object.keys(loadElements().HE_ALIAS).length, 'mọi alias phải trỏ về một hệ chuẩn');
  for (const legacy of ['than', 'rau', 'suong', 'set', 'mong', 'soul', 'phong', 'metal', 'wood', 'water', 'fire', 'earth', 'dream']) {
    assert.ok(['kim', 'moc', 'thuy', 'hoa', 'tho'].includes(heOf(legacy)), 'alias ' + legacy + ' phải map về 1 trong 5 hệ');
  }
  assert.equal(heOf('soul'), 'hoa', 'Âm Hồn → Hoả');
  assert.equal(heOf('mong'), 'tho', 'Mộng → Thổ');
  assert.equal(heOf('set'), 'kim', 'Lôi → Kim');
  assert.equal(heOf('rau'), 'moc');
  assert.equal(heOf('metal'), 'kim');
  assert.equal(heOf('wood'), 'moc');
  assert.equal(heOf('water'), 'thuy');
  assert.equal(heOf('dream'), 'tho');
  assert.equal(heOf('suong'), 'thuy');
  assert.equal(heOf('vo'), null, 'hệ lạ thì không cộng trừ');
});

test('vòng tương khắc đúng ngũ hành cổ điển', () => {
  const { KHAC } = loadElements();
  assert.deepEqual({ ...KHAC }, { kim: 'moc', moc: 'tho', tho: 'thuy', thuy: 'hoa', hoa: 'kim' });
  // mỗi hệ khắc đúng 1 hệ, và không hệ nào tự khắc mình
  for (const [a, d] of Object.entries(KHAC)) {
    assert.notEqual(a, d);
    assert.ok(KHAC[d] !== a, 'không được khắc vòng 2 chiều');
  }
});

test('hệ số 1,25 khi khắc và 0,85 khi bị khắc', () => {
  const { counterMult } = loadElements();
  assert.equal(counterMult('kim', 'moc'), 1.25);
  assert.equal(counterMult('moc', 'tho'), 1.25);
  assert.equal(counterMult('tho', 'thuy'), 1.25);
  assert.equal(counterMult('thuy', 'hoa'), 1.25);
  assert.equal(counterMult('hoa', 'kim'), 1.25);
  assert.equal(counterMult('moc', 'kim'), 0.85);
  assert.equal(counterMult('kim', 'kim'), 1);
  assert.equal(counterMult('kim', 'thuy'), 1);
  assert.equal(counterMult('vo', 'kim'), 1);
  // tướng cũ dùng tên nội bộ vẫn phải ăn hệ số
  assert.equal(counterMult('than', 'set'), 1.25, 'than(Hoả) khắc set(Kim)');
  assert.equal(counterMult('rau', 'mong'), 1.25, 'rau(Mộc) khắc mong(Thổ)');
  assert.equal(counterMult('suong', 'than'), 1.25, 'suong(Thuỷ) khắc than(Hoả)');
});

test('tương sinh đúng chiều', () => {
  const { SINH } = loadElements();
  assert.deepEqual({ ...SINH }, { kim: 'thuy', thuy: 'moc', moc: 'hoa', hoa: 'tho', tho: 'kim' });
});

test('dòng phụ hệ có trong bảng và cộng dồn được', async () => {
  const { AFFIX_TIER2, affixSum, affixLines } = await import('../src/domain/equipment/item-affixes.mjs');
  assert.ok(AFFIX_TIER2.khangHe, 'phải có Kháng hệ khắc');
  assert.ok(AFFIX_TIER2.satHe, 'phải có Sát thương hệ khắc');
  assert.deepEqual(Object.keys(AFFIX_TIER2.khangHe.range), ['s', 'ss', 'ssr']);
  const sum = affixSum({ affixes: [{ k: 'khangHe', v: 8 }, { k: 'satHe', v: 6 }] });
  assert.equal(sum.khangHe, 8);
  assert.equal(sum.satHe, 6);
  const lines = affixLines({ affixes: [{ k: 'satHe', v: 6 }] });
  assert.equal(lines[0].text, '+6% Sát thương hệ khắc');
  assert.equal(lines[0].special, true);
});
