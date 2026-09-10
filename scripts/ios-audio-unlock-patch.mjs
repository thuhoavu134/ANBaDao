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
      // Prime existing HTML media during the user's first real game interaction.
      document.querySelectorAll('audio,video').forEach(el=>{
        try{
          const wasMuted=el.muted;
          el.muted=true;
          const p=el.play();
          if(p&&p.then)p.then(()=>{el.pause();el.currentTime=0;el.muted=wasMuted;}).catch(()=>{el.muted=wasMuted;});
          else {el.pause();el.currentTime=0;el.muted=wasMuted;}
        }catch(_e){}
      });
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
  window.HonVietAudio={unlock,playVoice,beginCombat,stopCombat,preload:(u)=>decode(u),isUnlocked:()=>unlocked,context:()=>getCtx()};

  // Keep unlocking on every gesture until the context is running. Full-page
  // battle.html on iOS often misses the original Xuất chiến tap.
  const firstGesture=()=>{
    unlock().then(ok=>{
      try{window.__HV_BATTLE_BGM?.play?.();}catch(_e){}
      if(ok) document.getElementById('hvUnmuteAudio')?.remove();
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

  function showUnmute(){
    const c=getCtx();
    if((c&&c.state==='running')||document.getElementById('hvUnmuteAudio'))return;
    const host=document.body||document.documentElement;
    if(!host)return;
    const b=document.createElement('button');
    b.id='hvUnmuteAudio';
    b.type='button';
    b.textContent='Bật tiếng';
    b.setAttribute('aria-label','Bật tiếng trận đấu');
    b.style.cssText='position:fixed;right:12px;top:max(12px,env(safe-area-inset-top));z-index:2147483647;min-height:44px;padding:8px 14px;border-radius:12px;border:1px solid #d7c07a;background:#102826f2;color:#f4dfaa;font:800 14px/1 system-ui,sans-serif';
    b.addEventListener('pointerdown',ev=>{ev.stopPropagation();firstGesture();});
    host.appendChild(b);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(showUnmute,400));
  else setTimeout(showUnmute,400);
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
