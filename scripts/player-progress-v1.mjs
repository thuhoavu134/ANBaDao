import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8').replace(/\r\n/g,'\n');
let html=read('dist/index.html');
function patch(from,to){if(html.split(from).length!==2)throw new Error('Player progression boundary: '+from.slice(0,100));html=html.replace(from,to);}
const domain=read('src/domain/campaign/player-progress.mjs').replace(/^export\s+/gm,'');
const runtime=read('src/ui/player-progress-runtime.js');
new Function(domain+'\n'+runtime);
patch('function chapterBattleSequence(idx){','/* hv-player-progress-v1 */\n'+domain+'\n'+runtime+'\nfunction chapterBattleSequence(idx){');
patch('function startChapter(idx,options={}){ const ch=DATA.chapters[idx];','function startChapter(idx,options={}){ const ch=DATA.chapters[idx];\n  if (!hvCheckCampaignEntry(idx)) return;');
patch("const stageIndex=P.clearedChapters.includes(idx)?0:Math.max(0,Math.min(sequence.length-1,Math.floor(Number(P.campaignStages[idx]||0))));", "const stageIndex=Math.max(0,Math.min(sequence.length-1,Math.floor(Number(P.campaignStages[idx]||0))));");
patch('const stageIndex = replay ? 0 : Math.max(0, Math.min(sequence.length - 1, Number.isFinite(raw) ? Math.floor(raw) : 0));','const stageIndex = Math.max(0, Math.min(sequence.length - 1, Number.isFinite(raw) ? Math.floor(raw) : 0));');
// All quest XP participates in the existing atomic mutation + persist rollback.
patch('const txOptions={state:P,commandId,expectedRevision:P?.revision,cost,balances,source,reason,mutate};',`const xpMutation = player => {
    const result = typeof mutate === 'function' ? mutate(player) : {ok:true};
    if(result===false || result?.ok===false) return result;
    const xp = (source === 'daily.quest' || source === 'daily.weekly') ? hvQuestXp(source) : 0;
    if(xp) { const playerXp=hvAddPlayerXp(player,xp); return {...result,playerXp}; }
    return result;
  };
  const txOptions={state:P,commandId,expectedRevision:P?.revision,cost,balances,source,reason,mutate:xpMutation};`);
patch('mutate:()=>({ok:true,battleId:safeText(payload.battleId,"battle"),win:true})','mutate:player=>({ok:true,battleId:safeText(payload.battleId,"battle"),win:true,playerXp:hvCampaignSettlementXp(player,payload)})');
patch('    applyLegacyMetaWinHooks(payload);',`    const settlement = applyLegacyMetaWinHooks(payload);
    if(payload.win && !settlement?.ok){
      activeBattle = null; closeOverlay(); navTo('campaign'); return;
    }`);
patch('+(typeof petBondSuffix==="function"?petBondSuffix(petBond):""));\n  }\n\n  function closeOverlay()',`+(typeof petBondSuffix==="function"?petBondSuffix(petBond):""));
    if(transaction.result?.playerXp) toast('+'+transaction.result.playerXp+' EXP · Cấp '+hvPlayerLevel(P.hvPlayerProgress?.xp));
    return transaction;
  }

  function closeOverlay()`);
