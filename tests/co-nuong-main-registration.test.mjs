import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {patchCoNuongMainIndex} from '../scripts/co-nuong-main-integration.mjs';

const fixture = [
  'const DATA={heroes:{ong_hang_pho:{name:"Ông Phở"}}};',
  'const CHARACTER_MANIFEST={};',
  'let P=null, MEMORY_ONLY=false;',
  'function defaultPlayer(){',
  ' const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,stars:1};',
  ' return {heroes};',
  '}',
  'function migrateSave(p){ for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,stars:1};',
  ' return p;',
  '}',
  'const OFFICIAL_ROSTER_12_IDS=Object.freeze(["ong_hang_pho"]);'
].join('\n');
function inspect(){
  const patched=patchCoNuongMainIndex(fixture);
  const js=patched+'\nglobalThis.result={definition:DATA.heroes.co_nuong,art:CHARACTER_MANIFEST.co_nuong,roster:OFFICIAL_ROSTER_12_IDS,defaultSave:defaultPlayer(),migrate:migrateSave};';
  const scope={};vm.runInNewContext(js,scope);return {patched,scope};
}
test('Cổ Nương is registered in the real main-game catalogue and portrait registry',()=>{
  const {scope}=inspect();
  assert.equal(scope.result.definition.name,'Cổ Nương');
  assert.equal(scope.result.definition.he,'soul');
  assert.equal(scope.result.art.assets.card,'assets/characters/co-nuong/avatar.webp');
  assert.ok(scope.result.roster.includes('co_nuong'));
  assert.equal(scope.result.defaultSave.heroes.co_nuong.owned,true);
});
test('Existing player data remains intact and obtains the hero once',()=>{
  const {scope}=inspect();
  const original={heroes:{ong_hang_pho:{owned:true,level:23,stars:5}},flags:{unrelated:true},squad:[{id:'ong_hang_pho',row:'front'}],gold:1234};
  const migrated=scope.result.migrate(original);
  assert.equal(migrated.heroes.co_nuong.owned,true);
  assert.equal(migrated.heroes.ong_hang_pho.level,23);
  assert.equal(migrated.gold,1234);
  assert.equal(migrated.squad.length,1);
  assert.equal(migrated.flags.unrelated,true);
  migrated.heroes.co_nuong.owned=false;
  scope.result.migrate(migrated);
  assert.equal(migrated.heroes.co_nuong.owned,false,'subsequent migrations must not override saved ownership');
});
test('Build patch rejects duplicate installation or an unexpected owner shape',()=>{
  const {patched}=inspect();
  assert.throws(()=>patchCoNuongMainIndex(patched),/CO_NUONG_ALREADY_PATCHED/);
  assert.throws(()=>patchCoNuongMainIndex(fixture.replace('let P=null, MEMORY_ONLY=false;','')),/CO_NUONG_MAIN_ANCHOR/);
});

test('Cổ Nương registration survives save-contract-v1 migration header injection',()=>{
  const liveFixture=fixture.replace(
    'function migrateSave(p){',
    [
      'function validateSaveObject(p){return {ok:!!p?.heroes};}',
      'function buildRecoveryPlayer(){return {heroes:{}};}',
      'function migrateSaveObject(p){return {...p};}',
      'function migrateSave(p){',
      ' const saveValidation=validateSaveObject(p);',
      ' if(!saveValidation.ok) return buildRecoveryPlayer(saveValidation);',
      ' p = migrateSaveObject(p);'
    ].join('\n')
  );
  const patched=patchCoNuongMainIndex(liveFixture);
  const migrate=vm.runInNewContext(patched+'\n globalThis.migrate=migrateSave; migrate;', {});
  const save={heroes:{ong_hang_pho:{owned:true,level:12,stars:3}},flags:{unrelated:true},gold:567};
  const next=migrate(save);
  assert.equal(next.heroes.co_nuong.owned,true);
  assert.equal(next.heroes.ong_hang_pho.level,12);
  assert.equal(next.flags.unrelated,true);
  assert.equal(next.gold,567);
  assert.ok(patched.indexOf('p = migrateSaveObject(p);') < patched.indexOf('coNuongStarter20261018'));
});

