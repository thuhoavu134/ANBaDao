---
id: TKT-0003
title: L12 fixed campaign formation slots
status: REVIEW
phase: GREEN
priority: P1
created: 2026-09-10T09:10:00.000Z
updated: 2026-09-10T09:10:00.000Z
acceptance_ids: ["L12-S1","L12-S2","L12-S3","L12-S4","L12-S5","L12-S9","L12-S10"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/campaign/campaign-view.mjs","src/domain/hero/loadout.mjs","src/ui/campaign-scene.js","src/ui/campaign-scene.css","index.html","scripts/campaign-fixed-slots-v1.mjs","scripts/build-static.mjs","tests/campaign-fixed-slots.test.mjs","tests/campaign-pointer-lifecycle.test.mjs"]
resource_locks: ["campaign-formation-slots"]
last_handoff_revision:
---
# TKT-0003 — L12 fixed campaign formation slots

## Contract

Goal: Keep Bày trận on a fixed six-slot board. Removing a hero leaves a hole; dragging onto an empty slot moves without packing. Unique saved `slot` values survive load/save. Legacy saves without slots still pack by row. Empty launch stays blocked; 1–6 owned heroes can still sortie.

Non-goals: visual redesign of Bày trận, AFK facelift, countdown auto-next, crop/target/Combat V2, balance.

## Acceptance

- L12-S1: toggle-off keeps remaining heroes on their slots.
- L12-S2: reserve add fills the first hole.
- L12-S3: drag occupied → empty moves without compacting.
- L12-S4: selected empty slot can receive a reserve hero.
- L12-S5: unique slots persist through prepareFormationChange; missing slots stay legacy-safe.
- L12-S9: empty slots cannot start a drag.
- L12-S10: source normalizeSquad keeps unique slots and still recovers empty saves.

## Next action

RED → GREEN on source tests, build through scripts/build-static.mjs, Chrome preview of Bày trận holes, then REVIEW. Do not merge to main.
