---
id: TKT-0004
title: L12 preparation drag leftover tap
status: REVIEW
phase: GREEN
priority: P1
created: 2026-09-10T09:20:00.000Z
updated: 2026-09-10T09:30:00.000Z
acceptance_ids: ["L12-D1","L12-D2"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/ui/campaign-scene.js","tests/campaign-pointer-lifecycle.test.mjs","docs/qa/L12-DRAG-TAP","docs/project-memory.md","docs/vibe-changelog.md","docs/HANDOFF-2026-09-09.md"]
resource_locks: ["campaign-preparation-pointer"]
last_handoff_revision:
---
# TKT-0004 — L12 preparation drag leftover tap

## Contract

Goal: After dragging a hero on Bày trận, the next tap on an empty slot must select it. A completed drop must not leave the vacated hole selected.

Non-goals: visual redesign, bench-to-field drag, AFK, combat, crop, balance.

## Acceptance

- L12-D1: a moved drop that rebuilds the slot DOM does not keep `suppressSlotClick` armed through the next empty-slot pointerdown.
- L12-D2: a moved drop clears `sceneState.slot` so the source hole is not still selected.

## Worklog

- RED 11/13, fail L12-D1 and L12-D2.
- GREEN 13/13; focused campaign/lifetime 44/44; build PASS.
- Chrome 390×844: drag 5→3 then first tap on empty slot 5 selects; Ông Phở placed on that hole.

## Next action

Owner review. Do not merge to main.
