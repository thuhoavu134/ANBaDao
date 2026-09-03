function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function textId(value, fallback = '') {
  const raw = value?.id ?? value?.pid ?? value?.sourceId ?? fallback;
  return String(raw ?? fallback);
}

function stableCompare(a, b) {
  return String(a).localeCompare(String(b), 'en', { numeric: true });
}

function hash(value) {
  let h = 2166136261;
  for (const char of String(value)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function selectTargets(units, options = {}) {
  const mode = String(options.mode || 'front');
  let candidates = (Array.isArray(units) ? units : []).filter(Boolean).filter((unit) => {
    if (options.team != null && unit.team !== options.team) return false;
    if (options.includeDead !== true && (unit.dead || numeric(unit.hp, 1) <= 0)) return false;
    if (typeof options.filter === 'function' && !options.filter(unit)) return false;
    return true;
  });
  const bySlot = (a, b) => numeric(a.slot, 0) - numeric(b.slot, 0) || stableCompare(textId(a), textId(b));
  if (mode === 'lowestHp') {
    candidates.sort((a, b) => numeric(a.hp, 0) / Math.max(1, numeric(a.maxHp, 1)) - numeric(b.hp, 0) / Math.max(1, numeric(b.maxHp, 1)) || bySlot(a, b));
  } else if (mode === 'highestAtk') {
    candidates.sort((a, b) => numeric(b.atk, 0) - numeric(a.atk, 0) || bySlot(a, b));
  } else if (mode === 'back') {
    candidates.sort((a, b) => bySlot(b, a));
  } else if (mode === 'random') {
    candidates.sort((a, b) => hash(String(options.seed ?? '') + ':' + textId(a)) - hash(String(options.seed ?? '') + ':' + textId(b)) || bySlot(a, b));
  } else {
    candidates.sort(bySlot);
  }
  if (mode === 'all') return candidates;
  const count = Math.max(1, Math.round(numeric(options.count, 1)));
  return candidates.slice(0, count);
}
