import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectLinhDongStatic } from '../scripts/qa-linh-dong-static-v1.mjs';

test('static smoke validates Linh Đồng URLs by bytes and content fingerprint', () => {
  const result = inspectLinhDongStatic();
  assert.equal(result.ok, true);
  assert.equal(result.required, 10);
});
