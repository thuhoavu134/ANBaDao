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
  // A presentation lease is stable across impact; S+ increments actionCount
  // at impact, while legacy combat increments it before approach.
  const actionSequence = actor => env.actionSequenceFor?.(actor) ?? finite(env.getState().actionCount);
  const ownsAction = (actor, value) => plans.get(actor) === value && value.actionSequence === actionSequence(actor);
  // Distances below are LUC THAN formation-spacing units, NOT 3Q source pixels.
  // Each action has an independent policy. Ranged units may advance close;
  // destination is driven by the live target/enemy formation rather than a
  // fixed caster line on the actor's own side.
  const registry = {
    'luc-anh': {
      basic: { mode: 'target', distance: 1.45, travel: 'snap' },
      skill: { mode: 'target-team', distance: 1.20, alignY: 'target', travel: 'snap' },
      ultimate: { mode: 'target-team', distance: 0.95, alignY: 'center', travel: 'snap' }
    },
    'linh-dong': {
      basic: { mode: 'target', distance: 1.35 },
      skill: { mode: 'target', distance: 1.15 },
      ultimate: { mode: 'target-team', distance: 0.90, alignY: 'center' }
    },
    'bach-dien': {
      basic: { mode: 'target', distance: 1.20 },
      skill: { mode: 'target', distance: 1.05 },
      ultimate: { mode: 'target', distance: 0.90 }
    },
    'thay-mo': {
      basic: { mode: 'target', distance: 1.50 },
      skill: { mode: 'target-team', distance: 1.25, alignY: 'target' },
      ultimate: { mode: 'target-team', distance: 1.00, alignY: 'center' }
    }
  };
  for (const skills of Object.values(registry)) {
    for (const policy of Object.values(skills)) Object.freeze(policy);
    Object.freeze(skills);
  }
  Object.freeze(registry);

  function policyFor(actor, action) {
    const key = normalizeAction(action);
    const base = registry[env.heroKeyFor(actor)]?.[key];
    const explicit = actor?.skillMovement?.[key];
    const policy = explicit ? { ...(base || {}), ...explicit } : base;
    if (!policy) return null;
    if (!['home', 'target', 'target-team', 'formation', 'column'].includes(policy.mode)) {
      throw new Error('Unsupported skill movement mode: ' + policy.mode);
    }
    if (policy.travel != null && !['tween', 'snap', 'dash', 'run', 'stationary'].includes(policy.travel)) {
      throw new Error('Unsupported skill movement travel: ' + policy.travel);
    }
    const travel = policy.mode === 'home' || policy.travel === 'stationary'
      ? 'stationary'
      : policy.travel === 'tween'
        ? 'run'
        : policy.travel || 'run';
    return { ...policy, travel };
  }
  function summarizeAnchors(anchors, width) {
    const safe = anchors.length ? anchors : [{ x: width * 0.5, y: 0 }];
    const xs = [...new Set(safe.map(p => p.x))].sort((a, b) => a - b);
    const xGaps = xs.slice(1).map((x, i) => x - xs[i]).filter(gap => gap > 1);
    return {
      spacing: xGaps.length ? Math.min(...xGaps) : width * 0.10,
      center: {
        x: safe.reduce((sum, p) => sum + p.x, 0) / safe.length,
        y: safe.reduce((sum, p) => sum + p.y, 0) / safe.length
      }
    };
  }
  function geometry(actor, target) {
    const world = env.getWorld();
    const width = Math.max(1, finite(world?.width, 1600));
    const height = Math.max(1, finite(world?.height, 900));
    const units = env.getUnits();
    const ownUnits = units.filter(unit => unit.team === actor.team);
    const targetTeam = target?.team ?? units.find(unit => unit.team !== actor.team && unit.hp > 0)?.team;
    const enemyUnits = units.filter(unit => unit.team === targetTeam && unit.hp > 0);
    const ownAnchors = ownUnits.length ? ownUnits.map(home) : [home(actor)];
    const enemyAnchors = enemyUnits.length ? enemyUnits.map(home) : (target ? [home(target)] : []);
    const own = summarizeAnchors(ownAnchors, width);
    const enemy = summarizeAnchors(enemyAnchors, width);
    const spacing = Math.max(1, Math.min(own.spacing, enemy.spacing));
    const dir = direction(actor);
    const frontX = enemyAnchors.length
      ? enemyAnchors.reduce((front, p) => dir > 0 ? Math.min(front, p.x) : Math.max(front, p.x), enemyAnchors[0].x)
      : null;
    return { width, height, spacing, ownCenter: own.center, enemyCenter: enemy.center, enemyFrontX: frontX };
  }
  function standoffDestination(origin, targetPoint, actor, policy, g, { respectFrontline = true } = {}) {
    const dir = direction(actor);
    const available = Math.max(0, dir * (targetPoint.x - origin.x));
    if (available <= 0) return { ...origin };
    const desiredGap = Math.max(0, finite(policy.distance, 1.5)) * g.spacing;
    const targetGap = Math.min(desiredGap, available * 0.70);
    let x = targetPoint.x - dir * targetGap;
    if (respectFrontline && policy.penetrate !== true && g.enemyFrontX != null) {
      const frontAvailable = Math.max(0, dir * (g.enemyFrontX - origin.x));
      if (frontAvailable > 0) {
        const frontlineGap = Math.min(Math.max(g.spacing * finite(policy.frontlineGap, 0.55), 1), frontAvailable * 0.70);
        const frontlineStop = g.enemyFrontX - dir * frontlineGap;
        x = dir > 0 ? Math.min(x, frontlineStop) : Math.max(x, frontlineStop);
      }
    }
    return { x, y: targetPoint.y + finite(policy.offsetY) * g.spacing };
  }
  function plan(actor, action, target) {
    const policy = policyFor(actor, action);
    const origin = home(actor);
    if (!policy) return { mode: 'legacy', travel: 'run', home: origin, destination: origin, moved: false };
    if (policy.mode === 'home' || policy.travel === 'stationary') return { mode: policy.mode, travel: 'stationary', home: origin, destination: origin, moved: false };
    const g = geometry(actor, target), dir = direction(actor);
    let destination;
    if (policy.mode === 'formation') {
      // Backward-compatible escape hatch for explicit legacy/custom profiles.
      destination = {
        x: g.ownCenter.x + dir * finite(policy.advance, 1) * g.spacing,
        y: g.ownCenter.y + finite(policy.offsetY) * g.spacing
      };
    } else if (policy.mode === 'target-team') {
      if (g.enemyFrontX == null) return { mode: policy.mode, travel: policy.travel, home: origin, destination: origin, moved: false };
      const y = policy.alignY === 'target' && target && target.hp > 0 ? home(target).y : g.enemyCenter.y;
      destination = standoffDestination(origin, { x: g.enemyFrontX, y }, actor, policy, g, { respectFrontline: false });
    } else {
      if (!target || target.hp <= 0) return { mode: policy.mode, travel: policy.travel, home: origin, destination: origin, moved: false };
      let targetPoint = home(target);
      if (policy.mode === 'column') {
        const lane = Math.floor(finite(target.slot) / 2);
        const column = env.getUnits().filter(unit => unit.team === target.team && unit.hp > 0 && Math.floor(finite(unit.slot) / 2) === lane);
        const front = column.sort((a, b) => dir * (home(a).x - home(b).x))[0];
        if (front) targetPoint = home(front);
      }
      destination = standoffDestination(origin, targetPoint, actor, policy, g);
    }
    const margin = Math.min(g.spacing * 0.25, g.width * 0.03);
    destination.x = Math.max(margin, Math.min(g.width - margin, destination.x));
    destination.y = Math.max(0, Math.min(g.height, destination.y));
    return { mode: policy.mode, travel: policy.travel, home: origin, destination, moved: !same(origin, destination) };
  }
  function valid(actor, battleId) {
    const state = env.getState();
    return !!actor && actor.hp > 0 && state.battleId === battleId && state.mode === 'battle' && state.currentId === actor.id;
  }
  function record(type, actor, battleId, planValue) {
    if (!env.traceEnabled) return;
    events.push({ type, actorId: actor.id, battleId, actionSequence: planValue.actionSequence, mode: planValue.mode, travel: planValue.travel, position: point(actor), home: { ...planValue.home }, destination: { ...planValue.destination } });
    if (events.length > 240) events.splice(0, events.length - 240);
  }
  async function approach(actor, action, target, battleId) {
    if (!valid(actor, battleId)) return false;
    const previous = plans.get(actor);
    if (previous && previous.battleId === battleId && previous.actionSequence === actionSequence(actor)) return false;
    const value = { ...plan(actor, action, target), battleId, actionSequence: actionSequence(actor) };
    plans.set(actor, value);
    let accepted = false;
    try {
      record('approach:start', actor, battleId, value);
      if (value.travel === 'stationary') {
        env.setStatus(actor.name + ' thi triển tại chỗ');
        env.setPhase('Giữ vị trí • Thi triển');
        record('approach:stationary', actor, battleId, value);
      } else if (!same(point(actor), value.destination)) {
        if (value.travel === 'snap') {
          env.setStatus(actor.name + ' dịch chuyển đến điểm thi triển');
          env.setPhase('Dịch chuyển • Vào vị trí');
          actor.x = value.destination.x;
          actor.y = value.destination.y;
          record('approach:snap', actor, battleId, value);
        } else {
          const runDuration = Math.max(1, finite(env.approachMs(), 380));
          const duration = value.travel === 'dash'
            ? Math.max(1, finite(env.dashMs?.(), runDuration * 0.45))
            : runDuration;
          env.setStatus(actor.name + (value.travel === 'dash' ? ' lướt đến điểm thi triển' : ' chạy đến điểm thi triển'));
          env.setPhase(value.travel === 'dash' ? 'Lướt • Vào vị trí' : 'Chạy • Vào vị trí');
          env.setUnitState(actor, 'run', duration);
          if (!await env.tweenUnit(actor, value.destination.x, value.destination.y, duration, battleId)) return false;
          record(value.travel === 'dash' ? 'approach:dash' : 'approach:run', actor, battleId, value);
        }
      }
      if (!valid(actor, battleId) || !ownsAction(actor, value)) return false;
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
    const original = value || { mode: 'home', home: home(actor), destination: point(actor), actionSequence: actionSequence(actor) };
    try {
      record('return:start', actor, battleId, original);
      if (!same(point(actor), original.home)) {
        const duration = Math.max(1, finite(env.returnMs(), 320));
        env.setStatus(actor.name + ' trở lại đội hình');
        env.setPhase('Thu thế • Trở về');
        env.setUnitState(actor, 'run', duration);
        if (!await env.tweenUnit(actor, original.home.x, original.home.y, duration, battleId)) return false;
      }
      if (!valid(actor, battleId) || original.actionSequence !== actionSequence(actor) || (value && !ownsAction(actor, value))) return false;
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
