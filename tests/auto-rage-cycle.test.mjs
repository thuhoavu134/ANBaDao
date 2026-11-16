import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function runtime() {
  const root = new URL('../', import.meta.url);
  const dir = mkdtempSync(join(tmpdir(), 'rage-cycle-'));
  try {
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist/battle.html'), readFileSync(new URL('battle.html', root)));
    execFileSync(process.execPath, [fileURLToPath(new URL('scripts/auto-skill-cadence-v1.mjs', root))], { cwd: dir });
    const built = new URL('dist/battle.html', root);
    const html = readFileSync(existsSync(built) ? built : join(dir, 'dist/battle.html'), 'utf8');
    const body = html.slice(html.indexOf('  function decideAi(actor){'), html.indexOf('\n  function chooseAction(action) {'));
    const debitStart = html.indexOf('    const talentActivation=');
    const debit = html.slice(debitStart, html.indexOf('    state.actionCount += 1;', debitStart));
    const target = { id: 'enemy', hp: 1000, maxHp: 1000 };
    const context = {
      window: {}, performance: { now: () => 0 }, QA_ULTI: false, QA_GOD: false, qaIsBoss: () => false, isDinhLoi: () => false, isThayMoAuthored: () => false,
      isOngPhoCarry: () => false, splusCombat: () => null, TEAM_PLAYER: 'player', TEAM_ENEMY: 'enemy',
      Core: { canUseAction: (u,a) => u.energy >= ({basic:0,skill:25,ultimate:60}[a]), actionCost: a => ({basic:0,skill:25,ultimate:60}[a]), lowestHealth: xs=>xs[0], hpRatio:u=>u.hp/u.maxHp, rageUltimateThreshold:()=>70 },
      living:()=>[target], adaptiveTarget:()=>target, preferredTargetFor:()=>target,
      talentSkillIntent:()=>null, plannedAiIntent:()=>null, legalTargetsFor:()=>[], armTalentSkill:()=>null
    };
    vm.createContext(context);
    vm.runInContext(body+'\nthis.decide=decideAi;this.debit=(actor,action)=>{'+debit+'};', context);
    return context;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('auto rotation reaches ultimate without incoming damage rage, then permits skill again', () => {
  const { decide, debit } = runtime();
  const actor={energy:30, hp:1000,maxHp:1000,team:'player',skillKind:'burn',ultKind:'aoe'};
  const actions=[];
  for(let turn=0;turn<15;turn++){
    if(turn)actor.energy=Math.min(100,actor.energy+7);
    const action=decide(actor).action;actions.push(action);debit(actor,action);
    if(action==='basic')actor.energy=Math.min(100,actor.energy+15);
  }
  assert.equal(actions[0],'skill');
  const ultimate=actions.indexOf('ultimate');
  assert.ok(ultimate>0&&ultimate<=5, '25-rage skills must not starve a 70-rage ultimate: '+actions);
  assert.ok(actions.slice(ultimate+1).includes('skill'));
});

test('planning does not consume cadence; free talents do not consume the paid skill allowance', () => {
  const { decide, debit }=runtime();const actor={energy:30,hp:1000,maxHp:1000,team:'player'};
  assert.equal(decide(actor).action,'skill');assert.equal(decide(actor).action,'skill');
  actor._talentSkillActive=true;debit(actor,'skill');delete actor._talentSkillActive;
  assert.equal(actor.energy,30);assert.equal(decide(actor).action,'skill');
  debit(actor,'skill');actor.energy=30;
  assert.equal(decide(actor).action,'basic');
});
