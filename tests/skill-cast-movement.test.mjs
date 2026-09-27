import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createSkillCastMovement } from '../src/combat-domain/skill-cast-movement.mjs';

function fixture({ team = 1, hero = 'luc-anh', trace = true, scale = 1 } = {}) {
  const units = [];
  for (const side of [1, 2]) for (let slot = 0; slot < 6; slot++) {
    const baseX = (side === 1 ? 300 + (slot % 2) * 160 : 1300 - (slot % 2) * 160) * scale;
    const baseY = (310 + Math.floor(slot / 2) * 130) * scale;
    units.push({ id: `${side}:${slot}`, name: 'Fixture', sourceId: hero, team: side, slot, baseX, baseY, x: baseX, y: baseY, hp: 100, state: 'idle' });
  }
  const actor = units.find(unit => unit.team === team && unit.slot === 0);
  const target = units.find(unit => unit.team !== team && unit.slot === 2);
  const state = { battleId: 'battle:1', actionCount: 1, mode: 'battle', currentId: actor.id };
  const moves = [], states = [];
  let implementation = async (unit, x, y) => { unit.x = x; unit.y = y; return true; };
  const env = {
    teamPlayer: 1, getUnits: () => units, getState: () => state,
    getWorld: () => ({ width: 1600 * scale, height: 900 * scale }),
    heroKeyFor: unit => unit?.sourceId || '', traceEnabled: trace,
    approachMs: () => 380, returnMs: () => 320,
    setStatus: () => {}, setPhase: () => {},
    setUnitState: (unit, name) => { states.push(name); unit.state = name; },
    tweenUnit: async (unit, x, y, duration, battleId) => {
      moves.push({ x, y, duration, battleId });
      return implementation(unit, x, y, duration, battleId);
    }
  };
  return { actor, target, units, state, moves, states, env, movement: createSkillCastMovement(env), setTween: fn => { implementation = fn; } };
}
const xy = unit => ({ x: unit.x, y: unit.y });
const home = unit => ({ x: unit.baseX, y: unit.baseY });

// These test presentation policy, not art, combat damage or browser rendering.
test('one ranged hero has independent target-driven basic, skill and ultimate positioning', () => {
  const f = fixture();
  f.actor.weapon = 'staff';
  assert.equal(f.movement.plan(f.actor, 'basic', f.target).mode, 'target');
  assert.equal(f.movement.plan(f.actor, 'skill', f.target).mode, 'target-team');
  assert.equal(f.movement.plan(f.actor, 'ultimate', f.target).mode, 'target-team');
  assert.notDeepEqual(f.movement.plan(f.actor, 'skill', f.target).destination, f.movement.plan(f.actor, 'ultimate', f.target).destination);
  f.actor.weapon = 'sword';
  assert.equal(f.movement.plan(f.actor, 'basic', f.target).mode, 'target', 'weapon does not override the per-skill policy');
});

test('explicit home policy remains stationary and overrides a ranged approach', async () => {
  const f = fixture();
  f.actor.skillMovement = { basic: { mode: 'home' } };
  assert.equal(await f.movement.approach(f.actor, 'basic', f.target, 'battle:1'), true);
  assert.equal(f.moves.length, 0);
  assert.deepEqual(xy(f.actor), home(f.actor));
  assert.equal(await f.movement.returnHome(f.actor, 'battle:1'), true);
  assert.equal(f.moves.length, 0);
});

test('unmapped heroes retain legacy movement and aliases resolve explicitly', () => {
  const f = fixture({ hero: 'unmapped' });
  assert.equal(f.movement.policyFor(f.actor, 'basic'), null);
  f.actor.sourceId = 'luc-anh';
  assert.deepEqual(f.movement.policyFor(f.actor, 'atk'), f.movement.policyFor(f.actor, 'basic'));
  assert.deepEqual(f.movement.policyFor(f.actor, 'skill1'), f.movement.policyFor(f.actor, 'skill'));
  assert.deepEqual(f.movement.policyFor(f.actor, 'ult'), f.movement.policyFor(f.actor, 'ultimate'));
});

test('target-relative approach mirrors between teams with a nonzero standoff', () => {
  const left = fixture(), right = fixture({ team: 2 });
  const a = left.movement.plan(left.actor, 'basic', left.target);
  const b = right.movement.plan(right.actor, 'basic', right.target);
  assert.equal(a.destination.x + b.destination.x, 1600);
  assert.equal(a.destination.y, b.destination.y);
  assert.ok(a.destination.x > a.home.x && a.destination.x < left.target.x);
  assert.ok(b.destination.x < b.home.x && b.destination.x > right.target.x);
});

