import test from 'node:test';
import assert from 'node:assert/strict';
import { markers, cueAt, validateBrief, domainModule } from '../scripts/hero/scaffold-lib.mjs';

const brief = {
  key: 'thu_nghiem', name: 'Thử Nghiệm', he: 'soul',
  kit: {
    passive: { name: 'Nội Tại', desc: 'Mô tả nội tại.' },
    basic: { name: 'Đánh Thường', desc: 'Chém 1 địch.', power: 1.1, target: 'enemy', hits: 3 },
    ultimate: { name: 'Tuyệt Kỹ', desc: 'Toàn bộ địch.', power: 2, target: 'aoe_enemy' },
  },
};

test('scaffold markers land near the hand-tuned Tinh Mac timing (swing sound at 1800ms, 4000ms clips)', () => {
  // Hand-tuned: basic release 1700, hits 2050/2450/2850; ultimate release 2300, hit 2900, recovery 4000.
  const b = markers(4000, 3, 1800, 16 * 60);
  assert.equal(b.release, 1800);
  assert.deepEqual(b.hits, [2200, 2600, 3000]);
  assert.ok(b.recovery >= 4000 - 1 && b.vfxEnd <= b.recovery);
  const u = markers(4000, 1, 2360, 24 * 90);
  assert.equal(u.release, 2360);
  assert.ok(Math.abs(u.hits[0] - 2900) <= 200, String(u.hits[0]));
  assert.equal(u.recovery, 4000);
  for (const m of [b, u]) {
    const marks = [m.release, ...m.hits, m.recovery];
    assert.ok(marks.every((v, i) => !i || v >= marks[i - 1]), 'release <= hits <= recovery (hero-doctor)');
  }
});

test('scaffold markers without audio fall back to 45% of the clip and stay inside it', () => {
  const m = markers(3000, 2, null, 0);
  assert.equal(m.release, 1350);
  assert.ok(m.hits.at(-1) <= 3000 - 200);
  assert.equal(m.recovery, 3000);
  assert.equal(markers(3000, 1, 50, 0).release, 900, 'a sound at the very start is clamped to 30%');
});

test('scaffold cue lead reproduces where the sound was cut from the clip', () => {
  const m = { release: 1800, hits: [2200, 2600, 3000] };
  assert.deepEqual(cueAt('x-basic', 1800, m), { cue: 'x-basic', at: 'release', lead: 0 });
  assert.deepEqual(cueAt('x-basic', 0, m), { cue: 'x-basic', at: 'release', lead: 1800 });
  assert.deepEqual(cueAt('x-hit', 2400, m), { cue: 'x-hit', at: 'hit', hit: 1, lead: 200 });
});

test('scaffold refuses an incomplete brief and names the fields', () => {
  assert.throws(() => validateBrief({ key: 'Bad Key', kit: {} }), /key.*name.*he.*kit\.passive\.name/);
  assert.equal(validateBrief(structuredClone(brief)).key, 'thu_nghiem');
});

test('scaffold domain module is valid JS with the S+ profile contract', async () => {
  // Loaded from a data: URL so the test writes no file.
  const src = domainModule(brief, 'thu-nghiem', '2026-10-22');
  const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(src));
  const h = mod.THU_NGHIEM_HERO;
  assert.equal(h.id, 'hero_splus_thu_nghiem');
  assert.equal(h.element, 'soul');
  assert.equal(h.elementName, 'Hỏa');
  assert.deepEqual(Object.keys(h.actions), ['basic', 'skill', 'ultimate']);
  assert.equal(h.actions.ultimate.target, 'Toàn bộ địch');
  assert.equal(mod.THU_NGHIEM_KIT.basic.hits, 3);
});
