---
id: TKT-0006
title: L12 enter battle after formation
status: REVIEW
phase: GREEN
priority: P1
created: 2026-09-10T10:05:00.000Z
updated: 2026-09-10T10:20:00.000Z
acceptance_ids: ["L12-B1","L12-B2","L12-B3","L12-B4","L12-B5","L12-B6"]
required_gates: ["vibelab","tdd"]
affected_paths: ["index.html","battle.html","scripts/runtime-safety-hotfix.mjs","scripts/combat-domain-3q-adapter-v1.mjs","tests/battle-enter-loading.test.mjs"]
resource_locks: ["battle-overlay"]
last_handoff_revision:
---
# TKT-0006 — L12 enter battle after formation

## Contract

Goal: After Bày trận → Xuất chiến, the overlay is a short loading veil into real combat. It must not look like another formation screen, and it must not stay up if the iframe loaded or if embed config failed to parse on iOS.

Non-goals: combat rules, crop, AFK, Bày trận visual redesign, restoring `74b3976`.

## Acceptance

- L12-B1: loading copy says the fight is starting, not “swap the engine”.
- L12-B2: iframe `load` hides the veil even without `contentDocument`.
- L12-B3: iframe URL includes `autostart=1`; Rút lui is visible while loading.
- L12-B4: embedded battle.html starts combat and reports the URL session if config parse fails.

## Worklog

- RED 0/4 → GREEN 4/4.
- Chrome 390×844: Xuất chiến → overlay → combat canvas, round 1, auto 6v4. No app-origin errors.
- Safari/device NOT_RUN.

## Next action

Owner review on iPhone. Do not merge to main.
