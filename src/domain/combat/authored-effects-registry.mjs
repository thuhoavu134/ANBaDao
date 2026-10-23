// Owner-declared mechanics per authored hero, keyed by hero key. Written by scripts/hero/scaffold.mjs from the
// "effects" of each hero brief (schema: src/domain/combat/authored-effects.mjs, template: docs/templates/hero-brief.json).
// Heroes integrated before 22/10/2026 keep their hand-written rules in splus-mechanics.mjs and have no entry here.
export const AUTHORED_EFFECTS = Object.freeze({
  lang_van: {"passive":{"effects":[{"when":"hit","action":"basic","do":"status","who":"target","status":"speedDown","value":0.1,"turns":3,"stack":true,"maxStacks":3}]},"ultimate":{"effects":[{"do":"status","who":"enemies","status":"speedDown","value":0.2,"turns":2},{"do":"damage","who":"enemies","pctMaxHp":0.02}]}},
  /* @scaffold:effects (one entry per hero above this line) */
});
