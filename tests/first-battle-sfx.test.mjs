import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/ui/audio-sfx-runtime.js',import.meta.url),'utf8');
function fixture(timestamp){
 const starts=[],samples=new Float32Array(1000).fill(.2);
 const context={state:'running',currentTime:1,destination:{},getOutputTimestamp:()=>timestamp,decodeAudioData:async()=>({duration:1,numberOfChannels:1,sampleRate:1000,getChannelData:()=>samples}),createGain:()=>({gain:{},connect(){},disconnect(){}}),createBufferSource:()=>({connect(){},disconnect(){},start(t){starts.push(t)},stop(){}})};
 const window={HonVietAudio:{context:()=>context},addEventListener(){}};window.parent=window;
 vm.runInNewContext(source,{window,document:{baseURI:'https://game.example/',documentElement:{dataset:{}},addEventListener(){}},URL,console,Date,performance:{now:()=>10000},setTimeout,clearTimeout,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})});
 return {bus:window.HonVietSfx,starts};
}
for(const timestamp of [{contextTime:0,performanceTime:0},{contextTime:.1,performanceTime:2000}]){
 test('cold or stale output clock cannot push the first SFX past its action: '+JSON.stringify(timestamp),async()=>{
  const f=fixture(timestamp);await f.bus.prepare('basic');await f.bus.play('basic',{cuePerformanceMs:10500,actionId:'first'});
  assert.ok(f.starts[0]>=1&&f.starts[0]<1.6,'cue 500ms away must be scheduled within 600ms, got context time '+f.starts[0]);
 });
}
test('a fresh output clock still compensates real device output latency',async()=>{
 const f=fixture({contextTime:.98,performanceTime:9990});await f.bus.prepare('basic');await f.bus.play('basic',{cuePerformanceMs:10500});assert.ok(Math.abs(f.starts[0]-1.49)<.02);
});
