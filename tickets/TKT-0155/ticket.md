---
id: TKT-0155
title: Hiện thẻ Bạch Diện trên Tướng và Đồ Giám
status: SUPERSEDED
phase: SUPERSEDED
priority: P0
created: 2026-09-16T05:30:00.000Z
updated: 2026-09-16T05:50:00.000Z
acceptance_ids: [L155-T1, L155-T2, L155-T3, L155-T4, L155-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/domain/hero/roster-view.mjs
  - src/ui/hero-roster-runtime.js
  - tests/bach-dien-roster.test.mjs
  - tickets/TKT-0155/
resource_locks: [hero-roster, splus-catalog-42]
branch_hint: work/l155-bach-dien-roster-20260916
---
# TKT-0155

Owner 16/09: chưa thấy tướng mới. Pack TKT-0154 đã LIVE nhưng không hiện trên màn Tướng / Đồ Giám vì extra S+ không nằm `OFFICIAL_ROSTER_12_IDS`.

## Goal

Hiện thẻ portrait Bạch Diện trên Tướng (sở hữu) và Đồ Giám. Chạm thẻ mở trận S+ authored. Không đưa vào 12 tướng Gọi Mộng / đội hình.

## Non-goals

Không sửa `OFFICIAL_ROSTER_12_IDS`. Không thêm `bach_dien` vào `DATA.heroes`. Không Gọi Mộng. Không đổi BETS 2/10/50, loot, lưới 42, encyclopedia 126 icon. Không Spine. Không đổi damage / initiative / AI / turn clock.

## Acceptance

- L155-T1: `buildRosterView` extras `bach_dien` hiện owned + all; portrait `assets/characters/bach-dien/card.webp`; hệ `soul`
- L155-T2: runtime Tướng/Đồ Giám `data-hero-id="bach_dien"`; `OFFICIAL_ROSTER_12_IDS` không chứa `bach_dien`; BETS đóng băng
- L155-T3: chạm thẻ Bạch Diện mở `battle.html?qaSplus42=hero_splus_bach_dien`; 12 tướng vẫn `renderHeroDetail`
- L155-T4: encyclopedia 42/126; `DATA.heroes` không có slug `bach-dien`
- L155-P1: Chrome 390×844 — tab Tướng và Đồ Giám có thẻ Bạch Diện, portrait thật. Safari/iPhone NOT_RUN

## Review

LIVE #151 `7a700e9`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.
