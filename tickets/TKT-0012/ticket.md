---
id: TKT-0012
title: Trợ trận → Bảo Vật
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T09:00:00.000Z
updated: 2026-09-11T09:20:00.000Z
acceptance_ids: ["L13-R1","L13-R2","L13-R3","L13-R4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-relics.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","assets/ui/account-relics/","tests/account-relics.test.mjs"]
resource_locks: ["assist-wheel"]
---
# TKT-0012 — Trợ trận → Bảo Vật

Goal: Spoke **Bảo Vật** on the Trợ trận wheel opens an account-wide relic board. Eight Vietnamese treasures flank the lead portrait. Cường hóa spends existing gold/hoạt lực. Bonuses apply to the whole roster. Set and Bậc Thầy Bảo Vật bonuses stack with the 12-slot gear board.

Non-goals: other locked wheel nodes, forge recipe/seed/reward, per-hero 4-slot, relic gacha/drops, star-up, Dung luyện.

## Acceptance

- L13-R1: 8 relics in two sets of 4; empty (all +0) grants no combat bonus
- L13-R2: enhance is immutable; spends gold/hoạt; rejects max level and missing funds
- L13-R3: primary stat × level + 2/4-set (level ≥ 1) + Bậc Thầy min-level of all 8
- L13-R4: wheel opens relic view; 8 circular slots; Cường hóa / Cường hóa nhanh; Chrome 390×844

## Result

- RED → GREEN: 5/5 `tests/account-relics.test.mjs` (gear+relic 19/19)
- Chrome 390×844 `?qa=unlock-all`: spoke mở, 8/8 ô, vàng 500→420, Đồ giám hai bộ, Bậc Thầy Lv1, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L13-RELICS/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
