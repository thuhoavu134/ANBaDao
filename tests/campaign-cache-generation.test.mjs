import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignResourcePackCache } from '../src/assets/campaign-resource-pack-cache.mjs';
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
const pack=(src,bytes=60)=>({heroId:src,clip:'idle',tier:'campaign',src,decodedBytes:bytes});

test('late old decode after purge cannot subtract a new scene reservation',async()=>{
  const pending=[];
  const cache=createCampaignResourcePackCache({maxDecodedBytes:100,maxLoading:1,makeImage:()=>({}),
    load:(p,image)=>new Promise(resolve=>pending.push(()=>resolve({image,decodedBytes:p.decodedBytes})))});
  const old=cache.ensure(pack('old'));await flush();cache.purge();await assert.rejects(old.promise);
  cache.ensure(pack('new'));await flush();assert.equal(cache.inspect().reservedBytes,60);
  pending[0]();await flush();assert.equal(cache.inspect().reservedBytes,60);
  pending[1]();await flush();assert.equal(cache.inspect().bytes,60);cache.purge();
});

test('invalid decode frees its loading slot and queued hero proceeds',async()=>{
  const cache=createCampaignResourcePackCache({maxDecodedBytes:100,maxLoading:1,makeImage:()=>({}),
    load:async(p,image)=>({image,decodedBytes:p.src==='bad'?101:p.decodedBytes})});
  const bad=cache.ensure(pack('bad')),next=cache.ensure(pack('next'));
  await assert.rejects(bad.promise,/exceeded/);await flush();
  assert.equal(next.state,'ready');assert.equal(cache.inspect().loading,0);cache.purge();
});

test('purge before scheduled load prevents stale request from starting',async()=>{
  let starts=0;
  const cache=createCampaignResourcePackCache({maxDecodedBytes:100,maxLoading:1,
    load:async()=>{starts++;return {image:{},decodedBytes:60};}});
  const old=cache.ensure(pack('old'));cache.purge();await assert.rejects(old.promise);await flush();
  assert.equal(starts,0);assert.equal(cache.inspect().loading,0);
});
