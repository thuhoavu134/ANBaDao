import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const indexPath = join(out, 'index.html');
const battlePath = join(out, 'battle.html');

const manager = String.raw`<script id="honviet-ios-audio-unlock">
(()=>{
  if(window.HonVietAudio)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  let ctx=window.__HV_EARLY_CTX||null, unlocked=false, unlockPromise=null;
  try{
    if(!ctx&&AC)ctx=new AC();
    window.__HV_EARLY_CTX=ctx;
    if(ctx&&ctx.state==='suspended')ctx.resume();
    if(ctx){
      const b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource();
      s.buffer=b;s.connect(ctx.destination);s.start(0);
    }
  }catch(_e){}
  const buffers=new Map();
  const loads=new Map();
  const activeVoices=new Set();
  let combatEpoch=0,combatEnabled=true;
  function beginCombat(){combatEnabled=true;}
  function stopCombat(){
    combatEnabled=false;combatEpoch++;
    for(const voice of activeVoices)if(voice.combat){voice.stop();voice.cleanup();}
    document.documentElement.dataset.voiceCombatActive=String([...activeVoices].filter(v=>v.combat).length);
  }
  const voiceUrls=[
    'assets/audio/voice-luc-anh-hero.mp3',
    'assets/audio/voice-luc-anh-ultimate.mp3'
  ];
  function getCtx(){
    if(!ctx) ctx=window.__HV_EARLY_CTX||(AC?new AC():null);
    if(ctx) window.__HV_EARLY_CTX=ctx;
    return ctx;
  }
  async function decode(url){
    if(buffers.has(url))return buffers.get(url);
    if(loads.has(url))return loads.get(url);
    const c=getCtx();
    if(!c)throw new Error('AudioContext unavailable');
    const p=fetch(url,{cache:'force-cache'})
      .then(r=>{if(!r.ok)throw new Error('audio '+r.status);return r.arrayBuffer();})
      .then(b=>c.decodeAudioData(b))
      .then(buf=>{buffers.set(url,buf);loads.delete(url);return buf;})
      .catch(e=>{loads.delete(url);throw e;});
    loads.set(url,p);return p;
  }
  async function unlock(){
    if(unlocked){
      const c=getCtx();
      if(c&&c.state==='suspended')try{await c.resume();}catch(_e){}
      return true;
    }
    if(unlockPromise)return unlockPromise;
    unlockPromise=(async()=>{
      const c=getCtx();
      if(c){
        try{if(c.state==='suspended')await c.resume();}catch(_e){}
        try{
          const b=c.createBuffer(1,1,22050),s=c.createBufferSource();
          s.buffer=b;s.connect(c.destination);s.start(0);
        }catch(_e){}
      }
      // Unlock only Web Audio here. A pending muted play() on an app-owned
      // HTMLMediaElement can settle after its source changes to combat BGM,
      // then pause and rewind the live track. Each media owner starts its own
      // track synchronously from the user's interaction instead.
      unlocked=true;
      document.documentElement.dataset.audioUnlocked='1';
      voiceUrls.forEach(u=>decode(u).catch(()=>{}));
      return true;
    })().finally(()=>{unlockPromise=null;});
    return unlockPromise;
  }
  async function playVoice(url,gainValue=1){
    const combat=String(url).includes('voice-luc-anh-ultimate.mp3'),ticket=combatEpoch;
    const current=()=>!combat||(combatEnabled&&ticket===combatEpoch);
    if(!current())return false;
    await unlock();
    if(!current())return false;
    const c=getCtx();
    if(!c)return false;
    try{
      const buf=await decode(url);
      if(!current())return false;
      if(c.state==='suspended')await c.resume();
      if(!current())return false;
      const src=c.createBufferSource(),gain=c.createGain();
      src.buffer=buf;gain.gain.value=Math.max(0,Number(gainValue)||1);
      src.connect(gain);gain.connect(c.destination);
      const voice={combat,stop(){try{src.stop();}catch(_e){}},cleanup(){if(!activeVoices.delete(voice))return;src.disconnect();gain.disconnect();document.documentElement.dataset.voiceCombatActive=String([...activeVoices].filter(v=>v.combat).length);}};
      src.onended=voice.cleanup;activeVoices.add(voice);src.start(0);
      document.documentElement.dataset.voiceCombatActive=String([...activeVoices].filter(v=>v.combat).length);
      return true;
    }catch(_e){
      if(!current())return false;
      try{
        const a=new Audio(url);a.preload='auto';a.volume=1;
        const voice={combat,stop(){a.pause();a.currentTime=0;},cleanup(){activeVoices.delete(voice);}};
        a.onended=voice.cleanup;activeVoices.add(voice);
        try{await a.play();return current();}catch(_e2){voice.cleanup();return false;}
      }catch(_e2){return false;}
    }
  }
  let musicEpoch=0,musicCurrent=null,musicVolume=0.34;
  const clampVolume=value=>Math.max(0,Math.min(1,Number(value)||0));
  function setMusicVolume(value){
    musicVolume=clampVolume(value);
    const track=musicCurrent;
    if(track&&track.category==='bgm')try{track.gain.gain.value=musicVolume;}catch(_e){}
    return musicVolume;
  }
  function fadeTrack(track,fadeMs,now){
    if(!track)return;
    const seconds=Math.max(0,Number(fadeMs)||0)/1000;
    try{
      track.gain.gain.cancelScheduledValues?.(now);
      track.gain.gain.setValueAtTime?.(track.gain.gain.value,now);
      if(seconds)track.gain.gain.linearRampToValueAtTime?.(0,now+seconds);
      else track.gain.gain.value=0;
      track.source.stop(now+seconds+0.02);
    }catch(_e){try{track.source.stop();}catch(_e2){}}
  }
  async function playMusic(url,options={}){
    const src=String(url||'');
    if(!src)return false;
    const loop=options.loop!==false,category=options.category||'bgm';
    const volume=category==='bgm'?(options.volume==null?musicVolume:clampVolume(options.volume)):clampVolume(options.volume==null?1:options.volume);
    const fadeMs=Math.max(0,Math.min(1500,Number(options.fadeMs??260)||0));
    if(musicCurrent?.url===src&&musicCurrent.loop===loop){
      if(category==='bgm')setMusicVolume(volume);
      return true;
    }
    const ticket=++musicEpoch,c=getCtx();
    if(!c||!unlocked)return false;
    let buffer;
    try{buffer=await decode(src);}catch(_e){return false;}
    if(ticket!==musicEpoch||c.state!=='running')return false;
    const source=c.createBufferSource(),gain=c.createGain(),old=musicCurrent;
    const now=Number(c.currentTime)||0,seconds=fadeMs/1000;
    source.buffer=buffer;source.loop=loop;gain.gain.value=0;
    source.connect(gain);gain.connect(c.destination);
    try{
      gain.gain.setValueAtTime?.(0,now);
      if(seconds)gain.gain.linearRampToValueAtTime?.(volume,now+seconds);
      else gain.gain.value=volume;
    }catch(_e){gain.gain.value=volume;}
    const track={source,gain,url:src,loop,category,volume};
    source.onended=()=>{
      try{source.disconnect();gain.disconnect();}catch(_e){}
      if(musicCurrent===track)musicCurrent=null;
    };
    musicCurrent=track;
    try{source.start(0);}catch(_e){musicCurrent=old;return false;}
    if(old)fadeTrack(old,fadeMs,now);
    document.documentElement.dataset.musicTrack=src;
    document.documentElement.dataset.musicActive='1';
    return true;
  }
  function stopMusic(options={}){
    musicEpoch++;
    if(options.keepCurrent)return;
    const track=musicCurrent;if(!track)return;
    musicCurrent=null;
    fadeTrack(track,options.fadeMs??120,Number(getCtx()?.currentTime)||0);
    document.documentElement.dataset.musicActive='0';
    document.documentElement.dataset.musicTrack='';
  }
  const getMusic=()=>musicCurrent;
  window.HonVietAudio={unlock,playVoice,beginCombat,stopCombat,playMusic,stopMusic,setMusicVolume,music:getMusic,preload:(u)=>decode(u),isUnlocked:()=>unlocked,context:()=>getCtx()};

  // Keep unlocking on every gesture until the context is running. Full-page
  // battle.html on iOS often misses the original Xuất chiến tap.
  const firstGesture=()=>{
    // Start a direct-battle HTMLMediaElement synchronously in the gesture before awaiting AudioContext.resume().
    try{const p=window.__HV_BATTLE_BGM?.play?.();p?.catch?.(()=>{});}catch(_e){}
    unlock().then(()=>{
      try{window.__HV_BGM_RETRY?.();}catch(_e){}
      try{window.__HV_BATTLE_BGM?.play?.();}catch(_e){}
    }).catch(()=>{});
  };
  ['pointerdown','touchstart','touchend','click','keydown'].forEach(t=>
    document.addEventListener(t,firstGesture,{capture:true,passive:true})
  );

  // Resume again after iOS returns from background / tab switch.
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      const c=getCtx();
      if(c&&c.state==='suspended')c.resume().catch(()=>{});
      try{window.__HV_BATTLE_BGM?.play?.();}catch(_e){}
    }
  });
})();
</script>`;

