import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function once(source,from,to){
  if(source.split(from).length!==2)throw new Error('RESULT_CONTRACT_ANCHOR: '+from.slice(0,100));
  return source.replace(from,to);
}

export function patchResultBattle(battle,actions){
  if(battle.includes('HV_RESULT_SETTLEMENT_V2'))return battle;
  // Replace the existing owner instead of adding more capture listeners.
  const owner=/<script id="m0-p0-result-action-owner-v1">[\s\S]*?<\/script>/g;
  if([...battle.matchAll(owner)].length!==1)throw new Error('RESULT_ACTION_OWNER');
  battle=battle.replace(owner,'<script id="m0-p0-result-action-owner-v1">\n'+actions+'\n</script>');
  battle=once(battle,"sessionId:()=>EMBED_CONFIG.sessionId||'',publish:","sessionId:()=>EMBED_CONFIG.sessionId||'',retry:()=>{if(state.mode==='result')state.resultPublished=false;},publish:");
  battle=once(battle,'    state.resultPublished = true;\n    const payload = {','    const payload = {');
  battle=once(battle,'    postToHonVietHost("battle-result", payload);\n    return true;',`    // Mark only after serialization succeeds; storage/transport failure is retryable.
    JSON.stringify(payload);
    state.resultPublished = true;
    try { postToHonVietHost("battle-result", payload); }
    catch(error) { state.resultPublished=false; throw error; }
    return true;`);
  battle=once(battle,'    if(!publishBattleResult())beginBattle();','    if(EMBEDDED)return publishBattleResult();\n    window.__hideIntegratedResultV6?.();beginBattle();return true;');
  battle=once(battle,'      parent.postMessage(message, "*");\n      return;','      parent.postMessage(message, "*");\n      return true;');
  battle=once(battle,'      try { sessionStorage.setItem("hvBattleHostEvent", JSON.stringify(message)); } catch (_) {}',`      try { sessionStorage.setItem("hvBattleHostEvent", JSON.stringify(message)); }
      catch(error) { throw new Error("Chưa lưu được kết quả trên thiết bị. Hãy thử lại; trận vẫn được giữ."); }`);
  const returnLine=battle.match(/      location\.replace\("index\.html\?hvBattleReturn=1"[^\n]*\);/g)||[];
  if(returnLine.length!==1)throw new Error('RESULT_RETURN_LOCATION');
  battle=once(battle,returnLine[0],returnLine[0]+'\n      return true;');
  const snapshotUnit='sourceId:unit.sourceId||unit.id,name:hero.name||unit.name,slot:unit.slot,alive';
  if(battle.split(snapshotUnit).length!==3)throw new Error('RESULT_UNIT_APPEARANCE');
  battle=battle.replaceAll(snapshotUnit,'sourceId:unit.sourceId||unit.id,archetype:unit.archetype,name:hero.name||unit.name,slot:unit.slot,alive');
  // The result renderer is outside the engine closure. All navigation must use
  // its public bridge, including defeat tips and the full-page Back button.
  battle=once(battle,"root.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));",'');
  const staticRewards='<section class="irv-rewards"><div class="irv-grid"><div class="irv-tip"><img src="${base}tinh-thong.png">Tinh thông</div><div class="irv-tip"><img src="${base}sach-exp.png">EXP tướng</div><div class="irv-tip"><img src="${base}ruong-trang-bi-thuong.png">Trang bị</div></div></section>';
  battle=once(battle,staticRewards,'${renderResultRewards(snap)}');
  const helper=`
 function renderResultRewards(snap){
   const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   const progress=snap?.progression||{},details=Array.isArray(progress.rewardDetails)?progress.rewardDetails:(snap?.rewards||[]);
   const rows=details.filter(r=>Number.isFinite(Number(r.value))&&Number(r.value)>0);
   const icons={gold:'assets/result-icons-art/gold-imagen.png',mastery:'assets/result-icons-art/mastery-imagen.png',playerXp:'assets/result-icons-art/scroll-imagen.png',gems:'assets/meta/economy/icon-gems.png',shards:'assets/result-icons-art/hero-shard-imagen.png'};
   return '<section class="irv-rewards"><h2>Chiến lợi phẩm</h2><div class="irv-grid">'+rows.map(r=>'<div class="irv-loot" data-reward-id="'+esc(r.id)+'"><img src="'+esc(icons[r.id]||'assets/result-icons-art/scroll-imagen.png')+'" alt=""><strong>+'+Number(r.value).toLocaleString('vi-VN')+'</strong><span>'+esc(r.name)+'</span><small>'+esc(r.detail||'')+'</small></div>').join('')+'</div><p class="irv-reward-note">'+esc(progress.rewardNote||'Nhận khi xác nhận kết quả trận.')+'</p></section>';
 }
`;
  battle=once(battle,' function show(victory,snap){',helper+' function show(victory,snap){');
  battle=once(battle,'</head>',`<style id="hv-result-settlement-v2">
/* HV_RESULT_SETTLEMENT_V2: layout is scoped to the existing result surface. */
#integratedResultV6 .irv-viewport{min-height:0;height:100dvh;overflow-y:auto;overscroll-behavior:contain}
#integratedResultV6 .irv-rewards{top:54%;bottom:calc(5% + 100px);left:6%;right:6%;overflow-y:auto;overscroll-behavior:contain}
#integratedResultV6 .irv-rewards h2{margin:0 0 8px;font:700 13px system-ui;color:#f1d28d;letter-spacing:.08em}
#integratedResultV6 .irv-rewards .irv-grid{grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:8px;align-items:start}
#integratedResultV6 .irv-loot{min-width:0;padding:8px 3px;border:1px solid #b7873859;border-radius:9px;background:linear-gradient(#3e2f1a88,#17130ccc);font:600 11px/1.3 system-ui;color:#f5dfaa;text-align:center}
#integratedResultV6 .irv-loot img{display:block;position:static;width:52px;height:52px;max-width:100%;margin:0 auto 5px;object-fit:contain;clip-path:none;mask:none;border-radius:0}
#integratedResultV6 .irv-loot strong{display:block;font-size:17px;color:#ffe39a}
#integratedResultV6 .irv-loot span,#integratedResultV6 .irv-loot small{display:block}
#integratedResultV6 .irv-loot small{font-size:9px;font-weight:400;color:#d8c8ab;margin-top:3px}
#integratedResultV6 .irv-reward-note{font:400 10px/1.4 system-ui;color:#dbc9a9;margin:7px 0}
#integratedResultV6 .irv-actions{top:auto;bottom:max(5%,env(safe-area-inset-bottom));gap:12px}
#integratedResultV6 [data-result-status]{grid-column:1/-1;margin:3px 0;color:#fff0cf;text-align:center;font:500 11px/1.4 system-ui}
#integratedResultV6 .irv-btn:disabled{opacity:.7}
@media(max-height:650px){#integratedResultV6 .irv-viewport{min-height:650px}#integratedResultV6{overflow-y:auto}}
</style>\n</head>`);
  return battle;
}