// Preserve Next through the competitive-loot wrapper. Seal loot now settles atomically.
patch('return prev(battleId, win => {','return prev(battleId, (win,resultAction) => {');
if(html.split("if (typeof cb === 'function') cb(win);").length!==2)throw new Error('Lore callback boundaries');
html=html.replaceAll("if (typeof cb === 'function') cb(win);","if (typeof cb === 'function') cb(win,resultAction);");
// UI uses existing scene click owner and refresh cadence, no document listener.
patch('function currentCheckpoint() { return campaignCheckpoint(P, DATA.chapters, chapterBattleSequence); }','function currentCheckpoint() { if (!hvEnsurePlayerProgress()) return null; return campaignCheckpoint(P, DATA.chapters, chapterBattleSequence); }');
patch('<strong data-scene-power></strong></small></div>','<strong data-scene-power></strong></small><small class="cs-player-xp" data-player-level></small></div>');
patch('<b data-scene-stage-label>—</b></button></div>','<b data-scene-stage-label>—</b></button><div class="cs-level-gate" data-player-gate hidden><span data-player-gate-text></span><br><button type="button" class="cs-xp-help" data-scene-action="open-chest">Nhận EXP từ rương</button> · <button type="button" class="cs-xp-help" data-scene-action="player-quests">Nhiệm vụ</button></div></div>');
patch('<p class="cs-cap-note">Tối đa 15 giờ</p>','<p class="cs-cap-note">Tối đa 15 giờ</p><p data-player-exp-help><b data-afk-player-xp></b><br>240 EXP/giờ · chỉ cộng khi nhận rương.<br>Thắng ải lần đầu và nhận nhiệm vụ cũng cho EXP.</p>');
patch('function updateSceneNumbers() {',`function updatePlayerLevelUi() {
  const xp=P.hvPlayerProgress?.xp || 0, level=hvPlayerLevel(xp);
  setSceneText('[data-player-level]',level===60?'Cấp 60 · Tối đa':'Cấp '+level+' · EXP '+(xp-hvLevelXp(level))+'/'+(hvLevelXp(level+1)-hvLevelXp(level)));
  const cp=currentCheckpoint(), gate=cp?hvCampaignGate(P,cp.chapterIndex,cp.stageIndex):null;
  const notice=sceneState.root.querySelector('[data-player-gate]');
  if(notice)notice.hidden=!gate || gate.ok;
  setSceneText('[data-player-gate-text]',gate&&!gate.ok?hvPlayerGateMessage(gate):'');
  const challenge=sceneState.root.querySelector('[data-hv-afk-challenge]');
  if(challenge){challenge.disabled=!cp || !gate?.ok;challenge.setAttribute('aria-label',gate&&!gate.ok?hvPlayerGateMessage(gate):'Khiêu chiến');}
}
function updateSceneNumbers() {`);
patch('  const clock = sceneClock(view.storedSeconds);',"  updatePlayerLevelUi();\n  setSceneText('[data-afk-player-xp]', '+' + hvAfkXpView(P,view.storedSeconds).xp + ' EXP');\n  const clock = sceneClock(view.storedSeconds);");
patch('  const checkpoint = currentCheckpoint();\n  if (!checkpoint) { toast', '  const checkpoint = currentCheckpoint();\n  if (checkpoint && !hvCampaignGate(P,checkpoint.chapterIndex,checkpoint.stageIndex).ok) { toast(hvPlayerGateMessage(hvCampaignGate(P,checkpoint.chapterIndex,checkpoint.stageIndex))); return; }\n  if (!checkpoint) { toast');
patch('  refreshStamina(); const checkpoint = currentCheckpoint();','  refreshStamina(); const checkpoint = currentCheckpoint();\n  if (checkpoint && !hvCampaignGate(P,checkpoint.chapterIndex,checkpoint.stageIndex).ok) { cancelPreparation(); return; }');
patch('function grantSceneClaim() {','function grantSceneClaim() {\n  if (!hvEnsurePlayerProgress()) { toast("Chưa lưu được cấp người chơi."); return; }');
patch('    let outcome;','    let outcome, playerXp = 0;');
patch('draft.hvAfkChest = outcome.state; return { ok: true, claimCount: outcome.state.claimCount };','playerXp = hvGrantAfkXp(draft, view.storedSeconds); draft.hvAfkChest = outcome.state; return { ok: true, claimCount: outcome.state.claimCount, playerXp };');
patch("sceneState.root.querySelector('.cs-receipt')?.showModal();", "sceneState.root.querySelector('[data-claim-receipt]').insertAdjacentHTML('beforeend','<div><b>+'+playerXp+'</b><small>EXP</small></div>');\n      sceneState.root.querySelector('.cs-receipt')?.showModal();");
patch("  if (button.hasAttribute('data-hv-afk-claim'))", "  if (button.dataset.sceneAction === 'player-quests') { navTo('daily'); return; }\n  if (button.hasAttribute('data-hv-afk-claim'))");
// Every stage exposes its level requirement in the existing progress sheet.
patch("'Thủ lĩnh' : 'Ải ' + (i + 1)}</small>", "'Thủ lĩnh' : 'Ải ' + (i + 1)} · Cấp ${hvStageLevel(checkpoint.chapterIndex,i)}</small>");
patch("const rw = result.def?.reward || {};\n      showRewardCeremony?.('HOÀN THÀNH VIỆC VẶT'", "const rw = result.def?.reward || {};\n      toast?.('+80 EXP · Cấp '+hvPlayerLevel(P.hvPlayerProgress?.xp));\n      showRewardCeremony?.('HOÀN THÀNH VIỆC VẶT'");
patch("const rw = result.def?.reward || {};\n      showRewardCeremony?.('HOÀN THÀNH VIỆC TUẦN'", "const rw = result.def?.reward || {};\n      toast?.('+240 EXP · Cấp '+hvPlayerLevel(P.hvPlayerProgress?.xp));\n      showRewardCeremony?.('HOÀN THÀNH VIỆC TUẦN'");
patch('</head>','<style id="hv-player-progress-style">'+read('src/ui/player-progress.css')+'</style></head>');
writeFileSync('dist/index.html',html);
console.log('Player level1–60: existing108 encounters, entry gate, atomic XP and additive migration');

