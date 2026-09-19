import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleAssetReadiness } from '../src/combat-domain/battle-asset-readiness.mjs';
const defer = () => { let resolve, reject; const promise = new Promise((a,b)=>{resolve=a;reject=b;}); return { promise,resolve,reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const state = { battleId: 1, mode: 'battle', currentId: 'a', sound: true };
  const actor = { id:'a',hp:100,hero:'linh-dong' }, target={id:'b',hp:100,hero:'bach-dien'};
  const gate = defer(), calls=[], pins=new Map(); let releases=0;
  const loader = {
    cache:{unpin:(src,pin)=>{ if(pins.get(src)===pin)pins.delete(src); }},
    ensure:(clip,opts)=>{ if(opts.pin)pins.set(clip.src,opts.pin); return {state:'ready',image:{complete:true}}; },
    acquire:async(clips,opts)=>{
      calls.push({clips,opts});
      await Promise.race([gate.promise,new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error('cancelled'),{name:'AbortError'})),{once:true}))]);
      return {release:()=>{releases++;}};
    }
  };
  const audio=defer(); let soundCalls=0;
  const bus={prepare:async()=>true,play:()=>{soundCalls++;return audio.promise;}};
  const api=createBattleAssetReadiness({getState:()=>state,getUnits:()=>[actor,target],sound:()=>bus,
    describe:u=>({hero:u.hero,loader,clip:key=>({src:u.hero+'/'+key}),sfx:a=>u.hero+(a==='ultimate'?'-ult':'-atk')})});
  return {api,state,actor,target,loader,gate,audio,calls,pins,bus,get releases(){return releases;},get soundCalls(){return soundCalls;}};
}
test('action readiness waits for pictures and includes visible idle, run, cast and VFX',async()=>{
  const f=setup();let done=false;
  const p=f.api.prepare(f.actor,'basic',f.target,1).then(x=>{done=true;return x;});
  await tick();assert.equal(done,false);
  assert.deepEqual(f.calls[0].clips.map(c=>c.src),['linh-dong/idle','bach-dien/idle','linh-dong/run','linh-dong/attack','linh-dong/atkVfx']);
  f.gate.resolve();const lease=await p;assert.equal(done,true);assert.equal(lease.active(),true);
  assert.equal(f.releases,0);lease.release();lease.release();assert.equal(f.releases,1);f.api.dispose();
});
test('changing battle while loading cancels the old action',async()=>{
  const f=setup();const p=f.api.prepare(f.actor,'ultimate',f.target,1);f.state.battleId=2;
  await assert.rejects(p,e=>e.name==='AbortError');assert.ok(f.api.events().some(e=>e.type==='assets:cancelled'));f.api.dispose();
});
test('image failure rejects readiness rather than running an invisible action',async()=>{
  const f=setup();const p=f.api.prepare(f.actor,'basic',f.target,1);f.gate.reject(new Error('network'));
  await assert.rejects(p,/network/);assert.ok(f.api.events().some(e=>e.type==='assets:failed'));f.api.dispose();
});
test('muting does not wait for audio preparation',async()=>{
  const f=setup();f.state.sound=false;let prepared=0;f.bus.prepare=()=>{prepared++;return new Promise(()=>{});};
  f.gate.resolve();const lease=await f.api.prepare(f.actor,'basic',f.target,1);assert.equal(prepared,0);lease.release();f.api.dispose();
});
test('SFX success is not marked until asynchronous playback confirms it',async()=>{
  const f=setup();const info={battleId:1};const p=f.api.playSfx(info,'linh-dong-atk');
  assert.notEqual(info.sfxPlayed,true);assert.equal(f.soundCalls,1);assert.equal(f.api.playSfx(info,'linh-dong-atk'),p);
  f.audio.resolve(true);assert.equal(await p,true);assert.equal(info.sfxPlayed,true);f.api.dispose();
});
test('declined sound is not marked played and permits a live-action retry',async()=>{
  const f=setup();const info={battleId:1};const p=f.api.playSfx(info,'x');f.audio.resolve(false);
  assert.equal(await p,false);assert.equal(info.sfxPlayed,false);f.bus.play=async()=>true;
  assert.equal(await f.api.playSfx(info,'x'),true);f.api.dispose();
});
test('late sound cannot mark success in a new battle or after completion/cancellation',async()=>{
  for(const mode of ['battle','finish','abort']){
    const f=setup(),controller=new AbortController(),info={battleId:1,assetSignal:controller.signal};
    const p=f.api.playSfx(info,'x');if(mode==='battle')f.state.battleId=2;if(mode==='finish')info.finished=true;if(mode==='abort')controller.abort();
    f.audio.resolve(true);assert.equal(await p,false);assert.equal(info.sfxPlayed,false);f.api.dispose();
  }
});
test('idle fallback retains one pin and releases it on teardown',()=>{
  const f=setup();const clip={src:'idle'};f.api.image(f.loader,clip,'idle');const pin=f.pins.get('idle');
  f.api.image(f.loader,clip,'idle');assert.equal(f.pins.get('idle'),pin);f.api.dispose();assert.equal(f.pins.size,0);
});
test('audio exceptions are observed rather than unhandled or reported successful',async()=>{
  const f=setup(),info={battleId:1};f.bus.play=()=>{throw new Error('audio offline');};
  assert.equal(await f.api.playSfx(info,'x'),false);assert.notEqual(info.sfxPlayed,true);f.api.dispose();
});
