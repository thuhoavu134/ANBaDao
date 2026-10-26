// Lăng Vân — owner kit 2026-10-23 (second revision): Thủy Chú → Đóng Băng → tan băng, Thủ Thế counter, Thừa Thắng,
// and the ultimate that freezes the soaked and shatters the frozen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createSplusCombat } from '../src/domain/combat/splus-mechanics.mjs';
import { SPLUS_EXTRA_BY_ID, resolveSplusExtraId } from '../src/domain/hero/splus-extras.mjs';

const H = (key, team = 1, slot = 0, extra = {}) => ({ id: `${team}:${key}`, sourceId: `hero_splus_${key}`, team, slot, hp: 1e6, maxHp: 1e6, atk: 1000, def: 200, speed: 100, energy: 100, crit: 0, accuracy: 100, statuses: [], ...extra });
const make = units => { const e = createSplusCombat({ units, rng: () => .5 }); e.start(); return e; };
const hero = '1:lang_van';
const hits = (e, tgt, action) => e.events.filter(x => x.type === 'damage' && x.sourceId === hero && x.targetId === tgt && x.action === action && !x.secondary);
const stacks = (e, id) => (e.unit(id).statuses || []).find(s => s.type === 'speedDown')?.stacks || 0;

test('lang_van: registered as an S+ extra and resolvable by key / slug', () => {
  assert.ok(SPLUS_EXTRA_BY_ID.hero_splus_lang_van);
  for (const alias of ['lang_van', 'lang-van', 'hero_splus_lang_van']) assert.equal(resolveSplusExtraId(alias), 'hero_splus_lang_van', alias);
});

test('lang_van basic: three beats on the main target, nothing on the neighbour from the main swings', () => {
  const e = make([H('lang_van'), H('a', 2, 0), H('b', 2, 1)]);
  e.act(hero, 'basic', '2:a');
  assert.equal(hits(e, '2:a', 'basic').length, 3);
  assert.equal(hits(e, '2:b', 'basic').length, 0, 'the sweep is secondary damage, counted separately');
});

test('lang_van basic: the closing sweep splashes 40% onto up to two neighbours', () => {
  const e = make([H('lang_van'), H('a', 2, 0), H('b', 2, 1), H('c', 2, 2)]);
  e.act(hero, 'basic', '2:a');
  const splash = e.events.filter(x => x.type === 'damage' && x.sourceId === hero && x.action === 'basic' && x.secondary);
  assert.ok(splash.length >= 1, 'splash landed');
  assert.ok(splash.every(x => x.targetId !== '2:a'), 'splash goes to the neighbours, not the main target');
});

test('lang_van basic: recolts 20 energy and braces (Thủ Thế) at the end of the action', () => {
  const e = make([H('lang_van', 1, 0, { energy: 40 }), H('a', 2, 0)]);
  e.act(hero, 'basic', '2:a');
  assert.ok(e.events.some(x => x.type === 'energy' && x.reason === 'lang-van-basic'));
  assert.ok(e.hasStatus(hero, 'mitigation'), 'Thủ Thế mitigation after her action');
  assert.ok(e.events.some(x => x.type === 'thuThe'));
});

test('lang_van Thủy Chú: the three beats count as ONE stack, so a single action does not freeze', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  e.act(hero, 'basic', '2:a');
  assert.equal(stacks(e, '2:a'), 1, 'one stack per action, not one per beat');
  assert.equal(e.events.filter(x => x.type === 'dongBang').length, 0, 'not frozen yet');
  e.act(hero, 'basic', '2:a');
  assert.equal(stacks(e, '2:a'), 2);
  e.act(hero, 'basic', '2:a');
  assert.ok(e.events.some(x => x.type === 'dongBang'), 'third action freezes');
  assert.ok(e.hasStatus('2:a', 'stun'), 'frozen');
  assert.equal(stacks(e, '2:a'), 0, 'the stacks are spent');
});