test('target-team casting uses stable enemy anchors, not caster home or live sprite positions', () => {
  const f = fixture();
  const expected = { x: 948, y: 440 }; // enemy front 1140 - 1.20 * spacing 160
  assert.deepEqual(f.movement.plan(f.actor, 'skill', f.target).destination, expected);
  for (const unit of f.units.filter(unit => unit.team === 1)) {
    assert.deepEqual(f.movement.plan(unit, 'skill', f.target).destination, expected);
    unit.x += 123; unit.y += 91;
    if (unit !== f.actor) unit.hp = 0;
  }
  assert.deepEqual(f.movement.plan(f.actor, 'skill', f.target).destination, expected);
  const frontEnemies=f.units.filter(unit=>unit.team===2&&unit.baseX===1140);
  frontEnemies.forEach(unit=>{unit.hp=0;});
  assert.deepEqual(f.movement.plan(f.actor, 'skill', f.target).destination, { x: 1108, y: 440 }, 'dead front row releases the cast point toward the next living enemy line');
});

test('target or target death does not cause implicit retargeting', () => {
  const f = fixture();
  assert.deepEqual(f.movement.plan(f.actor, 'basic', null).destination, home(f.actor));
  f.target.hp = 0;
  assert.deepEqual(f.movement.plan(f.actor, 'basic', f.target).destination, home(f.actor));
});

test('column policy uses the frontmost anchor of the selected lane', () => {
  const f = fixture();
  f.actor.skillMovement = { basic: { mode: 'column', distance: 1 } };
  assert.deepEqual(f.movement.plan(f.actor, 'basic', f.target).destination, { x: 980, y: 440 });
});

test('compact formation geometry scales cast points without copying source pixels', () => {
  const full = fixture(), compact = fixture({ scale: 0.4 });
  const a = full.movement.plan(full.actor, 'basic', full.target).destination;
  const b = compact.movement.plan(compact.actor, 'basic', compact.target).destination;
  assert.ok(Math.abs(a.x * 0.4 - b.x) < 1e-8);
  assert.ok(Math.abs(a.y * 0.4 - b.y) < 1e-8);
  compact.actor.skillMovement = { ultimate: { mode: 'formation', advance: 999, offsetY: -999 } };
  const bounded = compact.movement.plan(compact.actor, 'ultimate', compact.target).destination;
  assert.ok(bounded.x >= 0 && bounded.x <= 640 && bounded.y >= 0 && bounded.y <= 360);
});

test('Luc Anh snaps to cast position without run/tween and rejects duplicate ownership', async () => {
  const f = fixture(), original = home(f.actor);
  const destination = f.movement.plan(f.actor, 'basic', f.target).destination;
  const pending = f.movement.approach(f.actor, 'basic', f.target, 'battle:1');
  assert.equal(await pending, true);
  assert.equal(f.moves.length, 0, 'snap approach must not call tweenUnit');
  assert.equal(f.states.includes('run'), false, 'snap approach must not enter run state');
  assert.deepEqual(xy(f.actor), destination);
  assert.deepEqual(home(f.actor), original, 'home anchor remains immutable');
  assert.equal(await f.movement.approach(f.actor, 'basic', f.target, 'battle:1'), false);
  assert.deepEqual(f.movement.events().map(event => event.type), ['approach:start', 'approach:snap', 'cast:ready']);
});

test('Luc Anh return still waits for the existing return tween after snap cast', async () => {
  const f = fixture();
  await f.movement.approach(f.actor, 'basic', f.target, 'battle:1');
  const cast = xy(f.actor), original = home(f.actor);
  let complete;
  f.setTween((unit, x, y) => new Promise(resolve => { complete = () => { unit.x = x; unit.y = y; resolve(true); }; }));
  const pending = f.movement.returnHome(f.actor, 'battle:1');
  assert.deepEqual(xy(f.actor), cast, 'return behavior is unchanged and remains awaited');
  assert.equal(f.actor.state, 'run');
  assert.equal(f.moves.at(-1).duration, 320);
  complete();
  assert.equal(await pending, true);
  assert.deepEqual(xy(f.actor), original);
  assert.deepEqual(home(f.actor), original);
  assert.deepEqual(f.movement.events().map(event => event.type), ['approach:start', 'approach:snap', 'cast:ready', 'return:start', 'return:complete']);
});

test('failed tween approach releases ownership and permits a retry for non-snap hero', async () => {
  const f = fixture({ hero: 'linh-dong' });
  f.setTween(async () => false);
  assert.equal(await f.movement.approach(f.actor, 'basic', f.target, 'battle:1'), false);
  f.setTween(async (unit, x, y) => { unit.x = x; unit.y = y; return true; });
  assert.equal(await f.movement.approach(f.actor, 'basic', f.target, 'battle:1'), true);
});

