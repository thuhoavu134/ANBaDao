import test from 'node:test';
import assert from 'node:assert/strict';
import {createLegacyAuthoredReadiness} from '../src/combat-domain/legacy-authored-readiness.mjs';
function fixture(){
  let decoded,releaseCount=0;const calls=[];
  const image={src:'real-atlas.png',complete:false,naturalWidth:0,decode:()=>new Promise(resolve=>{decoded=()=>{image.complete=true;image.naturalWidth=100;resolve();};})};
  const gate=createLegacyAuthoredReadiness({cache:{retain:(keys,bytes)=>{calls.push({keys,bytes});return ()=>releaseCount++;}},describe:()=>[{key:'hero:cast',bytes:800,image:()=>image}],sound:()=>({}),enabled:()=>false});
  return {gate,calls,decode:()=>decoded(),released:()=>releaseCount};
}
test('legacy cast waits for decoded original bytes and holds its cache lease through recovery',async()=>{
  const f=fixture();let ready=false;const pending=f.gate.prepare({},'basic',new AbortController().signal).then(lease=>{ready=true;return lease;});
  await Promise.resolve();assert.equal(ready,false);assert.deepEqual(f.calls,[{keys:['hero:cast'],bytes:800}]);
  f.decode();const lease=await pending;assert.equal(f.released(),0);lease.release();lease.release();assert.equal(f.released(),1);
});
test('cancelled legacy preparation cannot start the action and releases its pins',async()=>{
  const f=fixture(),abort=new AbortController();const p=f.gate.prepare({},'ultimate',abort.signal);abort.abort();await assert.rejects(p,{name:'AbortError'});assert.equal(f.released(),1);
});

test('RED: legacy audio is decoded before the action clock even when the owner has no atlas lease',async()=>{
  const prepared=[];
  const gate=createLegacyAuthoredReadiness({
    cache:{retain:()=>()=>{}},
    describe:()=>null,
    sound:()=>({prepare:async(event)=>{prepared.push(event);return true;}}),
    enabled:()=>true
  });
  const lease=await gate.prepare({},'skill',new AbortController().signal);
  assert.deepEqual(prepared,['skill']);
  lease.release();
});
