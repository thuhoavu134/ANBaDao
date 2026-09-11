---
id: TKT-0017
title: Open Trợ trận Tướng Tinh using existing hero stars
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T09:55:00.000Z
updated: 2026-09-11T10:00:00.000Z
acceptance_ids: ["L17-T1","L17-T2","L17-T3","L17-T4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/hero/account-stars.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-stars.mjs"]
resource_locks: ["assist-wheel","account-gear-overlay"]
---
# TKT-0017 — Trợ trận → Tướng Tinh

Goal: Unlock Tướng Tinh. 12 official heroes on a star board. Thăng sao spends existing mảnh hồn (`P.shards`) and writes `P.heroes[id].stars` (max 6). Combat already scales 12% per star — do not wrap heroStats again.

Non-goals: new currency, loot table, other wheel nodes, live deploy, changing starCost.

## Acceptance

- L17-T1: cost is 20 × current stars; max 6; unowned cannot star
- L17-T2: prepare is immutable; rejects max/missing shards/unowned
- L17-T3: Bậc Thầy = min ★ of all 12 (unowned counts as 0)
- L17-T4: wheel opens 12-portrait board; Thăng sao spends shards; 0 app errors on Chrome 390×844

## Result

- GREEN 4/4 `tests/account-stars.test.mjs`. Combined 35/35
- Chrome 390×844: 12 ô, Thăng sao 80→60 mảnh, ★1→★2, Bậc Thầy ★2, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L17-STARS/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
