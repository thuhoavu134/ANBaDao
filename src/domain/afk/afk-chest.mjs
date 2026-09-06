/**
 * Pure AFK reward-chest contract.
 *
 * The presentation layer may animate a party fighting on a route, but this
 * module is the only owner of elapsed time, the 15-hour cap and claim state.
 * Reward rates are integer units per hour and are locked into the chest state
 * at creation so a balance change cannot retroactively rewrite stored loot.
 */

export const AFK_CHEST_SCHEMA = 'hon-viet-afk-chest/v1';
export const AFK_CAP_SECONDS = 15 * 60 * 60;
export const AFK_REWARD_HOUR_SECONDS = 60 * 60;
export const AFK_DEFAULT_REWARD_RATE = Object.freeze({
  gold: 60,
  tinh: 1,
  hoat: 1
});

const INTEGER_MAX = 2147483647;

function asNonNegativeInt(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(INTEGER_MAX, Math.floor(number)));
}

function asTimestamp(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.floor(number);
}

function clampSeconds(value, capSeconds) {
  return Math.max(0, Math.min(capSeconds, asNonNegativeInt(value)));
}

function cleanReward(input) {
  const output = {};
  if (!input || typeof input !== 'object') return output;
  for (const [key, value] of Object.entries(input)) {
    const amount = asNonNegativeInt(value);
    if (amount > 0) output[key] = amount;
  }
  return output;
}

function cleanRate(input) {
  const source = input && typeof input === 'object' ? input : AFK_DEFAULT_REWARD_RATE;
  const output = {};
  for (const [key, value] of Object.entries(source)) {
    const amount = asNonNegativeInt(value);
    if (amount > 0) output[key] = amount;
  }
  return output;
}

function cleanRemainder(input, rate) {
  const output = {};
  if (!input || typeof input !== 'object') return output;
  for (const key of Object.keys(rate)) {
    const amount = asNonNegativeInt(input[key]);
    if (amount > 0) output[key] = amount % AFK_REWARD_HOUR_SECONDS;
  }
  return output;
}

function rewardHasValue(reward) {
  return Object.values(reward || {}).some((amount) => asNonNegativeInt(amount) > 0);
}

function addReward(target, key, amount) {
  const value = asNonNegativeInt(amount);
  if (!value) return;
  target[key] = Math.min(INTEGER_MAX, asNonNegativeInt(target[key]) + value);
}

export function createAfkChestState({
  now = null,
  capSeconds = AFK_CAP_SECONDS,
  rewardRate = AFK_DEFAULT_REWARD_RATE
} = {}) {
  const cap = Math.max(1, asNonNegativeInt(capSeconds, AFK_CAP_SECONDS));
  const timestamp = asTimestamp(now);
  return {
    schema: AFK_CHEST_SCHEMA,
    version: 1,
    capSeconds: cap,
    storedSeconds: 0,
    lastAccruedAt: timestamp,
    initializedAt: timestamp,
    lastClaimAt: null,
    claimCount: 0,
    revision: 0,
    rewardRate: cleanRate(rewardRate),
    pendingReward: {},
    rewardRemainder: {}
  };
}

export function normalizeAfkChestState(input, { now = null } = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const capSeconds = Math.max(1, asNonNegativeInt(source.capSeconds, AFK_CAP_SECONDS));
  const rewardRate = cleanRate(source.rewardRate);
  const fallback = createAfkChestState({ now, capSeconds, rewardRate });
  const lastAccruedAt = asTimestamp(source.lastAccruedAt, fallback.lastAccruedAt);
  return {
    schema: AFK_CHEST_SCHEMA,
    version: 1,
    capSeconds,
    storedSeconds: clampSeconds(source.storedSeconds, capSeconds),
    lastAccruedAt,
    initializedAt: asTimestamp(source.initializedAt, lastAccruedAt),
    lastClaimAt: asTimestamp(source.lastClaimAt),
    claimCount: asNonNegativeInt(source.claimCount),
    revision: asNonNegativeInt(source.revision),
    rewardRate,
    pendingReward: cleanReward(source.pendingReward),
    rewardRemainder: cleanRemainder(source.rewardRemainder, rewardRate)
  };
}

