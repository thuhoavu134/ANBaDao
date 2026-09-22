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

test('mobile campaign profile covers all six idle atlases and quarters decoded residency',()=>{
  assert.equal(CAMPAIGN_MOBILE_SCALE,.5);
  for(const src of Object.keys(sourceBytes))assert.ok(CAMPAIGN_MOBILE_SOURCES.includes(src),src);
  const decoded=Object.values(sourceBytes).reduce((n,v)=>n+v*CAMPAIGN_MOBILE_SCALE**2,0);
  assert.ok(decoded<24*MiB,`six idle mobile set ${decoded/MiB} MiB`);
});

test('mobile derivative paths never overwrite canonical atlases',()=>{
  assert.equal(mobileVariantPath('assets/characters/thay-mo/idle-v3193-atlas.png'),'assets/characters/thay-mo/mobile-v1/idle-v3193-atlas.webp');
  assert.equal(mobileVariantPath('assets/characters/linh-dong/campaign-lite/idle-atlas.webp'),'assets/characters/linh-dong/campaign-lite/mobile-v1/idle-atlas.webp');
});

test('runtime patch applies low-memory cache, DPR, frame pacing and spec remap',()=>{
  const source=`const sceneState = {};
const sceneResourceCache = createCampaignResourcePackCache({
      maxDecodedBytes: 96 * 1024 * 1024,
      maxLoading: 2,
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const spriteSpecs = { a:{src:'a.webp',cellW:240,cellH:220,pivot:120,foot:220,body:165} };
const farmAttackSpecs = {};
const runSpecs = { b:{src:'b.webp',cellW:240,cellH:220,pivot:120,foot:220,body:165} };
function currentCheckpoint() {}
function drawScene(time){
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (time - sceneState.lastFrame >= 32) {
  }
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
  assert.match(patched,/Math\.min\(1\.5, window\.devicePixelRatio/);
  assert.match(patched,/__HV_CAMPAIGN_LOW_MEMORY \? 50 : 32/);
  assert.match(patched,/mobile\/a\.webp/);
});

test('build dependency keeps sharp available when Vercel omits devDependencies',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
  assert.equal(pkg.dependencies?.sharp,'0.34.3');
  assert.equal(pkg.devDependencies?.sharp,undefined);
  assert.equal(lock.packages[''].dependencies?.sharp,'0.34.3');
  assert.notEqual(lock.packages['node_modules/sharp']?.dev,true);
});

test('static build creates mobile atlases before campaign lifetime patch and final payload sync',()=>{
  const build=readFileSync('scripts/build-static.mjs','utf8');
  const mobile=build.indexOf('buildCampaignMobileAtlases(root)');
  const lifecycle=build.indexOf('installCampaignResourceLifecycle(root)');
  const sync=build.indexOf('let embeddedIndex = readFileSync');
  assert.ok(mobile>0&&mobile<lifecycle&&lifecycle<sync);
});
