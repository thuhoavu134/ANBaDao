import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('src/ui/audio-sfx-runtime.js',root),'utf8');
for(const speed of [1,2,3])// Owner 2026-10-26: mọi tiếng giữ cao độ & tốc độ gốc; tốc độ trận chỉ ảnh hưởng nhịp gọi play(), không tua tiếng.
test(`shared Cổ Nương bus decodes once, keeps original pitch at x${speed}, cancels and respects mute`,async()=>{
 const sources=[],requests=[];const ctx={state:'running',currentTime:0,destination:{},decodeAudioData:async bytes=>{const b=Buffer.from(bytes);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');return {duration:1};},createBufferSource(){const s={playbackRate:{value:1},connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(s);return s;},createGain:()=>({gain:{value:1},connect(){},disconnect(){}})};
 const window={__HV_EARLY_CTX:ctx,addEventListener(){}};window.parent=window;
 const c=vm.createContext({window,document:{baseURI:'https://battle.test/battle.html',documentElement:{dataset:{}},addEventListener(){}},URL,AbortController,setTimeout,clearTimeout,console,performance:{now:()=>100,timeOrigin:0},fetch:async url=>{const path=new URL(url).pathname.slice(1);requests.push(path);const bytes=readFileSync(new URL(path,root));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}});
 vm.runInContext(source,c);const bus=window.HonVietSfx,abort=new AbortController();
 assert.equal(await bus.prepare('co-nuong-ultimate'),true);assert.equal(await bus.play('co-nuong-ultimate',{playbackRate:speed,signal:abort.signal}),true);
 assert.equal(requests.length,1);assert.equal(requests[0],'assets/audio/sfx/co-nuong/tm_bylh_f.wav');assert.equal(sources[0].playbackRate.value,1,'không được tua tiếng theo tốc độ trận');assert.equal(sources[0].started,true);
 abort.abort();assert.equal(sources[0].stopped,true);bus.setCombatEnabled(false);assert.equal(await bus.play('co-nuong-atk'),false);assert.equal(sources.length,1);
 bus.setCombatEnabled(true);assert.equal(await bus.prepare('co-nuong-pierce'),true);
 for(let i=0;i<12;i++)assert.equal(await bus.play('co-nuong-pierce',{playbackRate:speed}),true,'pierce cooldown must not swallow close crossings');
 assert.equal(sources.length,13);assert.ok(sources.slice(1).every(s=>s.started&&s.playbackRate.value===1));
});
