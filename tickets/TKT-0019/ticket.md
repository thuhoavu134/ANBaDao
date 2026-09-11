---
id: TKT-0019
title: Open Trợ trận Tuệ Vận with one active fortune seal
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T10:05:00.000Z
updated: 2026-09-11T10:10:00.000Z
acceptance_ids: ["L19-L1","L19-L2","L19-L3","L19-L4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-luck.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-luck.mjs","assets/ui/account-luck/"]
resource_locks: ["assist-wheel","heroStats","account-gear-overlay"]
---
# TKT-0019 — Trợ trận → Tuệ Vận

Goal: Unlock Tuệ Vận. Five ngũ phúc seals. Chọn vận **exactly one**. Only the chosen seal grants percent stats. Enhance with gold + Hoạt Lực. Bậc Thầy when all five share min level.

Non-goals: new currency, loot table, other wheel nodes, live deploy.

## Acceptance

- L19-L1: 5 seals covering hp/atk/def/spd plus all-stat Ninh; empty board grants 0
- L19-L2: enhance spends gold+hoat, immutable, rejects max/missing funds
- L19-L3: only chosen seal counts; Chọn vận swaps the one slot; Bậc Thầy needs all 5
- L19-L4: wheel opens 5 seals; Cường hóa + Chọn vận; heroStats applies percent; 0 app errors on Chrome 390×844

## Result

- GREEN 4/4 `tests/account-luck.test.mjs`. Combined 43/43
- Chrome 390×844: 5 ấn, Cường hóa 500→440 vàng, Chọn vận 1, Bậc Thầy Lv1, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L19-LUCK/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