/**
 * Apply elapsed time once. No wall clock is read here: callers supply `now`
 * so tests and save migrations can be deterministic.
 */
export function accrueAfkChest(input, { now = null } = {}) {
  const state = normalizeAfkChestState(input);
  const timestamp = asTimestamp(now);
  if (timestamp === null) {
    return { state, changed: false, reason: 'invalid-time', elapsedSeconds: 0, accruedSeconds: 0 };
  }

  if (state.lastAccruedAt === null) {
    const initialized = {
      ...state,
      lastAccruedAt: timestamp,
      initializedAt: state.initializedAt ?? timestamp,
      revision: state.revision + 1
    };
    return { state: initialized, changed: true, reason: 'initialized', elapsedSeconds: 0, accruedSeconds: 0 };
  }

  if (timestamp < state.lastAccruedAt) {
    return { state, changed: false, reason: 'clock-backwards', elapsedSeconds: 0, accruedSeconds: 0 };
  }

  const elapsedSeconds = Math.floor((timestamp - state.lastAccruedAt) / 1000);
  if (elapsedSeconds <= 0) {
    return { state, changed: false, reason: 'no-elapsed-time', elapsedSeconds: 0, accruedSeconds: 0 };
  }

  const capacity = Math.max(0, state.capSeconds - state.storedSeconds);
  const accruedSeconds = Math.min(elapsedSeconds, capacity);
  const pendingReward = { ...state.pendingReward };
  const rewardRemainder = { ...state.rewardRemainder };

  for (const [key, ratePerHour] of Object.entries(state.rewardRate)) {
    const carried = asNonNegativeInt(rewardRemainder[key]);
    const units = accruedSeconds * ratePerHour + carried;
    const earned = Math.floor(units / AFK_REWARD_HOUR_SECONDS);
    rewardRemainder[key] = units % AFK_REWARD_HOUR_SECONDS;
    addReward(pendingReward, key, earned);
  }

  const next = {
    ...state,
    storedSeconds: state.storedSeconds + accruedSeconds,
    lastAccruedAt: timestamp,
    pendingReward,
    rewardRemainder,
    revision: state.revision + 1
  };
  return {
    state: next,
    changed: true,
    reason: accruedSeconds < elapsedSeconds ? 'cap-reached' : 'accrued',
    elapsedSeconds,
    accruedSeconds
  };
}

export function getAfkChestView(input, { now = null } = {}) {
  const accrued = accrueAfkChest(input, { now });
  const state = accrued.state;
  const fullness = state.capSeconds > 0 ? state.storedSeconds / state.capSeconds : 1;
  const isFull = state.storedSeconds >= state.capSeconds;
  const claimable = state.storedSeconds > 0 && (isFull || rewardHasValue(state.pendingReward));
  return {
    ...accrued,
    state,
    storedSeconds: state.storedSeconds,
    capSeconds: state.capSeconds,
    fullness: Math.max(0, Math.min(1, fullness)),
    isFull,
    pendingReward: { ...state.pendingReward },
    claimable
  };
}

/**
 * Claim is deliberately separate from accrual. It returns the exact reward
 * payload for the outer transaction layer to apply atomically to player data.
 */
export function claimAfkChest(input, { now = null } = {}) {
  const view = getAfkChestView(input, { now });
  const timestamp = asTimestamp(now);
  if (timestamp === null) {
    return { state: view.state, changed: false, reason: 'invalid-time', reward: {} };
  }
  if (!view.claimable) {
    return {
      state: view.state,
      changed: false,
      reason: view.storedSeconds <= 0 ? 'empty' : 'reward-not-ready',
      reward: {},
      accruedSeconds: view.accruedSeconds
    };
  }

  const next = {
    ...view.state,
    storedSeconds: 0,
    lastAccruedAt: timestamp,
    lastClaimAt: timestamp,
    claimCount: view.state.claimCount + 1,
    pendingReward: {},
    // Keep sub-unit progress so early claims do not silently destroy earned
    // fractions of the configured hourly reward rate.
    rewardRemainder: { ...view.state.rewardRemainder },
    revision: view.state.revision + 1
  };
  return {
    state: next,
    changed: true,
    reason: 'claimed',
    reward: { ...view.pendingReward },
    accruedSeconds: view.accruedSeconds
  };
}
