import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'dist');
const indexPath = join(out, 'index.html');
const battlePath = join(out, 'battle.html');

const manager = String.raw`<script id="honviet-ios-audio-unlock">
(()=>{
  if(window.HonVietAudio)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  let ctx=null, unlocked=false, unlockPromise=null;
  const buffers=new Map();
  const loads=new Map();
  const voiceUrls=[
    'assets/audio/voice-luc-anh-hero.mp3',
    'assets/audio/voice-luc-anh-ultimate.mp3'
  ];
  function getCtx(){
    if(!ctx&&AC)ctx=new AC();
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
    await unlock();
    const c=getCtx();
    if(!c)return false;
    try{
      const buf=await decode(url);
      if(c.state==='suspended')await c.resume();
      const src=c.createBufferSource(),gain=c.createGain();
      src.buffer=buf;gain.gain.value=Math.max(0,Number(gainValue)||1);
      src.connect(gain);gain.connect(c.destination);src.start(0);return true;
    }catch(_e){
      try{const a=new Audio(url);a.preload='auto';a.volume=1;await a.play();return true;}catch(_e2){return false;}
    }
  }
  window.HonVietAudio={unlock,playVoice,preload:(u)=>decode(u),isUnlocked:()=>unlocked,context:()=>getCtx()};

  // No blocking splash. The first normal tap/click on ANY actual game control unlocks audio.
  // Capture phase makes this run before the button's own handler (hero card, campaign, battle, etc.).
  const firstGesture=()=>unlock().catch(()=>{});
  ['pointerdown','touchstart','touchend','click','keydown'].forEach(t=>
    document.addEventListener(t,firstGesture,{capture:true,passive:true,once:true})
  );

  // Resume again after iOS returns from background / tab switch.
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&unlocked){
      const c=getCtx();
      if(c&&c.state==='suspended')c.resume().catch(()=>{});
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
