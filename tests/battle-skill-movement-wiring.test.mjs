import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the actual generated branch entries; do not substitute a model of
// performAction. Rendering and authored timelines need a separate browser gate.
const html = readFileSync('dist/battle.html', 'utf8');
const startMarker = '/* HV_SKILL_MOVEMENT_RUNTIME_START */';
const endMarker = '/* HV_SKILL_MOVEMENT_RUNTIME_END */';
function runtimeSource() {
  const start = html.indexOf(startMarker), end = html.indexOf(endMarker);
  return start < 0 || end < start ? '' : html.slice(start + startMarker.length, end);
}
function entryFor(flag, boundary) {
  const match = new RegExp('(?:if|else if)\\s*\\(' + flag + '\\)\\s*\\{').exec(html);
  assert.ok(match, 'generated branch exists: ' + flag);
  const remaining = html.slice(match.index + match[0].length);
  const end = remaining.search(boundary);
  assert.ok(end >= 0 && end < 4000, 'entry boundary exists: ' + flag);
  return remaining.slice(0, end);
}
const branches = [
  ['luc-anh', 'usesLucAnh', /if\s*\(action\s*===\s*["']basic["']\)/],
  ['linh-dong', 'usesLinhDong', /const linhAction\s*=/],
  ['bach-dien', 'usesBachDien', /const bachAction\s*=/],
  ['thay-mo', 'usesThayMoBasicQa', /setStatus\(/]
];
function fixture(hero, team) {
  const units = [];
  for (const side of [1, 2]) for (let slot = 0; slot < 6; slot++) {
    const baseX = side === 1 ? 300 + (slot % 2) * 160 : 1300 - (slot % 2) * 160;
    const baseY = 310 + Math.floor(slot / 2) * 130;
    units.push({ id: side + ':' + slot, sourceId: 'fixture', team: side, slot, baseX, baseY, x: baseX, y: baseY, hp: 100 });
  }
  const actor = units.find(u => u.team === team && u.slot === 0);
  actor.sourceId = hero;
  const target = units.find(u => u.team !== team && u.slot === 2);
  const moves = [];
  const context = vm.createContext({
    actor, target, units, moves, action: 'basic', battleId: 'fixture',
    phase1Trace: undefined, phase1ActionId: 'fixture:action:1',
    TEAM_PLAYER: 1, TEAM_ENEMY: 2, WORLD: { width: 1600, height: 900 },
    TIMING: { approach: 380, return: 320 }, REDUCED_MOTION: false,
    state: { battleId: 'fixture', mode: 'battle', currentId: actor.id, locked: true },
    dom: { phaseLabel: { textContent: '' } }, window: {},
    location: { search: '?qaPhase01=1' }, URLSearchParams,
    isLucAnh: unit => unit.sourceId === 'luc-anh',
    isLinhDong: unit => unit.sourceId === 'linh-dong',
    isBachDien: unit => unit.sourceId === 'bach-dien',
    isThayMoBasicQa: unit => unit.sourceId === 'thay-mo',
    isOngPho: () => false, isDinhLoi: () => false,
    actionKind: () => 'damage',
    combatPresentationProfileFor: () => 'stationaryProjectile',
    COMBAT_PRESENTATION_STANDARD: { profiles: { stationaryProjectile: { movesToTarget: false, standoff: 100 } } },
    setStatus: () => {},
    setUnitState: (unit, name) => { unit.state = name; },
    tweenUnit: async (unit, x, y, duration, id) => {
      moves.push({ from: { x: unit.x, y: unit.y }, to: { x, y }, duration, battleId: id, state: unit.state });
      await Promise.resolve();
      unit.x = x; unit.y = y;
      return true;
    }
  });
  return { context, actor, target, moves };
}
for (const [hero, flag, boundary] of branches.filter(([hero]) => hero !== 'luc-anh')) for (const team of [1, 2]) {
  test(`${hero} team ${team}: cast entry approaches before animation rather than remaining home`, async () => {
    const f = fixture(hero, team);
    const before = { x: f.actor.baseX, y: f.actor.baseY };
    vm.runInContext(runtimeSource(), f.context, { timeout: 1000 });
    await vm.runInContext('(async()=>{' + entryFor(flag, boundary) + '})()', f.context, { timeout: 1000 });
    assert.equal(f.moves.length, 1, 'one awaited approach is required before casting');
    assert.equal(f.moves[0].state, 'run');
    assert.ok(Math.abs(f.target.x - f.actor.x) < Math.abs(f.target.x - before.x), 'destination is closer to target');
    assert.ok(team === 1 ? f.actor.x > before.x : f.actor.x < before.x, 'movement mirrors for the enemy team');
    assert.deepEqual({ x: f.actor.baseX, y: f.actor.baseY }, before, 'home anchor is immutable');
    assert.ok(Number.isFinite(f.actor.x) && Number.isFinite(f.actor.y));
  });
}

for (const team of [1, 2]) for (const action of ['basic', 'skill', 'ultimate']) {
  test(`luc-anh team ${team} ${action}: cast entry snaps to the cast point without run/tween`, async () => {
    const [, flag, boundary] = branches.find(([hero]) => hero === 'luc-anh');
    const f = fixture('luc-anh', team);
    const before = { x: f.actor.baseX, y: f.actor.baseY };
    f.context.action = action;
    vm.runInContext(runtimeSource(), f.context, { timeout: 1000 });
    await vm.runInContext('(async()=>{' + entryFor(flag, boundary) + '})()', f.context, { timeout: 1000 });
    assert.equal(f.moves.length, 0, 'Luc Anh cast approach must not tween');
    assert.notEqual(f.actor.state, 'run', 'Luc Anh cast approach must not enter run state');
    assert.ok(Math.abs(f.target.x - f.actor.x) < Math.abs(f.target.x - before.x), 'snap destination is closer to target');
    assert.ok(team === 1 ? f.actor.x > before.x : f.actor.x < before.x, 'snap mirrors between teams');
    assert.deepEqual({ x: f.actor.baseX, y: f.actor.baseY }, before, 'home anchor is immutable');
  });
}

test('campaign iframe and standalone battle contain exactly one identical movement owner', () => {
  const index = readFileSync('dist/index.html', 'utf8');
  assert.match(index, /const BATTLE_HTML_BASE64 = "";/, 'embedded battle payload stays disabled; iframe loads battle.html directly');
  assert.equal(html.split(startMarker).length - 1, 1, 'movement runtime must be installed');
});
