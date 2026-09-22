import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { createCampaignResourcePackCache } from '../src/assets/campaign-resource-pack-cache.mjs';

const root = new URL('../', import.meta.url);
const original = readFileSync(new URL('src/ui/campaign-scene.js', root), 'utf8');
let source = original;
const patchUrl = new URL('scripts/campaign-resource-lifecycle-v1.mjs', root);
if (process.env.HV_TEST_BASELINE !== '1' && existsSync(patchUrl)) {
  const { patchCampaignResourceLifecycle } = await import(patchUrl);
  source = patchCampaignResourceLifecycle(original);
}
const start = source.indexOf('function campaignPackFor(');
const end = source.indexOf('function frameAt(', start);
assert.ok(start >= 0 && end > start, 'production campaign image owner boundaries');
const ownerSource = source.slice(start, end);
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const spec = { frames: 1, cols: 1, cellW: 1, cellH: 6 };

function fixture(cache) {
  const state = { active: true, scope: { add() { return () => {}; } } };
  let draws = 0;
  const context = vm.createContext({ sceneImages: new Map(), sceneResourceCache: cache,
    sceneState: state, window: {}, document: { getElementById: () => null },
    Image: class { complete=false; naturalWidth=0; removeAttribute() {} },
    reducedMotion: { matches:false }, performance, Date, setTimeout, clearTimeout,
    requestAnimationFrame: fn => setTimeout(() => fn(performance.now()), 0), cancelAnimationFrame: clearTimeout,
    drawScene: () => { draws++; } });
  vm.runInContext(ownerSource, context);
  return { context, get draws(){ return draws; }, image:(src,s)=>context.imageForScene(src,s),
    clear:()=>context.releaseSceneAtlases() };
}

test('six over-budget packs do not starve the UI timer', () => {
  const code = `
    import vm from 'node:vm';
    import { createCampaignResourcePackCache } from ${JSON.stringify(new URL('src/assets/campaign-resource-pack-cache.mjs', root).href)};
    let attempts=0,draws=0;
    const cache=createCampaignResourcePackCache({maxDecodedBytes:96,maxLoading:2,
      makeImage:()=>{attempts++;return {complete:false,naturalWidth:0,removeAttribute(){}};},
      load:async(pack,image)=>{image.complete=true;image.naturalWidth=1;return {image,decodedBytes:pack.decodedBytes};}});
    const c=vm.createContext({sceneImages:new Map(),sceneResourceCache:cache,sceneState:{active:true,scope:{add(){return ()=>{};}}},
      window:{},document:{getElementById:()=>null},Image:class{},reducedMotion:{matches:false},performance,Date,setTimeout,clearTimeout,
      requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()),0),cancelAnimationFrame:clearTimeout,
      drawScene(){draws++;for(let i=0;i<6;i++)c.imageForScene('assets/characters/h'+i+'/idle.webp',{frames:1,cols:1,cellW:1,cellH:6});}});
    vm.runInContext(${JSON.stringify(ownerSource)},c);c.drawScene();
    setTimeout(()=>{console.log(JSON.stringify({attempts,draws,timer:true}));c.releaseSceneAtlases();process.exit(0);},30);
  `;
  const child=spawnSync(process.execPath,['--input-type=module','-e',code],{timeout:1000,encoding:'utf8',maxBuffer:100000});
  assert.equal(child.error?.code,undefined,'UI timer starved: '+child.error?.code);
  assert.equal(child.status,0,child.stderr);
  const result=JSON.parse(child.stdout.trim());
  assert.equal(result.timer,true);
  assert.ok(result.attempts<=6,'no immediate re-admission loop: '+JSON.stringify(result));
});

test('late rejected load after clear cannot redraw a replacement scene', async () => {
  let reject;
  const cache={ensure:()=>({key:'old',image:{},promise:new Promise((_,r)=>{reject=r;})}),release(){},purge(){}};
  const f=fixture(cache);f.image('assets/characters/a/idle.webp',spec);f.clear();
  reject(new Error('old failed'));await flush();assert.equal(f.draws,0);
});

test('padded atlases reserve their stride grid and battle-runtime atlases are budgeted', () => {
  const f=fixture({purge(){}});
  const padded=f.context.campaignPackFor('assets/characters/thay-mo/idle.png',
    {cols:12,frames:96,cellW:235,cellH:264,strideW:241,strideH:270,pad:3});
  assert.equal(padded.decodedBytes,12*241*8*270*4);
  assert.equal(f.context.campaignPackFor('assets/battle-runtime/embedded-12.png',spec)?.decodedBytes,24);
});
