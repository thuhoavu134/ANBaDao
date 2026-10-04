import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const host=readFileSync('dist/index.html','utf8');const contract=readFileSync('src/domain/transaction/receipt-contract.mjs','utf8').replace(/^export /gm,'');const progression=readFileSync('src/domain/campaign/player-progress.mjs','utf8').replace(/^export /gm,'');
function section(start,end){const a=host.indexOf(start),b=host.indexOf(end,a);assert.ok(a>=0&&b>a,start);return host.slice(a,b);}
function harness({stage=1,mode='campaign',mainQuest=false}={}){
 const original={gold:100,revision:0,unlockedChapters:[0],clearedChapters:[],campaignStages:{0:stage},squad:[{id:'hero'}],heroes:{hero:{owned:true}},mastery:{hero:{xp:98,battles:0,wins:0}},hvPlayerProgress:{version:1,xp:80,clears:[],afkRemainder:0}};
 const env={P:original,ST:{mode,chapterIdx:0,campaignBattleIndex:stage},window:{},DATA:{chapters:[{idx:0,name:'Chapter 1'},{idx:1,name:'Chapter 2'}]},safeText:(a,b)=>String(a||b),toast(){},refreshResbar(){},masteryState:id=>c.P.mastery[id],masteryRank:()=>({name:'test'}),chapterBattleSequence:()=>Array.from({length:18},(_,i)=>'stage-'+i),hvQuestXpReward:()=>0};
 let saveMode='ok',saved=null,saves=0;env.persist=()=>{saves++;if(saveMode==='throw')throw new Error('storage failed');c.P=JSON.parse(JSON.stringify(c.P));if(saveMode==='fail')return false;saved=JSON.parse(JSON.stringify(c.P));return true;};
 const c=vm.createContext(env);vm.runInContext(contract+'\n'+progression+'\n'+section('function hvRunCommittedTransaction(','function hvApplyClanXp(')+section('function hvCampaignSettlementXp(','\nwindow.HonVietPlayerProgress')+section('function masteryBattleProgress(','\nfunction ')+section('  function applyLegacyMetaWinHooks(','\n  function closeOverlay'),c);
 c.applyReward=r=>{c.P.gold+=r.gold||0;c.P.gems=(c.P.gems||0)+(r.gems||0);};
 if(mainQuest){const domain=readFileSync('src/domain/quest/main-quest.mjs','utf8').replace(/^export /gm,'');vm.runInContext('const __hvMainQuestModule=(()=>{'+domain+';return {MAIN_QUEST_SCHEMA,mainQuestId,createMainQuestState,normalizeMainQuestState,bootstrapMainQuestState,getCurrentMainQuest,recordMainQuestBattle,claimMainQuest};})();'+section('  const chapterCount = () =>','  const initQuestRuntime = () =>'),c);}
c.window.HonVietTransaction={commit:opts=>c.hvRunCommittedTransaction(opts),read:(p,id)=>c.getTransactionReceipt(p,id)};
 const payload={sessionId:'save-consistency',battleId:'stage-'+stage,win:true,rewards:[{id:'gold',value:180}],units:[{team:'player',hp:100}]};
 return{c,original,payload,setSave:v=>{saveMode=v;},saved:()=>saved,saves:()=>saves};
}
test('gold, XP, mastery and the next stage are durable in the same receipt; duplicate grants nothing',()=>{
 const h=harness();assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).ok);assert.equal(h.saved().campaignStages[0],2);assert.equal(h.saved().gold,280);assert.equal(h.saved().hvPlayerProgress.xp,168);assert.equal(h.saved().mastery.hero.xp,100);
 assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).duplicate);assert.equal(h.c.P.gold,280);assert.equal(h.saves(),1);
});
for(const saveMode of ['fail','throw'])test(`${saveMode}: failed save restores original state and keeps result retryable`,()=>{
 const h=harness();h.setSave(saveMode);let tx;assert.doesNotThrow(()=>{tx=h.c.applyLegacyMetaWinHooks(h.payload);});assert.ok(!tx?.ok);assert.equal(h.c.P,h.original);assert.equal(h.c.P.gold,100);assert.equal(h.c.P.campaignStages[0],1);assert.equal(h.c.P.hvPlayerProgress.xp,80);assert.equal(h.c.P.mastery.hero.xp,98);assert.equal(Object.keys(h.c.P.receipts||{}).length,0);
 h.setSave('ok');assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).ok);assert.equal(h.saved().gold,280);assert.equal(h.saved().campaignStages[0],2);
});
test('an explicit zero gold reward remains zero instead of becoming fallback gold',()=>{
 const h=harness();h.payload.rewards=[{id:'gold',value:0}];assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).ok);assert.equal(h.c.P.gold,100);
});
test('loss, training and final stage do not advance beyond the campaign route',()=>{
 const lost=harness();lost.payload.win=false;lost.c.applyLegacyMetaWinHooks(lost.payload);assert.equal(lost.c.P.campaignStages[0],1);assert.equal(lost.c.P.gold,100);
 const train=harness({mode:'train'});train.c.applyLegacyMetaWinHooks(train.payload);assert.equal(train.c.P.campaignStages[0],1);
 const final=harness({stage:17});final.c.applyLegacyMetaWinHooks(final.payload);assert.equal(final.c.P.campaignStages[0],17);
});

