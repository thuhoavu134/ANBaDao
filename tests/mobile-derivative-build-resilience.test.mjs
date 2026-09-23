import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mobile quality policy does not generate reduced battle or campaign derivatives', () => {
  const battle = readFileSync('scripts/battle-mobile-pressure-v1.mjs', 'utf8');
  const campaign = readFileSync('scripts/campaign-mobile-atlas-v1.mjs', 'utf8');

  assert.doesNotMatch(battle, /await import\('sharp'\)/);
  assert.doesNotMatch(campaign, /await import\('sharp'\)/);
  assert.match(battle, /const out=join\(root,'dist'\),variants=\{\}/);
  assert.match(battle, /canonical authored sources only/);
  assert.match(campaign, /No mobile derivatives: preserve canonical authored pixels/);
  assert.match(campaign, /return \{\};/);
});
