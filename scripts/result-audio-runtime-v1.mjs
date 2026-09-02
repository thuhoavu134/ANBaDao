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
  const player=new Audio();player.preload='auto';player.loop=false;player.volume=.9;
  let active='';
  function stop(){try{player.pause();player.currentTime=0;}catch(_e){} active='';}
  async function play(kind){
    const src=tracks[kind];if(!src)return false;
    try{
      stop();
      if(typeof bgmPlayer!=='undefined'){try{bgmPlayer.pause();}catch(_e){}}
      active=kind;player.src=src;player.currentTime=0;
      if(window.HonVietAudio)try{await window.HonVietAudio.unlock();}catch(_e){}
      await player.play();return true;
    }catch(_e){return false;}
  }
  window.__HV_RESULT_AUDIO={player,play,stop,current:()=>active};
  window.addEventListener('message',event=>{
    const m=event.data;if(!m||m.source!=='hon-viet-battle'||m.type!=='battle-result-audio')return;
    play(m.payload?.victory?'victory':'defeat');
  });
  try{
    const originalShowScreen=showScreen;
    showScreen=function(name){if(active)stop();return originalShowScreen(name);};
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
