/**
 * Presentation-only movement. The existing battle scheduler still owns turns,
 * tween timing, action markers and damage. This factory is also embedded into
 * battle.html; keep it self-contained (no imported runtime dependencies).
 */
export function createSkillCastMovement(env) {
  const plans = new WeakMap();
  const events = [];
  const finite = (value, fallback = 0) => value != null && Number.isFinite(Number(value)) ? Number(value) : fallback;
  const point = unit => ({ x: finite(unit?.x), y: finite(unit?.y) });
  const home = unit => ({ x: finite(unit?.baseX, finite(unit?.x)), y: finite(unit?.baseY, finite(unit?.y)) });
  const normalizeAction = action => ['atk', 'normal'].includes(action) ? 'basic' : ['skill1'].includes(action) ? 'skill' : action === 'ult' ? 'ultimate' : action;
  const same = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 0.01;
  const direction = actor => actor.team === env.teamPlayer ? 1 : -1;
  const actionSequence = () => finite(env.getState().actionCount);
  const ownsAction = (actor, value) => plans.get(actor) === value && value.actionSequence === actionSequence();
  // Distances below are LUC THAN formation-spacing units, NOT 3Q source pixels.
  // Each action has an independent policy, even for the same ranged character.
  const registry = {
    'luc-anh': {
      basic: { mode: 'target', distance: 1.45 },
      skill: { mode: 'formation', advance: 0.75 },
      ultimate: { mode: 'formation', advance: 1.05 }
    },
    'linh-dong': {
      basic: { mode: 'target', distance: 1.35 },
      skill: { mode: 'target', distance: 1.35 },
      ultimate: { mode: 'formation', advance: 0.95 }
    },
    'bach-dien': {
      basic: { mode: 'target', distance: 1.20 },
      skill: { mode: 'target', distance: 1.20 },
      ultimate: { mode: 'target', distance: 0.90 }
    },
    'thay-mo': {
      basic: { mode: 'target', distance: 1.50 },
      skill: { mode: 'formation', advance: 0.80 },
      ultimate: { mode: 'formation', advance: 1.00 }
    }
  };
  for (const skills of Object.values(registry)) {
    for (const policy of Object.values(skills)) Object.freeze(policy);
    Object.freeze(skills);
  }
  Object.freeze(registry);

  function policyFor(actor, action) {
    const key = normalizeAction(action);
    const explicit = actor?.skillMovement?.[key];
    const policy = explicit ?? registry[env.heroKeyFor(actor)]?.[key];
    if (!policy) return null; // Unmapped heroes retain their authored movement.
    if (!['home', 'target', 'formation', 'column'].includes(policy.mode)) {
      throw new Error('Unsupported skill movement mode: ' + policy.mode);
    }
    return { ...policy };
  }

  function geometry(actor) {
    const world = env.getWorld();
    const width = Math.max(1, finite(world?.width, 1600));
    const height = Math.max(1, finite(world?.height, 900));
    // Include defeated units: formation anchors must not drift after a kill.
    const allies = env.getUnits().filter(unit => unit.team === actor.team);
    const anchors = allies.length ? allies.map(home) : [home(actor)];
    const xs = [...new Set(anchors.map(p => p.x))].sort((a, b) => a - b);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]).filter(gap => gap > 1);
    const spacing = gaps.length ? Math.min(...gaps) : width * 0.10;
    return {
      width, height, spacing,
      center: { x: anchors.reduce((sum, p) => sum + p.x, 0) / anchors.length, y: anchors.reduce((sum, p) => sum + p.y, 0) / anchors.length }
    };
  }

  function plan(actor, action, target) {
    const policy = policyFor(actor, action);
    const origin = home(actor);
    if (!policy || policy.mode === 'home') return { mode: policy?.mode || 'legacy', home: origin, destination: origin, moved: false };
    const g = geometry(actor), dir = direction(actor);
    let destination;
    if (policy.mode === 'formation') {
      // A fixed cast point is relative to the FORMATION CENTER, not actor.home.
      destination = {
        x: g.center.x + dir * finite(policy.advance, 1) * g.spacing,
        y: g.center.y + finite(policy.offsetY) * g.spacing
      };
    } else {
      // Do not pick a different gameplay target or change target selection.
      if (!target || target.hp <= 0) return { mode: policy.mode, home: origin, destination: origin, moved: false };
      let targetPoint = point(target);
      if (policy.mode === 'column') {
        // Current roster is interleaved front/back: slot 0/1, 2/3, 4/5.
        const lane = Math.floor(finite(target.slot) / 2);
        const column = env.getUnits().filter(unit => unit.team === target.team && Math.floor(finite(unit.slot) / 2) === lane);
        const front = column.sort((a, b) => dir * (home(a).x - home(b).x))[0];
        if (front) targetPoint = home(front);
      }
      const available = Math.max(0, dir * (targetPoint.x - origin.x));
      // Preserve a visible standoff while still advancing on compact layouts.
      const gap = Math.min(Math.max(0, finite(policy.distance, 1.5)) * g.spacing, available * 0.65);
      destination = { x: targetPoint.x - dir * gap, y: targetPoint.y + finite(policy.offsetY) * g.spacing };
    }
    const margin = Math.min(g.spacing * 0.25, g.width * 0.03);
    destination.x = Math.max(margin, Math.min(g.width - margin, destination.x));
    destination.y = Math.max(0, Math.min(g.height, destination.y));
    return { mode: policy.mode, home: origin, destination, moved: !same(origin, destination) };
  }

  function valid(actor, battleId) {
    const state = env.getState();
    return !!actor && actor.hp > 0 && state.battleId === battleId && state.mode === 'battle' && state.currentId === actor.id;
  }
  function record(type, actor, battleId, planValue) {
    if (!env.traceEnabled) return;
    events.push({ type, actorId: actor.id, battleId, actionSequence: planValue.actionSequence, mode: planValue.mode, position: point(actor), home: { ...planValue.home }, destination: { ...planValue.destination } });
    if (events.length > 240) events.splice(0, events.length - 240);
  }

  async function approach(actor, action, target, battleId) {
    if (!valid(actor, battleId)) return false;
    const previous = plans.get(actor);
    // Reject duplicate entry for THIS action, not a future action after death
    // or cancellation. The existing scheduler increments actionCount first.
    if (previous && previous.battleId === battleId && previous.actionSequence === actionSequence()) return false;
    const value = { ...plan(actor, action, target), battleId, actionSequence: actionSequence() };
    plans.set(actor, value);
    let accepted = false;
    try {
      record('approach:start', actor, battleId, value);
      if (!same(point(actor), value.destination)) {
        const duration = Math.max(1, finite(env.approachMs(), 380));
        env.setStatus(actor.name + ' tiến đến điểm thi triển');
        env.setPhase('Di chuyển • Vào vị trí');
        env.setUnitState(actor, 'run', duration);
        if (!await env.tweenUnit(actor, value.destination.x, value.destination.y, duration, battleId)) return false;
      }
      if (!valid(actor, battleId) || !ownsAction(actor, value)) return false;
      // Stop run before voice lead-in or any authored animation begins.
      env.setUnitState(actor, 'idle', 800);
      record('cast:ready', actor, battleId, value);
      accepted = true;
      return true;
    } finally {
      if (!accepted && plans.get(actor) === value) plans.delete(actor);
    }
  }

  async function returnHome(actor, battleId) {
    const value = plans.get(actor);
    if (!valid(actor, battleId) || (value && (value.battleId !== battleId || !ownsAction(actor, value)))) {
      if (value?.battleId === battleId && plans.get(actor) === value) plans.delete(actor);
      return false;
    }
    const original = value || { mode: 'home', home: home(actor), destination: point(actor), actionSequence: actionSequence() };
    try {
      record('return:start', actor, battleId, original);
      if (!same(point(actor), original.home)) {
        const duration = Math.max(1, finite(env.returnMs(), 320));
        env.setStatus(actor.name + ' trở lại đội hình');
        env.setPhase('Thu thế • Trở về');
        env.setUnitState(actor, 'run', duration);
        if (!await env.tweenUnit(actor, original.home.x, original.home.y, duration, battleId)) return false;
      }
      if (!valid(actor, battleId) || original.actionSequence !== actionSequence() || (value && !ownsAction(actor, value))) return false;
      // Correct only numerical tween residue AFTER completion, never teleport.
      actor.x = original.home.x; actor.y = original.home.y;
      env.setUnitState(actor, 'idle', 800);
      record('return:complete', actor, battleId, original);
      return true;
    } finally {
      if (plans.get(actor) === value) plans.delete(actor);
    }
  }

  return Object.freeze({ policyFor, plan, approach, returnHome, registry, events: () => events.map(event => ({ ...event, position: { ...event.position }, home: { ...event.home }, destination: { ...event.destination } })) });
}
