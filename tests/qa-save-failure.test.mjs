import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('L03c QA bridge exposes an opt-in one-shot persist failure and retry control', () => {
  const qa = read('../scripts/qa-full-access-v1.mjs');
  assert.match(qa, /qaPersistFail/);
  assert.match(qa, /persistFailureArmed/);
  assert.match(qa, /data-qa-arm-persist-fail/);
  assert.match(qa, /data-qa-persist-fault/);
  assert.match(qa, /SAVE_WRITE_FAILED/);
  assert.match(qa, /delete\('qaPersistFail'\)/);
});

test('L03c transaction build owner restores the candidate state after save failure', () => {
  const transaction = read('../scripts/transaction-contract-v1.mjs');
  assert.match(transaction, /if\(typeof persist!=='function' \|\| !persist\(\)\)/);
  assert.match(transaction, /P=JSON\.parse\(before\)/);
  assert.match(transaction, /code:'SAVE_WRITE_FAILED'/);
});
