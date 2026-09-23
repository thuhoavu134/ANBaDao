import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('mobile derivative builders bound Sharp resources and fall back per asset', () => {
  const battle = readFileSync('scripts/battle-mobile-pressure-v1.mjs', 'utf8');
  const campaign = readFileSync('scripts/campaign-mobile-atlas-v1.mjs', 'utf8');

  for (const source of [battle, campaign]) {
    assert.match(source, /sharp\.cache\(false\)/);
    assert.match(source, /sharp\.concurrency\(1\)/);
    assert.match(source, /catch \(error\)/);
  }

  assert.match(battle, /Battle mobile derivative skipped:/);
  assert.match(campaign, /Campaign mobile derivative skipped:/);
  assert.match(campaign, /if \(existsSync\(target\)\)/);
  assert.match(campaign, /variants\[src\] = \{ src: targetSrc, width: Number\(existing\.width\), height: Number\(existing\.height\), scale: CAMPAIGN_MOBILE_SCALE \}/);
});
