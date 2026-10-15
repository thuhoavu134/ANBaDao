import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import Core from '../src/domain/combat/hon-viet-core.mjs';
function harness(){
 const root=new URL('../',import.meta.url),dir=mkdtempSync(join(tmpdir(),'thay-mo-rage-'));
 try{
  mkdirSync(join(dir,'dist'));writeFileSync(join(dir,'dist/battle.html'),readFileSync(new URL('battle.html',root)));
  execFileSync(process.execPath,[new URL('scripts/auto-skill-cadence-v1.mjs',root).pathname],{cwd:dir});
  const html=readFileSync(join(dir,'dist/battle.html'),'utf8'),authored=readFileSync(new URL('scripts/thay-mo-authored-production-v1.mjs',root),'utf8');
  const identity=authored.slice(authored.indexOf('  const THAY_MO_PRODUCTION_IDS'),authored.indexOf('  async function prepareThayMoAuthoredAssets'));
  const decide=html.slice(html.indexOf('  function decideAi(actor){'),html.indexOf('\n  function chooseAction(action) {'));
  const start=html.indexOf('    const talentActivation='),debit=html.slice(start,html.indexOf('    state.actionCount += 1;',start));
  const gain=html.slice(html.indexOf('  function gainEnergy(unit, amount){'),html.indexOf('  function recordControl('));
  // Real Basic settlement including its early return; only damage is stubbed.
  const resolve=html.slice(html.indexOf('  function resolveAction(actor, action, target) {'),html.indexOf('    if (isOngPhoCarry(actor) && (action === "skill" || isVersionedBasic(actor)))'))+'\n  }';
  const target={id:'enemy',hp:10000,maxHp:10000,statuses:[]};
  const env={Core,state:{},window:{},TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',living:()=>[target],adaptiveTarget:()=>target,preferredTargetFor:()=>target,
   isOngPhoCarry:()=>false,isVersionedBasic:()=>false,isVersionedSkillKit:()=>false,isVersionedLucAnh:()=>false,
   talentSkillIntent:()=>null,plannedAiIntent:()=>null,legalTargetsFor:()=>[],armTalentSkill:(a,x)=>x,actionKind:()=> 'damage',applyDamage:()=>10,addLog(){},intelUnit:()=>null};
  vm.createContext(env);vm.runInContext(identity+decide+gain+resolve+'\nthis.debit=(actor,action)=>{'+debit+'};',env);return {env,target};
 }finally{rmSync(dir,{recursive:true,force:true});}
}
for(const id of ['thay_mo','thay-mo','hero_thay_mo'])test(`${id}: free Basic grants rage and reaches Ultimate without incoming damage`,()=>{
 const {env,target}=harness();
 for(const team of ['player','enemy']){
  const actor={sourceId:id,team,hp:1000,maxHp:1000,energy:30,statuses:[],ultimateKind:'aoe'};
  for(const expected of [45,60,75]){
   const intent=env.decideAi(actor);assert.equal(intent.action,'basic');const before=actor.energy;
   env.debit(actor,intent.action);assert.equal(actor.energy,before,'Basic debit zero');
   env.resolveAction(actor,intent.action,target);assert.equal(actor.energy,expected,'Basic grants +15');
  }
  assert.equal(env.decideAi(actor).action,'ultimate');env.debit(actor,'ultimate');assert.equal(actor.energy,15,'Ultimate retains 60 cost');assert.equal(env.decideAi(actor).action,'basic');
 }
});
test('regular paid skill, free talent and silence preserve existing behavior',()=>{
 const {env,target}=harness(),a={sourceId:'lac_yen',hp:1000,maxHp:1000,energy:30,statuses:[],team:'player'};
 assert.equal(env.decideAi(a).action,'skill');env.debit(a,'skill');assert.equal(a.energy,5);
 const mo={...a,sourceId:'thay_mo',energy:30,statuses:[{type:'silence'}]};assert.equal(env.decideAi(mo).action,'basic');
 mo.statuses=[];env.talentSkillIntent=()=>({action:'skill',target});mo._talentSkillActive=true;
 assert.equal(env.decideAi(mo).action,'skill');env.debit(mo,'skill');assert.equal(mo.energy,30,'free talent stays free');
});
