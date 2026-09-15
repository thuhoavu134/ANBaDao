import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSplusFixture } from '../scripts/splus-runtime-v1.mjs';
import { SPLUS_HEROES } from '../src/domain/hero/splus-catalog.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('L149-T1: live battles play at full timing; QA and S+ fixtures stay compressed', () => {
  const index = read('index.html');
  assert.match(index, /timingScale:\s*qaMode\s*\?\s*0\.035\s*:\s*1/);
  assert.doesNotMatch(index, /timingScale:\s*qaMode\s*\?\s*0\.035\s*:\s*0\.45/);
  const other = createSplusFixture(SPLUS_HEROES, 'hero_splus_mang_xa');
  const linh = createSplusFixture(SPLUS_HEROES, 'hero_splus_linh_dong');
  assert.equal(other.timingScale, 0.35);
  assert.equal(linh.timingScale, 0.35);
});

test('L149-T2: embedded battles start at 1× so one action can finish', () => {
  const battle = read('battle.html');
  assert.match(battle, /state\.speed = 1;/);
  assert.doesNotMatch(battle, /state\.speed = EMBEDDED \? 3 : 1;/);
  assert.match(battle, /id="embeddedSpeedBadge"[^>]*>×1</);
});

test('L149-T3: rest between actors is readable and auto waits for the action', () => {
  const battle = read('battle.html');
  const rest = battle.match(/turnRest:\s*(\d+)/);
  assert.ok(rest, 'turnRest exists');
  assert.ok(Number(rest[1]) >= 400, 'turnRest must leave a beat after the clip');
  assert.match(battle, /await performAction\(actor, intent\.action, intent\.target\)/);
  assert.doesNotMatch(battle, /void performAction\(actor, intent\.action, intent\.target\)/);
});

test('L149-T4: initiative owner is unchanged', () => {
  const battle = read('battle.html');
  assert.match(battle, /state\.queue = Core\.buildTurnOrder\(units\)/);
});
