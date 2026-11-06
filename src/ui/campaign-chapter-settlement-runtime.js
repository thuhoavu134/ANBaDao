function hvApplyCampaignChapterSettlement(player,payload){
  if(ST.mode!=='campaign'||!payload.win)return null;
  const idx=ST.chapterIdx,stage=ST.campaignBattleIndex,sequence=chapterBattleSequence(idx),ch=DATA.chapters[idx];
  if(!ch||stage!==sequence.length-1||sequence[stage]!==payload.battleId)return null;
  const first=!player.clearedChapters.includes(idx);
  const reward=first?{...ch.reward,gold:Math.round((ch.reward?.gold||0)*worldBattleMods(idx).rewardGold),gems:Math.round(ch.reward?.gems||0)}:{gold:250};
  applyReward(reward);
  let unlockedHero=null;
  if(first){
    player.clearedChapters.push(idx);
    if(ch.unlockHero&&player.heroes[ch.unlockHero]&&!player.heroes[ch.unlockHero].owned){player.heroes[ch.unlockHero].owned=true;unlockedHero=ch.unlockHero;}
    if(idx+1<DATA.chapters.length&&!player.unlockedChapters.includes(idx+1))player.unlockedChapters.push(idx+1);
    player.flags=player.flags||{};player.flags['world_clear_'+idx]=true;
    if(typeof hvApplyClanXp==='function')hvApplyClanXp(25);
  }
  // Owner 2026-10-25: boss chương rơi trang bị theo bảng đã duyệt (1 món/ngày đầy đủ, sau đó giảm nửa).
  let gearDrop=null;
  try{
    if(typeof rollBossDrop==='function'&&typeof buildDropItem==='function'){
      player.gearPity=player.gearPity||{}; player.gearDay=player.gearDay||{};
      const key='ch'+(idx+1), hits=Number(player.gearDay[key])||0;
      const pity=Number(player.gearPity.boss)||0;
      if(hits>=1&&Math.random()<0.5){
        // quá 1 món/ngày: giảm nửa tỉ lệ, coi như trượt lần này
        player.gearPity.boss=Math.min(99,pity+1);
      }else{
        const roll=rollBossDrop({chapter:idx+1,pity,rng:Math.random});
        player.gearPity.boss=roll.pity;
        player.gearDay[key]=hits+1;
        const slot=['weapon','armor','charm','boots'][Math.floor(Math.random()*4)];
        const item=buildDropItem({uid:(Number(player.itemSeq)||0)+1,slot,rar:roll.rar,source:'boss',
          rollAffixes:typeof rollAffixes==='function'?rollAffixes:null});
        if(item){ player.itemSeq=item.uid; player.inventory=player.inventory||[]; player.inventory.push(item); gearDrop=item; }
      }
    }
  }catch(_){}
  const incident=typeof resolveWorldIncident==='function'?resolveWorldIncident(idx):null;
  if(typeof weeklyProgress==='function')weeklyProgress('campaign',1,false);
  delete player.campaignStages[idx];
  return {idx,first,reward,unlockedHero,incident,gearDrop};
}
function hvShowCommittedChapterResult(result,options){
  const ch=DATA.chapters[result.idx];
  ST.mode=null;ST.campaignRoute=null;ST.chapterSettlement=null;
  refreshResbar();navTo('campaign');
  const rr=result.reward;
  let msg=ch.name+' hoàn tất · '+(result.first?'Thưởng chiến dịch: ':'Thưởng chơi lại: ')+'🪙 '+(rr.gold||0)+' · 💎 '+(rr.gems||0);
  if(result.unlockedHero)msg+=' · '+DATA.heroes[result.unlockedHero].name+' gia nhập đội!';
  if(result.incident)msg+=' · Xử lý sự cố: 🪙 '+result.incident.reward.gold+' · 💎 '+result.incident.reward.gems;
  if(result.gearDrop&&typeof itemName==='function')msg+=' · Rơi đồ: '+itemName(result.gearDrop)+' +'+result.gearDrop.lvl;
  toast(msg);
  if(result.first&&result.idx===0)toast('🔓 Mở khoá: 🗼 Thông Thiên Tháp · 🏟 Đấu Trường · 🐋 Săn Boss!');
  if(options?.autoContinue===true){
    const next=DATA.chapters.find(x=>P.unlockedChapters.includes(x.idx)&&!P.clearedChapters.includes(x.idx));
    if(next)setTimeout(()=>startChapter(next.idx,{continuing:true}),520);
  }
}
