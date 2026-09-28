import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import honVietCore from '../src/domain/combat/hon-viet-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

function runUmd(umd) {
  const shim = { exports: {} };
  new Function('module', umd)(shim);
  return shim.exports;
}

const unit = (over = {}) => ({
  id: 'u', name: 'U', atk: 120, def: 60, hp: 1200, maxHp: 1200, speed: 12,
  accuracy: 1, evasion: 0, crit: 0.2, critRes: 0.05, critDamage: 1.55,
  statuses: [], team: 'player', slot: 0, x: 0, y: 0, level: 30, stars: 5,
  sourceId: 'ong_hang_pho', ...over
});

test('hon-viet-core module exposes the full rule core and deterministic damage', () => {
  assert.ok(Object.keys(honVietCore).length >= 200, 'core api surface relocated');
  const A = unit();
  const B = unit({ team: 'enemy', slot: 1, statuses: [{ type: 'marked', power: 0.2, turns: 2 }] });
  // Same inputs must give the same outputs — the core takes explicit rolls.
  const r1 = honVietCore.calculateDamageDetailed(A, B, 1.2, { hit: 0, variance: 0.5, crit: 0.99 });
  const r2 = honVietCore.calculateDamageDetailed(A, B, 1.2, { hit: 0, variance: 0.5, crit: 0.99 });
  assert.deepEqual(r2, r1);
});

test('golden damage/heal contract (locked values; change only with owner approval)', () => {
  const A = unit();
  const B = unit({ team: 'enemy', slot: 1, statuses: [{ type: 'marked', power: 0.2, turns: 2 }] });
  assert.deepEqual(honVietCore.calculateDamageDetailed(A, B, 1, { hit: 0, variance: 0.5, crit: 0.99 }), { amount: 113, missed: false, critical: false });
  assert.deepEqual(honVietCore.calculateDamageDetailed(A, B, 1.2, { hit: 0, variance: 0.25, crit: 0.5 }), { amount: 132, missed: false, critical: false });
  assert.deepEqual(honVietCore.calculateDamageDetailed(A, B, 2.5, { hit: 0, variance: 0.75, crit: 0.99 }), { amount: 291, missed: false, critical: false });
  assert.deepEqual(honVietCore.calculateDamageDetailed(A, B, 1, { hit: 0, variance: 0.5, crit: 0.01 }), { amount: 175, missed: false, critical: true });
  // Full-health target: no missing HP to heal.
  assert.equal(honVietCore.calculateHeal(A, B, 1), 0);
});

test('source battle.html carries only the placeholder, never an inline core', () => {
  const source = read('battle.html');
  assert.doesNotMatch(source, /<script>\(function attachHonVietCore/, 'inline core reappeared in the source; the core lives in src/domain/combat/hon-viet-core.mjs');
  assert.match(source, /<script id="hon-viet-core-umd-v1">/);
});

test('built battle.html serves the module core byte-for-byte (single source)', () => {
  const moduleSource = read('src/domain/combat/hon-viet-core.mjs');
  const umdStart = moduleSource.indexOf('// __HV_CORE_UMD_START\n');
  const umdEnd = moduleSource.indexOf('\n// __HV_CORE_UMD_END');
  const moduleUmd = moduleSource.slice(umdStart + '// __HV_CORE_UMD_START\n'.length, umdEnd);
  if (!existsSync(join(root, 'dist/battle.html'))) return;
  const dist = read('dist/battle.html');
  const startMarker = '<script id="hon-viet-core-umd-v1">';
  const start = dist.indexOf(startMarker);
  assert.ok(start >= 0, 'core block must carry the module id stamp');
  const endTag = dist.indexOf('</script>', start);
  const inline = dist.slice(start + startMarker.length, endTag);
  const strip = s => (s.endsWith('\n') ? s.slice(0, -1) : s);
  assert.equal(strip(inline), strip(moduleUmd), 'inline core drifted from the module; edit the module instead');
});

test('built core produces identical results to the module across a canonical sweep', () => {
  if (!existsSync(join(root, 'dist/battle.html'))) return;
  const dist = read('dist/battle.html');
  const start = dist.indexOf('<script id="hon-viet-core-umd-v1">');
  const endTag = dist.indexOf('</script>', start);
  const inlineUmd = dist.slice(start + '<script id="hon-viet-core-umd-v1">'.length, endTag);
  const built = runUmd(inlineUmd);
  assert.ok(Object.keys(built).length >= 200);

  // Deterministic pseudo-random sweep: 200 damage cases, both engines must
  // agree exactly on amount/missed/critical.
  let seed = 0x9E3779B9;
  const rand = () => { seed = (Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6D2B79F5) | 0; return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
  const statuses = [[], [{ type: 'marked', power: 0.18, turns: 2 }], [{ type: 'guard', turns: 1 }], [{ type: 'nemVi', stacks: 2 }]];
  for (let i = 0; i < 200; i++) {
    const A = unit({ atk: 60 + Math.round(rand() * 200), def: 20 + Math.round(rand() * 90), statuses: pick(statuses, rand), team: rand() < 0.5 ? 'player' : 'enemy' });
    const B = unit({ atk: 60 + Math.round(rand() * 200), def: 20 + Math.round(rand() * 90), statuses: pick(statuses, rand), team: A.team === 'player' ? 'enemy' : 'player' });
    const rolls = { hit: rand() * 0.4, variance: rand(), crit: rand() };
    const mult = [0.8, 1, 1.15, 1.4, 2.2][Math.floor(rand() * 5)];
    assert.deepEqual(
      built.calculateDamageDetailed(A, B, mult, rolls),
      honVietCore.calculateDamageDetailed(A, B, mult, rolls),
      'parity mismatch at case ' + i
    );
  }
});
