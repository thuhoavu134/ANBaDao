import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

test('QA full access is present but opt-in', () => {
  assert.match(index, /id="hv-qa-full-access-v1"/);
  assert.match(index, /qa=unlock-all/);
  assert.match(index, /qaSafePersist/);
  assert.match(index, /data-testid="qa-full-access-panel"/);
  assert.match(index, /P\.unlockedChapters=allChapters/);
});
