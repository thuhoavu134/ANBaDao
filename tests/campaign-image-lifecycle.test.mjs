import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignSceneImageOwner } from '../src/ui/campaign-resource-lifecycle.mjs';
import { createCampaignResourcePackCache } from '../src/assets/campaign-resource-pack-cache.mjs';
import { patchCampaignResourceLifecycle } from '../scripts/campaign-resource-lifecycle-v1.mjs';
import { readFileSync } from 'node:fs';
const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};

function setup({budget=144,fail=false}={}) {
  let clock=0,serial=0,creates=0,draws=0,enabled=true,registrations=0;
  const frames=new Map(),timers=new Map(),images=new Map();
  const cache=createCampaignResourcePackCache({maxDecodedBytes:budget,maxLoading:1,clearDelayMs:10000,
    makeImage:()=>{creates++;return {complete:false,naturalWidth:0,removeAttribute(){}};},
    load:async(p,image)=>{if(fail)throw new Error('network');image.complete=true;image.naturalWidth=1;return {image,decodedBytes:p.decodedBytes};}});
  const cleanup=new Set(),scope={add(fn){registrations++;cleanup.add(fn);return()=>{if(!cleanup.delete(fn))return false;fn();return true;};}};
  const owner=createCampaignSceneImageOwner({images,cache,packFor:(src,s)=>s?{heroId:src,clip:'idle',tier:'test',src,decodedBytes:s.bytes}:null,
    makeImage:()=>({complete:false,naturalWidth:0,removeAttribute(){}}),getScope:()=>scope,now:()=>clock,active:()=>enabled,
    draw:()=>{draws++;},scheduleFrame:fn=>{const id=++serial;frames.set(id,fn);return id;},cancelFrame:id=>frames.delete(id),
    setTimer:(fn,ms)=>{const id=++serial;timers.set(id,{fn,due:clock+ms});return id;},clearTimer:id=>timers.delete(id)});
  return {owner,cache,images,frames,timers,cleanup,setFail:v=>fail=v,setActive:v=>enabled=v,advance:ms=>clock+=ms,
    frame(srcs){owner.beginFrame();for(const src of srcs)owner.image(src,{bytes:24});owner.endFrame();},
    get creates(){return creates;},get draws(){return draws;},get registrations(){return registrations;}};
}

test('six completion notifications coalesce to one redraw',async()=>{const f=setup();f.frame(['a','b','c','d','e','f']);await flush();assert.equal(f.creates,6);assert.equal(f.frames.size,1);f.owner.clear();});
test('budget failure is not retried per paint/microtask',async()=>{const f=setup({budget:24});f.frame(['a','b']);await flush();const n=f.creates;for(let i=0;i<120;i++){f.frame(['a','b']);await flush();}assert.equal(f.creates,n);assert.equal(f.timers.size,1);f.owner.clear();});
test('network failure retries after backoff and recovers',async()=>{const f=setup({fail:true});f.frame(['a']);await flush();assert.equal(f.images.get('a').failed,true);f.advance(1001);f.setFail(false);f.frame(['a']);await flush();assert.equal(f.images.get('a').handle.state,'ready');f.owner.clear();});
test('one scene cleanup registration survives repeated failed loads',async()=>{const f=setup({fail:true});for(let i=0;i<12;i++){f.advance(9000);f.frame(['a']);await flush();}assert.equal(f.registrations,1);assert.equal(f.cleanup.size,1);f.owner.clear();assert.equal(f.cleanup.size,0);});
test('expired pose ownership becomes evictable',async()=>{const f=setup({budget:48});f.frame(['idle','run']);await flush();f.frame(['idle']);assert.equal(f.cache.inspect().entries.find(e=>e.key.startsWith('run:')).owners,0);f.frame(['idle','attack']);await flush();assert.equal(f.images.get('attack').handle.state,'ready');assert.equal(f.cache.inspect().entries.some(e=>e.key.startsWith('run:')),false);f.owner.clear();});
test('inactive campaign starts no image work and exit clears resources',async()=>{const f=setup({budget:24});f.setActive(false);f.frame(['a','b']);assert.equal(f.creates,0);f.setActive(true);f.frame(['a','b']);await flush();f.owner.clear();assert.equal(f.images.size,0);assert.equal(f.cache.inspect().bytes,0);assert.equal(f.cache.inspect().reservedBytes,0);});
test('patch is idempotent and removes eager attack preload',()=>{const original=readFileSync(new URL('../src/ui/campaign-scene.js',import.meta.url),'utf8');const once=patchCampaignResourceLifecycle(original);assert.equal(patchCampaignResourceLifecycle(once),once);assert.match(once,/sceneImageOwner\.beginFrame\(\)/);assert.doesNotMatch(once,/imageForScene\(farmAttackSpecs\[actor\.id\]\.src\);/);});
