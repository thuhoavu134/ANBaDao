---
id: TKT-0014
title: Open Trợ trận Linh Thú with six account pets
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T09:34:00.000Z
updated: 2026-09-11T09:42:00.000Z
acceptance_ids: ["L14-P1","L14-P2","L14-P3","L14-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-pets.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-pets.mjs","assets/ui/account-pets/"]
resource_locks: ["assist-wheel","heroStats","account-gear-overlay"]
---
# TKT-0014 — Trợ trận → Linh Thú

Goal: Unlock the Linh Thú spoke. Six Vietnamese sacred beasts sit on an account board. Deploy one. Enhance with existing gold + Hoạt Lực. Team-wide bonus wraps `heroStats`.

Non-goals: new currency, loot table, gacha, other wheel nodes, live deploy.

## Acceptance

- L14-P1: 6 pets; empty board grants 0; stats cover hp/atk/def/spd
- L14-P2: enhance spends gold+hoat, immutable, rejects max/missing funds
- L14-P3: deployed pet full stat, others 25% support; Bậc Thầy when all 6 share min level
- L14-P4: wheel spoke opens pet view; 6 slots; Xuất chiến + Cường hóa; 0 app errors on Chrome 390×844

## Result

- RED: missing `account-pets.mjs`
- GREEN 4/4 `tests/account-pets.test.mjs`. Combined pets+relics+gear 23/23
- Chrome 390×844: 6 ô, Cường hóa 500→440 vàng, Xuất chiến Rồng Lạc, Bậc Thầy Lv1 kích hoạt, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L14-PETS/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
