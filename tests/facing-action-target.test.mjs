import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import Core from '../src/domain/combat/hon-viet-core.mjs';
const html=fs.readFileSync('dist/battle.html','utf8');
function extract(name){const match=new RegExp('(async )?function '+name+'\\(').exec(html);assert.ok(match,name);const start=match.index;for(let end=start;(end=html.indexOf('}',end+1))>=0;){const source=html.slice(start,end+1);try{new vm.Script('('+source+')');return source;}catch{}}throw Error(name);}
const unit=(team,slot,hp=100)=>({id:team+slot,team,slot,hp,maxHp:100,statuses:[],energy:100-slot});
function harness(team='player',slot=1,kind='damage'){
 const actor={...unit(team,slot),skillKind:kind,ultimateKind:kind},other=team==='player'?'enemy':'player';
 const enemies=[unit(other,0,1),unit(other,1),unit(other,2),unit(other,4)],ally=unit(team,4,10),seen=[];
 const box=vm.createContext({Core,TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',state:{enemyAdaptive:{active:'ragehunt'}},
  living:t=>t===team?[actor,ally]:enemies.filter(u=>u.hp>0),enemiesOf:()=>enemies.filter(u=>u.hp>0),splusOwnsActor:u=>u.kitVersion==='splus42-v2',splusCombat:()=>null,
  isLinhDong:()=>false,isBachDien:()=>false,isDinhLoi:()=>false,isAuthoredHero:()=>false,window:{},__hvPerformAction3qAdapter:async(a,act,t)=>{seen.push(t?.id);return t;},nemViStacks:()=>0});
 for(const name of ['actionKind','actionIgnoresFormation','usesFacingTarget','legalTargetsFor','preferredTargetFor','adaptiveTarget','ongPhoChainTarget','performAction']){
  if(name==='usesFacingTarget'&&!html.includes('function '+name+'('))continue;
  vm.runInContext(extract(name),box);
 }
 return{box,actor,enemies,ally,seen};
}
test('single damage Basic/Skill/Ultimate enters the real action owner with facing target, not weakest/highest rage',async()=>{
 for(const team of ['player','enemy'])for(const kind of ['damage','break','burn','fear','execute','double'])for(const action of ['basic','skill','ultimate']){
  const {box,actor,enemies,seen}=harness(team,1,kind);
  await box.performAction(actor,action,enemies[0]);
  assert.equal(seen[0],enemies[1].id,team+'/'+kind+'/'+action);
  assert.deepEqual(Array.from(box.legalTargetsFor(actor,action),u=>u.id),[enemies[1].id]);
  assert.equal(box.adaptiveTarget(actor,action,enemies[0]).id,enemies[1].id);
 }
});
test('missing opposite, then empty frontline chooses deterministic living slot; chain retarget agrees',async()=>{
 const {box,actor,enemies,seen}=harness();enemies[1].hp=0;
 await box.performAction(actor,'skill',enemies[1]);assert.equal(seen.at(-1),enemies[0].id);
 enemies[0].hp=0;
 assert.equal(box.ongPhoChainTarget(actor,enemies[1]).id,enemies[2].id);
 enemies[2].hp=0;await box.performAction(actor,'ultimate',enemies[1]);assert.equal(seen.at(-1),enemies[3].id);
});
test('ally support and AoE anchors retain their chosen target',async()=>{
 for(const kind of ['heal','guard','guardAll','cleanseGuard','buff','regen','aoe','aoeBurn','aoeDebuff']){
  const {box,actor,enemies,ally,seen}=harness('player',1,kind),target=kind.startsWith('aoe')?enemies[0]:ally;
  await box.performAction(actor,'skill',target);assert.equal(seen[0],target.id,kind);
 }
});
test('authored Bach Dien/Linh Dong Skill aliases retarget AFTER normalization to ATK',async()=>{
 for(const hero of ['BachDien','LinhDong']){
  const {box,actor,enemies}=harness('enemy',2);actor.kitVersion='splus42-v2';
  box['is'+hero]=()=>true;
  vm.runInContext(extract('normalize'+hero+'Action')+'\n'+extract(hero==='BachDien'?'bachDienLegacyAction':'linhDongLegacyAction'),box);
  const engine={canUse:()=>true,targets:(a,action)=>action==='basic'?[enemies[2]]:[enemies[0]]};
  box.splusCombat=()=>engine;box.state={mode:'battle',locked:false,currentId:actor.id};
  const actual=[];box.performSplusAction=async(a,action,target)=>actual.push({action,id:target.id});
  await box.performAction(actor,'skill',enemies[0]);
  assert.deepEqual(actual,[{action:'basic',id:enemies[2].id}],hero+' must animate at the same target as resolved ATK');
 }
});
