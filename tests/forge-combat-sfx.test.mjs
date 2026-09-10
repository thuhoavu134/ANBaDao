import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function bus(parent) {
  const fetched = [], started = [];
  const context = { state:'running', destination:{}, decodeAudioData:async bytes=>bytes,
    createGain:()=>({gain:{},connect(){},disconnect(){}}),
    createBufferSource:()=>({connect(){},disconnect(){},start(){started.push(this.buffer);},stop(){}}) };
  const window = {HonVietAudio:{context:()=>context},addEventListener(){}};
  window.parent = parent || window;
  vm.runInNewContext(read('src/ui/audio-sfx-runtime.js'), {window,URL,console,performance:{now:()=>100},
    document:{baseURI:'https://game.test/',documentElement:{dataset:{}},addEventListener(){},querySelectorAll:()=>[]},
    fetch:async url=>{fetched.push(url);return {ok:true,arrayBuffer:async()=>url};}});
  return {window,api:window.HonVietSfx,fetched,started};
}
test('SFX-1 legacy impact cannot play the forge sound in standalone battle', async()=>{
  const b=bus(); assert.equal(await b.api.play('impact'),false); assert.equal(b.started.length,0);
});
test('SFX-1 battle channel rejects forge sound even with UI group override; casts still play',async()=>{
  const b=bus(), child=bus(b.window);
  for(const event of ['forge-reveal','impact']) assert.equal(await child.api.play(event,{group:'ui'}),false);
  for(const event of ['basic','skill','ultimate','victory','defeat']) assert.equal(await child.api.play(event),true);
  assert.ok(b.started.every(url=>!url.endsWith('400500_se_s1_beaten.wav')));
});
test('SFX-2 shell forge event plays original sound only with explicit UI group',async()=>{
  const b=bus(); assert.equal(await b.api.play('forge-reveal'),false);
  assert.equal(await b.api.play('forge-reveal',{group:'ui'}),true);
  assert.equal(b.started.length,1); assert.ok(b.started[0].endsWith('400500_se_s1_beaten.wav'));
});
test('SFX-2 actual forge reveal dispatches dedicated event once per item UID',()=>{
  const calls=[], ST={}; const source=read('src/ui/forge-item-assets-runtime.js');
  const start=source.indexOf('function hvForgeReveal('),end=source.indexOf('\nconst hvCraftItemWithReveal',start);
  const sandbox={ST,window:{HonVietSfx:{play:(...args)=>calls.push(args)}}};vm.createContext(sandbox);
  vm.runInContext(source.slice(start,end)+'\nhvForgeReveal({uid:"one"});hvForgeReveal({uid:"one"});',sandbox);
  assert.equal(calls.length,1);assert.equal(calls[0][0],'forge-reveal');assert.equal(calls[0][1].group,'ui');
});
test('SFX-3 build owner removes shared impact dispatch without replacing VFX or damage',()=>{
  const patch=read('scripts/runtime-mobile-render-sfx-v1.mjs');
  assert.doesNotMatch(patch,/HonVietSfx\?\.play\(["']impact["']\)/);
  assert.match(patch,/tone\(critical \? 105 : 135/);
  assert.match(patch,/playActionSound\(actor, action\)/);
});
