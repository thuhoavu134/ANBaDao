import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleAssetReadiness} from '../src/combat-domain/battle-asset-readiness.mjs';
import {createLegacyAuthoredReadiness} from '../src/combat-domain/legacy-authored-readiness.mjs';
// A real asynchronous cold decode exceeding the former 2s best-effort window.
function coldSound(){let decoded=false;return {decoded:()=>decoded,prepare:(_event,{timeoutMs})=>new Promise(resolve=>setTimeout(()=>{decoded=timeoutMs>=2150;resolve(decoded)},Math.min(timeoutMs,2150))) };}
test('first S+ action waits for its cold SFX before releasing the cast clock',async()=>{
 const bus=coldSound(),actor={id:'first',hp:10};
 const loader={ensure:()=>({state:'ready'}),acquire:async()=>({release(){}})};
 const owner=createBattleAssetReadiness({getState:()=>({battleId:1,mode:'battle',currentId:actor.id,sound:true}),getUnits:()=>[actor],describe:()=>({hero:'linh-dong',sfx:()=> 'linh-dong-atk',loader,clip:key=>({src:key})}),sound:()=>bus});
 const lease=await owner.prepare(actor,'basic',null,1);try{assert.equal(bus.decoded(),true,'cast was released before cold SFX decode');}finally{lease.release();owner.dispose();}
});
test('first legacy/generic action waits for cold SFX on the same pre-cast gate',async()=>{
 const bus=coldSound(),owner=createLegacyAuthoredReadiness({cache:{retain:()=>()=>{}},describe:()=>[],sound:()=>bus,enabled:()=>true});
 const lease=await owner.prepare({id:'first'},'basic');try{assert.equal(bus.decoded(),true,'cast was released before cold SFX decode');}finally{lease.release();}
});
