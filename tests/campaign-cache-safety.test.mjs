import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignResourcePackCache } from '../src/assets/campaign-resource-pack-cache.mjs';

const pack=(src, bytes)=>({heroId:src,clip:'idle',tier:'campaign',src,decodedBytes:bytes});

test('campaign cache reserves decoded bytes before concurrent decode begins', async()=>{
 const pending=[];
 const cache=createCampaignResourcePackCache({maxDecodedBytes:100,maxLoading:2,makeImage:()=>({}),load:(p,img)=>new Promise(r=>pending.push(()=>r({image:img,decodedBytes:p.decodedBytes})))});
 const a=cache.ensure(pack('a',60),'scene:a');
 const b=cache.ensure(pack('b',60),'scene:b');
 await Promise.resolve();
 const state=cache.inspect();
 assert.equal(state.loading,1);
 assert.equal(state.queued,1);
 assert.equal(state.reservedBytes,60);
 pending.shift()(); await a.promise;
 await assert.rejects(b.promise,/budget/);
});

test('purge of pending loader settles promise once without negative loading', async()=>{
 let settle;
 const cache=createCampaignResourcePackCache({maxDecodedBytes:100,maxLoading:1,makeImage:()=>({}),load:()=>new Promise(r=>{settle=r})});
 const h=cache.ensure(pack('a',60),'scene:a');
 await Promise.resolve();
 cache.purge();
 settle({image:{},decodedBytes:60});
 await assert.rejects(h.promise,/purged|cancelled/);
 const state=cache.inspect();
 assert.equal(state.loading,0);
 assert.equal(state.entries.length,0);
});
