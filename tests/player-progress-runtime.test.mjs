import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as progress from '../src/domain/campaign/player-progress.mjs';
import {executeLocalTransaction,settleRewardTransaction} from '../src/domain/transaction/receipt-contract.mjs';
const html=readFileSync('dist/index.html','utf8');
const between=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i,a);return html.slice(i,j);};
const fresh=()=>({gold:500,stamina:120,unlockedChapters:[0],clearedChapters:[],campaignStages:{},flags:{},heroes:{}});
function context(){
 const c={...progress,P:fresh(),ST:{},window:{},toast:()=>{},navTo:()=>{},persist:()=>true,executeLocalTransaction,settleRewardTransaction,applyReward:()=>{},setTimeout:fn=>fn(),DATA:{chapters:Array.from({length:6},(_,idx)=>({idx})),daily:{costCampaign:6}},ensureWorld:()=>{},refreshStamina:()=>{},refreshResbar:()=>{},spendStamina:n=>{c.P.stamina-=n;return true;},chapterBattleSequence:i=>Array.from({length:18},(_,s)=>'lt_seal_'+i+'_'+s),runBattle:(id,cb)=>{c.started=id;c.callback=cb;}};
 vm.createContext(c);vm.runInContext(between('function hvRunCommittedTransaction(', 'function hvApplyClanXp('),c);
 vm.runInContext(readFileSync('src/ui/player-progress-runtime.js','utf8'),c);
 vm.runInContext(between('function startChapter(idx,options={})','function startTraining()'),c);
 return c;
}
test('AC3: built start owner checks level before stamina and blocks Next at threshold',()=>{
 assert.ok(html.includes('hv-player-progress-v1'),'build installs feature');
 const c=context();c.hvEnsurePlayerProgress();c.P.campaignStages[0]=2;c.P.hvPlayerProgress.clears=['0:0','0:1'];
 c.startChapter(0);assert.equal(c.started,undefined);assert.equal(c.P.stamina,120);
 c.P.hvPlayerProgress.xp=100;c.startChapter(0);assert.equal(c.started,'lt_seal_0_2');assert.equal(c.P.stamina,114);
 const d=context();d.hvEnsurePlayerProgress();d.P.campaignStages[0]=1;d.P.hvPlayerProgress.clears=['0:0'];
 d.startChapter(0);d.P.hvPlayerProgress.clears.push('0:1');d.callback(true,'next');
 assert.equal(d.started,'lt_seal_0_1');assert.equal(d.P.stamina,114);assert.equal(d.P.campaignStages[0],2);
});
test('AC4: daily EXP is transaction-bound; duplicates and save failures do not grant',()=>{
 const c=context();c.hvEnsurePlayerProgress();
 const claim=()=>c.hvRunCommittedTransaction({commandId:'daily.quest:test:1',source:'daily.quest',mutate:p=>{p.gold+=10;return {ok:true};}});
 assert.equal(claim().ok,true);assert.equal(c.P.hvPlayerProgress.xp,80);assert.equal(claim().duplicate,true);assert.equal(c.P.hvPlayerProgress.xp,80);
 c.persist=()=>false;const before=JSON.stringify(c.P);
 assert.equal(c.hvRunCommittedTransaction({commandId:'daily.quest:test:2',source:'daily.quest',mutate:p=>{p.gold+=10;return {ok:true};}}).ok,false);
 assert.equal(JSON.stringify(c.P),before);
});
test('AC4: campaign XP checks active battle identity, win and first clear',()=>{
 const c=context();c.hvEnsurePlayerProgress();c.ST={mode:'campaign',chapterIdx:0,campaignBattleIndex:0};
 assert.equal(c.hvCampaignSettlementXp(c.P,{win:false,battleId:'lt_seal_0_0'}),0);
 assert.equal(c.hvCampaignSettlementXp(c.P,{win:true,battleId:'lt_seal_1_0'}),0);
 assert.equal(c.hvCampaignSettlementXp(c.P,{win:true,battleId:'lt_seal_0_0'}),80);
 assert.equal(c.hvCampaignSettlementXp(c.P,{win:true,battleId:'lt_seal_0_0'}),0);
});
test('AC3/4: built UI and AFK grant are inside existing handlers',()=>{
 assert.match(html,/data-player-level/);assert.match(html,/data-player-gate/);assert.match(html,/data-afk-player-xp/);
 const claim=between('function grantSceneClaim()', 'function sceneClick(');
 assert.match(claim,/playerXp = hvGrantAfkXp/);assert.ok(claim.indexOf('playerXp = hvGrantAfkXp')>claim.indexOf('mutate: draft'));
 assert.match(html,/if \(!hvCheckCampaignEntry\(idx\)\) return/);
 assert.match(html,/playerXp:hvCampaignSettlementXp\(player,payload\)/);
});