export function patchResultHost(host){
  if(host.includes('HV_RESULT_RETURN_READY_V2'))return host;
  // The source campaign starts with a short story sequence. Late scripts build
  // the real 18-stage route. Returning before those run falsely ends a chapter.
  host=once(host,'  (function consumeBattleReturn() {','  function consumeBattleReturn() {\n    // HV_RESULT_RETURN_READY_V2');
  const start=host.indexOf('  function consumeBattleReturn() {');
  const end=host.indexOf('  })();\n})();',start);
  if(end<0)throw new Error('RESULT_RETURN_END');
  let consume=host.slice(start,end);
  const cleanupStart=consume.indexOf('    try {\n      const url = new URL(location.href);');
  const cleanupEnd=consume.indexOf('    let message = null, lease = null;',cleanupStart);
  if(cleanupStart<0||cleanupEnd<cleanupStart)throw new Error('RESULT_RETURN_HISTORY');
  const cleanUrl=consume.slice(cleanupStart,cleanupEnd);
  consume=consume.slice(0,cleanupStart)+consume.slice(cleanupEnd);
  consume=consume.replace(' sessionStorage.removeItem("hvBattleHostEvent");','').replace(' sessionStorage.removeItem("hvBattleHostLease");','');
  consume=once(consume,'    const payload = message.payload || {};',`    const payload = message.payload || {};
    if(!lease?.sessionId||payload.sessionId!==lease.sessionId||
       (message.type==='battle-result'&&payload.battleId!==lease.battleId)){
      navTo('campaign');toast('Kết quả không khớp trận đang chờ.');return;
    }
    ST.mode=lease.mode;ST.chapterIdx=lease.chapterIdx;ST.campaignBattleIndex=Number(lease.campaignBattleIndex)||0;
    if(lease.mode==='campaign'){
      const sequence=chapterBattleSequence(lease.chapterIdx);
      if(sequence[ST.campaignBattleIndex]!==lease.battleId){navTo('campaign');toast('Chưa khôi phục được ải đang đánh. Kết quả vẫn được giữ.');return;}
      ST.campaignBattles=sequence;
    }`);
  consume=once(consume,'      finishIntegratedBattle(payload);',`      if(!finishIntegratedBattle(payload))return;`);
  consume+=cleanUrl+`    try { sessionStorage.removeItem("hvBattleHostEvent");sessionStorage.removeItem("hvBattleHostLease");window.name=''; } catch(_) {}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',consumeBattleReturn,{once:true});
  else consumeBattleReturn();
`;
  host=host.slice(0,start)+consume+host.slice(end+'  })();\n'.length);
  host=once(host,'    if (!activeBattle || payload.sessionId !== activeBattle.sessionId) return;', '    if (!activeBattle || payload.sessionId !== activeBattle.sessionId) return false;');
  host=once(host,'    else if (typeof navTo === "function") navTo("hub");\n  }','    else if (typeof navTo === "function") navTo("hub");\n    return true;\n  }');
  // Replayed transports must not advance mastery twice. Keep progression inside
  // the existing committed reward mutation, including loss participation.
  host=once(host,'function masteryBattleProgress(win){','function masteryBattleProgress(win,save=true){');
  host=once(host,'});persist();return out;}','});if(save)persist();return out;}');
  const beforeProgress=`    if(typeof relationshipBattleProgress==='function') relationshipBattleProgress(Boolean(payload.win));
    const masteryGain=typeof masteryBattleProgress==='function'?masteryBattleProgress(Boolean(payload.win)):[];`;
  host=once(host,beforeProgress,`    const settlement = applyLegacyMetaWinHooks(payload);
    if(!settlement?.ok){
      toast('Chưa lưu được kết quả. Anh tải lại trang để thử nhận lại.');
      frame.contentWindow?.postMessage({source:'hon-viet-parent',type:'battle-settlement-error',payload:{sessionId:payload.sessionId}},location.origin);
      if(new URLSearchParams(location.search).get('hvBattleReturn')==='1')navTo('campaign');
      return false;
    }
    if(!settlement.duplicate&&typeof relationshipBattleProgress==='function') relationshipBattleProgress(Boolean(payload.win));
    const masteryGain=settlement.result?.masteryGain||[];`);
  host=once(host,`    const settlement = applyLegacyMetaWinHooks(payload);
    if(payload.win && !settlement?.ok){
      activeBattle = null; closeOverlay(); navTo('campaign'); return;
    }
    const callback`, '    const callback');
  host=once(host,'    if (!payload.win) return;','    // Wins and losses both settle participation exactly once.');
  host=once(host,'    const gold = Math.max(0, Math.round(Number(payloadGold?.value) || (ST.mode === "train" ? 140 : 180)));','    const gold = payload.win ? Math.max(0, Math.round(Number(payloadGold?.value) || (ST.mode === "train" ? 140 : 180))) : 0;');
  host=once(host,'mutate:player=>({ok:true,battleId:safeText(payload.battleId,"battle"),win:true,playerXp:hvCampaignSettlementXp(player,payload)})', 'mutate:player=>({ok:true,battleId:safeText(payload.battleId,"battle"),win:Boolean(payload.win),playerXp:hvCampaignSettlementXp(player,payload),masteryGain:masteryBattleProgress(Boolean(payload.win),false),petBond:typeof petBondActivity==="function"?petBondActivity("battle",{win:Boolean(payload.win),alive:survivors,mode:ST.mode||null}):null})');
  host=once(host,'    if (!transaction.duplicate) {\n      window.__HV_MAIN_QUEST_RUNTIME_V1', '    if (payload.win && !transaction.duplicate) {\n      window.__HV_MAIN_QUEST_RUNTIME_V1');
  host=once(host,'    if (!transaction.duplicate && typeof questProgress === "function") {','    if (payload.win && !transaction.duplicate && typeof questProgress === "function") {');
  host=once(host,'    if (typeof toast === "function") toast("Thắng trận bằng engine Hồn Việt', '    if (payload.win && typeof toast === "function") toast("Thắng trận bằng engine Hồn Việt');
  // Expose the existing quest reward rule as a read-only preview, not a second
  // economy formula. The settlement remains the only place awarding it.
  host=once(host,'    schema: __hvMainQuestModule.MAIN_QUEST_SCHEMA,',`    previewBattleReward: battleId => {
      const quest=current();return !quest.complete&&!quest.claimed&&quest.battleId===battleId?rewardFor(quest):{};
    },
    schema: __hvMainQuestModule.MAIN_QUEST_SCHEMA,`);
  host=once(host,'    const petBond=typeof petBondActivity==="function"?petBondActivity("battle",{win:Boolean(payload.win),alive:survivors,mode:ST.mode||null}):null;','');
  host=once(host,'petBondSuffix(petBond):""','petBondSuffix(transaction.result?.petBond):""');
  host=once(host,'    if(payload.intelligence && typeof payload.intelligence === "object"){','    if(!settlement.duplicate && payload.intelligence && typeof payload.intelligence === "object"){');
  host=once(host,'      status.phase="settled";status.lastType=message.type;status.settledAt=Date.now();','      status.phase=window.HonVietMetaBridge?.isActive?.()?"running":"settled";status.lastType=message.type;status.settledAt=Date.now();');
  const rewardPreview=`    const rewardDetails=rewardPreview.map(r=>({...r,detail:r.id==='gold'?'Thưởng thắng trận':'Mỗi tướng tham chiến · tối đa 100'}));
    const mastery=rewardDetails.find(r=>r.id==='mastery');
    if(mastery){
      const ids=[...new Set((P.squad||[]).map(x=>x?.id).filter(id=>P.heroes?.[id]?.owned))];
      mastery.value=ids.reduce((total,id)=>total+Math.max(0,Math.min(4,100-(Number(P.mastery?.[id]?.xp)||0))),0);
      mastery.name='Tinh Thông đội';mastery.detail=ids.length+' tướng · tối đa +4/tướng, dừng ở 100';
    }
    let rewardNote='Nhận khi xác nhận kết quả trận.';
    if(ST.mode==='campaign'){
      const copy=JSON.parse(JSON.stringify(P)),xp=hvRecordCampaignXp(copy,ST.chapterIdx,ST.campaignBattleIndex);
      if(xp)rewardDetails.push({id:'playerXp',name:'EXP người chơi',value:xp,detail:'Vượt ải lần đầu · mở ải theo cấp'});
      const bonus=window.__HV_MAIN_QUEST_RUNTIME_V1?.previewBattleReward?.(battleId)||{};
      if(bonus.gold)rewardDetails.push({id:'gold',name:'Vàng chính tuyến',value:bonus.gold,detail:'Hoàn thành nhiệm vụ ải'});
      if(bonus.gems)rewardDetails.push({id:'gems',name:'Ngọc chính tuyến',value:bonus.gems,detail:'Hoàn thành nhiệm vụ ải'});
      rewardNote='Ải '+(ST.chapterIdx+1)+'–'+(ST.campaignBattleIndex+1)+' · Xác nhận để nhận thưởng. Ải sau nhận thưởng rồi vào ải kế tiếp.';
      const sequence=chapterBattleSequence(ST.chapterIdx);
      if(ST.campaignBattleIndex===sequence.length-1){
        const ch=DATA.chapters[ST.chapterIdx];
        const reward=P.clearedChapters.includes(ST.chapterIdx)?{gold:250}:{...ch.reward,gold:Math.round((ch.reward?.gold||0)*worldBattleMods(ST.chapterIdx).rewardGold)};
        for(const id of ['gold','gems','shards'])if(reward[id])rewardDetails.push({id,value:reward[id],name:({gold:'Vàng',gems:'Ngọc',shards:'Mảnh tướng'})[id],detail:id==='shards'?(DATA.heroes[reward.shardHero]?.name||'Thưởng chương'):'Hoàn thành chương'});
      }
    }
    return {
      resultProgress:{rewardDetails,rewardNote},
      embedded: true,`;
  host=once(host,'    return {\n      embedded: true,',rewardPreview);
  return host;
}

export function installResultScreenContract(root){
  const battle=join(root,'dist/battle.html'),host=join(root,'dist/index.html');
  writeFileSync(battle,patchResultBattle(readFileSync(battle,'utf8'),readFileSync(join(root,'src/ui/result-actions-runtime.js'),'utf8')));
  writeFileSync(host,patchResultHost(readFileSync(host,'utf8')));
}
