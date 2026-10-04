# Canonical campaign content audit — 2026-10-04

Run after a fresh build:

```
npm run build
node scripts/campaign-progression-audit.mjs > /tmp/campaign-progression.json
node --test tests/campaign-progression-audit.test.mjs tests/campaign-boss-cadence.test.mjs
```

The harness evaluates selected generated-host data declarations and stat functions in a bounded VM, expands all six chapter sequences through the actual lore owner, then uses the roster conversion domain. It fails on missing extraction anchors. It does not execute the host UI or implement an approximate legacy combat engine.

Observed content: 108 stages, 14 IDs in the historically named OFFICIAL_ROSTER_12_IDS constant. Profiles compare levels 1/5/10 at one star with equipment, set, mold, guild, clan, awakening, relationship and mastery bonuses explicitly zero. These are not affordability or ownership claims.

The chapter 5 mirror boss uses an explicit fixture squad: the first six official IDs. Different account squads produce different mirror stats. Its authored level/star scaling is retained.

| Chapter | Stages | Seal-only gold | Total enemy HP at boss stages 6 / 12 / 18 |
| --- | ---: | ---: | --- |
| 1 | 18 | 2,419 | 8,400 / 10,416 / 12,432 |
| 2 | 18 | 2,995 | 19,185 / 23,100 / 27,015 |
| 3 | 18 | 3,571 | 29,744 / 35,024 / 40,304 |
| 4 | 18 | 4,147 | 47,559 / 55,029 / 62,499 |
| 5 | 18 | 4,723 | 20,737 / 23,657 / 26,579 |
| 6 | 18 | 5,299 | 62,980 / 71,020 / 79,060 |

Seal-only gold excludes base battle, first-clear, quest, chapter, world, daily and AFK rewards. HP alone is not difficulty: attacks, skills, control, team composition and bonuses matter. Do not tune rewards from these totals.

Discovered runtime blocker: chapter 5's authored mirror encounter is a function, but seal expansion passed the function into cloneWave, causing `(foes || []).map is not a function`. The owner now resolves encounter factories before cloning and returns already-generated waves without re-invoking the factory. Static wave rotation and boss cadence remain unchanged. RED test reproduced the failure; focused audit/boss/slot tests passed after the fix.

Remaining: build canonical bridge/legacy skill execution into a mixed battle harness, verify it against runtime traces, model representative account budgets and bonuses, then measure win rates and reward progression. No full campaign simulation, browser/device validation or reward rebalance is claimed here.
