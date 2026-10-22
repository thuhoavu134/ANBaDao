// Owner-declared hero mechanics (the "effects" of a hero brief), interpreted by the combat engine.
// A brief lists effects as data; scripts/hero/scaffold.mjs validates them and writes them into
// authored-effects-registry.mjs. The engine calls the hooks below from six fixed places, so a new hero never adds a
// `switch(key)` branch for the common mechanics. Unusual mechanics are still written by hand in AUTHORED_HIT.<key>.
//
// Action effects (kit.basic.effects / kit.ultimate.effects) run after the LAST hit of the cast:
//   per target for who=target, once per cast for self / allies / lowestAlly / enemies.
// Passive effects (kit.passive.effects) carry `when`: always | immune | kill | hit | receive | roundStart.

export const DO = Object.freeze(['status', 'heal', 'shield', 'energy', 'cleanse', 'execute', 'damage', 'stack']);
export const WHO = Object.freeze(['target', 'self', 'allies', 'lowestAlly', 'enemies']);
export const WHEN = Object.freeze(['always', 'immune', 'kill', 'hit', 'receive', 'roundStart']);
export const STATS = Object.freeze(['attack', 'defense', 'magicDefense', 'speed', 'crit', 'critDamage', 'resist', 'lifesteal', 'mitigation']);
export const BUFF_STATUSES = Object.freeze(['attackUp', 'armorUp', 'magicArmorUp', 'speedUp', 'critUp', 'critDamage', 'resistUp', 'evasionUp', 'lifesteal', 'mitigation']);
export const CONTROL_STATUSES = Object.freeze(['stun', 'sleep', 'paralysis', 'fear', 'root', 'disarm', 'silence', 'confusion']);
export const DEBUFF_STATUSES = Object.freeze(['healDown', 'antiHeal', 'armorDown', 'magicArmorDown', 'attackDown', 'speedDown', 'blind', 'rageSlow', 'rageBan', 'shieldBan', 'buffBan', 'damageDown', 'critDown', 'resistDown']);
export const DOT_STATUSES = Object.freeze(['burn', 'poison', 'bleed']);
export const STATUSES = Object.freeze([...BUFF_STATUSES, ...CONTROL_STATUSES, ...DEBUFF_STATUSES, ...DOT_STATUSES]);

const num = v => typeof v === 'number' && Number.isFinite(v);
const between = (v, lo, hi) => num(v) && v >= lo && v <= hi;