let index = readFileSync(indexPath,'utf8');
if(!index.includes('honviet-ios-audio-unlock')){
  index=index.replace(/<head(\s[^>]*)?>/i,m=>m+'\n'+manager);
}
// Force Lục Ảnh hero-detail voice through the shared, already-unlocked parent audio bus.
index=index.replace(/function playLucAnhVoice\(src,vol=[^)]*\)\{[\s\S]*?\}\s*(?=function startLucAnhDetailIdle)/,
`function playLucAnhVoice(src,vol=1){
  try{
    if(window.HonVietAudio){window.HonVietAudio.playVoice(src,5).catch(()=>{});return;}
    const a=new Audio(src);a.preload='auto';a.volume=1;a.play().catch(()=>{});
  }catch(_e){}
}
`);
writeFileSync(indexPath,index);

let battle = readFileSync(battlePath,'utf8');
if(!battle.includes('honviet-ios-audio-unlock')){
  battle=battle.replace(/<head(\s[^>]*)?>/i,m=>m+'\n'+manager);
}
// Ultimate voice is played by the parent page AudioContext which was unlocked by the first real UI interaction.
battle=battle.replace(/function playLucAnhUltimateVoice\(\)\{[\s\S]*?\}\s*(?=function|async function|const |let |var )/,
`function playLucAnhUltimateVoice(){
  try{
    const bus=(window.parent&&window.parent!==window&&window.parent.HonVietAudio)?window.parent.HonVietAudio:window.HonVietAudio;
    if(bus){bus.playVoice(LUC_ANH_ULTI_VOICE,2.75).catch(()=>{});return;}
    const a=new Audio(LUC_ANH_ULTI_VOICE);a.preload='auto';a.volume=1;a.play().catch(()=>{});
  }catch(_e){}
}
`);
writeFileSync(battlePath,battle);
console.log('iOS audio unlock on first real interaction applied; no blocking gate');
