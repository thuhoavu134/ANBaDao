import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function patchBattleSettlementConsistency(host) {
  if(host.includes('/* HV_BATTLE_SETTLEMENT_CONSISTENCY_V1 */'))return host;
  const once=(from,to)=>{if(host.split(from).length!==2)throw new Error('Settlement consistency anchor: '+from.slice(0,100));host=host.replace(from,to);};
  const begin=host.indexOf('  const claimReady = () => {'),end=host.indexOf('  const go = () => {',begin);
  if(begin<0||end<0)throw new Error('Main quest runtime owner missing');
  host=host.slice(0,begin)+`  /* HV_BATTLE_SETTLEMENT_CONSISTENCY_V1 */
  const prepareBattleSettlement = (payload = {}) => {
    if(!payload.win)return null;
    const state=ensure(),quest=current();
    if(!quest.battleId||quest.battleId!==payload.battleId)return null;
    const recorded=__hvMainQuestModule.recordMainQuestBattle(state,quest,{win:true,battleId:payload.battleId,at:Date.now()});
    if(!recorded.changed&&!quest.ready)return null;
    const claimed=__hvMainQuestModule.claimMainQuest(recorded.state,quest,{
      chapterCount:chapterCount(),stageCount:sequenceFor(state.chapterIndex).length,
      hasNextChapter:state.chapterIndex+1<chapterCount(),reward:rewardFor(quest)
    });
    return claimed.changed?{quest,state:claimed.state,reward:claimed.reward||rewardFor(quest)}:null;
  };
  const applyBattleSettlement = (player,prepared) => {
    if(!prepared)return null;
    player.hvMainQuest=prepared.state;
    return {quest:prepared.quest,reward:prepared.reward};
  };
  const notifyBattleSettlement = result => {
    if(!result)return;
    if(typeof showProgressBurst==='function')showProgressBurst('Nhiệm vụ hoàn thành',result.quest.objective+' · tự mở nhiệm vụ kế tiếp');
    else if(typeof toast==='function')toast('📜 Hoàn thành '+result.quest.objective);
    renderQuestSurfaces();
  };
  const claimReady = () => {
    const state=ensure(),quest=current();if(!quest.ready)return false;
    const out=__hvMainQuestModule.claimMainQuest(state,quest,{
      chapterCount:chapterCount(),stageCount:sequenceFor(state.chapterIndex).length,
      hasNextChapter:state.chapterIndex+1<chapterCount(),reward:rewardFor(quest)
    });
    if(!out.changed)return false;
    const tx=window.HonVietTransaction?.commit?.({commandId:'main.quest:'+state.campaignCycle+':'+quest.id,
      source:'main.quest',reward:out.reward||{},mutate:player=>{player.hvMainQuest=out.state;return{ok:true,questId:quest.id};}});
    if(!tx?.ok){if(typeof toast==='function')toast('Chưa lưu được thưởng nhiệm vụ. Hãy thử lại.');return false;}
    if(!tx.duplicate)showQuestReward(quest,out.reward||{});
    renderQuestSurfaces();return true;
  };
  const onBattleResult = (payload = {}) => {
    const prepared=prepareBattleSettlement(payload);if(!prepared)return false;
    const tx=window.HonVietTransaction?.commit?.({commandId:'main.quest:'+prepared.state.campaignCycle+':'+prepared.quest.id,
      source:'main.quest',reward:prepared.reward,mutate:player=>({ok:true,mainQuest:applyBattleSettlement(player,prepared)})});
    if(!tx?.ok){if(typeof toast==='function')toast('Chưa lưu được thưởng nhiệm vụ. Hãy thử lại.');return false;}
    if(!tx.duplicate)notifyBattleSettlement(tx.result?.mainQuest);return true;
  };
`+host.slice(end);
  once('    previewBattleReward: battleId => {','    prepareBattleSettlement,applyBattleSettlement,notifyBattleSettlement,\n    previewBattleReward: battleId => {');
  once('    const sealLoot=payload.win?', '    const mainQuestPrepared=payload.win&&!previous?window.__HV_MAIN_QUEST_RUNTIME_V1?.prepareBattleSettlement?.(payload):null;\n    const sealLoot=payload.win?');
  once('reward:{...sealLoot,gold:gold+(sealLoot.gold||0)},',
    'reward:{...sealLoot,gold:gold+(sealLoot.gold||0)+(mainQuestPrepared?.reward?.gold||0),gems:(sealLoot.gems||0)+(mainQuestPrepared?.reward?.gems||0)},');
  once('win:Boolean(payload.win),sealLoot,playerXp:hvCampaignSettlementXp(player,payload)',
    'win:Boolean(payload.win),sealLoot,mainQuest:window.__HV_MAIN_QUEST_RUNTIME_V1?.applyBattleSettlement?.(player,mainQuestPrepared)||null,playerXp:hvCampaignSettlementXp(player,payload)');
  once('window.__HV_MAIN_QUEST_RUNTIME_V1?.onBattleResult?.(payload);',
    'window.__HV_MAIN_QUEST_RUNTIME_V1?.notifyBattleSettlement?.(transaction.result?.mainQuest);');
  // The receipt already saved the checkpoint. Callbacks route only; legacy
  // fallback still advances monotonically if no integrated receipt ran.
  once('      P.campaignStages[idx]=stageIndex+1; persist(); refreshResbar();',
    '      const nextStage=Math.max(Number(P.campaignStages[idx])||0,stageIndex+1);\n      if(P.campaignStages[idx]!==nextStage){P.campaignStages[idx]=nextStage;persist();}\n      refreshResbar();');
  once('            P.campaignStages[idx] = stageIndex + 1;\n            persist();',
    '            const nextStage=Math.max(Number(P.campaignStages[idx])||0,stageIndex+1);\n            if(P.campaignStages[idx]!==nextStage){P.campaignStages[idx]=nextStage;persist();}');
  return host;
}
export function installBattleSettlementConsistency(root) {
  const path=join(root,'dist','index.html');writeFileSync(path,patchBattleSettlementConsistency(readFileSync(path,'utf8')));
}
