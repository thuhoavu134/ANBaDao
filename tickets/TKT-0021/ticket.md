---
id: TKT-0021
title: Open Trợ trận Đồ Giám Cẩu Cá with a catch catalog
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T10:15:00.000Z
updated: 2026-09-11T10:22:00.000Z
acceptance_ids: ["L21-F1","L21-F2","L21-F3","L21-F4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-fish.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-fish.mjs","assets/ui/account-fish/"]
resource_locks: ["assist-wheel","heroStats","account-gear-overlay"]
---
# TKT-0021 — Trợ trận → Đồ Giám Cẩu Cá

Goal: Unlock the last wheel node. Eight Vietnamese fish. **Câu** spends gold + Hoạt Lực and raises a random (injectable rng) fish. All caught levels count. Bậc Thầy when all eight share min level.

Non-goals: new currency, live minigame physics, changing combat seed.

## Acceptance

- L21-F1: 8 fish covering hp/atk/def/spd; empty board grants 0
- L21-F2: Câu spends gold+hoat, stays immutable, rejects missing funds / all-max; rng picks the fish
- L21-F3: every leveled fish counts; Bậc Thầy needs all 8
- L21-F4: wheel opens 2×4 catalog; Câu; heroStats adds bonus; 0 app errors on Chrome 390×844

## Result

- GREEN 4/4 `tests/account-fish.test.mjs`. Combined 51/51
- Chrome 390×844: 8 ô, Câu 500→450 vàng, 1 cá +1, bánh xe 0 nan khóa, Bậc Thầy Lv1, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L21-FISH/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
