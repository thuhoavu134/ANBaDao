// SFX sourcing rules (scripts/hero/sfx-lib.mjs): source priority, brief pins, keyword matching, todo rows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, sectFor, pinnedCode, keywordsFor, kiemtheCandidates, pickFromPixabay, planRole, todoRows, coverage, downloadUrlFrom } from '../scripts/hero/sfx-lib.mjs';

const sects = { cuiyan: { ten: 'Thúy Yên', hanh: 'Thủy' }, shaolin: { ten: 'Thiếu Lâm', hanh: 'Kim' }, public: { ten: 'Chung', hanh: '' } };
const skillpack = { sfx: [
  { ma: 'sl_aa_c', phai: 'shaolin', file: 'sfx/shaolin/sl_aa_c.wav' },
  { ma: 'sl_bb_f', phai: 'shaolin', file: 'sfx/shaolin/sl_bb_f.wav' },
  { ma: 'cy_cc_c', phai: 'cuiyan', file: 'sfx/cuiyan/cy_cc_c.wav' },
  { ma: 'pub_dd_c', phai: 'public', file: 'sfx/public/pub_dd_c.wav' },
] };
const brief = { name: 'Thử Nghiệm', he: 'kim', kit: { passive: { name: 'Nghiệm Thu Tâm Pháp' }, basic: { name: 'Trảm Thử' }, ultimate: { name: 'Đao Vực Nghiệm Thu' } } };

test('sfx: every role has a clip label and the role list is the 7 the extractor produces', () => {
  assert.deepEqual(ROLES.map(r => r.role), ['basic', 'basic-hit', 'ultimate', 'ultimate-vfx', 'ultimate-hit', 'hit', 'passive']);
  for (const r of ROLES) assert.ok(r.label, r.role);
});

test('sfx: clip audio always wins over the libraries', () => {
  const p = planRole('basic', { have: 'assets/audio/sfx/x/basic.wav', brief, sects, skillpack });
  assert.equal(p.action, 'keep');
});

test('sfx: a code pinned in the brief wins over the auto pick', () => {
  assert.equal(pinnedCode({ sfx: { basic: 'cy_cc_c' } }, 'basic'), 'cy_cc_c');
  assert.equal(pinnedCode({ kit: { ultimate: { sfx: 'sl_bb_f' } } }, 'ultimate-vfx'), 'sl_bb_f');
  assert.equal(pinnedCode(brief, 'basic'), null);
  const p = planRole('basic', { brief: { ...brief, sfx: { basic: 'cy_cc_c' } }, sects, skillpack });
  assert.equal(p.action, 'kiemthe');
  assert.equal(p.code, 'cy_cc_c');
});

test('sfx: element picks the sect, and the role picks the code inside it', () => {
  assert.equal(sectFor(brief, sects), 'shaolin');            // he=kim -> hanh Kim
  assert.equal(sectFor({ he: 'thuy' }, sects), 'cuiyan');
  assert.equal(sectFor({ he: 'soul' }, sects), 'public');     // no element match -> public
  assert.equal(sectFor({ sfx: { sect: 'cuiyan' }, he: 'kim' }, sects), 'cuiyan');   // explicit pin
  const cand = kiemtheCandidates(skillpack, { sect: 'shaolin', role: 'basic' });
  assert.equal(cand[0].ma, 'sl_aa_c');                       // own sect, matching suffix, first
  assert.ok(cand.some(e => e.phai === 'public'));            // public kept as a later option
});

test('sfx: two roles never take the same code, and keywords come from the brief then the role', () => {
  const used = new Set(['sl_aa_c']);
  const p = planRole('basic-hit', { brief, sects, skillpack, used });
  assert.equal(p.action, 'kiemthe');
  assert.notEqual(p.code, 'sl_aa_c');
  const kw = keywordsFor(brief, 'ultimate');
  assert.ok(kw.includes('dao vuc nghiem thu'), kw.join(','));
  assert.ok(kw.includes('ultimate'), kw.join(','));
});

test('sfx: the Pixabay library matches by tag, best score first, ties broken by file name', () => {
  const index = { items: [
    { file: 'b.wav', tags: ['sword', 'slash'] },
    { file: 'a.wav', tags: ['sword'] },
    { file: 'c.wav', tags: ['explosion'] },
  ] };
  assert.equal(pickFromPixabay(index, ['sword', 'slash']).file, 'b.wav');
  assert.equal(pickFromPixabay(index, ['sword']).file, 'a.wav');
  assert.equal(pickFromPixabay(index, ['nothing']), null);
});

test('sfx: an empty library still resolves when the skillpack can supply the role', () => {
  const p = planRole('ultimate', { brief, sects, skillpack, pixabayIndex: { items: [] } });
  assert.equal(p.action, 'kiemthe');
});

test('sfx: nothing available -> a todo row with search words, never a silent gap', () => {
  const p = planRole('hit', { brief, sects, skillpack: { sfx: [] }, pixabayIndex: { items: [] } });
  assert.equal(p.action, 'todo');
  assert.ok(p.keywords.length && p.keywords.length <= 4);
  const rows = todoRows({ hit: p, basic: { action: 'keep', file: 'x' } });
  assert.deepEqual(rows.map(r => r.role), ['hit']);
  assert.ok(rows[0].search.length > 0);
});

test('sfx: coverage needs one basic and one ultimate cue for hero-doctor', () => {
  assert.equal(coverage({ 'x-basic': {}, 'x-ultimate': {} }).ok, true);
  assert.equal(coverage({ 'x-basic-hit': {}, 'x-ultimate-vfx': {} }).ok, true);
  assert.equal(coverage({ 'x-basic': {} }).ok, false);
  assert.equal(coverage({}).ok, false);
});
test('sfx: a preview URL becomes the CDN download URL, and an already-download URL is left alone', () => {
  assert.equal(downloadUrlFrom('https://cdn.pixabay.com/audio/2026/01/29/audio_573798665f.mp3'),
    'https://cdn.pixabay.com/download/audio/2026/01/29/audio_573798665f.mp3');
  assert.equal(downloadUrlFrom('https://cdn.pixabay.com/download/audio/2022/03/10/audio_cf23a04678.mp3'),
    'https://cdn.pixabay.com/download/audio/2022/03/10/audio_cf23a04678.mp3');
  assert.equal(downloadUrlFrom(''), '');
});
