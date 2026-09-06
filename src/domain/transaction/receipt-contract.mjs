export const TRANSACTION_CONTRACT_SCHEMA = 'hon-viet-transaction-contract/v1';
export const TRANSACTION_SCHEMA_VERSION = 1;
export const RECEIPT_LIMIT = 100;
export const LEDGER_LIMIT = 200;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function normalizeRevision(value, fallback = 0) {
  const revision = Number(value);
  return Number.isInteger(revision) && revision >= 0 ? revision : fallback;
}

function restoreStateInPlace(state, snapshot) {
  const restored = JSON.parse(snapshot);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, restored);
}

function failure(code, message, extra = {}) {
  return { ok: false, code, message, ...extra };
}

function normalizeLedgerDelta(delta) {
  if (delta === null || delta === undefined) {
    return { ok: true, value: null };
  }
  if (!isRecord(delta)) {
    return failure('INVALID_LEDGER_DELTA', 'Ledger delta không hợp lệ.');
  }

  const normalized = {};
  for (const [resource, rawAmount] of Object.entries(delta)) {
    const amount = Number(rawAmount);
    if (!Number.isInteger(amount) || !Number.isFinite(amount)) {
      return failure('INVALID_LEDGER_DELTA', 'Ledger delta không hợp lệ.', { resource });
    }
    if (amount !== 0) normalized[resource] = amount;
  }
  return { ok: true, value: normalized };
}

export function rewardToLedgerDelta(reward) {
  if (!isRecord(reward)) return {};
  const delta = {};
  for (const resource of ['gold', 'gems', 'tinh', 'hoat']) {
    const amount = Number(reward[resource] ?? 0);
    if (Number.isInteger(amount) && Number.isFinite(amount) && amount !== 0) {
      delta[resource] = amount;
    }
  }
  const shards = Number(reward.shards ?? 0);
  if (
    Number.isInteger(shards) &&
    Number.isFinite(shards) &&
    shards !== 0 &&
    typeof reward.shardHero === 'string' &&
    reward.shardHero
  ) {
    delta['shards:' + reward.shardHero] = shards;
  }
  return delta;
}

export function validateTransactionRequest({
  commandId,
  expectedRevision = null,
  currentRevision = 0,
  cost = {},
  balances = {}
} = {}) {
  if (typeof commandId !== 'string' || commandId.trim() === '') {
    return failure('MISSING_COMMAND_ID', 'Thiếu mã giao dịch.');
  }
  if (commandId.length > 160) {
    return failure('INVALID_COMMAND_ID', 'Mã giao dịch quá dài.');
  }
  if (!isRecord(cost)) {
    return failure('INVALID_COST', 'Chi phí giao dịch không hợp lệ.');
  }
  if (!isRecord(balances)) {
    return failure('INVALID_BALANCES', 'Số dư giao dịch không hợp lệ.');
  }

  const current = Number(currentRevision);
  if (!Number.isInteger(current) || current < 0) {
    return failure('INVALID_REVISION', 'Revision hiện tại không hợp lệ.');
  }

  if (expectedRevision !== null && expectedRevision !== undefined) {
    const expected = Number(expectedRevision);
    if (!Number.isInteger(expected) || expected < 0) {
      return failure('INVALID_REVISION', 'Revision giao dịch không hợp lệ.');
    }
    if (expected !== current) {
      return failure('STALE_REVISION', 'Dữ liệu đã thay đổi, hãy thử lại.', {
        expectedRevision: expected,
        currentRevision: current
      });
    }
  }

  const normalizedCost = {};
  for (const [resource, rawAmount] of Object.entries(cost)) {
    const amount = Number(rawAmount);
    if (!Number.isInteger(amount) || amount < 0) {
      return failure('INVALID_COST', 'Chi phí giao dịch không hợp lệ.', { resource });
    }
    normalizedCost[resource] = amount;
    const balance = Number(balances[resource] ?? 0);
    if (!Number.isFinite(balance) || balance < amount) {
      return failure('INSUFFICIENT_FUNDS', 'Không đủ tài nguyên.', {
        resource,
        required: amount,
        available: Number.isFinite(balance) ? balance : 0
      });
    }
  }

  return {
    ok: true,
    commandId,
    currentRevision: current,
    expectedRevision: expectedRevision === null || expectedRevision === undefined
      ? null
      : Number(expectedRevision),
    cost: normalizedCost
  };
}

export function getTransactionReceipt(state, commandId) {
  if (!isRecord(state) || typeof commandId !== 'string' || !isRecord(state.receipts)) {
    return null;
  }
  const receipt = state.receipts[commandId];
  return isRecord(receipt) ? receipt : null;
}

