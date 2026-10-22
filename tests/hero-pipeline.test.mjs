// Guards for the standard hero pipeline (scripts/hero/*). These encode real failures:
// partial bundles, stale clips mixed into a new set, vfx_sfx_atk read as atk, shell-mangled test logs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { labelOf, chooseBundle, STATES } from '../scripts/hero/intake.mjs';
import { failingTests, totals, compare } from '../scripts/hero/compare-test-fails.mjs';

test('intake labels: owner file names map to the six states and the VFX clips', () => {
  const cases = {
    'idle7---fd2fd7a2-107d-4739-a02a-12755f4518f2.mp4': 'idle',
    'idle_3---d466863e-d002-4cd1-ba32-d193bb330344.mp4': 'idle',
    'run6---23d2245d-886f-4c8c-ba00-c55fae20e4d1.mp4': 'run',
    'falldie6---d4d1334f-68ab-4e46-be82-1a98563d992b.mp4': 'fall-die',
    'fall7---ab1a37fc-a13d-452a-a936-322d3064385b.mp4': 'fall-die',
    'Hit_3---5c8d9bca-f9c7-46f5-b942-779fc8886fd6.mp4': 'hit',
    'Atk6---da12943e-79bb-4873-8d19-c8d63ee26cdf.mp4': 'atk',
    'ulti---ab918426-bb76-4108-9417-5be588455548.mp4': 'ultimate',
    'vfxatk---162ad73e-bf34-4db5-ac4e-0733e83ed587.mp4': 'vfx-basic',
    'vfx_sfx_atk---a7c94b12-c7b2-4908-9e69-01abe6ba8228.mp4': 'vfx-basic',
    'vfxulti6---20dc6796-0968-44c6-abfa-2c16c9f95f58.mp4': 'vfx-ultimate',
    'vfx_sfx_ulti---3f176666-a49c-4211-a6b7-900d059419b4.mp4': 'vfx-ultimate',
    'vfxnoitai7---35a9f0fd-6f37-4cac-82ab-82c2f121cfd1.mp4': 'vfx-passive',
    'random-clip---0000aaaa.mp4': null,
  };
  for (const [name, label] of Object.entries(cases)) assert.equal(labelOf(name), label, name);
});

const clip = (name, minutesAgo) => ({ name, path: name, mtimeMs: 1e12 - minutesAgo * 60000 });
const fullSet = (age = 0) => [
  clip('idle1---aaaaaaaa.mp4', age), clip('run1---aaaaaaaa.mp4', age), clip('fall1---aaaaaaaa.mp4', age),
  clip('hit1---aaaaaaaa.mp4', age), clip('atk1---aaaaaaaa.mp4', age), clip('ulti1---aaaaaaaa.mp4', age),
  clip('vfxatk1---aaaaaaaa.mp4', age), clip('vfxulti1---aaaaaaaa.mp4', age),
];

test('intake refuses a partial bundle and names what is missing', () => {
  assert.throws(() => chooseBundle(fullSet().filter(c => !/^hit/.test(c.name))), /thiếu: hit/);
  assert.throws(() => chooseBundle(fullSet().filter(c => !/^vfxulti/.test(c.name))), /thiếu: vfx-ultimate/);
  assert.doesNotThrow(() => chooseBundle(fullSet().filter(c => !/^vfx/.test(c.name)), { requireVfx: false }));
});

test('intake refuses a stale state clip but drops a stale optional clip', () => {
  const set = fullSet(0);
  set[1] = clip('run0---bbbbbbbb.mp4', 600); // run from an older bundle
  assert.throws(() => chooseBundle(set), /Nguồn cũ lẫn vào bộ: run=run0/);
  const pick = chooseBundle([...fullSet(0), clip('vfxnoitai9---cccccccc.mp4', 900)]);
  assert.equal(pick['vfx-passive'], undefined);
  assert.deepEqual(pick.dropped, ['vfx-passive=vfxnoitai9---cccccccc.mp4']);
  for (const s of STATES) assert.ok(pick[s], s);
});

test('intake picks the newest clip of each label', () => {
  const pick = chooseBundle([...fullSet(5), clip('idle2---dddddddd.mp4', 1)]);
  assert.equal(pick.idle.name, 'idle2---dddddddd.mp4');
});

test('test gate keys failures by the ASCII file:line:col anchor, so a mangled log compares equal', () => {
  const clean = 'ℹ tests 3\nℹ pass 2\nℹ fail 1\n\n✖ failing tests:\n\ntest at tests\\a.test.mjs:7:1\n✖ đánh thường hồi nộ (4.97ms)\n  AssertionError\n';
  // PowerShell re-encoding turns ✖/ℹ into mojibake and can corrupt the Vietnamese name; the anchor survives.
  const mangled = clean.replace(/ℹ/g, 'Γä╣').replace(/✖/g, 'Γ£û').replace(/đánh thường hồi nộ/, '─æ├ính thã░ß╗¥ng hß╗ôi nß╗Ö');
  for (const log of [clean, mangled]) {
    const fails = failingTests(log);
    assert.deepEqual([...fails.keys()], ['tests/a.test.mjs:7:1#1']);
    assert.deepEqual(totals(log), { tests: 3, pass: 2, fail: 1 });
  }
  assert.equal(compare(failingTests(clean), failingTests(mangled)).added.length, 0, 'same test, different glyphs = not a new failure');
  assert.equal(compare(failingTests(mangled), failingTests(clean)).fixed.length, 0);
});