/** Validate a list of effects; returns ['kit.basic.effects[0].status: …', …] (empty = valid). */
export function validateEffects(list, path, { passive = false } = {}) {
  const errs = [];
  if (list == null) return errs;
  if (!Array.isArray(list)) return [`${path}: phải là mảng`];
  list.forEach((fx, i) => {
    const p = `${path}[${i}]`;
    const bad = (field, why) => errs.push(`${p}.${field}: ${why}`);
    if (!fx || typeof fx !== 'object') return errs.push(`${p}: phải là object`);
    if (passive) {
      if (!WHEN.includes(fx.when)) return bad('when', `cần một trong ${WHEN.join('|')}`);
      if (fx.when === 'immune') {
        const s = Array.isArray(fx.status) ? fx.status : [fx.status];
        if (!s.length || s.some(x => ![...CONTROL_STATUSES, ...DEBUFF_STATUSES, ...DOT_STATUSES, 'accuracyDown'].includes(x))) bad('status', 'danh sách trạng thái xấu (vd ["stun","blind"])');
        return;
      }
      if (fx.when === 'always') {
        if (fx.do !== 'stat') return bad('do', 'when=always chỉ dùng do=stat');
        if (!STATS.includes(fx.stat)) bad('stat', `cần một trong ${STATS.join('|')}`);
        if (!between(fx.value, -1, 2)) bad('value', 'số trong khoảng -1..2 (0.15 = 15%)');
        if (fx.perStack != null && typeof fx.perStack !== 'string') bad('perStack', 'tên bộ đếm (do=stack)');
        return;
      }
      if (fx.when === 'hit' && fx.action != null && !['basic', 'ultimate'].includes(fx.action)) bad('action', 'basic|ultimate');
    }
    if (!DO.includes(fx.do)) return bad('do', `cần một trong ${DO.join('|')}`);
    if (fx.who != null && !WHO.includes(fx.who)) bad('who', `cần một trong ${WHO.join('|')}`);
    if (fx.chance != null && !between(fx.chance, 0, 1)) bad('chance', 'xác suất 0..1');
    const amount = ['pctAtk', 'pctMaxHp', 'value'].filter(k => fx[k] != null);
    switch (fx.do) {
      case 'status':
        if (!STATUSES.includes(fx.status)) bad('status', `không hỗ trợ "${fx.status}" (xem docs/templates/hero-brief.json)`);
        if (fx.turns != null && !(Number.isInteger(fx.turns) && fx.turns >= 1 && fx.turns <= 5)) bad('turns', 'số nguyên 1..5');
        if (DOT_STATUSES.includes(fx.status) && !num(fx.pctAtk) && !num(fx.pctMaxHp)) bad('pctAtk', 'trạng thái sát thương theo lượt cần pctAtk hoặc pctMaxHp');
        if (fx.maxStacks != null && !(Number.isInteger(fx.maxStacks) && fx.maxStacks >= 1 && fx.maxStacks <= 10)) bad('maxStacks', 'số nguyên 1..10');
        break;
      case 'heal': case 'shield': case 'damage':
        if (!amount.length || amount.some(k => !between(fx[k], 0, 10))) bad('pctAtk', 'cần pctAtk hoặc pctMaxHp (0.1 = 10%)');
        break;
      case 'energy':
        if (!between(fx.value, -100, 100)) bad('value', 'số nộ -100..100');
        break;
      case 'cleanse':
        if (fx.count != null && !(Number.isInteger(fx.count) && fx.count >= 1)) bad('count', 'số nguyên ≥ 1');
        break;
      case 'execute':
        if (!between(fx.belowHp, 0.01, 0.9)) bad('belowHp', 'ngưỡng máu 0.01..0.9 (0.2 = dưới 20%)');
        break;
      case 'stack':
        if (typeof fx.name !== 'string' || !/^[a-zA-Z][\w]*$/.test(fx.name)) bad('name', 'tên bộ đếm, vd "uHon"');
        if (fx.max != null && !(Number.isInteger(fx.max) && fx.max >= 1)) bad('max', 'số nguyên ≥ 1');
        break;
    }
  });
  return errs;
}

/** Validate a whole hero spec { passive:{effects}, basic:{effects}, ultimate:{effects} }. */
export function validateSpec(spec, base = 'kit') {
  return [
    ...validateEffects(spec?.passive?.effects, `${base}.passive.effects`, { passive: true }),
    ...validateEffects(spec?.basic?.effects, `${base}.basic.effects`),
    ...validateEffects(spec?.ultimate?.effects, `${base}.ultimate.effects`),
  ];
}

/**
 * Hooks for the combat engine. `registry` maps hero key -> spec; `api` is the engine's own toolbox
 * ({buff, heal, shield, energy, cleanse, damage, stat, ratio, friends, foes, alive, weakest, emit, rng, key, passive}).
 * Every hook is a no-op for a hero without a spec, so existing heroes are untouched.
 */
