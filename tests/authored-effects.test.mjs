// The brief-declared mechanics interpreter (src/domain/combat/authored-effects.mjs) driven through the real engine.
// Specs are injected with options.authoredEffects so the shipped registry is not involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSplusCombat } from '../src/domain/combat/splus-mechanics.mjs';
import { validateSpec, STATUSES, DEBUFF_STATUSES, CONTROL_STATUSES, DOT_STATUSES } from '../src/domain/combat/authored-effects.mjs';

const H = (key, team = 1, slot = 0, extra = {}) => ({ id: `${team}:${key}`, sourceId: `hero_splus_${key}`, team, slot, hp: 1e6, maxHp: 1e6, atk: 1000, def: 200, speed: 100, energy: 100, crit: 0, accuracy: 100, statuses: [], ...extra });
const make = (units, authoredEffects, rng = () => .5) => { const e = createSplusCombat({ units, rng, authoredEffects }); e.start(); return e; };
// khaos is an authored hero (AUTHORED_KITS): its casts go through resolveAuthoredImpact -> fx.onAction.
const K = 'khaos';

test('authored effects: a hero without a spec behaves exactly as before', () => {
  const run = fx => { const e = make([H(K, 1, 0), H('a', 2, 0)], fx); e.act(`1:${K}`, 'basic', '2:a'); return e.events.map(x => `${x.type}:${x.targetId}:${Math.round(x.amount || 0)}`).join('|'); };
  assert.equal(run({}), run(undefined));
});

test('authored effects: basic applies a debuff to the target and heals self after the last hit', () => {
  const e = make([H(K, 1, 0, { hp: 5e5 }), H('a', 2, 0)], { [K]: { basic: { effects: [
    { do: 'status', who: 'target', status: 'armorDown', value: .2, turns: 2 },
    { do: 'heal', who: 'self', pctAtk: 1 },
  ] } } });
  e.act(`1:${K}`, 'basic', '2:a');
  assert.ok(e.hasStatus('2:a', 'armorDown'));
  assert.ok(e.unit(`1:${K}`).hp > 5e5, 'healed');
});

test('authored effects: self/ally effects fire once per cast even when the ultimate hits every enemy', () => {
  const e = make([H(K, 1, 0), H('a', 2, 0), H('b', 2, 1), H('c', 2, 2)], { [K]: { ultimate: { effects: [{ do: 'energy', who: 'self', value: 10 }] } } });
  e.act(`1:${K}`, 'ultimate', '2:a');
  assert.equal(e.events.filter(x => x.type === 'energy' && x.reason === 'authored-fx').length, 1);
});

test('authored effects: execute kills a target left under the threshold, not one above it', () => {
  const fx = { [K]: { basic: { effects: [{ do: 'execute', belowHp: .2 }] } } };
  const low = make([H(K, 1, 0), H('a', 2, 0, { hp: 1.5e5 })], fx); low.act(`1:${K}`, 'basic', '2:a');
  assert.equal(low.unit('2:a').hp, 0);
  const high = make([H(K, 1, 0), H('a', 2, 0, { hp: 5e5 })], fx); high.act(`1:${K}`, 'basic', '2:a');
  assert.ok(high.unit('2:a').hp > 0);
});

test('authored effects: burn is a damage-over-time sized from attack', () => {
  const e = make([H(K, 1, 0), H('a', 2, 0)], { [K]: { basic: { effects: [{ do: 'status', status: 'burn', pctAtk: .3, turns: 2 }] } } });
  e.act(`1:${K}`, 'basic', '2:a');
  const burn = e.unit('2:a').statuses.find(s => s.type === 'burn');
  assert.ok(burn && burn.rawPerTick > 0);
});

test('authored effects: chance uses the engine rng (0.5 roll misses 0.3, lands 0.8)', () => {
  const at = chance => { const e = make([H(K, 1, 0), H('a', 2, 0)], { [K]: { basic: { effects: [{ do: 'status', status: 'stun', turns: 1, chance }] } } }); e.act(`1:${K}`, 'basic', '2:a'); return e.hasStatus('2:a', 'stun'); };
  assert.equal(at(.3), false);
  assert.equal(at(.8), true);
});

test('authored passive: always-on stat, per-stack stat and stack counter', () => {
  const fx = { [K]: { passive: { effects: [
    { when: 'always', do: 'stat', stat: 'resist', value: .15 },
    { when: 'always', do: 'stat', stat: 'attack', value: .05, perStack: 'soul' },
    { when: 'hit', do: 'stack', name: 'soul', max: 5 },
  ] } } };
  const e = make([H(K, 1, 0), H('a', 2, 0)], fx);
  assert.ok(Math.abs(e.modifiers(`1:${K}`).resist - .15) < 1e-9);
  const before = e.modifiers(`1:${K}`).attack;
  e.damage(`1:${K}`, '2:a', { multiplier: 1, forceHit: true });
  assert.equal(e.unit(`1:${K}`).splus.memory.fx.soul, 1);
  assert.ok(Math.abs(e.modifiers(`1:${K}`).attack - before - .05) < 1e-9);
});

test('authored passive: immunity blocks the listed statuses only', () => {
  const e = make([H(K, 1, 0), H('a', 2, 0)], { [K]: { passive: { effects: [{ when: 'immune', status: ['blind', 'stun'] }] } } });
  assert.equal(e.addStatus('2:a', `1:${K}`, { type: 'blind', power: 1, turns: 2 }), null);
  assert.equal(e.addStatus('2:a', `1:${K}`, { type: 'stun', turns: 1 }), null);
  assert.ok(e.addStatus('2:a', `1:${K}`, { type: 'speedDown', power: .1, turns: 2 }));
});

