---
id: TKT-0140
title: Hiện thẻ Linh Đồng trên Tướng và Đồ Giám
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-14T04:12:00.000Z
updated: 2026-09-14T04:20:00.000Z
acceptance_ids: ['L140-T1', 'L140-T2', 'L140-T3', 'L140-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/domain/hero/roster-view.mjs
  - src/ui/hero-roster-runtime.js
  - tests/linh-dong-roster.test.mjs
  - docs/qa/L140-LINH-DONG-ROSTER/
resource_locks: ["linh-dong-roster"]
branch_hint: work/l140-linh-dong-roster-20260914
---
# TKT-0140

Owner iOS 14/09 (IMG_7331/7332): Tướng và Đồ Giám đều 12/12, không có Linh Đồng.
Hiện thẻ portrait Linh Đồng trên cả hai tab. Không đưa vào 12 tướng Gọi Mộng / đội hình.

## Non-goals

Không sửa `OFFICIAL_ROSTER_12_IDS`. Không Gọi Mộng. Không đổi BETS 2/10/50, loot, công thức combat. Không per-frame crop, không key đen.

## Acceptance

- L140-T1: `buildRosterView` extras `linh_dong` hiện ở scope owned và all; portrait `assets/characters/linh-dong/card.webp`; hệ `mong`
- L140-T2: runtime Tướng/Đồ Giám render `data-hero-id="linh_dong"`; `OFFICIAL_ROSTER_12_IDS` không gồm `linh_dong`; BETS đóng băng
- L140-T3: chạm thẻ Linh Đồng mở `battle.html?qaSplus42=hero_splus_linh_dong`; tướng 12 vẫn `renderHeroDetail`
- L140-P1: Chrome 390×844 — tab Tướng và Đồ Giám có thẻ Linh Đồng, portrait thật

## Result

RED 3 fail → GREEN 3/3 L140 + npm test 947 PASS.
Chrome 390×844 L140-P1 PASS (Tướng + Đồ Giám 13 thẻ, portrait Linh Đồng góc trên-trái). Safari NOT_RUN.
Chạm thẻ mở trận thử atlas. Roster 12 / Gọi Mộng / BETS không đổi.
