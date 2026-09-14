---
id: TKT-0141
title: Linh Đồng tướng đầy đủ như Lục Ảnh
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-14T04:25:00.000Z
updated: 2026-09-14T04:41:13.000Z
acceptance_ids: ['L141-T1', 'L141-T2', 'L141-T3', 'L141-T4', 'L141-T5', 'L141-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - index.html
  - battle.html
  - src/domain/hero/skill-kit.mjs
  - src/domain/hero/account-stars.mjs
  - src/ui/hero-roster-runtime.js
  - src/ui/hero-detail-tabs.css
  - tests/linh-dong-hero.test.mjs
  - assets/ui/hero-detail/linh-dong-showcase-bg.jpg
  - docs/qa/L141-LINH-DONG-HERO/
resource_locks: ["linh-dong-hero"]
branch_hint: work/l141-linh-dong-hero-20260914
---
# TKT-0141

Owner 14/09: tích hợp Linh Đồng vào toàn bộ tính năng giống các tướng khác, áp dụng y hệt Lục Ảnh.

## Non-goals

Không đổi BETS 2/10/50, loot, công thức combat của 12 tướng cũ. Không mở 42 tướng S+ còn lại. Không thay art tướng bằng hình sinh mới. Không per-frame crop, không key đen. Không nhét Hồng Trầu.

## Acceptance

- L141-T1: `DATA.heroes.linh_dong` có stats/skill/ultimate; `CHARACTER_MANIFEST` surfaces roster, formation, hero-detail, battle
- L141-T2: `OFFICIAL_ROSTER_12_IDS` gồm `linh_dong`; save mới và migrate sở hữu; `STAR_ROSTER_IDS` gồm `linh_dong`
- L141-T3: kit v2 `getHeroSkillKit('linh_dong')` hợp lệ; tên khớp skill.json authored
- L141-T4: chạm thẻ Tướng mở `renderHeroDetail`; idle canvas hồ sơ; không nhảy trận thử
- L141-T5: trận campaign vẽ atlas + chiêu Nhiễu Loạn / Bách Quỷ; 6v6 QA slice(0,6)/slice(6,12) giữ
- L141-P1: Chrome 390×844 — Tướng có thẻ Linh Đồng, hồ sơ idle atlas, nâng cấp/sao hiện

## Result

RED: L141-T1…T5 fail trước DATA/kit/roster; Chrome L141-P1 fail `startLinhDongDetailIdle is not defined` vì patch Luc Anh idle nuốt hàm nằm giữa `startLucAnhDetailIdle` và `renderHeroDetail`.

GREEN: Linh Đồng vào DATA.heroes, roster chính thức, kit v2, sao, hồ sơ idle, trận campaign. Hàm idle đặt sau `renderHeroDetail`. npm test 953/953. Chrome 390×844 L141-P1 PASS (`docs/qa/L141-LINH-DONG-HERO/`). Safari NOT_RUN.

REVIEW. Owner gõ **live** rồi tự `git pull && vercel --prod`. Không tự merge.
