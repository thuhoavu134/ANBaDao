---
id: TKT-0013
title: Separate overlapping Trợ trận wheel icons
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T09:27:00.000Z
updated: 2026-09-11T09:32:00.000Z
acceptance_ids: ["L13-W1","L13-W2","L13-W3"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","tests/account-relics.test.mjs","scripts/qa-account-relics.mjs"]
resource_locks: ["assist-wheel"]
---
# TKT-0013 — Icon bánh xe Trợ trận đè nhau

Goal: 11 spokes sit on a full circle with ≥32° spacing. Circular badges do not overlap. Only the badge receives taps.

Non-goals: new wheel nodes, relic/gear rules, seed/reward, live deploy.

## Acceptance

- L13-W1: 11 unique angles; minimum circular gap ≥ 32°
- L13-W2: spoke `pointer-events` only on the 54px badge; radius large enough to clear the core
- L13-W3: Chrome 390×844 badge boxes do not overlap; 0 app errors

## Result

- RED: `wheel gap 14`
- GREEN 5/5 `tests/account-relics.test.mjs`
- Chrome 390×844: 11 badges, overlap 0, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L13-RELICS/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
