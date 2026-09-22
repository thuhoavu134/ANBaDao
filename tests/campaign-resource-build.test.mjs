import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('static pipeline installs campaign repair before final payload sync',()=>{
  const build=readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
  const install=build.indexOf('installCampaignResourceLifecycle(root);');
  assert.ok(install>build.indexOf("await import('./result-character-motion-v1.mjs');"));
  assert.ok(install<build.indexOf('let embeddedIndex = readFileSync'));
});

test('final built campaign contains repair and parses',()=>{
  const index=readFileSync('dist/index.html','utf8');
  const script=index.match(/<script id="hv-afk-chest-runtime-v1">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script,'campaign runtime exists');
  assert.equal(script.split('/* HV_CAMPAIGN_RESOURCE_LIFECYCLE_V1 */').length,2);
  assert.match(script,/sceneImageOwner\.beginFrame\(\)/);
  assert.match(script,/sceneImageOwner\.endFrame\(\)/);
  assert.match(script,/const finishLoading = entry/);
  assert.doesNotMatch(script,/imageForScene\(farmAttackSpecs\[actor\.id\]\.src\);/);
  new vm.Script(script,{filename:'dist/index.html:campaign'});
});
