import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const transactionPatch = fs.readFileSync(
  new URL('../scripts/transaction-contract-v1.mjs', import.meta.url),
  'utf8'
);
const openingPatch = fs.readFileSync(
  new URL('../scripts/opening-loop-v1.mjs', import.meta.url),
  'utf8'
);

test('transaction and opening-loop build owners accept the atomic level-up hook', () => {
  const atomicMarker = "const opening=window.HonVietOpeningLoop?.applyToState?.(P,'hero.upgrade'";

  assert.match(transactionPatch, new RegExp(atomicMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(openingPatch, /const atomicUpgradeMarker =/);
  assert.match(openingPatch, /else if \(index\.includes\(atomicUpgradeMarker\)\)/);
  assert.match(openingPatch, /console\.log\('R10 opening loop retained atomic hero upgrade hook'\)/);
  assert.match(openingPatch, /throw new Error\('R07 upgrade success marker not found'\)/);
});
