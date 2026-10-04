# Controlled S+ balance benchmark — 2026-10-04

Baseline: main `1b130f37877d3ce5d8a4cf2e26ed6ef2b69a4200`.

Run `node scripts/combat-balance-benchmark.mjs`. No DOM, animations, storage or asset loading. Reuses `createSplusCombat`, core slot order and the core 15-round challenge judgement. Seeded RNG; extra-turn and action-delay queue events are consumed, with a guard against runaway extra turns.

324 matches: three six-hero teams, all nine pairings, player levels 1/5/10, twelve seeds each. Everyone starts with 2000 HP, 180 ATK, 50 DEF before level scaling. This isolates skill interactions; it is not production campaign difficulty and does not model legacy kits, equipment, account bonuses, synergies, map effects, UI or Safari. The teams are benchmark fixtures, not recommendations for a new account.

At equal level/base stats:
- Balanced versus offense: 9/12 wins; average 10.92 rounds.
- Offense versus sustain: 12/12 wins; average 11.42 rounds.
- Sustain versus balanced: 8/12 wins; all reach the round cap.
- Balanced mirror and sustain mirror also reach the cap in all twelve trials.

This shows composition matters and several sustain matchups depend on the existing HP judgement at the cap. Twelve seeds give coarse estimates, not stable production win-rate targets. No hero nerf, reward or combat-rule changes are justified by this fixture alone.

Next: extend the benchmark through the production mixed legacy/S+ adapter, canonical host stats and deterministic campaign roster resolution. Test actual starter, earned heroes and equipment states before changing boss HP or upgrade income. Desktop/Safari visual timing and production deployment are outside this benchmark.
