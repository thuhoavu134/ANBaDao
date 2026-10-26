import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync(new URL('../src/ui/audio-sfx-runtime.js',import.meta.url),'utf8');
const meta=JSON.parse(readFileSync(new URL('../assets/characters/hong-thuong/runtime-meta.json',import.meta.url),'utf8'));
function fixture(){const nodes=[],urls=[],samples=new Float32Array(1000);samples.fill(.1,100);const context={state:'running',currentTime:10,destination:{},decodeAudioData:async()=>({duration:1,numberOfChannels:1,sampleRate:1000,getChannelData:()=>samples}),createGain:()=>({gain:{},connect(){},disconnect(){}}),createBufferSource:()=>{const n={playbackRate:{value:1},connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};nodes.push(n);return n;}};const window={HonVietAudio:{context:()=>context},addEventListener(){}};window.parent=window;vm.runInNewContext(source,{window,URL,console,performance:{now:()=>1000},setTimeout,clearTimeout,document:{baseURI:'https://game.test/',documentElement:{dataset:{}},addEventListener(){},querySelectorAll:()=>[]},fetch:async url=>{urls.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}});return {api:window.HonVietSfx,nodes,urls};}
test('Hồng Thương cue đi qua bus dùng chung, speed scale đúng, mute chặn, abort dừng voice',async()=>{
 assert.ok(existsSync(new URL('../assets/audio/sfx/hong-thuong/impact.wav',import.meta.url)),'file SFX mẫu 22 trong assets');
 assert.equal(meta.sfx.cues['hong-thuong-impact'],'hong-thuong/impact.wav');
 const b=fixture(),abort=new AbortController();
 assert.equal(await b.api.play('hong-thuong-impact',{group:'combat',playbackRate:3,signal:abort.signal}),true);
 // Owner 2026-10-26: giữ cao độ gốc ở mọi tốc độ trận.
 assert.equal(b.nodes[0].playbackRate.value,1,'x3 scale playbackRate như Tịch Dao');
 assert.ok(b.urls[0].endsWith('/hong-thuong/impact.wav'));
 b.api.setCombatEnabled(false);
 assert.equal(await b.api.play('hong-thuong-impact'),false,'mute chặn dispatch');
 abort.abort();assert.equal(b.nodes[0].stopped,true,'abort dừng voice');
});
