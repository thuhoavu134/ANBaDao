---
id: TKT-0015
title: Open Trợ trận Cửu Ứ Chiến Linh
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T09:40:00.000Z
updated: 2026-09-11T09:48:00.000Z
acceptance_ids: ["L15-S1","L15-S2","L15-S3","L15-S4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-spirits.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-spirits.mjs","assets/ui/account-spirits/"]
resource_locks: ["assist-wheel","heroStats","account-gear-overlay"]
---
# TKT-0015 — Trợ trận → Cửu Ứ Chiến Linh

Goal: Unlock Cửu Ứ Chiến Linh. Nine Vietnamese war spirits in a 3×3 board. An vị up to 3. Enhance with gold + Hoạt Lực. Only slotted spirits grant combat stats. 3-piece set if the three slots share a triad.

Non-goals: new currency, loot table, other wheel nodes, live deploy.

## Acceptance

- L15-S1: 9 spirits, 3 sets of 3; empty board grants 0
- L15-S2: enhance spends gold+hoat, immutable, rejects max/missing funds
- L15-S3: only 3 slotted spirits count; same-set 3-slot bonus; Bậc Thầy when all 9 share min level
- L15-S4: wheel opens 3×3 spirit view; An vị + Cường hóa; 0 app errors on Chrome 390×844

## Result

- RED: missing `account-spirits.mjs`
- GREEN 4/4 `tests/account-spirits.test.mjs`. Combined 27/27
- Chrome 390×844: 9 ô, Cường hóa 500→450 vàng, An vị Liễu Hạnh, Bậc Thầy Lv1, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L15-SPIRITS/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
