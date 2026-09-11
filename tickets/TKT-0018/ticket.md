---
id: TKT-0018
title: Open Trợ trận Cổ Vật with a single equipped antique
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T10:00:00.000Z
updated: 2026-09-11T10:06:00.000Z
acceptance_ids: ["L18-A1","L18-A2","L18-A3","L18-A4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-antiques.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-antiques.mjs","assets/ui/account-antiques/"]
resource_locks: ["assist-wheel","heroStats","account-gear-overlay"]
---
# TKT-0018 — Trợ trận → Cổ Vật

Goal: Unlock Cổ Vật. Six Vietnamese antiques. An vị **exactly one**. Only the equipped antique grants its flat stats. Enhance with gold + Hoạt Lực. Bậc Thầy when all six share min level (collection bonus always on).

Non-goals: new currency, loot table, other wheel nodes, live deploy.

## Acceptance

- L18-A1: 6 antiques covering hp/atk/def/spd; empty board grants 0
- L18-A2: enhance spends gold+hoat, immutable, rejects max/missing funds
- L18-A3: only equipped antique counts; An vị swaps the one slot; Bậc Thầy needs all 6
- L18-A4: wheel opens 2×3 grid; Cường hóa + An vị; heroStats adds bonus; 0 app errors on Chrome 390×844

## Result

- GREEN 4/4 `tests/account-antiques.test.mjs`. Combined 39/39
- Chrome 390×844: 6 ô, Cường hóa 500→420 vàng, An vị 1, Bậc Thầy Lv1, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L18-ANTIQUES/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
