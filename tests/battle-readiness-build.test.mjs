import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('dist/battle.html','utf8');
const owner='  async function __hvPerformAction3qAdapter(actor, action, target) {';
const begin=html.indexOf(owner),end=html.indexOf('\n  function statusLabel(',begin);
assert.ok(begin>=0&&end>begin,'real generated action owner must exist');
const actionSource=html.slice(begin,end);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(){
  const gate=deferred();let releases=0,entered=0,prepared=0,failures=0;
  const actor={id:'a',hp:100,energy:80},state={battleId:1,mode:'battle',currentId:'a',locked:false,actionCount:0};
  const context=vm.createContext({state,Core:{canUseAction:()=>true},isLinhDong:()=>false,isBachDien:()=>false,
    document:{getElementById:()=>null},clearTargets:()=>{entered++;throw new Error('ACTION_BODY_REACHED');},
    __hvBattleAssets:{prepare:()=>{prepared++;return gate.promise;}},
    __hvBattleAssetError:()=>{failures++;state.locked=false;},
  });
  const run=vm.runInContext(actionSource+';__hvPerformAction3qAdapter',context);
  return {actor,state,gate,run,get releases(){return releases;},get entered(){return entered;},get prepared(){return prepared;},get failures(){return failures;},
    ready:()=>gate.resolve({signal:new AbortController().signal,release:()=>{releases++;}})};
}
test('final battle gates the real action before energy debit and keeps the same iframe payload',()=>{
  assert.equal(html.split('/* HV_BATTLE_ASSET_READINESS_V1 */').length-1,1);
  assert.ok(actionSource.indexOf('__hvBattleAssets.prepare')<actionSource.indexOf('__hvDebitActionEnergy3qAdapter(actor, cost'));
  assert.ok(actionSource.indexOf('__hvBattleAssets.prepare')>actionSource.indexOf('state.locked = true'));
  const index=readFileSync('dist/index.html','utf8'),encoded=index.match(/const BATTLE_HTML_BASE64 = "([A-Za-z0-9+/=]+)";/);
  assert.ok(encoded);assert.equal(Buffer.from(encoded[1],'base64').toString('utf8'),html);
});
test('actual generated action does not begin or spend energy while pictures are loading',async()=>{
  const f=fixture();const pending=f.run(f.actor,'basic',{});
  assert.equal(f.prepared,1);assert.equal(f.entered,0);assert.equal(f.actor.energy,80);assert.equal(f.state.actionCount,0);
  assert.equal(f.state.locked,true);f.ready();await assert.rejects(pending,/ACTION_BODY_REACHED/);
  assert.equal(f.entered,1);assert.equal(f.releases,1);assert.equal(f.actor._hvAssetLease,undefined);
});
test('actual generated action rejects duplicate clicks while waiting',async()=>{
  const f=fixture();const first=f.run(f.actor,'basic',{});await f.run(f.actor,'basic',{});assert.equal(f.prepared,1);
  f.ready();await assert.rejects(first,/ACTION_BODY_REACHED/);assert.equal(f.releases,1);
});
test('actual generated action leaves energy untouched and unlocks retry on asset failure',async()=>{
  const f=fixture();const first=f.run(f.actor,'ultimate',{});f.gate.reject(new Error('network'));
  await first;assert.equal(f.failures,1);assert.equal(f.entered,0);assert.equal(f.actor.energy,80);assert.equal(f.state.locked,false);
});
test('hero finish no longer drops decoded cast/VFX images before return',()=>{
  for(const title of ['LinhDong','BachDien']){
    const start=html.indexOf('function finish'+title+'Action('),stop=html.indexOf('function play'+title+'Sfx(',start);
    assert.ok(start>=0&&stop>start);
    assert.doesNotMatch(html.slice(start,stop),/_LOADER\.release\(/);
    assert.match(html.slice(start,stop),/info\.finished=true/);
  }
});
test('both documents expose preparation on the original shared audio bus',()=>{
  for(const source of [html,readFileSync('dist/index.html','utf8')]){
    assert.match(source,/window\.HonVietSfx = \{ play, prepare, unlock,/);
    assert.match(source,/options\.signal\?\.aborted/);
    assert.match(source,/sfxLastResult', 'expired'/);
  }
});
test('current S+ readiness build keeps native atlas dimensions on the 96 MiB iOS budget',()=>{
  const report=JSON.parse(readFileSync('dist/battle-readiness-assets.json','utf8'));
  assert.deepEqual(report,[]);
});
