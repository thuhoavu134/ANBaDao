function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function textId(value, fallback = '') {
  const raw = value?.id ?? value?.pid ?? value?.sourceId ?? fallback;
  return String(raw ?? fallback);
}

function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeFighter(input = {}, index = 0) {
  const fighter = clone(input) || {};
  fighter.id = textId(fighter, 'unit-' + index);
  fighter.attr = { ...(fighter.attr || {}) };
  fighter.buff = { ...(fighter.buff || {}), list: [...(fighter.buff?.list || fighter.statuses || [])] };
  fighter.skill = { ...(fighter.skill || {}) };
  fighter.cd = { ...(fighter.cd || {}), record: { ...(fighter.cd?.record || {}) }, rewriteCfg: { ...(fighter.cd?.rewriteCfg || {}) } };
  fighter.roundVar = { ...(fighter.roundVar || {}) };
  return fighter;
}

export function resetFighter(input = {}) {
  const fighter = normalizeFighter(input);
  fighter.cd.record = {};
  fighter.buff.list = [];
  fighter.statuses = [];
  fighter.roundVar = {};
  fighter.dead = false;
  return fighter;
}

export function canAct(fighter = {}) {
  if (fighter.dead || numeric(fighter.hp, 1) <= 0) return false;
  const blocked = new Set(['stun', 'fear', 'silence', 'frozen']);
  const statuses = [...(fighter.statuses || []), ...(fighter.buff?.list || [])];
  return !statuses.some((status) => blocked.has(status?.type));
}