test('battle cancellation during tween approach cannot emit cast-ready', async () => {
  const f = fixture({ hero: 'linh-dong' });
  f.setTween(async () => { f.state.battleId = 'battle:2'; return true; });
  assert.equal(await f.movement.approach(f.actor, 'basic', f.target, 'battle:1'), false);
  assert.equal(f.movement.events().some(event => event.type === 'cast:ready'), false);
});

test('cancelled return does not teleport or emit return-complete', async () => {
  const f = fixture();
  await f.movement.approach(f.actor, 'basic', f.target, 'battle:1');
  const cast = xy(f.actor);
  f.setTween(async () => { f.state.mode = 'results'; return false; });
  assert.equal(await f.movement.returnHome(f.actor, 'battle:1'), false);
  assert.deepEqual(xy(f.actor), cast);
  assert.equal(f.movement.events().some(event => event.type === 'return:complete'), false);
});

test('a defeated then revived actor can approach again on a later action in the same battle', async () => {
  const f = fixture();
  assert.equal(await f.movement.approach(f.actor, 'basic', f.target, 'battle:1'), true);
  f.actor.hp = 0; // The battle skips its living-actor return block.
  f.state.actionCount++;
  f.actor.hp = 100;
  f.actor.x = f.actor.baseX; f.actor.y = f.actor.baseY;
  assert.equal(await f.movement.approach(f.actor, 'basic', f.target, 'battle:1'), true, 'stale action ownership must not lock a revived actor');
});

test('normal URLs allocate no trace events and QA snapshots cannot mutate history', async () => {
  const off = fixture({ trace: false });
  await off.movement.approach(off.actor, 'basic', off.target, 'battle:1');
  await off.movement.returnHome(off.actor, 'battle:1');
  assert.deepEqual(off.movement.events(), []);
  const on = fixture();
  await on.movement.approach(on.actor, 'basic', on.target, 'battle:1');
  on.movement.events()[0].home.x = -999;
  assert.equal(on.movement.events()[0].home.x, 300);
});

test('final generated living-actor return awaits the movement owner for all four branches', async () => {
  const html = readFileSync('dist/battle.html', 'utf8');
  const end = html.indexOf("    phase1Trace?.marker('recovery',");
  const start = html.lastIndexOf('    if (actor.hp > 0) {', end);
  assert.ok(start >= 0 && end > start);
  const block = html.slice(start, end);
  for (const flag of ['usesLucAnh', 'usesLinhDong', 'usesBachDien', 'usesThayMoBasicQa']) {
    let finish, calls = 0;
    const actor = { hp: 100, x: 900, y: 440 };
    const context = vm.createContext({ actor, action: 'basic', battleId: 'b',
      usesLucAnh: flag === 'usesLucAnh', usesLinhDong: flag === 'usesLinhDong',
      usesBachDien: flag === 'usesBachDien', usesThayMoBasicQa: flag === 'usesThayMoBasicQa',
      usesOngPhoGif: false, usesDinhLoi: false,
      // 93f1489 inserts `state.ultimateFocus = null;` at the recovery boundary;
      // in battle.html `state` is the module-level battle state.
      state: { ultimateFocus: null },
      __hvSkillMovement: { returnHome: () => { calls++; return new Promise(resolve => { finish = resolve; }); } }
    });
    const result = vm.runInContext('(async()=>{' + block + ';return "after-return";})()', context, { timeout: 1000 });
    let settled = false;
    result.then(() => { settled = true; });
    await Promise.resolve();
    assert.equal(calls, 1, flag);
    assert.equal(settled, false, 'next phase is blocked by return: ' + flag);
    assert.deepEqual(xy(actor), { x: 900, y: 440 }, 'branch itself must not teleport');
    finish(true);
    assert.equal(await result, 'after-return');
  }
});


test('generated Dinh Loi recovery has one return owner and no second hard reset', () => {
  const html = readFileSync('dist/battle.html', 'utf8');
  const recovery = html.indexOf("    phase1Trace?.marker('recovery',");
  assert.ok(recovery > 0, 'recovery marker exists');
  const tail = html.slice(Math.max(0, recovery - 9000), recovery);
  const hardReset = 'actor.x=origin.x;actor.y=origin.y;setUnitState(actor,"idle",800);';
  assert.equal(tail.split(hardReset).length - 1, 1, 'Dinh Loi x/y hard reset occurs only in its awaited return branch');
  assert.match(tail, /if \(usesDinhLoi\) \{\s*\/\/ Dinh Loi already completed its awaited return/);
});