test('authored passive: kill heals, receive retaliates with a debuff, round start grants energy', () => {
  const fx = { [K]: { passive: { effects: [
    { when: 'kill', do: 'heal', who: 'self', pctMaxHp: .1 },
    { when: 'receive', do: 'status', who: 'target', status: 'attackDown', value: .1, turns: 2 },
    { when: 'roundStart', do: 'energy', who: 'self', value: 7 },
  ] } } };
  const e = make([H(K, 1, 0, { hp: 5e5 }), H('a', 2, 0, { hp: 1, maxHp: 1e6 })], fx);
  e.damage(`1:${K}`, '2:a', { multiplier: 1, forceHit: true });
  assert.equal(e.unit('2:a').hp, 0);
  assert.ok(e.unit(`1:${K}`).hp >= 5e5 + 1e5 - 1, 'kill heal 10% max HP');
  const r = make([H(K, 1, 0), H('b', 2, 0)], fx);
  r.damage('2:b', `1:${K}`, { multiplier: 1, forceHit: true });
  assert.ok(r.hasStatus('2:b', 'attackDown'), 'attacker debuffed');
  r.beginRound(2);
  assert.ok(r.events.some(x => x.type === 'energy' && x.reason === 'authored-fx' && x.targetId === `1:${K}`));
});

test('authored effects: every supported debuff/control/dot is harmful to the engine (polarity debuff)', () => {
  const e = make([H(K, 1, 0), H('a', 2, 0)], {});
  for (const type of [...DEBUFF_STATUSES, ...CONTROL_STATUSES, ...DOT_STATUSES]) {
    const s = e.addStatus(`1:${K}`, '2:a', { type, power: .1, turns: 2, rawPerTick: 1 });
    assert.equal(s?.polarity, 'debuff', type);
  }
  assert.ok(STATUSES.length > 30);
});

test('authored effects: validation names the wrong field instead of ignoring it', () => {
  const errs = validateSpec({
    passive: { effects: [{ when: 'sometimes', do: 'heal' }, { when: 'always', do: 'stat', stat: 'luck', value: .1 }] },
    basic: { effects: [{ do: 'status', status: 'frozen' }, { do: 'heal' }, { do: 'execute', belowHp: 2 }, { do: 'status', status: 'burn' }] },
  });
  for (const want of ['passive.effects[0].when', 'passive.effects[1].stat', 'basic.effects[0].status', 'basic.effects[1].pctAtk', 'basic.effects[2].belowHp', 'basic.effects[3].pctAtk'])
    assert.ok(errs.some(e => e.includes(want)), `${want} in ${JSON.stringify(errs)}`);
  assert.deepEqual(validateSpec({ basic: { effects: [{ do: 'status', status: 'stun', turns: 1, chance: .3 }] } }), []);
});

// ---- browser bundle: battle.html copies createSplusMechanics and createAuthoredEffects with toString() ----
test('authored effects survive the browser bundle: serialized factory gives identical events', async () => {
  const vm = await import('node:vm');
  const { createSplusMechanics } = await import('../src/domain/combat/splus-mechanics.mjs');
  const { createAuthoredEffects } = await import('../src/domain/combat/authored-effects.mjs');
  const { SPLUS_HEROES, SPLUS_EXTRA_HEROES, SPLUS_REVIEW_DEFAULTS } = await import('../src/domain/hero/splus-catalog.mjs');
  const ctx = vm.createContext({});
  const create = vm.runInContext(`(${createSplusMechanics.toString()})`, ctx);
  const factory = vm.runInContext(`(${createAuthoredEffects.toString()})`, ctx);
  const spec = { [K]: {
    basic: { effects: [{ do: 'status', status: 'burn', pctAtk: .2, turns: 2 }, { do: 'heal', who: 'self', pctAtk: 1 }] },
    passive: { effects: [{ when: 'hit', do: 'stack', name: 'soul', max: 5 }, { when: 'always', do: 'stat', stat: 'attack', value: .05, perStack: 'soul' }] },
  } };
  const units = () => [H(K, 1, 0, { hp: 5e5 }), H('a', 2, 0), H('b', 2, 1)];
  const node = make(units(), spec);
  const browser = create({ units: units(), rng: () => .5, catalog: [...SPLUS_HEROES, ...SPLUS_EXTRA_HEROES], defaults: SPLUS_REVIEW_DEFAULTS, authoredEffects: spec, createAuthoredEffects: factory });
  browser.start();
  for (const e of [node, browser]) { e.act(`1:${K}`, 'basic', '2:a'); e.act(`1:${K}`, 'basic', '2:b'); }
  assert.ok(node.events.some(x => x.type === 'authoredStack'), 'effects actually ran');
  assert.equal(JSON.stringify(browser.events), JSON.stringify(node.events));
});

test('authored effects: the self-contained lists inside the factory match the exported ones', async () => {
  const { createAuthoredEffects, DOT_STATUSES, CONTROL_STATUSES } = await import('../src/domain/combat/authored-effects.mjs');
  const src = createAuthoredEffects.toString();
  const list = name => JSON.parse(src.match(new RegExp(`const ${name} = (\\[[^\\]]*\\])`))[1].replace(/'/g, '"'));
  assert.deepEqual(list('DOTS'), [...DOT_STATUSES]);
  assert.deepEqual(list('CONTROL'), [...CONTROL_STATUSES]);
});
