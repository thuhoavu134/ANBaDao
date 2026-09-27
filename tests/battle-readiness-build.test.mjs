import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { battleActionWorkingSetBytes } from '../scripts/battle-asset-readiness-v1.mjs';
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
test('final battle gates the real action before energy debit and serves battle.html standalone',()=>{
  assert.equal(html.split('/* HV_BATTLE_ASSET_READINESS_V1 */').length-1,1);
  assert.ok(actionSource.indexOf('__hvBattleAssets.prepare')<actionSource.indexOf('__hvDebitActionEnergy3qAdapter(actor, cost'));
  assert.ok(actionSource.indexOf('__hvBattleAssets.prepare')>actionSource.indexOf('state.locked = true'));
  const index=readFileSync('dist/index.html','utf8');
  assert.match(index,/const BATTLE_HTML_BASE64 = "";/);
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
test('generated S+ action atlas variants fit the complete decoded working set',()=>{
  const report=JSON.parse(readFileSync('dist/battle-readiness-assets.json','utf8'));
  const sets=[
    ['run-atlas.webp','basic-atlas.webp','skill1_vfx-atlas.webp'],
    ['run-atlas.webp','ultimate-atlas.webp','ultimate_vfx-atlas.webp']
  ];
  for(const profile of ['desktop','mobile']){
    const files=new Map(report.filter(item=>item.source.startsWith('assets/characters/linh-dong/')&&item.profile===profile).map(item=>[item.source.split('/').at(-1),item.decodedAfter]));
    assert.ok(files.size>0,`${profile} working-set variants are generated`);
    for(const set of sets){
      const bytes=set.reduce((sum,file)=>sum+(files.get(file)||0),0);
      assert.ok(bytes>0);
      assert.ok(bytes<=(profile==='mobile'?96:128)*1024*1024,`${profile} ${set.join('+')} = ${bytes} bytes`);
    }
  }
});


test('generated atlas size accounts for pinned idle art plus the complete action working set', () => {
  const files = ['idle-atlas.webp', 'run-atlas.webp', 'basic-atlas.webp', 'skill1_vfx-atlas.webp',
    'ultimate-atlas.webp', 'ultimate_vfx-atlas.webp'];
  const atlases = Object.fromEntries(files.map((file, index) => [file, { width: (index + 2) * 100, height: 100 }]));
  const expected = Math.max(
    ['idle-atlas.webp', 'run-atlas.webp', 'basic-atlas.webp', 'skill1_vfx-atlas.webp'].reduce((sum, file) => sum + atlases[file].width * atlases[file].height * 4, 0),
    ['idle-atlas.webp', 'run-atlas.webp', 'ultimate-atlas.webp', 'ultimate_vfx-atlas.webp'].reduce((sum, file) => sum + atlases[file].width * atlases[file].height * 4, 0),
  );
  assert.equal(battleActionWorkingSetBytes(atlases), expected);
});
