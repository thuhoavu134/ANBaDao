# Mixed legacy/S+ healing — 2026-10-04

After progress/next scope update PR #258, the first mixed-adapter test reproduced a legacy heal awarding 340 HP despite an active S+ antiHeal=1 debuff. This is an integration failure, not a hero balance decision.

Patch the existing __hvApplyHeal3qAdapter owner: Core retains cast strength and legacy received-healing reductions; in a mixed fight S+ applies its own healing reduction, anti-heal, wound conversion, cap and single heal event. Remove S+ healDown only from Core request calculation to avoid applying it twice, and calculate the uncapped request before S+ reduces/caps it. Keep the existing legacy-only path and authored heal burst/SFX. Actual gameplay visuals remain unverified.

Generated adapter VM tests use the real Core and S+ engine: both teams, full anti-heal, 50% reduction exactly once, near-full HP, dead target, legacy-only fallback, single event and expiry. Initial RED: 340 != 0. GREEN: focused tests pass. Full CI must be reported separately.

The complete mixed campaign simulator is still pending. Next integrate legacy action impacts, status interoperability and canonical roster/encounter stats before using win rates to change difficulty or income.
