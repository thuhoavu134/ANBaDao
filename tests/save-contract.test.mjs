import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SAVE_BACKUP_STORAGE_KEY,
  SAVE_CONTRACT_SCHEMA,
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
  buildRecoveryPlayer,
  isSaveRecovery,
  migrateSaveObject,
  parseSavePayload,
  prepareSaveState,
  validateSaveObject
} from '../src/domain/save/save-contract.mjs';

const fixture = name => JSON.parse(readFileSync(
  new URL('./fixtures/save/' + name, import.meta.url), 'utf8'
));

test('save contract keeps the existing storage key and adds explicit version/revision', () => {
  assert.equal(SAVE_CONTRACT_SCHEMA, 'hon-viet-save-contract/v1');
  assert.equal(SAVE_SCHEMA_VERSION, 2);
  assert.equal(SAVE_STORAGE_KEY, 'mong_gioi_save_v1');
  assert.equal(SAVE_BACKUP_STORAGE_KEY, 'mong_gioi_save_v1_backup');
});

test('legacy v1 fixture migrates without mutating the source object', () => {
  const legacy = fixture('legacy-v1-minimal.json');
  const migrated = migrateSaveObject(legacy);

  assert.equal(legacy.schemaVersion, undefined);
  assert.equal(legacy.revision, undefined);
  assert.equal(migrated.v, 1);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.revision, 0);
  assert.equal(migrated.heroes.ong_hang_pho.owned, true);
});

test('versioned fixture increments revision and stamps save time', () => {
  const current = fixture('versioned-v2.json');
  const prepared = prepareSaveState(current, { previousRevision: 7, now: 1234567890 });

  assert.equal(current.revision, 7);
  assert.equal(prepared.schemaVersion, 2);
  assert.equal(prepared.revision, 8);
  assert.equal(prepared.savedAt, 1234567890);
});

test('parser rejects corrupt JSON and future schemas without falling back silently', () => {
  const corrupt = parseSavePayload('{"v":1');
  assert.equal(corrupt.ok, false);
  assert.equal(corrupt.code, 'CORRUPT_JSON');

  const future = parseSavePayload(JSON.stringify(fixture('future-v3.json')));
  assert.equal(future.ok, false);
  assert.equal(future.code, 'FUTURE_SCHEMA_VERSION');
  assert.equal(validateSaveObject(future.value).code, 'FUTURE_SCHEMA_VERSION');
});

test('empty storage is distinguishable from invalid storage', () => {
  assert.deepEqual(parseSavePayload(null), { ok: true, empty: true, value: null });
  assert.equal(parseSavePayload('{}').code, 'MISSING_HERO_STATE');
});

test('recovery marker is non-enumerable and survives migration', () => {
  const recovery = buildRecoveryPlayer({ ok: false, code: 'CORRUPT_JSON' });
  assert.equal(isSaveRecovery(recovery), true);
  assert.equal(JSON.stringify(recovery).includes('__saveRecovery'), false);
  const migrated = migrateSaveObject(recovery);
  assert.equal(isSaveRecovery(migrated), true);
});