test('AC1: production lore produces 6×18 stable encounters and forwards Next',()=>{
 const c={DATA:{encounters:{template:[{id:'m',stats:{hp:100,atk:20,def:10,spd:90}}]},heroes:{}},P:{},ST:{mode:null},chapterBattleSequence:()=>['template'],runBattle:(id,cb)=>cb(true,'next'),toast:()=>{},persist:()=>true,refreshResbar:()=>{}};
 vm.createContext(c);vm.runInContext(between('  const SEAL_STAGES = 18;', '  function pickShardHero()'),c);vm.runInContext('expandSeals()',c);
 const ids=Array.from({length:6},(_,i)=>c.chapterBattleSequence(i)).flat();assert.equal(new Set(ids).size,108);
 assert.ok(ids.every(id=>c.DATA.encounters[id].length>0));let action;c.runBattle(ids[0],(win,next)=>action=next);assert.equal(action,'next');
});

test('AC4: real AFK claim credits EXP together with chest reset, including save rollback',async()=>{
 const afk=await import('../src/domain/afk/afk-chest.mjs');
 const c=context();Object.assign(c,afk);c.hvEnsurePlayerProgress();
 c.P.hvAfkChest=afk.createAfkChestState({now:1000});c.Date={now:()=>3601000};
 const el={close(){},showModal(){},insertAdjacentHTML(){}};
 Object.assign(c,{sceneState:{active:true,claiming:false,root:{querySelector:()=>el}},ensureSceneChest:()=>c.P.hvAfkChest,updateSceneNumbers:()=>{},sceneRewards:[],sceneNumber:String});
 c.window.HonVietTransaction={commit:c.hvRunCommittedTransaction};
 vm.runInContext(between('function grantSceneClaim()', 'function sceneClick('),c);
 c.persist=()=>false;const before=JSON.stringify(c.P);c.grantSceneClaim();assert.equal(JSON.stringify(c.P),before);
 c.persist=()=>true;c.grantSceneClaim();assert.equal(c.P.hvPlayerProgress.xp,240);assert.equal(c.P.hvAfkChest.claimCount,1);assert.equal(c.P.hvAfkChest.storedSeconds,0);
 c.grantSceneClaim();assert.equal(c.P.hvPlayerProgress.xp,240);assert.equal(c.P.hvAfkChest.claimCount,1);
});

test('AC4: actual settlement commit rolls first-clear XP back on save failure',()=>{
 const c=context();c.hvEnsurePlayerProgress();c.ST={mode:'campaign',chapterIdx:0,campaignBattleIndex:0};
 c.safeText=(v,f)=>String(v||f);c.window.HonVietTransaction={commit:c.hvRunCommittedTransaction};
 vm.runInContext(between('function applyLegacyMetaWinHooks(payload)', '\n  function closeOverlay()'),c);
 const payload={win:true,battleId:'lt_seal_0_0',sessionId:'one',units:[]};
 c.persist=()=>false;assert.equal(c.applyLegacyMetaWinHooks(payload),undefined);assert.equal(c.P.hvPlayerProgress.xp,0);assert.deepEqual(Array.from(c.P.hvPlayerProgress.clears),[]);
 c.persist=()=>true;assert.equal(c.applyLegacyMetaWinHooks(payload).ok,true);assert.equal(c.P.hvPlayerProgress.xp,80);
 assert.equal(c.applyLegacyMetaWinHooks(payload).duplicate,true);assert.equal(c.P.hvPlayerProgress.xp,80);
});
