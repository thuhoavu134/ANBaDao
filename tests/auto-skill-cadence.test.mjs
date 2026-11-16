import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadDecideAi(dist) {
  const start = dist.indexOf('  function decideAi(actor){');
  const end = dist.indexOf('\n  function chooseAction(action) {', start);
  assert.ok(start >= 0 && end > start, 'decideAi block must exist in dist battle.html');
  const body = dist.slice(start, end);
  const actorBase = { id: 'p:0', team: 'player', slot: 0, energy: 0, skillKind: 'burn', ultKind: 'aoeBurn', statuses: [], hp: 1000, maxHp: 1000 };
  const context = {
    window: {}, location: { search: '' }, sessionStorage: { getItem: () => '' }, performance: { now: () => 0 },
    QA_ULTI: false, QA_GOD: false, qaIsBoss: () => false, isDinhLoi: () => false, isThayMoAuthored: () => false,
    isOngPhoCarry: () => false,
    // Hero path: no S+ engine active for this unit (S+ kit actors delegate earlier).
    splusCombat: () => null,
    TEAM_PLAYER: 'player',
    TEAM_ENEMY: 'enemy',
    Core: { canUseAction: (u, a) => a === 'basic' || a === 'skill' || (a === 'ultimate' && u.energy >= 60), actionCost: a => ({ basic: 0, skill: 25, ultimate: 60 }[a] ?? Infinity), lowestHealth: l => l[0], hpRatio: u => u.hp / u.maxHp, rageUltimateThreshold: () => 70 },
    living: t => [actorBase],
    adaptiveTarget: (u, a, preferred) => preferred || { id: 'enemy:0' },
    preferredTargetFor: () => ({ id: 'enemy:0' }),
    talentSkillIntent: () => null,
    plannedAiIntent: () => null,
    armTalentSkill: () => { throw new Error('should not arm talent'); },
    legalTargetsFor: () => [],
  };
  context.actor = actorBase;
  vm.createContext(context);
  vm.runInContext(body + '\nglobalThis.__decide = decideAi;', context);
  return { decide: context.__decide, actor: actorBase, context };
}

test('auto-battle casts the regular skill once its rage cost is met', () => {
  if (!existsSync(join(root, 'dist/battle.html'))) return;
  const { decide, actor } = loadDecideAi(readFileSync(join(root, 'dist/battle.html'), 'utf8'));
  actor.energy = 30; // >= skill cost 25, < ultimate threshold
  const intent = decide(actor);
  assert.equal(intent.action, 'skill', 'regular skill must join the auto rotation at 25+ rage');
  assert.equal(intent.target.id, 'enemy:0');
});

test('below the skill cost the auto rotation still holds basics', () => {
  if (!existsSync(join(root, 'dist/battle.html'))) return;
  const { decide, actor } = loadDecideAi(readFileSync(join(root, 'dist/battle.html'), 'utf8'));
  actor.energy = 20;
  assert.equal(decide(actor).action, 'basic');
});

test('Ông Phở golden-carry pacing survives: 40–69 rage still banks basics', () => {
  if (!existsSync(join(root, 'dist/battle.html'))) return;
  const { decide, actor, context } = loadDecideAi(readFileSync(join(root, 'dist/battle.html'), 'utf8'));
  context.isOngPhoCarry = () => true;
  actor.energy = 50;
  assert.equal(decide(actor).action, 'basic', 'carry keeps banking basics before the 70-rage ultimate');
  actor.energy = 75;
  assert.equal(decide(actor).action, 'ultimate', 'carry still ultimates past the threshold');
});

test('the cadence patch is wired into the build chain', () => {
  const build = readFileSync(join(root, 'scripts/build-static.mjs'), 'utf8');
  assert.match(build, /auto-skill-cadence-v1/);
  const patch = readFileSync(join(root, 'scripts/auto-skill-cadence-v1.mjs'), 'utf8');
  assert.match(patch, /HV_AUTO_SKILL_CADENCE_V1/);
});
