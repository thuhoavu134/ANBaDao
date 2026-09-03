function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function createCooldownState(input = {}) {
  return { record: { ...(input.record || {}) }, rewriteCfg: { ...(input.rewriteCfg || {}) } };
}

export function setCooldown(state, skillId, readyRound) {
  if (!state || skillId == null) return state;
  state.record[String(skillId)] = Math.max(0, Math.round(numeric(readyRound, 0)));
  return state;
}

export function getCooldown(state, skillId) {
  return Math.max(0, Math.round(numeric(state?.record?.[String(skillId)], 0)));
}

export function handleSkillUsed(state, skill = {}, round = 0) {
  const id = String(skill.id ?? skill.skillId ?? '');
  const baseCooldown = numeric(state?.rewriteCfg?.[id], numeric(skill.cd, 0));
  const unlockRound = state?.record && Object.prototype.hasOwnProperty.call(state.record, id)
    ? getCooldown(state, id)
    : numeric(skill.unlockRound, 0);
  return setCooldown(state, id, baseCooldown + unlockRound + 1 + Math.max(0, Math.round(numeric(round, 0) - unlockRound)));
}

export function available(state, skillId, round) {
  return !state?.record || !Object.prototype.hasOwnProperty.call(state.record, String(skillId)) || numeric(round, 0) >= getCooldown(state, skillId);
}

export function offsetCooldown(state, amount) {
  if (!state?.record) return state;
  const delta = Math.round(numeric(amount, 0));
  for (const id of Object.keys(state.record)) state.record[id] = getCooldown(state, id) - delta;
  return state;
}
