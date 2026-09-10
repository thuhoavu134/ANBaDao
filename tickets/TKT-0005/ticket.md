---
id: TKT-0005
title: L12 tap field hero to undock
status: REVIEW
phase: GREEN
priority: P1
created: 2026-09-10T09:40:00.000Z
updated: 2026-09-10T10:00:00.000Z
acceptance_ids: ["L12-R1","L12-R2","L12-R3"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/ui/campaign-scene.js","tests/campaign-field-remove.test.mjs","docs/qa/L12-FIELD-REMOVE"]
resource_locks: ["campaign-formation-slots"]
last_handoff_revision:
---
# TKT-0005 — L12 tap field hero to undock

## Contract

Goal: On Bày trận, one tap on an occupied field hero removes that hero from the squad immediately. The player does not need to tap the bench portrait below. Empty-slot tap still selects a hole for a reserve. Drag still swaps. Holes stay; remaining heroes keep their slots.

Non-goals: visual redesign of Bày trận, bench-to-field drag, AFK, combat, crop, balance, restoring rejected visual pass `74b3976`.

## Acceptance

- L12-R1: a tap on an occupied field slot removes that hero and leaves a hole; remaining heroes keep their slots.
- L12-R2: a tap on an empty field slot still selects it for a reserve placement.
- L12-R3: a drag leftover click (`suppressSlotClick`) still does not remove or select.

## Worklog

- GREEN 4/4 `tests/campaign-field-remove.test.mjs`. Focused campaign/pointer 26/26 PASS.
- Chrome 390×844 `?qa=unlock-all`: tap Ông Phở on slot 0 → 5/6, hole at 0, remaining keep 1–5; next tap on that hole selects it.
- Bench portrait still can undock as a secondary path. Drag still swaps.

## Next action

Owner review. Do not merge to main.