test('main quest bonus and state join the battle receipt before checkpoint advance',()=>{
 const h=harness({stage:2,mainQuest:true});const tx=h.c.applyLegacyMetaWinHooks(h.payload);assert.ok(tx.ok);
 assert.equal(h.saved().gold,430);assert.equal(h.saved().gems,5);assert.equal(h.saved().campaignStages[0],3);assert.equal(h.saved().hvMainQuest.stageIndex,3);
 assert.equal(tx.receipt.delta.gold,330);assert.equal(tx.receipt.delta.gems,5);assert.equal(tx.result.mainQuest.quest.id,'main:0:2');
 assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).duplicate);assert.equal(h.c.P.gold,430);assert.equal(h.saves(),1);
});
test('failure rolls back battle rewards, main quest reward and both cursors together; retry pays once',()=>{
 const h=harness({mainQuest:true});h.setSave('fail');assert.ok(!h.c.applyLegacyMetaWinHooks(h.payload)?.ok);
 assert.equal(h.c.P.gold,100);assert.equal(h.c.P.campaignStages[0],1);assert.equal(h.c.P.hvMainQuest.stageIndex,1);assert.equal(h.c.P.hvMainQuest.claimed.length,0);
 h.setSave('ok');assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).ok);assert.equal(h.saved().gold,415);assert.equal(h.saved().campaignStages[0],2);assert.equal(h.saved().hvMainQuest.stageIndex,2);
 assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).duplicate);assert.equal(h.c.P.gold,415);
});
test('a pending manual main quest claim remains ready on save failure and grants once on retry',()=>{
 const h=harness({mainQuest:true}),api=h.c.window.__HV_MAIN_QUEST_RUNTIME_V1;api.ensure();h.c.P.hvMainQuest.progress=1;
 h.setSave('throw');assert.equal(api.claimReady(),false);assert.equal(h.c.P.gold,100);assert.equal(api.current().ready,true);
 h.setSave('ok');assert.equal(api.claimReady(),true);assert.equal(h.saved().gold,235);assert.equal(api.current().stageIndex,2);
 assert.equal(api.claimReady(),false);assert.equal(h.c.P.gold,235);
});
test('legacy main-quest callback and integrated result cannot award the same quest twice',()=>{
 const h=harness({mainQuest:true}),api=h.c.window.__HV_MAIN_QUEST_RUNTIME_V1;
 assert.equal(api.onBattleResult(h.payload),true);assert.equal(h.c.P.gold,235);
 assert.ok(h.c.applyLegacyMetaWinHooks(h.payload).ok);assert.equal(h.c.P.gold,415);assert.equal(api.onBattleResult(h.payload),false);assert.equal(h.c.P.gold,415);
});
