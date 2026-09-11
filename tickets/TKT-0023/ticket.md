---
id: TKT-0023
title: Tower floor power gate with daily catch-up
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T11:20:00.000Z
updated: 2026-09-11T11:50:00.000Z
acceptance_ids: ["L22-P1","L22-P2","L22-P3","L22-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/tower/tower-progress.mjs","src/ui/tower-runtime.js","src/ui/tower-screen.css","scripts/qa-tower-screen.mjs","tests/tower-progress.test.mjs"]
resource_locks: ["tower-screen"]
---
# TKT-0023 — Tháp khóa lực chiến + bù ngày

Goal: Each floor needs a combat-power mark. Enough power clears the floor. Too low fails, keeps the floor, and starts a daily catch-up so a near-miss can pass after a few days. Players still need Trợ trận / Rèn / sao to cover a large gap.

Non-goals: new currency, campaign win, combat seed, online rank, changing gold/stamina formulas.

## Acceptance

- L22-P1: required power rises with floor; floor 1 is under a typical 6-hero start
- L22-P2: under-power attempt spends stamina, does not drop floor, does not touch campaign, records stuckSince
- L22-P3: same power that failed day 0 can pass after a few catch-up days; catch-up caps
- L22-P4: screen shows đội / cần; Leo tầng auto-resolves; Chrome 390×844, 0 app errors

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 8/8 `tests/tower-progress.test.mjs` (L22-T1..T4 + L22-P1..P4)
- Chrome 390×844 `?qa=unlock-all`: Tầng 1 đội 6.063 / cần 3.800 → Leo tầng auto-resolve, 0 trận, ⚡120→115, Tầng 2. Tầng 12 stub 1.200 / 8.420 kẹt, Thử leo không tụt tầng, stuckSince ghi, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L22-TOWER/`
