---
id: TKT-0148
title: Địch Bày trận quay trái + màn Tướng cuộn được
status: LIVE
phase: LIVE
priority: P0
acceptance_ids: [L148-T1, L148-T2, L148-T3, L148-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/ui/campaign-scene.js
  - scripts/hero-roster-phase-a-v4.mjs
  - tests/campaign-enemy-preview.test.mjs
  - tests/hero-roster-route.test.mjs
  - tests/mobile-render-sfx.test.mjs
  - tickets/TKT-0148/
resource_locks: [campaign-scene, hero-roster]
branch_hint: work/l148-foe-face-roster-scroll-20260915
---

# TKT-0148

Owner 15/09: Bày trận Ải 1-2, Ô Cửa Mất Ngủ hàng sau vẫn nhìn sang phải. Màn Tướng không cuộn, thanh icon đè Tố Điệp.

## Goal

Mọi địch bên phải Bày trận nhìn sang trái. Lưới tướng là bề mặt cuộn; thanh điều hướng không đè thẻ cuối.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage math / initiative / AI / turn clock. Không đụng atlas Linh Đồng.

## Acceptance

- L148-T1: mọi `preparationEnemyArt` (kể cả bản trùng) `mirror: true`; `drawScene` lật mọi `pick.enemy`
- L148-T2: `#hvHeroRosterV4` overflow hidden; `.v4-grid` overflow auto; `.v4-dock` không overlay lưới
- L148-T3: thẻ vẫn `min-height:150px`; không thêm document listener
- L148-P1: Chrome 390×844 Bày trận địch quay trái; Tướng cuộn tới thẻ cuối trên thanh. Safari/iPhone NOT_RUN

## Result

LIVE #144 `5de296f`. Bày trận lật mọi địch. Lưới Tướng là bề mặt cuộn; thanh dưới không đè thẻ.
Local npm test 984/984. CI Build and test PASS. Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
