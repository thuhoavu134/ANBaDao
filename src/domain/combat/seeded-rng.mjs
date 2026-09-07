export const COMBAT_RNG_SCHEMA = 'hon-viet-combat-rng/v1';
export const COMBAT_RNG_DOMAINS = Object.freeze({ rule: 'rule', presentation: 'presentation' });

const UINT32_RANGE = 0x100000000;
const STREAM_INCREMENT = 0x6d2b79f5;
const SESSION_RNGS = new WeakMap();

function text(value, fallback = '') {
  return String(value == null ? fallback : value);
}

function hash(value) {
  let result = 2166136261;
  for (const character of String(value)) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeDomain(domain) {
  return domain === COMBAT_RNG_DOMAINS.presentation ? COMBAT_RNG_DOMAINS.presentation : COMBAT_RNG_DOMAINS.rule;
}

function nextValue(stream) {
  stream.state = (stream.state + STREAM_INCREMENT) >>> 0;
  let value = stream.state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
}

export function createSeededCombatRng(seed) {
  const normalizedSeed = seed == null ? null : text(seed);
  const streams = {
    rule: { state: hash(String(normalizedSeed ?? '') + ':rule'), cursor: 0 },
    presentation: { state: hash(String(normalizedSeed ?? '') + ':presentation'), cursor: 0 }
  };
  const calls = [];

  function next(domain = COMBAT_RNG_DOMAINS.rule, site = 'unknown') {
    const normalizedDomain = normalizeDomain(domain);
    const stream = streams[normalizedDomain];
    const value = nextValue(stream);
    calls.push({
      index: calls.length,
      site: text(site, 'unknown'),
      domain: normalizedDomain,
      cursor: stream.cursor,
      value
    });
    stream.cursor += 1;
    return value;
  }

  return Object.freeze({
    schema: COMBAT_RNG_SCHEMA,
    seed: normalizedSeed,
    next,
    nextRule(site) {
      return next(COMBAT_RNG_DOMAINS.rule, site);
    },
    nextPresentation(site) {
      return next(COMBAT_RNG_DOMAINS.presentation, site);
    },
    cursor(domain) {
      return streams[normalizeDomain(domain)].cursor;
    },
    callCount() {
      return calls.length;
    },
    callsSince(index = 0) {
      return calls.slice(Math.max(0, Math.round(Number(index) || 0))).map(clone);
    },
    snapshot() {
      return {
        schema: COMBAT_RNG_SCHEMA,
        seed: normalizedSeed,
        streams: {
          rule: { cursor: streams.rule.cursor },
          presentation: { cursor: streams.presentation.cursor }
        },
        callCount: calls.length
      };
    }
  });
}

export function createCombatSessionRng(session) {
  if (!session || typeof session !== 'object') return null;
  const seed = session.seed == null ? null : text(session.seed);
  const previous = SESSION_RNGS.get(session);
  if (previous?.seed === seed) return previous;
  const rng = createSeededCombatRng(seed);
  SESSION_RNGS.set(session, rng);
  return rng;
}