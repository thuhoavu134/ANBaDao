---
id: TKT-0007
title: Account-wide 12-slot equipment board
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-10T11:15:00.000Z
updated: 2026-09-10T11:42:00.000Z
acceptance_ids: ["L13-G1","L13-G2","L13-G3","L13-G4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-board.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","src/ui/hero-detail-tabs.js","assets/ui/account-gear/"]
resource_locks: ["equipment-board"]
---
# TKT-0007 — Trợ trận → Trang bị (12 ô)

Goal: Dock Trợ trận opens the assist wheel; Trang bị is a 12-slot account board with enhance, quick enhance, quick equip and quick unequip. Bonuses apply to the whole roster.

Non-goals: Dung luyện, wheel entries other than Trang bị/Quân Trận, changing forge recipes, per-hero 4-slot removal, seed/reward tables.

## Result

- RED → GREEN: 10/10 `tests/account-gear-board.test.mjs`
- Chrome 390×844 `?qa=unlock-all`: wheel → board, title visible, 12/12 filled, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L13-ACCOUNT-GEAR/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
