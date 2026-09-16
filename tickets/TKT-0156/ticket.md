---
id: TKT-0156
title: Bạch Diện tướng đầy đủ như Linh Đồng
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-16T05:55:00.000Z
updated: 2026-09-16T06:05:00.000Z
acceptance_ids: [L156-T1, L156-T2, L156-T3, L156-T4, L156-T5, L156-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - index.html
  - src/domain/hero/skill-kit.mjs
  - src/domain/hero/account-stars.mjs
  - src/ui/hero-roster-runtime.js
  - src/ui/hero-detail-tabs.css
  - tests/bach-dien-hero.test.mjs
  - assets/ui/hero-detail/bach-dien-showcase-bg.jpg
  - docs/qa/L156-BACH-DIEN-HERO/
resource_locks: [hero-roster, splus-catalog-42]
branch_hint: work/l156-bach-dien-hero-20260916
---
# TKT-0156

Owner 16/09: TKT-0155 extras + trận thử làm mất Linh Đồng, Bạch Diện không vào game như tướng thật. Làm đúng TKT-0141: tướng đầy đủ, hồ sơ idle, không nhảy trận QA.

## Goal

Bạch Diện vào `DATA.heroes`, roster chính thức, hồ sơ idle atlas, kit v2. Linh Đồng giữ chỗ. Chạm thẻ mở `renderHeroDetail`. Không `qaSplus42`.

## Non-goals

Không đổi BETS 2/10/50, loot, công thức combat của 12 tướng cũ. Không mở encyclopedia 42. Không Spine. Không đổi 6v6 `slice(0,6)`/`slice(6,12)`. Không Hồng Trầu.

## Acceptance

- L156-T1: `DATA.heroes.bach_dien` stats/skill/ultimate; `CHARACTER_MANIFEST` surfaces roster, formation, hero-detail, battle
- L156-T2: `OFFICIAL_ROSTER_12_IDS` gồm `bach_dien` và `linh_dong`; save mới + migrate sở hữu; `STAR_ROSTER_IDS` gồm cả hai
- L156-T3: kit v2 `getHeroSkillKit('bach_dien')` hợp lệ; tên khớp skill.json authored
- L156-T4: chạm thẻ Tướng mở `renderHeroDetail`; idle canvas hồ sơ; không nhảy trận thử; runtime không extras-only
- L156-T5: encyclopedia 42/126 giữ; 6v6 slice giữ; BETS đóng
- L156-P1: Chrome 390×844 — Tướng có Bạch Diện + Linh Đồng, hồ sơ idle, nâng cấp/sao. Safari/iPhone NOT_RUN

## Review

RED L156-T1…T5 → GREEN 6/6. npm test 1040/1040. Chrome 390×844 `tuong-390x844.png` + `detail-390x844.png` PASS. TKT-0155 extras/trận thử SUPERSEDED. Safari/iPhone NOT_RUN.

Đợi `live` rồi squash-merge. Owner tự `git pull && vercel --prod`.

