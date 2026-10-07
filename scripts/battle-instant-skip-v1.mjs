import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
export function patchBattleInstantSkip(input,runtime){
 if(input.includes('HV_BATTLE_INSTANT_SKIP_V1'))return input;
 let s=input;
 const once=(from,to)=>{if(s.split(from).length!==2)throw Error('Instant skip anchor: '+from.slice(0,100));s=s.replace(from,()=>to);};
 once('  function sleep(milliseconds, battleId = state.battleId) {','  /* HV_BATTLE_INSTANT_SKIP_V1 */\n'+runtime+'\n  function sleep(milliseconds, battleId = state.battleId) {');
 for(const [name,delay] of [['sleep','motionDuration(milliseconds)'],['sleepVisualMilliseconds','Math.max(0, Number(milliseconds) || 0)'],['waitRealTime','Math.max(0, milliseconds)']]){
  once(`function ${name}(milliseconds, battleId = state.battleId) {\n    return new Promise((resolve) => {\n      setTimeout(() => resolve(battleId === state.battleId), ${delay});\n    });\n  }`,`function ${name}(milliseconds, battleId = state.battleId) { return __hvSkipWait(${delay},battleId); }`);
 }
 once('function tweenUnit(unit, toX, toY, milliseconds, battleId) {\n    if (REDUCED_MOTION)', 'function tweenUnit(unit, toX, toY, milliseconds, battleId) {\n    if (REDUCED_MOTION || __hvIsSkipping())');
 once('const progress = Core.clamp((now - started) / duration, 0, 1);','const progress = __hvIsSkipping() ? 1 : Core.clamp((now - started) / duration, 0, 1);');
 const loop='  while(state.battleId===battleId){\n    const elapsed=info.clock.advance(performance.now()-info.startedAt);';
 if(s.split(loop).length!==3)throw Error('Instant skip: expected both authored marker clocks');
 s=s.split(loop).join('  while(state.battleId===battleId){\n    if(__hvIsSkipping()){info.clock.advance(targetMs);return true;}\n    const elapsed=info.clock.advance(performance.now()-info.startedAt);');
 for(const call of ['__hvBattleAssets.prepare(actor,action,target,battleId)','__hvLegacyAuthored.prepare(actor,action,__hvActionAssets.signal)','prepareThayMoAuthoredAssets(action,__hvActionAssets.signal)']){
  const from='await '+call;if(!s.includes(from))throw Error('Instant skip asset anchor '+call);
  s=s.split(from).join('await __hvSkipVisualAssets(()=>'+call+',battleId)');
 }
 once('    if (playerControlled) {\n      dom.actionPrompt.textContent', '    if (playerControlled && !state.auto) {\n      dom.actionPrompt.textContent');
 const anchor='document.getElementById("embeddedSkipButton")?.addEventListener("click", () => {';
 const start=s.indexOf(anchor),end=s.indexOf('\n  });',start);
 if(start<0||end<0)throw Error('Instant skip click owner missing');
 s=s.slice(0,start)+anchor+'\n    __hvRequestBattleSkip();'+s.slice(end);
 once('    state.battleId += 1;','    state.battleId += 1;\n    __hvFinishSkip();\n    for(const finish of [...__hvSkipWaiters])finish();');
 once('  function endBattle(winner, objectiveReason=null) {','  function endBattle(winner, objectiveReason=null) {\n    __hvFinishSkip();');
 once('  function render(time) {','  function render(time) {\n    if(__hvIsSkipping()){requestAnimationFrame(render);return;}');
 once('  function __hvScheduleAuthoredSfx(actor,action,cuePerformanceMs,cue,actionId,signal=null,sampleCue=\'onset\',eventOverride=null){','  function __hvScheduleAuthoredSfx(actor,action,cuePerformanceMs,cue,actionId,signal=null,sampleCue=\'onset\',eventOverride=null){\n    if(__hvIsSkipping())return Promise.resolve(false);');
 s=s.replace('aria-label="Tua nhanh trận đấu"','aria-label="Bỏ qua chiến đấu"');
 return s;
}
export function installBattleInstantSkip(root){const path=join(root,'dist/battle.html');writeFileSync(path,patchBattleInstantSkip(readFileSync(path,'utf8'),readFileSync(join(root,'src/runtime/battle-instant-skip.js'),'utf8')));}
