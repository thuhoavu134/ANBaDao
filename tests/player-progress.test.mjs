import test from 'node:test';
import assert from 'node:assert/strict';
import * as p from '../src/domain/campaign/player-progress.mjs';
const fresh=()=>({unlockedChapters:[0],clearedChapters:[],campaignStages:{},gold:500,heroes:{a:{level:30}}});
test('AC1: 108 ordered gates, cap60, monotonic XP and invalid coordinates fail closed',()=>{
 const gates=Array.from({length:108},(_,n)=>p.hvStageLevel(Math.floor(n/18),n%18));
 assert.equal(gates[0],1);assert.equal(gates.at(-1),60);
 assert.deepEqual(gates.slice(0,18),[1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,10]);
 assert.equal(p.hvStageLevel(6,0),null);assert.equal(p.hvStageLevel(0,18),null);
 for(let l=1;l<=60;l++)assert.equal(p.hvPlayerLevel(p.hvLevelXp(l)),l);
 assert.equal(p.hvPlayerLevel(Infinity),1);assert.equal(p.hvPlayerLevel(1e12),60);
});
test('AC2: migration preserves three legacy histories and only runs once',()=>{
 for(const state of [fresh(),{...fresh(),unlockedChapters:[0,1],clearedChapters:[0],campaignStages:{1:9}},{...fresh(),unlockedChapters:[0,1,2,3,4,5],clearedChapters:[0,1,2,3,4,5]}]){
 const before=structuredClone(state);p.hvMigratePlayerProgress(state);
 assert.deepEqual(state.heroes,before.heroes);assert.equal(state.gold,500);assert.deepEqual(state.campaignStages,before.campaignStages);
 const once=structuredClone(state);p.hvMigratePlayerProgress(state);assert.deepEqual(state,once);
 }
 const s={...fresh(),unlockedChapters:[0,1],clearedChapters:[0],campaignStages:{1:9}};p.hvMigratePlayerProgress(s);
 assert.equal(p.hvPlayerLevel(s.hvPlayerProgress.xp),15);assert.equal(s.hvPlayerProgress.clears.length,27);
 assert.equal(p.hvCampaignGate(s,1,9).ok,true);assert.equal(p.hvCampaignGate(s,0,17).ok,true);
});
test('AC3: level and previous win both required; changing heroes cannot change access',()=>{
 const s=fresh();p.hvMigratePlayerProgress(s);
 assert.equal(p.hvCampaignGate(s,0,0).ok,true);assert.equal(p.hvCampaignGate(s,0,1).code,'PREVIOUS_STAGE');
 p.hvRecordCampaignXp(s,0,0);s.campaignStages[0]=1;
 assert.equal(p.hvCampaignGate(s,0,1).ok,true);
 s.hvPlayerProgress.xp=p.hvLevelXp(60);assert.equal(p.hvCampaignGate(s,1,0).ok,false);
 s.unlockedChapters.push(1);assert.equal(p.hvCampaignGate(s,1,0).code,'PREVIOUS_CHAPTER');
 const low=fresh();p.hvMigratePlayerProgress(low);low.hvPlayerProgress.clears=['0:0','0:1'];low.campaignStages[0]=2;
 assert.equal(p.hvCampaignGate(low,0,2).code,'PLAYER_LEVEL');
 low.heroes={z:{level:1}};assert.equal(p.hvCampaignGate(low,0,2).code,'PLAYER_LEVEL');
});
test('L147-T1: campaign cursor after a win unlocks the next stage even if clears lagged',()=>{
 const s=fresh();p.hvMigratePlayerProgress(s);
 assert.equal(p.hvCampaignGate(s,0,0).ok,true);
 assert.equal(p.hvCampaignGate(s,0,1).code,'PREVIOUS_STAGE');
 s.campaignStages[0]=1;
 assert.equal(p.hvCampaignGate(s,0,1).ok,true,'Ải 1-2 opens when cursor already advanced past Ải 1-1');
 assert.equal(p.hvCampaignGate(s,0,2).code,'PREVIOUS_STAGE');
 const stuck=fresh();p.hvMigratePlayerProgress(stuck);
 assert.equal(p.hvCampaignGate(stuck,0,1).code,'PREVIOUS_STAGE');
});
test('L147-T2: first stage stays open; later chapters still need the previous chapter',()=>{
 const s=fresh();p.hvMigratePlayerProgress(s);
 assert.equal(p.hvCampaignGate(s,0,0).ok,true);
 s.campaignStages[0]=1;
 assert.equal(p.hvCampaignGate(s,1,0).code,'PREVIOUS_CHAPTER');
 s.clearedChapters.push(0);s.unlockedChapters.push(1);
 s.hvPlayerProgress.xp=p.hvLevelXp(11);
 assert.equal(p.hvCampaignGate(s,1,0).ok,true);
});
test('AC4: first clear once, AFK fractional/cap and non-reward sources',()=>{
 const s=fresh();p.hvMigratePlayerProgress(s);
 assert.equal(p.hvRecordCampaignXp(s,0,0),80);assert.equal(p.hvRecordCampaignXp(s,0,0),0);
 for(let n=0;n<15;n++)p.hvGrantAfkXp(s,1);
 assert.equal(s.hvPlayerProgress.xp,81);
 const start=s.hvPlayerProgress.xp;p.hvGrantAfkXp(s,999999);assert.equal(s.hvPlayerProgress.xp-start,3600);
 assert.equal(p.hvQuestXp('daily.quest'),80);assert.equal(p.hvQuestXp('daily.weekly'),240);assert.equal(p.hvQuestXp('daily.idle'),0);
});

test('AC1/3: all108 stages reachable with claimed EXP and previous wins; final cap60',()=>{
 const s=fresh();p.hvMigratePlayerProgress(s);
 for(let c=0;c<6;c++){
  for(let stage=0;stage<18;stage++){
   const need=p.hvLevelXp(p.hvStageLevel(c,stage))-s.hvPlayerProgress.xp;
   if(need>0)p.hvAddPlayerXp(s,need);
   assert.equal(p.hvCampaignGate(s,c,stage).ok,true,`${c}:${stage}`);
   p.hvRecordCampaignXp(s,c,stage);s.campaignStages[c]=stage+1;
  }
  s.clearedChapters.push(c);s.unlockedChapters.push(c+1);delete s.campaignStages[c];
 }
 assert.equal(s.hvPlayerProgress.clears.length,108);assert.equal(p.hvPlayerLevel(s.hvPlayerProgress.xp),60);
});
