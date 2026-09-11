---
id: TKT-0016
title: Open Trợ trận Thần Binh with percent troop banners
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T09:48:00.000Z
updated: 2026-09-11T09:54:00.000Z
acceptance_ids: ["L16-D1","L16-D2","L16-D3","L16-D4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-divines.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-divines.mjs","assets/ui/account-divines/"]
resource_locks: ["assist-wheel","heroStats","account-gear-overlay"]
---
# TKT-0016 — Trợ trận → Thần Binh

Goal: Unlock Thần Binh. Four Vietnamese troop banners grant **percent** combat stats (not flat). Enhance with gold + Hoạt Lực. All four always active. Bậc Thầy when all four share min level.

Non-goals: new currency, loot table, other wheel nodes, live deploy.

## Acceptance

- L16-D1: 4 troops covering hp/atk/def/spd percent; empty board grants 0
- L16-D2: enhance spends gold+hoat, immutable, rejects max/missing funds
- L16-D3: each troop adds its percent; Bậc Thầy adds all-stat percent when all 4 share min level
- L16-D4: wheel opens 2×2 banners; Cường hóa; heroStats applies percent; 0 app errors on Chrome 390×844

## Result

- RED: missing `account-divines.mjs` (earlier). GREEN 4/4 `tests/account-divines.test.mjs`. Combined 31/31
- Chrome 390×844: 4 cờ, Cường hóa 500→430 vàng, Đồ giám hiện %, Bậc Thầy Lv1, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L16-DIVINES/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
