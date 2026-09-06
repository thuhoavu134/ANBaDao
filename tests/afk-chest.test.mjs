import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AFK_CAP_SECONDS,
  AFK_DEFAULT_REWARD_RATE,
  accrueAfkChest,
  claimAfkChest,
  createAfkChestState,
  getAfkChestView,
  normalizeAfkChestState
} from '../src/domain/afk/afk-chest.mjs';

const T0 = Date.UTC(2026, 8, 7, 0, 0, 0);
const hour = 60 * 60 * 1000;

test('starts empty and accrues elapsed time into the chest', () => {
  const state = createAfkChestState({ now: T0 });
  const result = accrueAfkChest(state, { now: T0 + 10 * hour });

  assert.equal(result.state.storedSeconds, 10 * 60 * 60);
  assert.deepEqual(result.state.pendingReward, {
    gold: 10 * AFK_DEFAULT_REWARD_RATE.gold,
    tinh: 10,
    hoat: 10
  });
  assert.equal(result.state.lastAccruedAt, T0 + 10 * hour);
});

test('caps at exactly 15 hours and discards time beyond the cap', () => {
  const state = createAfkChestState({ now: T0 });
  const result = accrueAfkChest(state, { now: T0 + 20 * hour });

  assert.equal(result.state.storedSeconds, AFK_CAP_SECONDS);
  assert.equal(result.accruedSeconds, AFK_CAP_SECONDS);
  assert.equal(result.reason, 'cap-reached');
  assert.deepEqual(result.state.pendingReward, { gold: 900, tinh: 15, hoat: 15 });

  const stillFull = accrueAfkChest(result.state, { now: T0 + 30 * hour });
  assert.equal(stillFull.state.storedSeconds, AFK_CAP_SECONDS);
  assert.deepEqual(stillFull.state.pendingReward, result.state.pendingReward);
  assert.equal(stillFull.accruedSeconds, 0);
});

test('claim returns the reward atomically and opens a fresh accumulation cycle', () => {
  const state = createAfkChestState({ now: T0 });
  const claimed = claimAfkChest(state, { now: T0 + 20 * hour });

  assert.equal(claimed.changed, true);
  assert.deepEqual(claimed.reward, { gold: 900, tinh: 15, hoat: 15 });
  assert.equal(claimed.state.storedSeconds, 0);
  assert.equal(claimed.state.claimCount, 1);
  assert.equal(claimed.state.lastClaimAt, T0 + 20 * hour);

  const nextHour = accrueAfkChest(claimed.state, { now: T0 + 21 * hour });
  assert.equal(nextHour.state.storedSeconds, 60 * 60);
  assert.deepEqual(nextHour.state.pendingReward, { gold: 60, tinh: 1, hoat: 1 });
});

test('does not accrue when the device clock moves backwards', () => {
  const state = createAfkChestState({ now: T0 });
  const tenHours = accrueAfkChest(state, { now: T0 + 10 * hour });
  const backwards = accrueAfkChest(tenHours.state, { now: T0 + 2 * hour });

  assert.equal(backwards.changed, false);
  assert.equal(backwards.reason, 'clock-backwards');
  assert.equal(backwards.state.storedSeconds, tenHours.state.storedSeconds);
  assert.deepEqual(backwards.state.pendingReward, tenHours.state.pendingReward);
});

test('allows a partial claim and keeps sub-unit reward progress', () => {
  const state = createAfkChestState({ now: T0 });
  const halfHour = getAfkChestView(state, { now: T0 + hour / 2 });
  assert.equal(halfHour.storedSeconds, 30 * 60);
  assert.equal(halfHour.claimable, true);

  const claimed = claimAfkChest(state, { now: T0 + hour / 2 });
  assert.equal(claimed.changed, true);
  assert.deepEqual(claimed.reward, { gold: 30 });
  assert.equal(claimed.state.storedSeconds, 0);
  assert.equal(claimed.state.rewardRemainder.tinh, 1800);
});

test('normalization cannot exceed the cap or carry invalid values', () => {
  const state = normalizeAfkChestState({
    capSeconds: AFK_CAP_SECONDS,
    storedSeconds: 999999,
    pendingReward: { gold: -5, tinh: 2.8 },
    rewardRemainder: { gold: 999999 },
    claimCount: -3
  }, { now: T0 });

  assert.equal(state.storedSeconds, AFK_CAP_SECONDS);
  assert.deepEqual(state.pendingReward, { tinh: 2 });
  assert.equal(state.rewardRemainder.gold, 2799);
  assert.equal(state.claimCount, 0);
});

test('a new chest without a clock does not start at Unix epoch', () => {
  const state = createAfkChestState();
  assert.equal(state.lastAccruedAt, null);
  const initialized = accrueAfkChest(state, { now: T0 });
  assert.equal(initialized.accruedSeconds, 0);
  assert.equal(initialized.state.lastAccruedAt, T0);
  assert.equal(initialized.state.storedSeconds, 0);
});
