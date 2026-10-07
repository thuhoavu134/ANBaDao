import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const scene=fs.readFileSync('src/ui/campaign-scene.js','utf8');

test('campaign never returns an empty hero image merely because a battle overlay state is stale',()=>{
 assert.doesNotMatch(scene,/function imageForScene\(src, spec = null\) \{\s*if \(campaignBattleOpen\(\)\) return emptySceneImage/);
});

test('campaign drops failed resource handle and falls back to authored full-body poster before unregistered portrait instead of skipping actor',()=>{
 assert.match(scene,/if \(sceneImages\.get\(src\) === handle\) sceneImages\.delete\(src\)/);
 assert.match(scene,/portraitSrc\(pick\.id, 'master'\)/);
 assert.match(scene,/drawSpec = fullBody\?/);
});

