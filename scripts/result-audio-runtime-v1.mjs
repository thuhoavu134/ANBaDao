import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out=join(process.cwd(),'dist');
const indexPath=join(out,'index.html');
const battlePath=join(out,'battle.html');

let index=readFileSync(indexPath,'utf8');
const parentScript=String.raw`<script id="honviet-result-audio-v1">
(()=>{
  if(window.__HV_RESULT_AUDIO_V1)return;
  window.__HV_RESULT_AUDIO_V1=true;
  const tracks={victory:'assets/audio/bgm-victory.mp3',defeat:'assets/audio/bgm-defeat.mp3'};
  let active='',epoch=0,fallbackPlayer=null;
  function stop(options={}){
    epoch++;
    try{window.HonVietAudio?.stopMusic?.(options);}catch(_e){}
    if(!options.keepCurrent&&fallbackPlayer){try{fallbackPlayer.pause();fallbackPlayer.currentTime=0;}catch(_e){}fallbackPlayer=null;}
    active='';
  }
  async function play(kind){
    const src=tracks[kind];if(!src)return false;
    try{
      stop({keepCurrent:true});
      const ticket=epoch;
      active=kind;
      const bus=window.HonVietAudio;
      if(bus?.playMusic){
        const played=await bus.playMusic(src,{loop:false,volume:.9,category:'result',fadeMs:260});
        if(ticket!==epoch)return false;
        if(played)return true;
      }
      if(bus)try{await bus.unlock();}catch(_e){}
      if(ticket!==epoch)return false;
      const previous=fallbackPlayer;
      const next=new Audio();next.preload='auto';next.loop=false;next.volume=.9;next.src=src;
      await next.play();
      if(ticket!==epoch){try{next.pause();next.currentTime=0;}catch(_e){}return false;}
      fallbackPlayer=next;
      if(previous&&previous!==next){try{previous.pause();previous.currentTime=0;}catch(_e){}}
      return true;
    }catch(_e){return false;}
  }
  window.__HV_RESULT_AUDIO={play,stop,current:()=>active};
  window.addEventListener('message',event=>{
    const m=event.data;if(!m||m.source!=='hon-viet-battle'||m.type!=='battle-result-audio')return;
    const frame=document.getElementById('hvBattleFrame'),session=window.HonVietMetaBridge?.active?.();
    if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin||!session||m.payload?.sessionId!==session.sessionId)return;
    play(m.payload?.victory?'victory':'defeat');
  });
  try{
    const originalShowScreen=showScreen;
    showScreen=function(name){if(active)stop({keepCurrent:true});return originalShowScreen(name);};
  }catch(_e){}
})();
</script>`;

if(!index.includes('honviet-result-audio-v1')) index=index.replace('</body>',parentScript+'\n</body>');
writeFileSync(indexPath,index);

let battle=readFileSync(battlePath,'utf8');
if(!battle.includes('battle-result-audio')){
  const hook=/function endBattle\(winner, objectiveReason=null\) \{\n    document\.body\.classList\.add\("result-active"\);\n    state\.mode = "result";\n    state\.locked = true;\n    state\.result = winner;/;
  if(!hook.test(battle)) throw new Error('Result audio patch: endBattle hook not found');
  battle=battle.replace(hook,`function endBattle(winner, objectiveReason=null) {\n    document.body.classList.add("result-active");\n    state.mode = "result";\n    state.locked = true;\n    state.result = winner;\n    if(EMBEDDED)parent.postMessage({source:'hon-viet-battle',type:'battle-result-audio',payload:{sessionId:EMBED_CONFIG.sessionId||'',victory:winner===TEAM_PLAYER}},'*');`);
}
writeFileSync(battlePath,battle);
console.log('Victory/defeat result audio integrated');
