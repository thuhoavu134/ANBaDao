export function validateSummonBanner(rates, poolFor, guaranteedTiers = ['ssr', 's']) {
  if (!Array.isArray(rates) || !rates.length) return { ok: false, reason: 'INVALID_RATES' };
  if (rates.some(([tier, weight]) => !tier || !Number.isFinite(weight) || weight < 0) ||
      Math.abs(rates.reduce((sum, [, weight]) => sum + weight, 0) - 100) > 0.0001) {
    return { ok: false, reason: 'INVALID_RATES' };
  }
  const required = new Set([...rates.filter(([, weight]) => weight > 0).map(([tier]) => tier), ...guaranteedTiers]);
  const empty = [...required].filter(tier => !Array.isArray(poolFor(tier)) || !poolFor(tier).length);
  return empty.length ? { ok: false, reason: 'EMPTY_POOL', tiers: empty } : { ok: true };
}

export function guardSummonCommand(action, validate, reject) {
  return function guardedSummon(n, free) {
    if (![1, 10].includes(n) || (free && n !== 1)) { reject('INVALID_COUNT'); return null; }
    const result = validate();
    if (!result.ok) { reject(result.reason); return null; }
    return action(n, free);
  };
}
