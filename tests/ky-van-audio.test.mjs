import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setImmediate as flush} from 'node:timers/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const meta=JSON.parse(readFileSync(new URL('assets/characters/ky-van/runtime-meta.json',root)));
const actorRuntime=readFileSync(new URL('src/runtime/ky-van.js',root),'utf8');
const audioRuntime=readFileSync(new URL('src/ui/audio-sfx-runtime.js',root),'utf8');

// Inspect the shipped M4A container without requiring ffmpeg in the test runner.
// Decoding/listening remains a device concern; this checks actual AAC payloads
// and baked durations, rather than accepting a matching filename as evidence.
function audioContainer(bytes){
 function boxes(start=0,end=bytes.length){
  const result=[];
  for(let at=start;at<end;){
   assert.ok(at+8<=end,'complete MP4 atom header');
   let size=bytes.readUInt32BE(at),header=8;
   if(size===1){assert.ok(at+16<=end);size=Number(bytes.readBigUInt64BE(at+8));header=16;}
   if(size===0)size=end-at;
   assert.ok(size>=header&&at+size<=end,'complete MP4 atom payload');
   result.push({type:bytes.toString('ascii',at+4,at+8),start:at+header,end:at+size});at+=size;
  }
  return result;
 }
 const child=(parent,type)=>{const box=boxes(parent?.start,parent?.end).find(b=>b.type===type);assert.ok(box,`M4A contains ${type}`);return box;};
 child(null,'ftyp');
 const moov=child(null,'moov'),mvhd=child(moov,'mvhd'),p=mvhd.start,version=bytes[p];
 assert.ok(version===0||version===1);
 const timescale=bytes.readUInt32BE(p+(version===1?20:12));
 const duration=version===1?Number(bytes.readBigUInt64BE(p+24)):bytes.readUInt32BE(p+16);
 assert.ok(timescale>0);
 const audioTracks=boxes(moov.start,moov.end).filter(b=>b.type==='trak').filter(trak=>{
  const mdia=child(trak,'mdia'),hdlr=child(mdia,'hdlr');
  if(bytes.toString('ascii',hdlr.start+8,hdlr.start+12)!=='soun')return false;
  const stsd=child(child(child(mdia,'minf'),'stbl'),'stsd');
  assert.ok(boxes(stsd.start+8,stsd.end).some(b=>b.type==='mp4a'),'audio track uses AAC');
  return true;
 });
 assert.equal(audioTracks.length,1,'one baked audio track');
 const mdat=child(null,'mdat');assert.ok(mdat.end-mdat.start>1000,'nonempty encoded sound');
 return {durationMs:duration*1000/timescale};
}

function harness({speed=1,sound=true,skip=false,holdDecode=false}={}){
 let now=100,skipping=skip,releases=0,acquires=0,releaseDecode,notifyDecode;
 const decoding=new Promise(resolve=>{notifyDecode=resolve;});
 const requests=[],decoded=[],sources=[],gains=[],draws=[];
 const audioContext={state:'running',currentTime:0,destination:{},
  async decodeAudioData(bytes){
   decoded.push(Buffer.from(bytes));notifyDecode();
   if(holdDecode)await new Promise(resolve=>{releaseDecode=resolve;});
   return {duration:audioContainer(Buffer.from(bytes)).durationMs/1000};
  },
  createBufferSource(){
   const source={playbackRate:{value:1},connect(){},disconnect(){},started:0,stopped:0,
    start(){this.started++;},stop(){this.stopped++;}};
   sources.push(source);return source;
  },
  createGain(){const gain={gain:{value:1},connect(){},disconnect(){}};gains.push(gain);return gain;}
 };
 const window={__HV_EARLY_CTX:audioContext,addEventListener(){}};window.parent=window;
 const actor={id:'ky',sourceId:'hero_splus_ky_van',team:'player',hp:100,x:200,y:400,state:'idle'};
 const targets=Array.from({length:6},(_,slot)=>({id:'enemy-'+slot,team:'enemy',hp:100,x:600+slot*10,y:400,slot}));
 const state={battleId:1,speed,sound};
 const c=vm.createContext({window,document:{baseURI:'https://battle.test/battle.html',documentElement:{dataset:{}},addEventListener(){}},
  URL,AbortController,setTimeout,clearTimeout,console,performance:{now:()=>now,timeOrigin:0},
  async fetch(url){
   const pathname=new URL(url).pathname.slice(1),bytes=readFileSync(new URL(pathname,root));
   requests.push({url,bytes});
   return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  },
  KY_VAN_META:meta,state,units:[actor,...targets],__hvIsSkipping:()=>skipping,__hvSkipVisualAssets:fn=>fn(),
  battleCharacterBody:u=>({height:100,centerX:u.x,centerY:u.y-50,footY:u.y}),
  BACH_DIEN_LOADER:{acquire:async()=>{acquires++;return {release:()=>releases++};},ensure:clip=>({image:{src:clip.src,complete:true,naturalWidth:2000}})}
 });
 vm.runInContext(audioRuntime,c,{filename:'audio-sfx-runtime.js'});
 vm.runInContext(actorRuntime,c,{filename:'ky-van.js'});
 const ctx={save(){},restore(){},drawImage(...args){draws.push(args);}};
 return {c,state,actor,targets,window,requests,decoded,sources,gains,draws,ctx,decoding,
  setTime:value=>{now=value;},setSkipping:value=>{skipping=value;},releaseDecode:()=>releaseDecode(),
  releases:()=>releases,acquires:()=>acquires};
}

