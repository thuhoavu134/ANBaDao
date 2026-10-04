import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { patchBattleTurnPacing } from '../scripts/battle-turn-pacing-v1.mjs';

const source = readFileSync('dist/battle.html', 'utf8');
const html = patchBattleTurnPacing(source);
const timing = vm.runInNewContext(html.match(/const TIMING = Object.freeze\((\{[\s\S]*?\})\);/)[1].replace(/^/, '(') + ')');
const between = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert.ok(i >= 0 && j > i, a); return html.slice(i, j); };

test('transition/reveal/AI/announcement dead time is at most 200ms at x1', () => {
  assert.ok(timing.turnRest + timing.turnReveal + timing.enemyThink + timing.actionAnnounce <= 200);
  assert.equal(timing.approach, 520); assert.equal(timing.windup, 430);
  assert.equal(timing.impactHold, 320); assert.equal(timing.return, 500);
});

test('existing scheduler hands off once after completion, with no AI think wait', async () => {
  let elapsed = 0, turns = 0; const events = [];
  const c = { TIMING: timing, TEAM_PLAYER: 'player', EMBED_CONFIG: {},
    actor: { id: 'b', team: 'enemy', name: 'B', title: 'B' },
    battleId: 7, state: { battleId: 7, auto: true, round: 1 },
    dom: { phaseLabel: {}, actionPrompt: {} }, setStatus() {}, updateActorHud() {}, renderSupportCall() {},
    sleep: async (ms, id) => { elapsed += ms; return id === c.state.battleId; },
    __hvRunAiTurn: async () => { events.push('next:start'); elapsed += timing.actionAnnounce; },
    battleHasWinner: () => false, checkBattleEnd: () => false,
    waitForDefeatExit: async () => { throw new Error('ordinary handoff must not wait for defeat'); } };
  vm.createContext(c);
  const next = new vm.Script('(async()=>{' + between('    const playerControlled = actor.team', '\n  function applyStatusIconQaFixtures()').replace(/\n  }\s*$/, '') + '})()');
  c.advanceTurn = () => { turns++; c.next = next.runInContext(c); };
  const end = between('    if (battleHasWinner() && !await waitForDefeatExit(battleId)) return;', '\n    }finally{');
  await vm.runInContext('(async()=>{' + end + '})()', c); await c.next;
  assert.equal(turns, 1); assert.deepEqual(events, ['next:start']); assert.ok(elapsed <= 200);
  // Cancelled battle IDs must still prevent dispatch to a new battle.
  c.state.battleId = 8; turns = 0;
  await vm.runInContext('(async()=>{' + end + '})()', c); assert.equal(turns, 0);
});

test('manual player turn still waits for a choice instead of auto dispatch', async () => {
  let dispatched = 0;
  const c = { TIMING: timing, TEAM_PLAYER: 'player', EMBED_CONFIG: {},
    actor: { team: 'player', name: 'A', title: 'A' }, battleId: 1,
    state: { auto: false, round: 1 }, dom: { phaseLabel: {}, actionPrompt: {} },
    setStatus() {}, updateActorHud() {}, renderSupportCall() {}, sleep: async () => true,
    __hvRunAiTurn: async () => { dispatched++; } };
  const body = between('    const playerControlled = actor.team', '\n  function applyStatusIconQaFixtures()').replace(/\n  }\s*$/, '');
  await vm.runInNewContext('(async()=>{' + body + '})()', c);
  assert.equal(dispatched, 0); assert.equal(c.state.locked, false);
});

test('no second post-idle hold and no special announcement delay for Ong Pho', () => {
  assert.ok(!html.includes('if(!await sleepVisualMilliseconds(120,battleId))return;'));
  assert.ok(html.includes('const ongPhoSkillAnnounce = TIMING.actionAnnounce;'));
  assert.equal(patchBattleTurnPacing(html), html, 'late build patch is idempotent');
});
