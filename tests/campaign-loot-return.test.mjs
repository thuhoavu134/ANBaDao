import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { settleRewardTransaction, getTransactionReceipt } from '../src/domain/transaction/receipt-contract.mjs';
import * as xp from '../src/domain/campaign/player-progress.mjs';

const host = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const lore = readFileSync(new URL('../src/ui/lore-luc-than-runtime.js', import.meta.url), 'utf8');
const login = readFileSync(new URL('../src/ui/login-gate-runtime.js', import.meta.url), 'utf8');
function section(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, start);
  return text.slice(a, b);
}
function harness(stage = 1) {
  let fail = false, callback, draws = 0;
  const P = { gold:500, gems:0, shards:{}, revision:0, heroes:{a:{owned:true},b:{owned:true}}, squad:[] };
  const ST = { mode:'campaign', chapterIdx:0, campaignBattleIndex:stage };
  const window = {};
  const ctx = vm.createContext({ ...xp, P, ST, window, console, Math:Object.assign(Object.create(Math), {random:()=>{draws++;return .8;}}),
    CHAPTERS:Array(6),DATA:{heroes:{a:{name:'A'},b:{name:'B'}},encounters:{},chapters:[{reward:{gold:900,gems:80}}]},
    chapterBattleSequence:()=>[], runBattle:(id,cb)=>{callback=cb;}, safeText:(a,b)=>String(a||b),
    toast(){}, persist:()=>!fail, refreshResbar(){}, masteryBattleProgress:()=>[], hvCampaignSettlementXp:()=>0 });
  vm.runInContext(section(lore, '  const SEAL_STAGES', '  function pickShardHero'), ctx);
  ctx.expandSeals();
  window.HonVietTransaction = { read:getTransactionReceipt, commit:opts=>{
    const before=JSON.stringify(P);
    const tx=settleRewardTransaction({...opts,state:P,applyReward:reward=>{
      P.gold+=reward.gold||0; P.gems+=reward.gems||0;
      if(reward.shards)P.shards[reward.shardHero]=(P.shards[reward.shardHero]||0)+reward.shards;
    }});
    if(tx.ok&&!tx.duplicate&&fail){for(const key of Object.keys(P))delete P[key];Object.assign(P,JSON.parse(before));return {ok:false};}
    return tx;
  }};
  vm.runInContext(section(host, '  function applyLegacyMetaWinHooks(', '\n  function closeOverlay'),ctx);
  const payload={sessionId:'loot-test',battleId:'lt_seal_0_'+stage,win:true,rewards:[{id:'gold',value:180}],units:[]};
  return {ctx,P,ST,window,payload,fail:v=>{fail=v;},draws:()=>draws,
    settle:()=>ctx.applyLegacyMetaWinHooks(payload),
    finishIframe(){ctx.runBattle(payload.battleId,()=>{});const tx=ctx.applyLegacyMetaWinHooks(payload);if(tx?.ok)callback(true,'confirm');return tx;}};
}

test('full-page and iframe settlement both award the existing stage gold exactly once',()=>{
  for(const iframe of [false,true]){
    const h=harness(); const tx=iframe?h.finishIframe():h.settle();
    assert.equal(tx.ok,true);assert.equal(h.P.gold,766); // 500 + battle 180 + stage 86
    assert.equal(tx.receipt.delta.gold,266);
    assert.equal(h.settle().duplicate,true);assert.equal(h.P.gold,766);
  }
});
test('failed save rolls back stage gold and gems together; retry commits once',()=>{
  const h=harness(4);h.fail(true);assert.ok(!h.settle()?.ok);assert.equal(h.P.gold,500);assert.equal(h.P.gems,0);
  h.fail(false);const tx=h.settle();assert.equal(h.P.gold,786);assert.equal(h.P.gems,6);assert.equal(tx.receipt.delta.gems,6);
  h.settle();assert.equal(h.P.gems,6);
});
test('stage shards use the existing hero pool and duplicate delivery does not roll or grant twice',()=>{
  const h=harness(3);const tx=h.settle();assert.deepEqual(h.P.shards,{b:4});assert.equal(tx.receipt.delta['shards:b'],4);
  const draws=h.draws();h.settle();assert.equal(h.draws(),draws);assert.deepEqual(h.P.shards,{b:4});
});
test('defeat, other modes and a mismatched stage cannot receive seal loot',()=>{
  const loss=harness();loss.payload.win=false;loss.settle();assert.equal(loss.P.gold,500);
  const training=harness();training.ST.mode='train';training.settle();assert.equal(training.P.gold,680);
  const mismatch=harness();mismatch.payload.battleId='lt_seal_0_9';mismatch.settle();assert.equal(mismatch.P.gold,680);
});
test('visible stage reward rows match the settlement owner, without changing player state',()=>{
  const h=harness(4);const before=JSON.stringify(h.P);
  Object.assign(h.ctx,{rewardPreview:[{id:'gold',value:180}],battleId:h.payload.battleId});
  vm.runInContext(section(host,'    const rewardDetails=rewardPreview.map','    return {\n      resultProgress:')+'\nglobalThis.rows=rewardDetails;',h.ctx);
  assert.equal(h.ctx.rows.find(r=>r.name==='Vàng vượt ải')?.value,106);
  assert.equal(h.ctx.rows.find(r=>r.name==='Ngọc vượt ải')?.value,6);
  assert.equal(JSON.stringify(h.P),before);
});

