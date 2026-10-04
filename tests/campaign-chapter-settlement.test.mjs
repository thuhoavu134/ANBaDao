import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const host=readFileSync('dist/index.html','utf8');
const domain=readFileSync('src/domain/transaction/receipt-contract.mjs','utf8').replace(/^export /gm,'');
const runtime=readFileSync('src/ui/campaign-chapter-settlement-runtime.js','utf8');
const start=host.indexOf('function hvRunCommittedTransaction('),end=host.indexOf('function hvApplyClanXp(',start);
function harness(){
 const original={gold:100,gems:0,revision:0,campaignStages:{0:17},clearedChapters:[],unlockedChapters:[0],heroes:{h:{owned:false}},flags:{},weekly:{progress:0},clan:{xp:0},world:{resolved:false}};
 let fail=false,saved,saves=0;
 const c=vm.createContext({P:original,ST:{mode:'campaign',chapterIdx:0,campaignBattleIndex:17},DATA:{chapters:[{idx:0,name:'C1',reward:{gold:1000,gems:20,shards:5,shardHero:'h'},unlockHero:'h'},{idx:1,name:'C2'}],heroes:{h:{name:'H'}}},window:{},chapterBattleSequence:()=>Array.from({length:18},(_,i)=>'s'+i),worldBattleMods:()=>({rewardGold:1.2}),toast(){}});
 c.applyReward=r=>{c.P.gold+=r.gold||0;c.P.gems+=r.gems||0;c.P.shards=(c.P.shards||0)+(r.shards||0);};
 c.hvApplyClanXp=n=>{c.P.clan.xp+=n;};c.weeklyProgress=(type,n,save)=>{assert.equal(save,false);c.P.weekly.progress+=n;};
 c.resolveWorldIncident=()=>{if(c.P.world.resolved)return null;c.P.world.resolved=true;const reward={gold:160,gems:8};c.applyReward(reward);return{reward};};
 c.persist=()=>{saves++;c.P=JSON.parse(JSON.stringify(c.P));if(fail)return false;saved=JSON.parse(JSON.stringify(c.P));return true;};
 vm.runInContext(domain+'\n'+host.slice(start,end)+'\n'+runtime,c);
 const payload={win:true,battleId:'s17'};
 const settle=id=>c.hvRunCommittedTransaction({commandId:id,source:'battle.settlement',reward:{gold:180},mutate:p=>({ok:true,chapter:c.hvApplyCampaignChapterSettlement(p,payload)})});
 return{c,original,payload,settle,fail:v=>{fail=v;},saved:()=>saved,saves:()=>saves};
}
test('chapter reward, roster unlock, next chapter, clan, incident and weekly progress save once',()=>{
 const h=harness(),tx=h.settle('a');assert.ok(tx.ok);const p=h.saved();assert.equal(p.gold,1640);assert.equal(p.gems,28);assert.equal(p.shards,5);assert.equal(p.heroes.h.owned,true);assert.deepEqual(p.unlockedChapters,[0,1]);assert.deepEqual(p.clearedChapters,[0]);assert.equal(p.campaignStages[0],undefined);assert.equal(p.clan.xp,25);assert.equal(p.weekly.progress,1);assert.ok(h.settle('a').duplicate);assert.equal(h.saves(),1);
});
test('failed final-stage save restores every chapter mutation and retry grants once',()=>{
 const h=harness();h.fail(true);assert.equal(h.settle('a').code,'SAVE_WRITE_FAILED');assert.equal(h.c.P,h.original);assert.equal(h.c.P.gold,100);assert.equal(h.c.P.heroes.h.owned,false);assert.equal(h.c.P.world.resolved,false);assert.equal(h.c.P.campaignStages[0],17);assert.equal(h.c.P.weekly.progress,0);h.fail(false);assert.ok(h.settle('a').ok);assert.equal(h.saved().gold,1640);
});
test('new replay pays only replay gold and does not repeat unlock or clan XP',()=>{
 const h=harness();h.settle('a');assert.ok(h.settle('b').ok);assert.equal(h.saved().gold,2070);assert.equal(h.saved().gems,28);assert.equal(h.saved().clan.xp,25);assert.equal(h.saved().weekly.progress,2);
});
test('loss, other mode, non-final or mismatched battle cannot settle a chapter',()=>{
 for(const mutate of [h=>h.payload.win=false,h=>h.c.ST.mode='train',h=>h.c.ST.campaignBattleIndex=1,h=>h.payload.battleId='wrong']){const h=harness();mutate(h);assert.equal(h.c.hvApplyCampaignChapterSettlement(h.c.P,h.payload),null);assert.equal(h.c.P.gold,100);}
});
test('generated final-result callback renders the committed chapter without saving again',()=>{
 assert.ok(host.includes(runtime));assert.match(host,/chapter:typeof hvApplyCampaignChapterSettlement/);assert.match(host,/ST.chapterSettlement=transaction.result\?\.chapter\|\|null/);
 const h=harness(),tx=h.settle('a');h.c.refreshResbar=()=>{};h.c.navTo=()=>{};h.c.setTimeout=()=>{};h.c.hvShowCommittedChapterResult(tx.result.chapter,{autoContinue:true});assert.equal(h.saves(),1);assert.equal(h.c.ST.mode,null);
});
