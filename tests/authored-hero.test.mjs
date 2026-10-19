import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { patchSplusBattleHtml } from '../scripts/splus-runtime-v1.mjs';
import { patchBeAnBattle } from '../scripts/be-an-integration.mjs';
import { loadAuthoredHeroes, battleDescriptor, patchAuthoredBattle, authoredSfxMap, patchAuthoredSfx } from '../scripts/authored-hero-install.mjs';
import { doctorSource, LIMITS } from '../scripts/hero-doctor.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('hero.json heroes are discovered from assets/characters without a per-hero script', () => {
  const heroes = loadAuthoredHeroes(root);
  const khaos = heroes.find(h => h.hero.id === 'khaos');
  assert.ok(khaos, 'khaos/hero.json must be discovered');
  const d = battleDescriptor(khaos);
  for (const key of ['idle', 'run', 'basic', 'ultimate', 'hit', 'fall-die', 'vfx-basic', 'vfx-impact', 'vfx-ultimate']) assert.ok(d.clips[key], key);
  assert.equal(d.clips.idle.frames, 30);
  assert.equal(d.clips['vfx-ultimate'].blend, 'screen');
  assert.deepEqual(Object.keys(authoredSfxMap(heroes)).sort(), ['khaos-basic', 'khaos-impact', 'khaos-ultimate']);
});

test('shared battle installer composes after Bé An, parses, and is idempotent', () => {
  const meta = JSON.parse(read('assets/characters/be-an/runtime-meta.json'));
  const base = patchBeAnBattle(patchSplusBattleHtml(read('battle.html')), read('src/runtime/be-an.js'), meta);
  const descriptors = loadAuthoredHeroes(root).map(battleDescriptor);
  const s = patchAuthoredBattle(base, read('src/runtime/authored-hero.js'), descriptors);
  for (const match of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  assert.equal(patchAuthoredBattle(s, '', descriptors), s);
  assert.match(s, /if\(isAuthoredHero\(actor\)\)return performAuthoredAction/);
  assert.match(s, /if\(isAuthoredHero\(unit\)\)return drawAuthoredHero/);
  assert.match(s, /const slots=isAuthoredHero\(actor\)\|\|isBeAn\(actor\)/);
  assert.equal((s.match(/async function advanceTurn\(/g) || []).length, 1);
  // Runtime must use the battle-wide atlas cache, never a private LRU.
  const runtime = read('src/runtime/authored-hero.js');
  assert.match(runtime, /__HV_NATIVE_ATLAS_CACHE/);
  assert.doesNotMatch(runtime, /\.size>3/);
});

test('SFX cue map is injected into HonVietSfx exactly once', () => {
  const sfxRuntime = read('src/ui/audio-sfx-runtime.js');
  const out = patchAuthoredSfx(sfxRuntime, { 'khaos-basic': 'khaos/basic.wav' });
  assert.match(out, /const authoredFiles = \{"khaos-basic":"khaos\/basic\.wav"\};/);
  assert.throws(() => patchAuthoredSfx(out, {}));
});

test('Bé An runtime no longer evicts pages per frame and prepares its cues', () => {
  const s = read('src/runtime/be-an.js');
  assert.doesNotMatch(s, /beAnImages\.size>3/);
  assert.match(s, /__HV_NATIVE_ATLAS_CACHE/);
  assert.match(s, /prepare\?\.\(cue/);
  assert.doesNotMatch(s, /maxDelayMs:150/);
});

test('hero:doctor passes for hero.json heroes and budget-enforced Bé An', async () => {
  const { errors, report } = await doctorSource(root);
  assert.deepEqual(errors, []);
  const khaos = report.find(r => r.hero === 'khaos');
  assert.ok(khaos.peakPageMiB <= LIMITS.maxDecodedBytes / 1048576);
});

import { createSplusCombat } from '../src/domain/combat/splus-mechanics.mjs';
test('Khaos HUD target query never throws when an enemy row is empty (battle froze on his turn)', () => {
  const H = (id, team, slot) => ({ id, sourceId: id === 'k' ? 'hero_splus_khaos' : 'dummy', team, slot, hp: 1000, maxHp: 1000, atk: 100, def: 0, speed: 100, energy: 0, statuses: [] });
  const e = createSplusCombat({ units: [H('k', 1, 3), H('front', 2, 0)], rng: () => 0.5 }); e.start();
  for (const action of ['basic', 'skill', 'ultimate']) assert.doesNotThrow(() => e.targets('k', action));
  assert.ok(e.targets('k', 'skill').every(Boolean));
});