export function createAuthoredEffects(registry, api) {
  // Self-contained on purpose: the browser bundle copies this function with toString()
  // (scripts/splus-runtime-v1.mjs), so it must not touch module-level names. Lists mirror DOT_STATUSES / CONTROL_STATUSES.
  const num = v => typeof v === 'number' && Number.isFinite(v);
  const DOTS = ['burn', 'poison', 'bleed'];
  const CONTROL = ['stun', 'sleep', 'paralysis', 'fear', 'root', 'disarm', 'silence', 'confusion'];
  const specOf = u => (u ? registry?.[api.key(u)] : null) || null;
  const stacksOf = (u, name) => Number(u?.splus?.memory?.fx?.[name]) || 0;

  function receivers(who, actor, target) {
    switch (who) {
      case 'self': return [actor];
      case 'allies': return api.friends(actor);
      case 'lowestAlly': return api.weakest(api.friends(actor)).slice(0, 1);
      case 'enemies': return api.foes(actor);
      default: return target && api.alive(target) ? [target] : [];
    }
  }
  const amountFor = (fx, actor, r) => (num(fx.pctAtk) ? api.stat(actor, 'atk') * fx.pctAtk : num(fx.pctMaxHp) ? r.maxHp * fx.pctMaxHp : Number(fx.value) || 0);

  function apply(fx, actor, target, action) {
    if (fx.chance != null && api.rng('authored.fx') >= fx.chance) return;
    if (fx.do === 'execute') {
      if (target && api.alive(target) && api.ratio(target) < fx.belowHp) {
        api.emit('authoredExecute', actor, target, { belowHp: fx.belowHp });
        api.damage(actor, target, { raw: target.maxHp * 10, type: 'true', action, bypassShield: true, bypassGuard: true, forceHit: true, secondary: true, noTriggers: true });
      }
      return;
    }
    if (fx.do === 'stack') {
      const mem = (actor.splus.memory.fx ||= {});
      const next = Math.min(fx.max ?? Infinity, stacksOf(actor, fx.name) + (Number(fx.add) || 1));
      if (next !== mem[fx.name]) { mem[fx.name] = next; api.emit('authoredStack', actor, actor, { name: fx.name, stacks: next }); }
      return;
    }
    for (const r of receivers(fx.who || (['heal', 'shield', 'energy', 'cleanse'].includes(fx.do) ? 'self' : 'target'), actor, target)) {
      if (!api.alive(r)) continue;
      switch (fx.do) {
        case 'status': {
          const extra = {};
          if (DOTS.includes(fx.status)) {
            if (num(fx.pctAtk)) extra.rawPerTick = api.stat(actor, 'atk') * fx.pctAtk; else extra.percentMaxHp = fx.pctMaxHp;
          }
          if (fx.stack || fx.maxStacks) { extra.stack = true; extra.maxStacks = fx.maxStacks || 3; }
          const control = CONTROL.includes(fx.status);
          api.buff(actor, r, fx.status, control ? 0 : Number(fx.value) || 0, fx.turns ?? (control ? 1 : 2), extra);
          break;
        }
        case 'heal': api.heal(actor, r, amountFor(fx, actor, r)); break;
        case 'shield': api.shield(actor, r, amountFor(fx, actor, r), { turns: fx.turns ?? 2 }); break;
        case 'energy': api.energy(actor, r, Number(fx.value) || 0, 'authored-fx'); break;
        case 'cleanse': api.cleanse(r, fx.count ?? 1); break;
        case 'damage': api.damage(actor, r, { raw: amountFor(fx, actor, r), type: fx.type || 'true', action, forceHit: true, secondary: true, noTriggers: true }); break;
      }
    }
  }

  return {
    /** After every hit of an authored cast; effects fire on the last hit (target-side per target, the rest once). */
    onAction(actor, target, cast, index) {
      const effects = specOf(actor)?.[cast.kind]?.effects;
      if (!effects?.length || index !== cast.hits - 1) return;
      cast.fxOnce ||= new Set();
      effects.forEach((fx, i) => {
        const perTarget = (fx.who || (['heal', 'shield', 'energy', 'cleanse', 'stack'].includes(fx.do) ? 'self' : 'target')) === 'target';
        if (!perTarget) { if (cast.fxOnce.has(i)) return; cast.fxOnce.add(i); }
        apply(fx, actor, target, cast.kind);
      });
    },
    modifiers(u, m) {
      const list = specOf(u)?.passive?.effects;
      if (!list || !api.passive(u)) return;
      for (const fx of list) if (fx.when === 'always' && fx.do === 'stat') m[fx.stat] += fx.value * (fx.perStack ? stacksOf(u, fx.perStack) : 1);
    },
    immune(u, type) {
      const list = specOf(u)?.passive?.effects;
      if (!list || !api.passive(u)) return false;
      return list.some(fx => fx.when === 'immune' && (Array.isArray(fx.status) ? fx.status : [fx.status]).includes(type));
    },
    onKill(source, victim) { run(source, 'kill', victim); },
    onHit(source, target, hit) { if (hit?.dealt > 0) run(source, 'hit', target, hit.action); },
    onReceive(target, source, dealt) { if (dealt > 0 && source && source.team !== target.team) run(target, 'receive', source); },
    onRoundStart(u) { run(u, 'roundStart', null); },
  };

  function run(hero, when, other, action) {
    const list = specOf(hero)?.passive?.effects;
    if (!list || !api.passive(hero)) return;
    for (const fx of list) {
      if (fx.when !== when) continue;
      if (when === 'hit' && fx.action && fx.action !== action) continue;
      apply(fx, hero, other, action || 'passive');
    }
  }
}
