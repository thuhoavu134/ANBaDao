import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../src/ui/audio-sfx-runtime.js',import.meta.url),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function fixture({pending,parent}={}) {
  const played=[],fetched=[],dataset={};let now=1000;
  const audio={state:'running',destination:{},decodeAudioData:async b=>({bytes:b,duration:1}),
    createGain:()=>({gain:{},connect(){},disconnect(){}}),
    createBufferSource:()=>({connect(){},disconnect(){},start(){played.push(this.buffer);},stop(){}})};
  const window={HonVietAudio:{context:()=>audio},addEventListener(){}};window.parent=parent?.window||window;
  vm.runInNewContext(source,{window,URL,console,Date:{now:()=>now},performance:{now:()=>now},setTimeout,clearTimeout,
    document:{baseURI:'https://game.example/',documentElement:{dataset},addEventListener(){},querySelectorAll:()=>[]},
    fetch:async url=>{fetched.push(url);return {ok:true,arrayBuffer:()=>pending?pending.promise:Promise.resolve(new ArrayBuffer(1))};}});
  return {window,bus:window.HonVietSfx,audio,played,fetched,dataset,advance:ms=>{now+=ms;}};
}
test('preparation decodes a real bus entry without playing it, then playback reuses that buffer',async()=>{
  const f=fixture();assert.equal(await f.bus.prepare('linh-dong-atk'),true);assert.equal(f.played.length,0);
  assert.equal(await f.bus.play('linh-dong-atk',{maxDelayMs:250}),true);assert.equal(f.played.length,1);assert.equal(f.fetched.length,1);
});
test('aborting during decode prevents starting a late sound',async()=>{
  const pending=deferred(),f=fixture({pending}),controller=new AbortController();
  const playback=f.bus.play('bach-dien-ult',{signal:controller.signal,maxDelayMs:250});controller.abort();pending.resolve(new ArrayBuffer(1));
  assert.equal(await playback,false);assert.equal(f.played.length,0);
});
test('a decoded sound arriving outside its marker deadline is discarded',async()=>{
  const pending=deferred(),f=fixture({pending});const playback=f.bus.play('linh-dong-atk',{maxDelayMs:250});
  f.advance(251);pending.resolve(new ArrayBuffer(1));assert.equal(await playback,false);assert.equal(f.played.length,0);assert.equal(f.dataset.sfxLastResult,'expired');
});
test('locked context cannot be reported as audible playback',async()=>{
  const f=fixture();f.audio.state='suspended';assert.equal(await f.bus.prepare('basic'),true);
  assert.equal(await f.bus.play('basic'),false);assert.equal(f.played.length,0);
});
test('child preparation uses the existing parent channel and never a second decoder',async()=>{
  const parent=fixture(),child=fixture({parent});assert.equal(await child.bus.prepare('bach-dien-atk'),true);
  assert.equal(child.fetched.length,0);assert.equal(parent.fetched.length,1);assert.equal(parent.played.length,0);
  parent.bus.endBattle();assert.equal(await child.bus.play('bach-dien-atk'),false);assert.equal(parent.played.length,0);
});
test('preparation timeout is bounded and does not convert into delayed playback',async()=>{
  const pending=deferred(),f=fixture({pending});assert.equal(await f.bus.prepare('basic',{timeoutMs:10}),false);
  pending.resolve(new ArrayBuffer(1));await Promise.resolve();assert.equal(f.played.length,0);
});