export function executeLocalTransaction({
  state,
  commandId,
  transactionId = commandId,
  expectedRevision = null,
  cost = {},
  balances = {},
  delta = null,
  source = 'unknown',
  reason = 'mutation',
  mutate,
  now = Date.now(),
  receiptLimit = RECEIPT_LIMIT,
  ledgerLimit = LEDGER_LIMIT
} = {}) {
  if (!isRecord(state)) {
    return failure('INVALID_STATE', 'Trạng thái giao dịch không hợp lệ.');
  }

  const existing = getTransactionReceipt(state, commandId);
  if (existing) {
    return {
      ok: existing.status === 'success',
      duplicate: true,
      receipt: cloneJson(existing),
      result: cloneJson(existing.result)
    };
  }

  const validation = validateTransactionRequest({
    commandId,
    expectedRevision,
    currentRevision: normalizeRevision(state.revision),
    cost,
    balances
  });
  if (!validation.ok) return validation;

  const normalizedDelta = normalizeLedgerDelta(delta);
  if (!normalizedDelta.ok) return normalizedDelta;
  const ledgerDelta = normalizedDelta.value ?? Object.fromEntries(
    Object.entries(validation.cost).map(([resource, amount]) => [resource, -amount])
  );

  let snapshot;
  try {
    snapshot = JSON.stringify(state);
  } catch {
    return failure('STATE_NOT_SERIALIZABLE', 'Không thể chuẩn bị giao dịch.');
  }

  try {
    for (const [resource, amount] of Object.entries(validation.cost)) {
      state[resource] = Number(state[resource] || 0) - amount;
    }

    const result = typeof mutate === 'function' ? mutate(state) : { ok: true };
    if (result === false || (isRecord(result) && result.ok === false)) {
      restoreStateInPlace(state, snapshot);
      return failure(
        result?.code || 'MUTATION_REJECTED',
        result?.message || 'Giao dịch bị từ chối.'
      );
    }

    const currentRevision = normalizeRevision(state.revision);
    const revision = currentRevision + 1;
    const createdAt = Number.isFinite(Number(now)) ? Number(now) : Date.now();
    const receipt = {
      schema: TRANSACTION_CONTRACT_SCHEMA,
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      commandId,
      transactionId: typeof transactionId === 'string' && transactionId
        ? transactionId
        : commandId,
      status: 'success',
      source,
      reason,
      cost: cloneJson(validation.cost),
      delta: cloneJson(ledgerDelta),
      result: cloneJson(result ?? { ok: true }),
      revision,
      createdAt
    };

    const receipts = isRecord(state.receipts) ? state.receipts : {};
    receipts[commandId] = receipt;
    const receiptKeys = Object.keys(receipts);
    const maxReceipts = Number.isInteger(receiptLimit) && receiptLimit > 0
      ? receiptLimit
      : RECEIPT_LIMIT;
    while (receiptKeys.length > maxReceipts) {
      const oldest = receiptKeys.shift();
      delete receipts[oldest];
    }
    state.receipts = receipts;

    const ledger = Array.isArray(state.ledger) ? state.ledger : [];
    ledger.push({
      commandId,
      transactionId: receipt.transactionId,
      delta: cloneJson(ledgerDelta),
      reason,
      source,
      rulesVersion: TRANSACTION_CONTRACT_SCHEMA,
      configVersion: TRANSACTION_CONTRACT_SCHEMA,
      revision,
      createdAt
    });
    const maxLedger = Number.isInteger(ledgerLimit) && ledgerLimit > 0
      ? ledgerLimit
      : LEDGER_LIMIT;
    state.ledger = ledger.slice(-maxLedger);

    return {
      ok: true,
      duplicate: false,
      receipt: cloneJson(receipt),
      result: cloneJson(result ?? { ok: true })
    };
  } catch {
    try { restoreStateInPlace(state, snapshot); } catch {}
    return failure('TRANSACTION_FAILED', 'Giao dịch không hoàn tất.');
  }
}

export function settleRewardTransaction({
  state,
  commandId,
  transactionId = commandId,
  expectedRevision = null,
  reward = {},
  applyReward,
  source = 'unknown',
  mutate,
  now = Date.now(),
  receiptLimit = RECEIPT_LIMIT,
  ledgerLimit = LEDGER_LIMIT
} = {}) {
  if (typeof applyReward !== 'function') {
    return failure('MISSING_REWARD_APPLIER', 'Thiếu bộ áp dụng phần thưởng.');
  }

  return executeLocalTransaction({
    state,
    commandId,
    transactionId,
    expectedRevision,
    source,
    reason: 'reward',
    delta: rewardToLedgerDelta(reward),
    mutate: current => {
      const applied = applyReward(reward, current);
      if (applied === false) {
        return failure('REWARD_REJECTED', 'Phần thưởng chưa được áp dụng.');
      }
      return typeof mutate === 'function'
        ? mutate(current)
        : { ok: true, reward: cloneJson(reward) };
    },
    now,
    receiptLimit,
    ledgerLimit
  });
}
