---
id: TKT-0020
title: Open Trợ trận Ảo Hình with chính/phụ illusion slots
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T10:10:00.000Z
updated: 2026-09-11T10:16:00.000Z
acceptance_ids: ["L20-I1","L20-I2","L20-I3","L20-I4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-illusions.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/account-gear-v1.mjs","scripts/qa-account-illusions.mjs","assets/ui/account-illusions/"]
resource_locks: ["assist-wheel","heroStats","account-gear-overlay"]
---
# TKT-0020 — Trợ trận → Ảo Hình

Goal: Unlock Ảo Hình. Six Vietnamese theatrical illusions. Wear **chính (100%) + phụ (50%)**. Enhance with gold + Hoạt Lực. Bậc Thầy when all six share min level.

Non-goals: new currency, loot table, other wheel nodes, live deploy, fishing.

## Acceptance

- L20-I1: 6 illusions covering hp/atk/def/spd; empty board grants 0
- L20-I2: enhance spends gold+hoat, immutable, rejects max/missing funds
- L20-I3: chính 100% + phụ 50%; An vị toggles/fills slots; Bậc Thầy needs all 6
- L20-I4: wheel opens 2×3 grid + 2 loadout slots; Cường hóa + An vị; heroStats adds bonus; 0 app errors on Chrome 390×844

## Result

- GREEN 4/4 `tests/account-illusions.test.mjs`. Combined 47/47
- Chrome 390×844: 6 ô, Cường hóa 500→435 vàng, An vị chính+phụ, Bậc Thầy Lv1, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L20-ILLUSIONS/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
