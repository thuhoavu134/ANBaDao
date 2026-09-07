import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  executeLocalTransaction,
  getTransactionReceipt
} from '../src/domain/transaction/receipt-contract.mjs';

const transactionPatch = fs.readFileSync(
  new URL('../scripts/transaction-contract-v1.mjs', import.meta.url),
  'utf8'
);
const activeRuntime = fs.readFileSync(
  new URL('../index.html', import.meta.url),
  'utf8'
);

function baseState() {
  return {
    revision: 0,
    gold: 180,
    heroes: { ong_hang_pho: { level: 1 } },
    daily: { quests: [{ id: 'q_level', type: 'level', progress: 0, goal: 1 }] },
    weekly: { quests: [{ id: 'w_level', type: 'level', progress: 0, goal: 1 }] },
    receipts: {},
    ledger: []
  };
}

function questProgress(state, type, amount) {
  for (const quest of state.daily.quests) {
    if (quest.type === type && !quest.claimed) {
      quest.progress = Math.min(quest.goal, quest.progress + amount);
    }
  }
  for (const quest of state.weekly.quests) {
    if (quest.type === type && !quest.claimed) {
      quest.progress = Math.min(quest.goal, quest.progress + amount);
    }
  }
}

function restoreInPlace(state, snapshot) {
  const restored = JSON.parse(snapshot);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, restored);
}

function runLevelUp(state, {
  commandId = 'hero.level-up:ong_hang_pho:1',
  persistOk = true,
  now = 100
} = {}) {
  const before = JSON.stringify(state);
  const tx = executeLocalTransaction({
    state,
    commandId,
    expectedRevision: state.revision,
    cost: { gold: 60 },
    balances: { gold: state.gold },
    source: 'hero.level-up',
    reason: 'upgrade',
    now,
    mutate: current => {
      current.heroes.ong_hang_pho.level += 1;
      questProgress(current, 'level', 1);
      return {
        ok: true,
        heroId: 'ong_hang_pho',
        level: current.heroes.ong_hang_pho.level,
        questProgressed: true
      };
    }
  });

  if (!tx.ok || tx.duplicate) return tx;
  if (!persistOk) {
    restoreInPlace(state, before);
    return { ok: false, code: 'SAVE_WRITE_FAILED' };
  }

  // persist() prepares the save after the transaction has recorded its receipt.
  state.revision = tx.receipt.revision + 1;
  return tx;
}

test('L03b build owner keeps quest progress inside the level-up transaction', () => {
  const start = transactionPatch.indexOf('const newLevel = `');
  const end = transactionPatch.indexOf(
    '`;\nhtml = html.replace(levelPattern, newLevel);',
    start
  );
  assert.ok(start >= 0 && end > start);
  const levelBlock = transactionPatch.slice(start, end);

  assert.match(
    levelBlock,
    /mutate:\(\)=>\{\s*hero\.level\+\+;\s*questProgress\('level',1,false\);/
  );
  assert.equal(
    (levelBlock.match(/questProgress\('level',1/g) || []).length,
    1
  );
  assert.doesNotMatch(levelBlock, /if\(!tx\.duplicate\) questProgress/);
  assert.match(transactionPatch, /function weeklyProgress\(type,amt=1,save=true\)/);
  assert.match(transactionPatch, /function questProgress\(type,amt,save=true\)/);
  assert.match(
    transactionPatch,
    /const commandKey=commandId \|\| 'hero\.level-up:'\+id\+':'\+heroLevel\(id\);/
  );
  assert.match(transactionPatch, /levelUpHero\(id,commandId\)/);
  assert.match(transactionPatch, /levelButtonMarker/);
  assert.match(activeRuntime, /document\.getElementById\('lvBtn'\)\.addEventListener/);
  assert.match(activeRuntime, /const r=levelUpHero\(id\); if\(!r\.ok\)\{ msg=r\.msg; break; \}/);
});

test('L03b failed persist restores gold, hero, quest, weekly state and history', () => {
  const state = baseState();
  const before = JSON.stringify(state);
  const result = runLevelUp(state, { persistOk: false });

  assert.equal(result.code, 'SAVE_WRITE_FAILED');
  assert.equal(JSON.stringify(state), before);
  assert.equal(getTransactionReceipt(state, 'hero.level-up:ong_hang_pho:1'), null);
});

test('L03b success commits one debit, progress and receipt; retry after reload is duplicate', () => {
  const state = baseState();
  const result = runLevelUp(state);

  assert.equal(result.ok, true);
  assert.equal(result.duplicate, false);
  assert.equal(state.gold, 120);
  assert.equal(state.heroes.ong_hang_pho.level, 2);
  assert.equal(state.daily.quests[0].progress, 1);
  assert.equal(state.weekly.quests[0].progress, 1);
  assert.equal(state.revision, 2);
  assert.equal(getTransactionReceipt(state, result.receipt.commandId).status, 'success');

  const reloaded = JSON.parse(JSON.stringify(state));
  const retry = runLevelUp(reloaded, {
    commandId: result.receipt.commandId,
    persistOk: false,
    now: 200
  });

  assert.equal(retry.ok, true);
  assert.equal(retry.duplicate, true);
  assert.deepEqual(retry.receipt, result.receipt);
  assert.deepEqual(reloaded, state);
});
