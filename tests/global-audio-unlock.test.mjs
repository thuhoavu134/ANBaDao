import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../scripts/ios-audio-unlock-patch.mjs',import.meta.url),'utf8');
const manager=source.match(/const manager = String.raw`<script[^>]*>([\s\S]*?)<\/script>`;/)[1];
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({parent,blocked=false,holdResume=false,fetchAudio,audioSession}={}){
  const sources=[],contexts=[],listeners={},pending=[];
  let allowed=!blocked,gesture=false;
  class Context{
    state=blocked?'suspended':'running';currentTime=1;destination={};
    constructor(){contexts.push(this);}
    resume(){
      if(gesture||allowed){this.state='running';pending.splice(0).forEach(f=>f());return Promise.resolve();}
      if(holdResume)return new Promise(resolve=>pending.push(resolve));
      return Promise.reject(new Error('gesture required'));
    }
    createBuffer(){return {duration:0};}
    async decodeAudioData(){return {duration:3};}
    createBufferSource(){const s={context:this,connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(s);return s;}
    createGain(){return {gain:{value:1,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}},connect(){},disconnect(){}};}
  }
  const window={AudioContext:Context};window.parent=parent||window;
  const document={documentElement:{dataset:{}},visibilityState:'visible',addEventListener(t,f){listeners[t]=f;}};
  vm.runInNewContext(manager,{window,document,navigator:{audioSession},fetch:fetchAudio|| (async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})),console,setTimeout,clearTimeout});
  return {window,bus:window.HonVietAudio,contexts,sources,document,listeners,
    async gesture(){gesture=true;listeners.pointerdown?.();gesture=false;await tick();},
    allow(){allowed=true;}};
}

test('rejected resume never certifies an unlocked context',async()=>{
  const f=fixture({blocked:true});
  assert.equal(await f.bus.unlock(),false);
  assert.equal(f.bus.isUnlocked(),false);
  assert.notEqual(f.document.documentElement.dataset.audioUnlocked,'1');
  await f.gesture();assert.equal(f.bus.isUnlocked(),true);
});
test('first gesture can resume even when an earlier non-gesture resume is pending',async()=>{
  const f=fixture({blocked:true,holdResume:true});
  void f.bus.unlock();await tick();await f.gesture();
  assert.equal(f.bus.context().state,'running');
  assert.equal(f.bus.isUnlocked(),true);
});
test('latest requested screen starts after the first unlock without a second interaction',async()=>{
  const f=fixture({blocked:true});
  assert.equal(await f.bus.playMusic('hub.mp3'),false);
  assert.equal(await f.bus.playMusic('hero.mp3'),false);
  await f.gesture();await tick();
  assert.equal(f.bus.music()?.url,'hero.mp3');
  assert.equal(f.sources.filter(s=>s.started&&s.buffer?.duration===3).length,1);
  assert.equal(await f.bus.playMusic('campaign.mp3'),true);
  assert.equal(await f.bus.playMusic('combat.mp3'),true);
  assert.equal(await f.bus.playMusic('victory.mp3',{loop:false,category:'result'}),true);
});
test('new battle documents reuse the already unlocked host context without creating another one',async()=>{
  const host=fixture({blocked:true});await host.gesture();
  for(let i=0;i<3;i++){
    const child=fixture({parent:host.window,blocked:true});
    assert.equal(child.contexts.length,0);
    assert.equal(child.bus.context(),host.bus.context());
    assert.equal(child.window.__HV_EARLY_CTX,host.bus.context());
    assert.equal(child.bus.isUnlocked(),true);
  }
});
test('interrupted context recovers on foreground and music stays on the same owner',async()=>{
  const f=fixture();await f.bus.unlock();await f.bus.playMusic('hero.mp3');
  const c=f.bus.context();c.state='interrupted';
  assert.equal(f.bus.isUnlocked(),false);
  f.listeners.visibilitychange();await tick();
  assert.equal(c.state,'running');assert.equal(f.contexts.length,1);
  assert.equal(f.bus.music().url,'hero.mp3');
});
test('stopping music before unlock cancels the queued screen',async()=>{
  const f=fixture({blocked:true});await f.bus.playMusic('hub.mp3');f.bus.stopMusic();
  await f.gesture();await tick();assert.equal(f.bus.music(),null);
});

