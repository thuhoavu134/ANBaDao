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
  const incident=typeof resolveWorldIncident==='function'?resolveWorldIncident(idx):null;
  if(typeof weeklyProgress==='function')weeklyProgress('campaign',1,false);
  delete player.campaignStages[idx];
  return {idx,first,reward,unlockedHero,incident};
}
function hvShowCommittedChapterResult(result,options){
  const ch=DATA.chapters[result.idx];
  ST.mode=null;ST.campaignRoute=null;ST.chapterSettlement=null;
  refreshResbar();navTo('campaign');
  const rr=result.reward;
  let msg=ch.name+' hoàn tất · '+(result.first?'Thưởng chiến dịch: ':'Thưởng chơi lại: ')+'🪙 '+(rr.gold||0)+' · 💎 '+(rr.gems||0);
  if(result.unlockedHero)msg+=' · '+DATA.heroes[result.unlockedHero].name+' gia nhập đội!';
  if(result.incident)msg+=' · Xử lý sự cố: 🪙 '+result.incident.reward.gold+' · 💎 '+result.incident.reward.gems;
  toast(msg);
  if(result.first&&result.idx===0)toast('🔓 Mở khoá: 🗼 Tháp Trắng Đêm · 🏟 Đấu Trường · 🐋 Săn Boss!');
  if(options?.autoContinue===true){
    const next=DATA.chapters.find(x=>P.unlockedChapters.includes(x.idx)&&!P.clearedChapters.includes(x.idx));
    if(next)setTimeout(()=>startChapter(next.idx,{continuing:true}),520);
  }
}
