import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as campaign from '../src/domain/campaign/campaign-view.mjs';
import { prepareFormationChange } from '../src/domain/hero/loadout.mjs';
const ids = ['a','b','c','d','e','f','g'];
const squad = ids.slice(0,6).map((id,i)=>({id,row:i<3?'front':'back'}));
const player = {heroes:Object.fromEntries(ids.map(id=>[id,{owned:true}]))};
const catalog = Object.fromEntries(ids.map(id=>[id,{}]));
test('green tick removes, reserve fills a vacancy, full bench refuses replacement',()=>{
  const before=JSON.stringify(squad);
  const removed=campaign.toggleCampaignHero(squad,'b',ids);
  assert.equal(removed.length,5);
  assert.equal(removed.some(p=>p.id==='b'),false);
  const added=campaign.toggleCampaignHero(removed,'g',ids);
  assert.equal(added.length,6);
  assert.equal(added.find(p=>p.id==='g').row,'front');
  assert.deepEqual(campaign.toggleCampaignHero(squad,'g',ids),squad);
  assert.deepEqual(campaign.toggleCampaignHero(squad,'locked',ids),squad);
  assert.equal(JSON.stringify(squad),before);
});
test('campaign can launch one to six owned heroes, but never empty or duplicate',()=>{
  assert.equal(prepareFormationChange(player,catalog,squad.slice(0,1),{allowPartial:true}).ok,true);
  assert.equal(prepareFormationChange(player,catalog,[],{allowPartial:true}).ok,false);
  assert.equal(prepareFormationChange(player,catalog,[squad[0],squad[0]],{allowPartial:true}).code,'DUPLICATE_HERO');
  assert.equal(prepareFormationChange(player,catalog,squad.slice(0,1)).ok,false,'other modes retain their existing contract');
});
test('drag swap preserves destination rows and never mutates saved records',()=>{
  const moved=campaign.swapCampaignPositions(squad,0,4);
  assert.equal(moved[0].id,'e');assert.equal(moved[0].row,'front');
  assert.equal(moved[4].id,'a');assert.equal(moved[4].row,'back');
  assert.equal(squad[0].id,'a');
  assert.deepEqual(campaign.swapCampaignPositions(squad,0,99),squad);
});

const built = readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
function flowHarness() {
  const context=createContext({P:{unlockedChapters:[0],clearedChapters:[],campaignStages:{},squad:[squad[0]]},
    DATA:{chapters:[{idx:0}],daily:{costCampaign:6}},ST:{},calls:[],timer:null,
    ensureWorld(){},refreshStamina(){},refreshResbar(){},persist(){return true;},toast(){},
    chapterBattleSequence(){return ['first','boss'];},spendStamina(){return true;}});
  context.navTo=route=>context.calls.push(['route',route]);
  context.setTimeout=fn=>{context.timer=fn;};
  context.runBattle=(id,callback)=>{context.calls.push(['battle',id]);context.finish=callback;};
  context.endChapter=options=>context.calls.push(['end',options.autoContinue]);
  runInContext(built.slice(built.indexOf('function startChapter(idx,options={})'),built.indexOf('function startTraining()')),context);
  runInContext('startChapter(0)',context);return context;
}
test('shipped confirm advances the checkpoint then returns to AFK without launching again',()=>{
  const context=flowHarness();context.finish(true,'confirm');
  assert.equal(context.P.campaignStages[0],1);
  assert.deepEqual(context.calls,[['battle','first'],['route','campaign']]);
  assert.equal(context.timer,null);
});
test('shipped next starts the next independent encounter, defeat keeps the checkpoint',()=>{
  const next=flowHarness();next.finish(true,'next');next.timer();
  assert.deepEqual(next.calls,[['battle','first'],['battle','boss']]);
  const loss=flowHarness();loss.finish(false,'next');
  assert.equal(loss.P.campaignStages[0],undefined);assert.equal(loss.timer,null);
  assert.deepEqual(loss.calls,[['battle','first'],['route','campaign']]);
});
test('normalization preserves an intentional single hero through load and combat snapshots',()=>{
  const context=createContext({DATA:{heroes:catalog},P:player,defaultPlayer:()=>({squad})});
  const start=built.indexOf('function normalizeSquad('),end=built.indexOf('\nfunction defaultPlayer()',start);
  runInContext(built.slice(start,end),context);
  context.picks=[squad[0]];
  assert.equal(runInContext('normalizeSquad(picks,P,true).length',context),1);
  assert.equal(runInContext('normalizeSquad([],P,true).length',context),6,'invalid legacy save recovery still works');
});
