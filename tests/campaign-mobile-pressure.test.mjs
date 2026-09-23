import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CAMPAIGN_MOBILE_SCALE,
  CAMPAIGN_MOBILE_SOURCES,
  mobileVariantPath,
  patchCampaignMobileRuntime
} from '../scripts/campaign-mobile-atlas-v1.mjs';

const MiB=1024*1024;
const sourceBytes={
  'assets/characters/bach-dien/campaign-lite/idle-atlas.webp':1440*1320*4,
  'assets/characters/linh-dong/campaign-lite/idle-atlas.webp':1920*2640*4,
  'assets/characters/luc-anh/campaign-lite/idle-atlas.webp':1920*2880*4,
  'assets/characters/dinh-loi/campaign-lite/idle-atlas.webp':1920*1080*4,
  'assets/characters/thay-mo/idle-v3193-atlas.png':12*241*8*270*4,
  'assets/battle-runtime/embedded-12.png':8*240*6*135*4
};

test('mobile campaign profile preserves authored atlas scale',()=>{
  assert.equal(CAMPAIGN_MOBILE_SCALE,1);
  for(const src of Object.keys(sourceBytes))assert.ok(CAMPAIGN_MOBILE_SOURCES.includes(src),src);
});

test('mobile derivative paths never overwrite canonical atlases',()=>{
  assert.equal(mobileVariantPath('assets/characters/thay-mo/idle-v3193-atlas.png'),'assets/characters/thay-mo/mobile-v1/idle-v3193-atlas.webp');
  assert.equal(mobileVariantPath('assets/characters/linh-dong/campaign-lite/idle-atlas.webp'),'assets/characters/linh-dong/campaign-lite/mobile-v1/idle-atlas.webp');
});

test('runtime patch constrains cache without reducing visual fidelity or remapping sources',()=>{
  const source=`const sceneState = {};
const sceneResourceCache = createCampaignResourcePackCache({
      maxDecodedBytes: 96 * 1024 * 1024,
      maxLoading: 2,
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const spriteSpecs = { a:{src:'a.webp',cellW:240,cellH:220,pivot:120,foot:220,body:165} };
const farmAttackSpecs = {};
const runSpecs = { b:{src:'b.webp',cellW:240,cellH:220,pivot:120,foot:220,body:165} };
function drawOtherSurface(){
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
}
function currentCheckpoint() {}
function drawScene(time){
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const preparing = Boolean(sceneState.draft);
}
function sceneTick(time){
  if (time - sceneState.lastFrame >= 32) {
  }
}
function resizeScene(){
  const dpr = Math.min(2, window.devicePixelRatio || 1);
}
`;
  const patched=patchCampaignMobileRuntime(source,{
    'a.webp':{src:'mobile/a.webp',width:600,height:550,scale:.5},
    'b.webp':{src:'mobile/b.webp',width:600,height:550,scale:.5}
  });
  assert.match(patched,/__HV_CAMPAIGN_LOW_MEMORY/);
  assert.match(patched,/64 \* 1024 \* 1024 : 96 \* 1024 \* 1024/);
  assert.match(patched,/__HV_CAMPAIGN_LOW_MEMORY \? 1 : 2/);
  assert.match(patched,/const dpr = Math\.min\(2, window\.devicePixelRatio \|\| 1\)/);
  assert.match(patched,/time - sceneState\.lastFrame >= 32/);
  assert.match(patched,/ctx\.imageSmoothingQuality = 'high'/);
  assert.match(patched,/function drawOtherSurface\(\)\{[\s\S]*?ctx\.imageSmoothingQuality = 'high';/);
  assert.doesNotMatch(patched,/mobile\/a\.webp/);
});

test('static build creates mobile atlases before campaign lifetime patch and final payload sync',()=>{
  const build=readFileSync('scripts/build-static.mjs','utf8');
  const mobile=build.indexOf('installCampaignMobileAtlases(root)');
  const lifecycle=build.indexOf('installCampaignResourceLifecycle(root)');
  const entry=build.indexOf("await import('./battle-entry-fail-open-v1.mjs');");
  const sync=build.indexOf('let embeddedIndex = readFileSync');
  assert.ok(mobile>0&&mobile<lifecycle&&lifecycle<entry&&entry<sync);
});