test('lang_van Đóng Băng: melting pays 120% attack when the freeze expires', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  for (let i = 0; i < 3; i++) e.act(hero, 'basic', '2:a');
  assert.ok(e.hasStatus('2:a', 'stun'));
  const before = e.events.length;
  for (let r = 2; r <= 6 && e.hasStatus('2:a', 'stun'); r++) e.beginRound(r);
  const melt = e.events.slice(before).filter(x => x.type === 'burstOnExpire');
  assert.equal(melt.length, 1, 'exactly one melt');
  assert.ok(melt[0].amount >= 1000, `melt scales with attack (${melt[0].amount})`);
});

test('lang_van Thủ Thế: she counters the first attacker once per turn, not twice', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  e.damage('2:a', hero, { multiplier: 1, forceHit: true });
  assert.equal(e.events.filter(x => x.type === 'counterattack').length, 1, 'first attacker is countered');
  e.damage('2:a', hero, { multiplier: 1, forceHit: true });
  assert.equal(e.events.filter(x => x.type === 'counterattack').length, 1, 'second hit in the same turn is not countered');
});

test('lang_van Thủ Thế: Hàn Băng Hộ Giáp raises the cap to two counters per turn and adds defence', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  e.act(hero, 'ultimate', '2:a');
  assert.ok(e.hasStatus(hero, 'armorUp'), '+30% defence buff');
  assert.ok(e.hasStatus(hero, 'counterCap2'), 'counter cap buff');
  assert.ok(e.modifiers(hero).defense >= .3 - 1e-9, 'defence actually raised');
  e.damage('2:a', hero, { multiplier: 1, forceHit: true });
  e.damage('2:a', hero, { multiplier: 1, forceHit: true });
  assert.equal(e.events.filter(x => x.type === 'counterattack').length, 2, 'two counters in the turn');
});

test('lang_van counter also applies a Thủy Chú stack to the attacker', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  e.damage('2:a', hero, { multiplier: 1, forceHit: true });
  assert.equal(stacks(e, '2:a'), 1, 'the counter soaks the attacker');
});

test('lang_van ultimate: 200% on every enemy and one stack each', () => {
  const e = make([H('lang_van'), H('a', 2, 0), H('b', 2, 1), H('c', 2, 2)]);
  e.act(hero, 'ultimate', '2:a');
  for (const id of ['2:a', '2:b', '2:c']) {
    assert.equal(hits(e, id, 'ultimate').length, 1, `${id} hit once`);
    assert.ok(stacks(e, id) >= 1, `${id} soaked`);
  }
  assert.ok(e.events.some(x => x.type === 'loanVanPha'));
});

test('lang_van ultimate: an enemy already carrying two stacks freezes', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  e.addStatus(hero, '2:a', { type: 'speedDown', power: .1, turns: 3, stacks: 2, stack: true, maxStacks: 3 });
  assert.equal(stacks(e, '2:a'), 2);
  e.act(hero, 'ultimate', '2:a');
  assert.ok(e.hasStatus('2:a', 'stun'), 'two stacks + the storm = frozen');
});

test('lang_van ultimate: a frozen enemy shatters for 150% attack and loses action tempo', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  e.addStatus(hero, '2:a', { type: 'stun', power: 0, turns: 1 });
  e.act(hero, 'ultimate', '2:a');
  assert.ok(e.events.some(x => x.type === 'voBang'), 'shatter event');
  const shatter = e.events.filter(x => x.type === 'damage' && x.damageType === 'true' && x.secondary);
  assert.ok(shatter.length >= 1, 'true damage from the shatter');
  assert.ok(e.hasStatus('2:a', 'cooldownDelay'), 'action delay');
});

test('lang_van is melee: both actions dash in before the animation', () => {
  const h = JSON.parse(readFileSync(new URL('../assets/characters/lang-van/hero.json', import.meta.url), 'utf8'));
  for (const action of ['basic', 'ultimate']) {
    const l = h.battle.actions[action].lunge;
    assert.ok(l && Number(l.dashMs) >= 120 && Number(l.dashMs) <= 600, `${action} dashes`);
  }
});

