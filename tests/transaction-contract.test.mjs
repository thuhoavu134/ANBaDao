import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  RECEIPT_LIMIT,
  TRANSACTION_CONTRACT_SCHEMA,
  executeLocalTransaction,
  getTransactionReceipt,
  rewardToLedgerDelta,
  settleRewardTransaction,
  validateTransactionRequest
} from '../src/domain/transaction/receipt-contract.mjs';

const fixture = () => JSON.parse(readFileSync(
  new URL('./fixtures/transactions/base-state.json', import.meta.url),
  'utf8'
));

test('successful transaction debits and records one receipt plus a ledger delta', () => {
  const state = fixture();
  const tx = executeLocalTransaction({
    state,
    commandId: 'hero-level-up:ong_hang_pho:4',
    expectedRevision: 4,
    cost: { gold: 40 },
    balances: { gold: state.gold },
    source: 'hero.level-up',
    reason: 'upgrade',
    now: 1234567890,
    mutate: current => {
      current.heroes.ong_hang_pho.level += 1;
      return { ok: true, heroId: 'ong_hang_pho', level: 2 };
    }
  });

  assert.equal(tx.ok, true);
  assert.equal(tx.duplicate, false);
  assert.equal(state.gold, 60);
  assert.equal(state.heroes.ong_hang_pho.level, 2);
  assert.equal(tx.receipt.schema, TRANSACTION_CONTRACT_SCHEMA);
  assert.equal(tx.receipt.commandId, 'hero-level-up:ong_hang_pho:4');
  assert.equal(tx.receipt.revision, 5);
  assert.deepEqual(state.ledger[0].delta, { gold: -40 });
  assert.equal(state.ledger[0].source, 'hero.level-up');
  assert.equal(getTransactionReceipt(state, tx.receipt.commandId).status, 'success');
});

test('reward settlement applies reward once and records positive ledger delta', () => {
  const state = fixture();
  const tx = settleRewardTransaction({
    state,
    commandId: 'quest.claim:daily-1:4',
    expectedRevision: 4,
    reward: { gold: 50, gems: 2, shards: 3, shardHero: 'ong_hang_pho' },
    source: 'quest.claim',
    applyReward: reward => {
      state.gold += reward.gold;
      state.gems += reward.gems;
      state.shards = state.shards || {};
      state.shards[reward.shardHero] = reward.shards;
    },
    mutate: current => {
      current.mail[0].claimed = true;
      return { ok: true, questId: 'daily-1' };
    },
    now: 1234567891
  });

  assert.equal(tx.ok, true);
  assert.deepEqual(rewardToLedgerDelta({
    gold: 50, gems: 2, shards: 3, shardHero: 'ong_hang_pho'
  }), {
    gold: 50,
    gems: 2,
    'shards:ong_hang_pho': 3
  });
  assert.deepEqual(tx.receipt.delta, {
    gold: 50,
    gems: 2,
    'shards:ong_hang_pho': 3
  });
  assert.deepEqual(state.ledger[0].delta, tx.receipt.delta);
  assert.equal(state.gold, 150);
  assert.equal(state.mail[0].claimed, true);
});

test('duplicate command returns the original receipt without running mutation twice', () => {
  const state = fixture();
  let calls = 0;
  const request = {
    state,
    commandId: 'mail.claim:mail-1:4',
    expectedRevision: 4,
    source: 'mail.claim',
    reason: 'reward',
    mutate: current => {
      calls += 1;
      current.gold += 50;
      current.mail[0].claimed = true;
      return { ok: true, mailId: 'mail-1' };
    }
  };

  const first = executeLocalTransaction(request);
  state.revision = first.receipt.revision;
  const second = executeLocalTransaction(request);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, true);
  assert.equal(calls, 1);
  assert.equal(state.gold, 150);
  assert.deepEqual(second.receipt, first.receipt);
});

test('stale revision and insufficient funds reject before mutation', () => {
  const stale = fixture();
  let staleCalls = 0;
  const staleTx = executeLocalTransaction({
    state: stale,
    commandId: 'stale-1',
    expectedRevision: 3,
    cost: { gold: 20 },
    balances: { gold: stale.gold },
    mutate: () => { staleCalls += 1; }
  });
  assert.equal(staleTx.code, 'STALE_REVISION');
  assert.equal(staleCalls, 0);
  assert.equal(stale.gold, 100);

  const poor = fixture();
  let poorCalls = 0;
  const poorTx = executeLocalTransaction({
    state: poor,
    commandId: 'poor-1',
    expectedRevision: 4,
    cost: { gold: 101 },
    balances: { gold: poor.gold },
    mutate: () => { poorCalls += 1; }
  });
  assert.equal(poorTx.code, 'INSUFFICIENT_FUNDS');
  assert.equal(poorCalls, 0);
  assert.equal(poor.gold, 100);
});

test('rejected and thrown mutations roll back every in-memory change', () => {
  const rejected = fixture();
  const beforeRejected = JSON.stringify(rejected);
  const rejectedTx = executeLocalTransaction({
    state: rejected,
    commandId: 'reject-1',
    expectedRevision: 4,
    cost: { gold: 40 },
    balances: { gold: rejected.gold },
    mutate: current => {
      current.gold += 2;
      return { ok: false, code: 'ALREADY_CLAIMED', message: 'Đã nhận.' };
    }
  });
  assert.equal(rejectedTx.code, 'ALREADY_CLAIMED');
  assert.equal(JSON.stringify(rejected), beforeRejected);

  const thrown = fixture();
  const beforeThrown = JSON.stringify(thrown);
  const thrownTx = executeLocalTransaction({
    state: thrown,
    commandId: 'throw-1',
    expectedRevision: 4,
    cost: { gold: 40 },
    balances: { gold: thrown.gold },
    mutate: current => {
      current.gold += 2;
      throw new Error('boom');
    }
  });
  assert.equal(thrownTx.code, 'TRANSACTION_FAILED');
  assert.equal(JSON.stringify(thrown), beforeThrown);
});

test('request validation rejects invalid cost and transaction history stays bounded', () => {
  assert.equal(validateTransactionRequest({
    commandId: 'bad-cost',
    currentRevision: 0,
    cost: { gold: -1 },
    balances: { gold: 100 }
  }).code, 'INVALID_COST');

  const state = fixture();
  for (let i = 0; i < RECEIPT_LIMIT + 5; i += 1) {
    const tx = executeLocalTransaction({
      state,
      commandId: 'history-' + i,
      expectedRevision: 4,
      balances: {},
      mutate: () => ({ ok: true, index: i })
    });
    assert.equal(tx.ok, true);
  }
  assert.equal(Object.keys(state.receipts).length, RECEIPT_LIMIT);
  assert.equal(state.ledger.length, RECEIPT_LIMIT + 5);
});

test('static build wires the contract after the save contract and patches both safe mutation paths', () => {
  const patch = readFileSync(new URL('../scripts/transaction-contract-v1.mjs', import.meta.url), 'utf8');
  const build = readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');

  assert.match(patch, /executeLocalTransaction/);
  assert.match(patch, /function levelUpHero\(id,commandId\)/);
  assert.match(patch, /function claimQuest\(id,commandId\)/);
  assert.match(patch, /function claimMail\(id,commandId\)/);
  assert.match(build, /await import\('\.\/save-contract-v1\.mjs'\);/);
  assert.match(build, /await import\('\.\/transaction-contract-v1\.mjs'\);/);
});
