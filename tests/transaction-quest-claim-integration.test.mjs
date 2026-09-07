import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  getTransactionReceipt,
  settleRewardTransaction
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
    gold: 100,
    gems: 5,
    daily: {
      dayIndex: 321,
      activityPoints: 0,
      quests: [{ id: 'q_first', progress: 1, goal: 1, pts: 10, claimed: false }]
    },
    clan: { level: 1, xp: 0 },
    receipts: {},
    ledger: []
  };
}

function applyReward(reward, state) {
  state.gold += reward.gold || 0;
  state.gems += reward.gems || 0;
}

function restoreInPlace(state, snapshot) {
  const restored = JSON.parse(snapshot);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, restored);
}

function runQuestClaim(state, {
  commandId = 'quest.claim:q_first:321',
  persistOk = true,
  now = 100,
  notifications = []
} = {}) {
  const before = JSON.stringify(state);
  const tx = settleRewardTransaction({
    state,
    commandId,
    expectedRevision: state.revision,
    reward: { gold: 75, gems: 4 },
    applyReward,
    source: 'quest.claim',
    now,
    mutate: current => {
      current.daily.quests[0].claimed = true;
      current.daily.activityPoints += current.daily.quests[0].pts;
      current.clan.xp += 5;
      return {
        ok: true,
        questId: 'q_first',
        clanXp: 5,
        clanLevelUps: []
      };
    }
  });

  if (!tx.ok || tx.duplicate) return tx;
  if (!persistOk) {
    restoreInPlace(state, before);
    return { ok: false, code: 'SAVE_WRITE_FAILED' };
  }

  state.revision = tx.receipt.revision + 1;
  for (const levelUp of tx.result.clanLevelUps) notifications.push(levelUp);
  return tx;
}

test('L03c build owner makes quest command id stable and keeps clan XP inside the transaction', () => {
  const start = transactionPatch.indexOf('const newQuest = `');
  const end = transactionPatch.indexOf(
    '`;\nhtml = html.replace(questPattern, newQuest);',
    start
  );
  assert.ok(start >= 0 && end > start);
  const questBlock = transactionPatch.slice(start, end);

  assert.match(
    questBlock,
    /const commandKey=commandId \|\| 'quest\.claim:'\+id\+':'\+\(P\.daily\?\.dayIndex\?\?today\(\)\);/
  );
  assert.match(questBlock, /const clanXp=hvApplyClanXp\(5\);/);
  assert.match(questBlock, /clanLevelUps:clanXp\.levelUps/);
  assert.match(questBlock, /afterCommit:tx=>hvNotifyClanLevelUps\(tx\.result\?\.clanLevelUps\)/);
  assert.doesNotMatch(questBlock, /if\(!tx\.duplicate\) clanAddXp/);
  assert.match(transactionPatch, /function hvApplyClanXp\(amount\)/);
  assert.match(transactionPatch, /function hvNotifyClanLevelUps\(levelUps\)/);
  assert.match(activeRuntime, /function claimQuest\(id\)\{/);
  assert.match(activeRuntime, /clanAddXp\(5\)/);
});

test('L03c failed persist restores reward, quest, activity, clan XP and receipt', () => {
  const state = baseState();
  const before = JSON.stringify(state);
  const notifications = [];
  const result = runQuestClaim(state, { persistOk: false, notifications });

  assert.equal(result.code, 'SAVE_WRITE_FAILED');
  assert.equal(JSON.stringify(state), before);
  assert.equal(getTransactionReceipt(state, 'quest.claim:q_first:321'), null);
  assert.deepEqual(notifications, []);
});

test('L03c success commits reward, quest, activity and clan XP once; retry is duplicate', () => {
  const state = baseState();
  const notifications = [];
  const result = runQuestClaim(state, { notifications });

  assert.equal(result.ok, true);
  assert.equal(result.duplicate, false);
  assert.equal(state.gold, 175);
  assert.equal(state.gems, 9);
  assert.equal(state.daily.quests[0].claimed, true);
  assert.equal(state.daily.activityPoints, 10);
  assert.equal(state.clan.xp, 5);
  assert.equal(state.revision, 2);
  assert.equal(state.ledger.length, 1);
  assert.equal(getTransactionReceipt(state, result.receipt.commandId).status, 'success');

  const reloaded = JSON.parse(JSON.stringify(state));
  const retry = runQuestClaim(reloaded, {
    commandId: result.receipt.commandId,
    persistOk: false,
    now: 200,
    notifications
  });

  assert.equal(retry.ok, true);
  assert.equal(retry.duplicate, true);
  assert.deepEqual(retry.receipt, result.receipt);
  assert.deepEqual(reloaded, state);
  assert.deepEqual(notifications, []);
});
