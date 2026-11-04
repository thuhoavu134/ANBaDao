import { createSplusCombat } from './src/domain/combat/splus-mechanics.mjs';

const H = (key, team = 1, slot = 0, extra = {}) => ({ id: `${team}:${key}`, sourceId: `hero_splus_${key}`, team, slot, hp: 1e6, maxHp: 1e6, atk: 1000, def: 200, speed: 100, energy: 100, crit: 0, accuracy: 100, statuses: [], ...extra });
const e = createSplusCombat({ units: [H('lang_van', 1, 0), H('a', 2, 0), H('b', 2, 1)], rng: () => 0.5 });
e.start();
const r = e.act('1:lang_van', 'ultimate', '2:a');
console.log('act result:', JSON.stringify({ ok: r.ok, reason: r.reason, n: (r.events || []).length }));
console.log('targets(ultimate):', e.targets('1:lang_van', 'ultimate').map(t => t.id));
for (const x of e.events) console.log(' ', x.type, x.sourceId, '->', x.targetId, x.amount ?? '', x.action ?? '');