function loginHarness({account='guest@tmp',marker=account,guest=true,query='?hvBattleReturn=1',cloud=async()=>{}}={}){
  let hidden=0,errors=[];
  const ctx=vm.createContext({URLSearchParams,NET:{user:account,guest,token:guest?'':'existing'},
    location:{search:query},ENTERED_KEY:'hv.login.entered',sessionStorage:{getItem:()=>marker},
    window:{HonVietCloud:{ready:cloud}},canEnter:()=>Boolean(account),hasSession:()=>!guest,
    hideLogin:()=>{hidden++;},setErr:msg=>errors.push(msg)});
  vm.runInContext(section(login,'  async function resumeBattleReturn()', '  async function enterGame()'),ctx);
  return{ctx,hidden:()=>hidden,errors};
}
test('returning battle resumes only the same previously entered account in this tab',async()=>{
  const h=loginHarness();assert.equal(await h.ctx.resumeBattleReturn(),true);assert.equal(h.hidden(),1);
  for(const opts of [{marker:''},{marker:'another@tmp'},{account:''},{query:''}]){
    const blocked=loginHarness(opts);assert.equal(await blocked.ctx.resumeBattleReturn(),false);assert.equal(blocked.hidden(),0);
  }
});
test('signed-in battle return awaits cloud readiness and never opens after cloud failure',async()=>{
  let ready;const h=loginHarness({guest:false,cloud:()=>new Promise(resolve=>{ready=resolve;})});
  const waiting=h.ctx.resumeBattleReturn();assert.equal(h.hidden(),0);ready();assert.equal(await waiting,true);
  const failed=loginHarness({guest:false,cloud:async()=>{throw Error('offline');}});
  assert.equal(await failed.ctx.resumeBattleReturn(),false);assert.equal(failed.hidden(),0);assert.equal(failed.errors.length,1);
});

test('the progression build preserves Next through the remaining lore callback',()=>{
  const build=readFileSync(new URL('../scripts/player-progress-v1.mjs',import.meta.url),'utf8');
  const ctx=vm.createContext({assert});
  vm.runInContext('let html='+JSON.stringify(lore)+';'+
    'function patch(from,to){assert.equal(html.split(from).length,2);html=html.replace(from,to);}',ctx);
  vm.runInContext(section(build,'// Preserve Next','// UI uses existing'),ctx);
  const built=vm.runInContext('html',ctx);assert.doesNotThrow(()=>new Function(built));
  assert.ok(built.includes('cb(win,resultAction)'));assert.ok(!built.includes('runBattleWithSealLoot'));
});
test('seal preview preserves existing amounts at every chapter and stage',()=>{
  const h=harness();
  for(let chapterIdx=0;chapterIdx<6;chapterIdx++)for(let campaignBattleIndex=0;campaignBattleIndex<18;campaignBattleIndex++){
    const c={mode:'campaign',chapterIdx,campaignBattleIndex};
    const loot=h.window.HonVietSealLoot.preview('lt_seal_'+chapterIdx+'_'+campaignBattleIndex,c);
    assert.equal(loot.gold,Math.round(80*(1+chapterIdx*.4+campaignBattleIndex*.08)));
    assert.equal(loot.gems,(campaignBattleIndex+1)%5===0&&campaignBattleIndex!==17?6+chapterIdx*2:0);
    assert.equal(loot.shards,(campaignBattleIndex+1)%4===0&&campaignBattleIndex!==17?4+chapterIdx:0);
  }
});
test('a failed shard save retains its draw for retry in the same battle',()=>{
  const h=harness(3);h.fail(true);h.settle();assert.deepEqual(h.P.shards,{});const draws=h.draws();
  h.fail(false);h.settle();assert.equal(h.draws(),draws);assert.deepEqual(h.P.shards,{b:4});
});