for(const speed of [1,2,3])test(`Ultimate x${speed} uses one real mapped AAC mix for all three lightning waves`,async()=>{
 const h=harness({speed}),path=`assets/audio/sfx/ky-van/ultimate-x${speed}.m4a`;
 const bytes=readFileSync(new URL(path,root)),container=audioContainer(bytes);
 assert.ok(Math.abs(container.durationMs-meta.clips.ultimate.durationMs/speed)<25,'baked mix ends with the captured action clock');
 const info=await h.c.beginKyVanAction(h.actor,'ultimate',h.targets[0],1);await flush();
 assert.ok(info);assert.equal(info.speed,speed);
 assert.equal(h.actor.stateDuration,meta.clips.ultimate.durationMs/speed);
 assert.equal(h.requests.length,1,'prepare and play share one fetch');
 assert.equal(new URL(h.requests[0].url).pathname,'/'+path,'production registry selects the matching baked speed');
 assert.equal(h.decoded.length,1);assert.deepEqual(h.decoded[0],bytes,'decoder receives the committed audio bytes');
 assert.equal(h.sources.length,1);assert.equal(h.sources[0].started,1);
 assert.equal(h.sources[0].playbackRate.value,1,'baked speed is not applied a second time');
 assert.equal(h.gains[0].gain.value,.38);
 const timing=h.window.HonVietSfx.timingEvents();assert.equal(timing.length,1);
 assert.equal(timing[0].event,`ky-van-ultimate-x${speed}`);
 h.state.speed=speed===3?1:3;
 for(const age of [1900,2400,3150]){
  h.setTime(info.startedAt+age/speed);
  assert.ok(Math.abs(h.c.kyVanElapsed(info)-age)<1e-8,'speed changes do not shift an active cast');
  const before=h.draws.length;
  h.c.drawKyVanFx(h.ctx);
  assert.ok(h.draws.length>before,`wave at ${age}ms renders`);
 }
 assert.equal(h.sources.length,1,'drawing multiple bolts and targets never creates more audio voices');
 h.c.cancelKyVanActions();
 assert.equal(info.abort.signal.aborted,true);assert.equal(h.sources[0].stopped,1);
 assert.equal(h.releases(),1);assert.equal(h.actor._kyVanAction,undefined);
 assert.equal(h.window.HonVietSfx.timingEvents()[0].cancelReason,'signal-abort');
});

test('Ultimate awaits the real bus decode before starting its cast and mix',async()=>{
 const h=harness({holdDecode:true});
 const pending=h.c.beginKyVanAction(h.actor,'ultimate',h.targets[0],1);
 await h.decoding;
 assert.equal(h.actor.state,'idle');assert.equal(h.actor._kyVanAction,undefined);assert.equal(h.sources.length,0);
 h.setTime(800);h.releaseDecode();
 const info=await pending;await flush();
 assert.equal(info.startedAt,800);assert.equal(h.actor.stateStarted,800);
 assert.equal(h.decoded.length,1);assert.equal(h.sources.length,1);assert.equal(h.sources[0].started,1);
 h.c.finishKyVanAction(info);
});

test('muted Ultimate prepares its mix without creating an audio voice',async()=>{
 const h=harness({sound:false}),info=await h.c.beginKyVanAction(h.actor,'ultimate',h.targets[0],1);await flush();
 assert.ok(info);assert.equal(h.requests.length,1);assert.equal(h.decoded.length,1);assert.equal(h.sources.length,0);
 assert.equal(h.window.HonVietSfx.timingEvents().length,0);
 h.c.finishKyVanAction(info);
});

test('skipped Ultimate avoids audio assets; skipping an active cast ends its one voice',async()=>{
 const skipped=harness({skip:true}),info=await skipped.c.beginKyVanAction(skipped.actor,'ultimate',skipped.targets[0],1);await flush();
 assert.ok(info);assert.equal(skipped.acquires(),0);assert.equal(skipped.requests.length,0);assert.equal(skipped.sources.length,0);
 skipped.c.finishKyVanAction(info);
 const active=harness(),playing=await active.c.beginKyVanAction(active.actor,'ultimate',active.targets[0],1);await flush();
 active.setSkipping(true);
 assert.equal(await active.c.waitKyVanMarker(playing,'recovery:end',1),true);
 active.c.finishKyVanAction(playing);
 assert.equal(active.sources.length,1);assert.equal(active.sources[0].stopped,1);assert.equal(playing.abort.signal.aborted,true);
});
