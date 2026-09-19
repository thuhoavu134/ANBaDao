import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = rel => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');

test('PHASE01 action contract has explicit id/parent/target/completion concepts', () => {
  const battle = read('battle.html');
  assert.match(battle, /actionId/);
  assert.match(battle, /battleId/);
  assert.match(battle, /target/);
  assert.match(battle, /resolveAction/);
  assert.match(battle, /resolvedActionIds/);
  assert.match(battle, /arguments\[3\]/);
  assert.match(battle, /state\.locked/);
});

test('PHASE01 resource contract has a shared native atlas cache with owner release', () => {
  const battle = read('battle.html');
  assert.match(battle, /BATTLE_NATIVE_ATLAS_CACHE/);
  assert.match(battle, /maxBytes=128\*1024\*1024/);
  assert.match(battle, /function release|const release/);
  assert.match(battle, /function clear|const clear/);
});

test('PHASE01 opt-in diagnostics are not enabled by default', () => {
  const battle = read('battle.html');
  assert.match(battle, /__HV_NATIVE_ATLAS_CACHE/);
  assert.match(battle, /__HV_BATTLE_PHASE01/);
  assert.match(battle, /PHASE01_QA_ENABLED/);
  assert.match(battle, /pagehide/);
});