test('lang_van: every registered cue has a trigger (no dead sounds)', () => {
  const h = JSON.parse(readFileSync(new URL('../assets/characters/lang-van/hero.json', import.meta.url), 'utf8'));
  const b = h.battle;
  const used = new Set();
  for (const a of Object.values(b.actions || {})) for (const e of a.sfx || []) used.add(e.cue);
  for (const v of Object.values(b.events || {})) if (v?.sfx) used.add(v.sfx);
  if (b.reactions?.hitCue) used.add(b.reactions.hitCue);
  assert.deepEqual(Object.keys(h.sfx).filter(c => !used.has(c)), []);
});

// ---- knockback: push into an empty slot, stun when something is in the way ---------------------------
test('lang_van shatter: a frozen enemy in the front row is thrown to the back when that slot is empty', () => {
  const e = make([H('lang_van'), H('a', 2, 0)]);
  e.addStatus(hero, '2:a', { type: 'stun', power: 0, turns: 1 });
  e.act(hero, 'ultimate', '2:a');
  assert.equal(e.unit('2:a').slot, 3, 'pushed back to the empty slot behind');
  assert.ok(e.events.some(x => x.type === 'displacement' && x.from === 0 && x.to === 3));
});

test('lang_van shatter: an ally standing behind becomes a wall — the victim is stunned, not swapped', () => {
  const e = make([H('lang_van'), H('a', 2, 0), H('b', 2, 3)]);
  e.addStatus(hero, '2:a', { type: 'stun', power: 0, turns: 1 });
  e.act(hero, 'ultimate', '2:a');
  const slam = e.events.filter(x => x.type === 'wallSlam');
  assert.equal(slam.length, 1, 'wall slam fired');
  assert.equal(slam[0].blockedBy, '2:b', 'the ally behind is the wall');
  assert.equal(e.unit('2:a').slot, 0, 'nobody swapped slots');
  assert.equal(e.unit('2:b').slot, 3, 'the ally stays put');
  assert.ok(e.hasStatus('2:a', 'stun'), 'the victim is stunned instead');
});

test('lang_van shatter: an enemy already in the back row cannot be pushed further and is stunned', () => {
  const e = make([H('lang_van'), H('a', 2, 3)]);
  e.addStatus(hero, '2:a', { type: 'stun', power: 0, turns: 1 });
  e.act(hero, 'ultimate', '2:a');
  assert.equal(e.unit('2:a').slot, 3);
  assert.ok(e.events.some(x => x.type === 'wallSlam' && x.row === 'back'));
  assert.ok(e.hasStatus('2:a', 'stun'));
});

// ---- SFX must follow the animation, beat by beat ------------------------------------------------------
test('lang_van basic: mỗi nhịp đánh có tiếng riêng (3-3-1 theo chủ dự án)', () => {
  const h = JSON.parse(readFileSync(new URL('../assets/characters/lang-van/hero.json', import.meta.url), 'utf8'));
  const basic = h.battle.actions.basic;
  const beats = basic.hits.length;
  assert.ok(beats >= 3, 'three beats');
  // Owner 2026-10-26: ba nhịp dùng ba tiếng, nhịp 1-2 là tiếng số 3, nhịp 3 là tiếng số 1 (sắc hơn).
  // Bài học cũ vẫn giữ: KHÔNG được để nhịp nào im lặng — mọi hit index 0..beats-1 phải có cue.
  const perBeat = new Map();
  for (const entry of basic.sfx) {
    if (entry.at !== 'hit' || entry.hit === undefined) continue;
    perBeat.set(entry.hit, entry.cue);
  }
  for (let beat = 0; beat < beats; beat++) {
    assert.ok(perBeat.has(beat), `nhịp ${beat} phải có tiếng, không được im`);
  }
  assert.equal(perBeat.get(0), 'lang-van-basic-1');
  assert.equal(perBeat.get(1), 'lang-van-basic-2');
  assert.equal(perBeat.get(2), 'lang-van-basic-3');
  // tệp phải tồn tại thật
  for (const [, cue] of perBeat) {
    const rel = h.sfx[cue];
    assert.ok(rel, `cue ${cue} phải được đăng ký`);
    assert.ok(existsSync(new URL('../assets/audio/sfx/' + rel, import.meta.url)), `thiếu file cho ${cue}`);
  }
});

