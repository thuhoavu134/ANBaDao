export const SAVE_CONTRACT_SCHEMA = 'hon-viet-save-contract/v1';
export const SAVE_SCHEMA_VERSION = 2;
export const SAVE_STORAGE_KEY = 'mong_gioi_save_v1';
export const SAVE_BACKUP_STORAGE_KEY = 'mong_gioi_save_v1_backup';

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function validateSaveObject(value) {
  if (!isRecord(value)) {
    return { ok: false, code: 'INVALID_SAVE_ROOT', message: 'Bản lưu không phải object.' };
  }

  const schemaVersion = Number(value.schemaVersion ?? value.v ?? 1);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return { ok: false, code: 'INVALID_SCHEMA_VERSION', message: 'Phiên bản bản lưu không hợp lệ.' };
  }
  if (schemaVersion > SAVE_SCHEMA_VERSION) {
    return { ok: false, code: 'FUTURE_SCHEMA_VERSION', message: 'Bản lưu thuộc phiên bản game mới hơn.' };
  }
  if (value.v !== undefined && Number(value.v) !== 1) {
    return { ok: false, code: 'UNSUPPORTED_SAVE_FORMAT', message: 'Định dạng bản lưu không được hỗ trợ.' };
  }
  if (!isRecord(value.heroes)) {
    return { ok: false, code: 'MISSING_HERO_STATE', message: 'Bản lưu thiếu dữ liệu tướng.' };
  }

  return {
    ok: true,
    schemaVersion,
    legacy: value.schemaVersion === undefined
  };
}

export function parseSavePayload(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === '') {
    return { ok: true, empty: true, value: null };
  }

  let value;
  try {
    value = JSON.parse(String(raw));
  } catch {
    return {
      ok: false,
      code: 'CORRUPT_JSON',
      message: 'Bản lưu hỏng — JSON không đọc được.'
    };
  }

  return { ...validateSaveObject(value), value };
}

export function migrateSaveObject(value) {
  const migrated = { ...value };
  const recovery = value?.__saveRecovery;
  migrated.v = 1;
  migrated.schemaVersion = SAVE_SCHEMA_VERSION;

  const revision = Number(migrated.revision);
  migrated.revision = Number.isInteger(revision) && revision >= 0 ? revision : 0;

  if (recovery) {
    Object.defineProperty(migrated, '__saveRecovery', {
      value: recovery,
      enumerable: false,
      configurable: true
    });
  }
  return migrated;
}

export function prepareSaveState(value, { previousRevision = 0, now = Date.now() } = {}) {
  const prepared = { ...value };
  const currentRevision = Math.max(
    0,
    Number(prepared.revision) || 0,
    Number(previousRevision) || 0
  );
  prepared.v = 1;
  prepared.schemaVersion = SAVE_SCHEMA_VERSION;
  prepared.revision = currentRevision + 1;
  prepared.savedAt = now;
  return prepared;
}

export function markSaveRecovery(player, reason) {
  Object.defineProperty(player, '__saveRecovery', {
    value: reason,
    enumerable: false,
    configurable: true
  });
  return player;
}

export function isSaveRecovery(value) {
  return Boolean(value?.__saveRecovery);
}

export function buildRecoveryPlayer(reason) {
  const player = typeof defaultPlayer === 'function'
    ? defaultPlayer()
    : { v: 1, heroes: {} };
  return markSaveRecovery(player, reason);
}