function routeFixture(options){
  const f=fixture(options),plays=[];
  const patch=readFileSync(new URL('../scripts/bgm-runtime-patch.mjs',import.meta.url),'utf8');
  const expression=patch.slice(patch.indexOf('const newPlay = ')+'const newPlay = '.length,patch.indexOf('\nif(!s.includes(oldPlay))')).replace(/;$/,'');
  const routed=vm.runInNewContext(expression);
  const player={volume:.34,pause(){},async play(){plays.push(this.src);}};
  const c=vm.createContext({window:f.window,bgmPlayer:player,bgmTrack:'',bgmUnlocked:false,
    BGM_TRACKS:{maincity:'hub.mp3',hero:'hero.mp3',challenge:'campaign.mp3',combat:'combat.mp3'},
    BGM_FALLBACKS:{maincity:'hub-fallback.mp3',hero:'hero-fallback.mp3',challenge:'campaign-fallback.mp3',combat:'combat-fallback.mp3'}});
  vm.runInContext(routed,c);return {...f,plays,c};
}
test('generated screen route does not start a newly gesture-gated HTML player after first unlock',async()=>{
  const f=routeFixture({blocked:true});await f.c.playBgm('maincity');await f.gesture();await tick();
  for(const key of ['hero','challenge','combat','maincity'])assert.equal(await f.c.playBgm(key),true,key);
  assert.equal(f.bus.music().url,'hub.mp3');assert.equal(f.plays.length,0);
});
test('profile mute is preserved by later screen changes and result returns to the requested route',async()=>{
  const f=routeFixture();await f.bus.unlock();f.c.bgmPlayer.volume=0;
  await f.c.playBgm('hero');assert.equal(f.bus.music().gain.gain.value,0);
  await f.bus.playMusic('victory.mp3',{loop:false,category:'result',volume:.9});
  await f.gesture();assert.equal(f.bus.music().url,'victory.mp3','gesture does not restart background music over result');
  await f.c.playBgm('challenge');assert.equal(f.bus.music().url,'campaign.mp3');assert.equal(f.bus.music().gain.gain.value,0);
});
test('old child lifecycle cannot stop the shared music or close the host context',async()=>{
  const host=fixture();await host.bus.unlock();await host.bus.playMusic('combat.mp3');
  const child=fixture({parent:host.window});child.bus.stopMusic();child.bus.stopCombat();
  assert.equal(host.bus.music().url,'combat.mp3');assert.equal(host.bus.context().state,'running');
});

test('a later gesture does not replay a completed result sting',async()=>{
  const f=fixture();await f.bus.unlock();await f.bus.playMusic('victory.mp3',{loop:false,category:'result'});
  f.bus.music().source.onended();const count=f.sources.filter(s=>s.started&&s.buffer?.duration===3).length;
  await f.gesture();assert.equal(f.bus.music(),null);
  assert.equal(f.sources.filter(s=>s.started&&s.buffer?.duration===3).length,count);
});

test('queued screen retains its fallback when the primary audio file cannot load',async()=>{
  const f=routeFixture({blocked:true,fetchAudio:async url=>({ok:url!=='hero.mp3',status:404,arrayBuffer:async()=>new ArrayBuffer(1)})});
  await f.c.playBgm('hero');await f.gesture();await tick();
  assert.equal(f.bus.music().url,'hero-fallback.mp3');assert.equal(f.plays.length,0);
});
test('unsupported Web Audio keeps the original media fallback usable',async()=>{
  const f=routeFixture();f.window.HonVietAudio=null;
  assert.equal(await f.c.playBgm('hero'),true);assert.deepEqual(f.plays,['hero.mp3']);
});


test('iOS playback routing is requested before playback and restored on gesture without a second context',async()=>{const session={type:'ambient'};const f=fixture({audioSession:session,blocked:true});assert.equal(session.type,'playback');session.type='ambient';await f.gesture();assert.equal(session.type,'playback');assert.equal(f.contexts.length,1);assert.equal(f.bus.isUnlocked(),true);});
test('unsupported or read-only AudioSession does not break normal unlock',async()=>{const session={set type(v){throw new Error('unsupported');}};const f=fixture({audioSession:session});assert.equal(await f.bus.unlock(),true);});
