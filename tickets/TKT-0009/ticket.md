---
id: TKT-0009
title: Bậc Thầy Trang Bị grants team stats
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T08:00:00.000Z
updated: 2026-09-11T08:20:00.000Z
acceptance_ids: ["L13-M1","L13-M2","L13-M3","L13-M4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-board.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/qa-account-gear.mjs"]
resource_locks: ["equipment-board"]
---
# TKT-0009 — Bậc Thầy Trang Bị kích hoạt

Goal: Khi đủ 12 ô cùng mức cường hóa N ≥ 1, Bậc Thầy Lv N cộng HP/Công/Thủ/Tốc cho toàn đội. UI hiện tiến độ lên cấp kế và dòng buff khi đã kích hoạt.

Non-goals: nan Trợ trận khác, đổi công thức/seed/reward rèn, bỏ 4 ô theo tướng, đổi salvage Dung luyện.

## Acceptance

- L13-M1: master 0 → `{ hp:0, atk:0, def:0, spd:0 }`
- L13-M2: 12 ô cùng +3 → `{ hp:120, atk:12, def:9, spd:3 }` nằm trong `accountGearBonus`
- L13-M3: tháo 1 ô → master 0, mất buff Bậc Thầy
- L13-M4: UI có thanh tiến độ và copy **Đã kích hoạt**; Chrome 390×844 hiện Lv 1 sau khi 12 ô +1

## Result

- RED → GREEN: 14/14 `tests/account-gear-board.test.mjs`
- Chrome 390×844: Lv1 **Đã kích hoạt · HP +40 · Công +4 · Thủ +3 · Tốc +1**, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L13-ACCOUNT-GEAR/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
