import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import Core from '../src/domain/combat/hon-viet-core.mjs';
import { createSplusCombat } from '../src/domain/combat/splus-mechanics.mjs';
import { resolveBattleAiIntent } from '../src/combat-domain/ai-intent.mjs';

const html = readFileSync('dist/battle.html', 'utf8');
function fn(name) {
  const start = html.search(new RegExp('(?:async )?function ' + name + '\\('));
  assert.ok(start >= 0, name);
  let end = start;
  while ((end = html.indexOf('}', end + 1)) >= 0) {
    const source = html.slice(start, end + 1);
    try { new vm.Script('(' + source + ')'); return source; } catch {}
  }
  throw new Error(name);
}
const target = { id: 'enemy-1', team: 'enemy', slot: 0, hp: 100 };
const actor = (extra = {}) => ({ id: 'legacy', team: 'player', hp: 100, maxHp: 100, slot: 0,
  energy: 100, statuses: [], basicKind: 'single', skillKind: 'single', ultimateKind: 'aoe', ...extra });
const rules = { canUse: Core.canUseAction, targets: () => [target], preferred: () => target };

test('actual AI chooses a basic instead of a silenced ultimate at full rage', () => {
  const unit = actor({ statuses: [{ type: 'silence', turns: 2 }] });
  const box = vm.createContext({ Core, TEAM_PLAYER: 'player', TEAM_ENEMY: 'enemy',
    splusCombat: () => null, isOngPhoCarry: () => false, living: team => team === 'player' ? [unit] : [target],
    preferredTargetFor: () => target, adaptiveTarget: (_u, _a, fallback) => fallback,
    talentSkillIntent: () => null, plannedAiIntent: () => null });
  vm.runInContext(fn('decideAi'), box);
  const intent = box.decideAi(unit);
  assert.equal(intent.action, 'basic');
  assert.equal(Core.canUseAction(unit, intent.action), true);
});

test('rejected proposal falls back to the legal opposite slot without spending rage', () => {
  const unit = actor({ statuses: [{ type: 'silence' }] });
  const intent = resolveBattleAiIntent(unit, { action: 'ultimate', target }, rules);
  assert.equal(intent.action, 'basic');assert.equal(intent.target, target);assert.equal(unit.energy, 100);
});

test('real mixed S+ engine silence and cooldown gates are respected for legacy actors', () => {
  const unit = actor(), foe = { ...target, maxHp: 100, energy: 100, statuses: [] };
  const combat = createSplusCombat({ units: [unit, foe], mutate: true });
  combat.start();unit.statuses.push({ type: 'silence', splus: true, expiresRound: 3 });
  const intent = resolveBattleAiIntent(unit, { action: 'ultimate', target: foe }, {
    ...rules, canUse: (u, a) => combat.canUse(u, a), targets: () => [foe]
  });
  assert.equal(intent.action, 'basic');
  unit.statuses=[];unit.splus.cooldowns.ultimate=100;
  assert.equal(resolveBattleAiIntent(unit, { action: 'ultimate', target: foe }, {
    ...rules, canUse: (u, a) => combat.canUse(u, a), targets: () => [foe]
  }).action, 'basic');
});

test('support targets and valid specialist proposals remain intact; dead targets are reselected', () => {
  const unit = actor(), ally = { id: 'ally', hp: 20, team: 'player' };
  const intent = resolveBattleAiIntent(unit, { action: 'skill', target: ally }, { ...rules, targets: () => [ally] });
  assert.equal(intent.action, 'skill');assert.equal(intent.target, ally);
  assert.equal(resolveBattleAiIntent(unit, { action: 'basic', target: { id: 'dead', hp: 0 } }, rules).target, target);
});

for (const available of [false, true]) test('existing scheduler progresses once when ' + (available ? 'only a basic is legal' : 'no action is legal'), async () => {
  const unit=actor(), state={battleId:7,mode:'battle',currentId:unit.id,locked:true};let actions=0,turns=0;
  const box=vm.createContext({state,Core:{canUseAction:(_u,a)=>available&&a==='basic'},
    __hvResolveAiIntent:resolveBattleAiIntent,decideAi:()=>({action:'ultimate',target}),legalTargetsFor:()=>[target],preferredTargetFor:()=>target,
    performAction:async(_u,a)=>{assert.equal(a,'basic');actions++;},updateTurnOrder(){},updateActorHud(){},addLog(){},
    checkBattleEnd:()=>false,sleep:async()=>true,TIMING:{turnRest:1},advanceTurn:()=>turns++});
  vm.runInContext(fn('__hvRunAiTurn'),box);await box.__hvRunAiTurn(unit,7);
  assert.equal(actions,available?1:0);assert.equal(turns,available?0:1);
  if(!available)assert.equal(state.currentId,null);
  await box.__hvRunAiTurn(unit,6);assert.equal(actions,available?1:0,'stale battle cannot dispatch');
});

test('cancelled rest cannot advance a replaced battle', async () => {
  let turns=0;const unit=actor(),state={battleId:7,mode:'battle',currentId:unit.id};
  const box=vm.createContext({state,Core:{canUseAction:()=>false},__hvResolveAiIntent:resolveBattleAiIntent,decideAi:()=>null,
    legalTargetsFor:()=>[],preferredTargetFor:()=>null,updateTurnOrder(){},updateActorHud(){},addLog(){},checkBattleEnd:()=>false,
    sleep:async()=>false,TIMING:{turnRest:1},advanceTurn:()=>turns++});
  vm.runInContext(fn('__hvRunAiTurn'),box);await box.__hvRunAiTurn(unit,7);assert.equal(turns,0);
});
