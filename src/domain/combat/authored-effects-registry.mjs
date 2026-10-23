// Owner-declared mechanics per authored hero, keyed by hero key. Written by scripts/hero/scaffold.mjs from the
// "effects" of each hero brief (schema: src/domain/combat/authored-effects.mjs, template: docs/templates/hero-brief.json).
// Heroes integrated before 22/10/2026 keep their hand-written rules in splus-mechanics.mjs and have no entry here.
export const AUTHORED_EFFECTS = Object.freeze({
  lang_van: {passive:{effects:[{when:"receive",do:"counter",pctAtk:0.8,perTurn:1,capFrom:"counterCap2",capTo:2,apply:{do:"status",who:"target",status:"speedDown",value:0.1,turns:2,stack:true,maxStacks:3}}]}},
  lang_tieu: {"passive":{"effects":[{"when":"hit","action":"basic","do":"status","who":"target","status":"speedDown","value":0.05,"turns":2,"stack":true,"maxStacks":4}]},"basic":{"effects":[{"when":"hit","action":"basic","do":"status","who":"target","status":"speedDown","value":0.05,"turns":2,"stack":true,"maxStacks":4}]},"ultimate":{"effects":[{"when":"hit","action":"ultimate","do":"status","who":"target","status":"speedDown","value":0.05,"turns":2,"stack":true,"maxStacks":4}]}},
  /* @scaffold:effects (one entry per hero above this line) */
});
