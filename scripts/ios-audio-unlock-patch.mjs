import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const indexPath = join(out, 'index.html');
const battlePath = join(out, 'battle.html');

const manager = String.raw`<script id="honviet-ios-audio-unlock">
(()=>{
  if(window.HonVietAudio)return;
  // Embedded screens borrow the host device. Their SFX battle channel owns
  // lifecycle/cancellation; destroying an old iframe must not stop host music.
  try{
    const parent=window.parent;
    const shared=parent&&parent!==window?parent.HonVietAudio:null;
    if(shared){
      window.__HV_EARLY_CTX=shared.context();
      window.HonVietAudio={
        context:()=>shared.context(),unlock:()=>shared.unlock(),
        isUnlocked:()=>shared.isUnlocked(),preload:u=>shared.preload(u),
        playVoice:(...args)=>shared.playVoice(...args),
        playMusic:(...args)=>shared.playMusic(...args),music:()=>shared.music(),musicRequest:()=>shared.musicRequest(),
        setMusicVolume:value=>shared.setMusicVolume(value),
        beginCombat(){},stopCombat(){},stopMusic(){}
      };
      return;
    }
  }catch(_e){}
  const AC=window.AudioContext||window.webkitAudioContext;
  let ctx=window.__HV_EARLY_CTX||null, unlocked=false;
  try{
    if(!ctx&&AC)ctx=new AC();
    window.__HV_EARLY_CTX=ctx;
    if(ctx){
      const b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource();
      s.buffer=b;s.connect(ctx.destination);s.start(0);
    }
  }catch(_e){}
  const buffers=new Map();
  const loads=new Map();
  const musicUrls=new Set();
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
  function unlock(){
    let c,resumed;
    try{
      c=getCtx();
      if(!c)return Promise.resolve(false);
      // Always call resume synchronously in this gesture. An earlier call
      // outside a gesture may still be pending and must not swallow this one.
      resumed=c.state==='running'?Promise.resolve():c.resume();
    }catch(_e){return Promise.resolve(false);}
    try{
      const b=c.createBuffer(1,1,22050),s=c.createBufferSource();
      s.buffer=b;s.connect(c.destination);s.onended=()=>s.disconnect();s.start(0);
    }catch(_e){}
    const settled=()=>{
      const wasUnlocked=unlocked;
      unlocked=c.state==='running';
      document.documentElement.dataset.audioUnlocked=unlocked?'1':'0';
      if(unlocked){
        if(!wasUnlocked)voiceUrls.forEach(u=>decode(u).catch(()=>{}));
        if(musicIntent?.pending&&musicIntent.src!==musicCurrent?.url)void playMusic(musicIntent.src,musicIntent.options);
      }
      return unlocked;
    };
    return Promise.resolve(resumed).then(settled,settled);
  }
  async function playVoice(url,gainValue=1){
    const combat=String(url).includes('voice-luc-anh-ultimate.mp3'),ticket=combatEpoch;
    const current=()=>!combat||(combatEnabled&&ticket===combatEpoch);
    if(!current())return false;
    if(!await unlock())return false;
    if(!current())return false;
    const c=getCtx();
    if(!c)return false;
    try{
      const buf=await decode(url);
      if(!current())return false;
      if(c.state!=='running'||!current())return false;
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
  let musicEpoch=0,musicCurrent=null,musicIntent=null,musicVolume=0.34;
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
    musicUrls.add(src);
    musicIntent={src,options:{...options},pending:true};
    if(category==='bgm')musicVolume=volume;
    const ticket=++musicEpoch,c=getCtx();
    if(!c||!unlocked||c.state!=='running')return false;
    if(musicCurrent?.url===src&&musicCurrent.loop===loop&&musicCurrent.category===category){
      musicIntent.pending=false;
      if(category==='bgm')setMusicVolume(volume);
      return true;
    }
    let buffer;
    try{buffer=await decode(src);}catch(_e){
      if(ticket===musicEpoch&&options.fallback&&options.fallback!==src){
        return playMusic(options.fallback,{...options,fallback:null});
      }
      return false;
    }
    if(ticket!==musicEpoch||c.state!=='running'){
      if(src!==musicIntent?.src&&src!==musicCurrent?.url)buffers.delete(src);
      return false;
    }
    const source=c.createBufferSource(),gain=c.createGain(),old=musicCurrent;
    const now=Number(c.currentTime)||0,seconds=fadeMs/1000;
    const startVolume=category==='bgm'?musicVolume:volume;
    source.buffer=buffer;source.loop=loop;gain.gain.value=0;
    source.connect(gain);gain.connect(c.destination);
    try{
      gain.gain.setValueAtTime?.(0,now);
      if(seconds)gain.gain.linearRampToValueAtTime?.(startVolume,now+seconds);
      else gain.gain.value=startVolume;
    }catch(_e){gain.gain.value=startVolume;}
    const track={source,gain,url:src,loop,category,volume};
    source.onended=()=>{
      try{source.disconnect();gain.disconnect();}catch(_e){}
      if(musicCurrent===track)musicCurrent=null;
    };
    musicCurrent=track;
    try{source.start(0);}catch(_e){musicCurrent=old;return false;}
    musicIntent.pending=false;
    if(old)fadeTrack(old,fadeMs,now);
    // The fading source retains its own buffer; the cache keeps only current music.
    for(const url of musicUrls)if(url!==src)buffers.delete(url);
    document.documentElement.dataset.musicTrack=src;
    document.documentElement.dataset.musicActive='1';
    return true;
  }
  function stopMusic(options={}){
    musicEpoch++;musicIntent=null;
    if(options.keepCurrent)return;
    const track=musicCurrent;if(!track)return;
    musicCurrent=null;
    fadeTrack(track,options.fadeMs??120,Number(getCtx()?.currentTime)||0);
    document.documentElement.dataset.musicActive='0';
    document.documentElement.dataset.musicTrack='';
  }
  const getMusic=()=>musicCurrent;
  window.HonVietAudio={unlock,playVoice,beginCombat,stopCombat,playMusic,stopMusic,setMusicVolume,music:getMusic,musicRequest:()=>musicIntent?.src||null,preload:(u)=>decode(u),isUnlocked:()=>unlocked&&ctx?.state==='running',context:()=>getCtx()};

  // Keep unlocking on every gesture until the context is running. Full-page
  // battle.html on iOS often misses the original Xuất chiến tap.
  const firstGesture=()=>{
    // Start a direct-battle HTMLMediaElement synchronously in the gesture before awaiting AudioContext.resume().
    try{const p=window.__HV_BATTLE_BGM?.play?.();p?.catch?.(()=>{});}catch(_e){}
    unlock().then(()=>{
      try{const p=window.__HV_BATTLE_BGM?.play?.();p?.catch?.(()=>{});}catch(_e){}
    }).catch(()=>{});
  };
  ['pointerdown','touchstart','touchend','click','keydown'].forEach(t=>
    document.addEventListener(t,firstGesture,{capture:true,passive:true})
  );

  // Resume again after iOS returns from background / tab switch.
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      if(unlocked)void unlock();
      try{const p=window.__HV_BATTLE_BGM?.play?.();p?.catch?.(()=>{});}catch(_e){}
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

