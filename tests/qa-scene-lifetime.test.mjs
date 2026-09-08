import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('L04b campaign exposes lifecycle diagnostics only behind the opt-in QA query', () => {
  const campaign = read('../src/ui/campaign-scene.js');

  assert.match(campaign, /qaL04b/);
  assert.match(campaign, /window\.location\?\.search/);
  assert.match(campaign, /__HV_CAMPAIGN_SCENE_DIAGNOSTICS/);
  assert.match(campaign, /hon-viet-campaign-scene-diagnostics\/v1/);
  assert.match(campaign, /rootCount/);
  assert.match(campaign, /activationGeneration/);
  assert.match(campaign, /pendingResources/);
  assert.match(campaign, /qaL04bSnapshot/);
});

test('L04b diagnostic snapshot proves one reusable root and active resource ownership', () => {
  const campaign = read('../src/ui/campaign-scene.js');

  assert.match(campaign, /visibleRootCount/);
  assert.match(campaign, /scopeGeneration/);
  assert.match(campaign, /timerActive/);
  assert.match(campaign, /rafActive/);
  assert.match(campaign, /resizeObserverActive/);
  assert.match(campaign, /imageCacheSize/);
  assert.match(campaign, /sceneState\.scope = createSceneLifetime\('campaign'\)/);
});
