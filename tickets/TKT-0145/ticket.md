---
id: TKT-0145
title: Gắn clock animation/VFX/SFX Linh Đồng
status: LIVE
phase: LIVE
priority: P0
acceptance_ids: [L145-T1, L145-T2, L145-T3, L145-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/combat-domain/linh-dong-presentation.mjs
  - scripts/linh-dong-timing-main-v1.mjs
  - scripts/qa-linh-dong-static-v1.mjs
  - scripts/build-static.mjs
  - tests/linh-dong-presentation.test.mjs
  - tests/linh-dong-static.test.mjs
resource_locks: [linh-dong-atlas-runtime]
branch_hint: fix/linh-dong-timing-main-20260914
---

# TKT-0145

Owner 14/09: live bản clock animation/VFX/SFX Linh Đồng trên main hiện tại.

## Non-goals

Không đổi BETS 2/10/50, loot, công thức combat. Không mở 42 S+ còn lại. Không Hồng Trầu. Không per-frame crop. Không rewrite damage/initiative/AI.

## Acceptance

- L145-T1: alias hero/action về `hero_splus_linh_dong` + ATK/Ultimate
- L145-T2: một elapsedMs: ATK 420/1320/1496, Ultimate 400/1600/1980; VFX cắt ở recovery
- L145-T3: 10 file runtime + payload trận; SFX wav HonVietSfx
- L145-P1: Chrome trận Linh Đồng; Safari/iPhone riêng

## Result

LIVE #140 `00a6e2c`. Clock ATK/Ultimate, VFX cắt recovery, SFX wav HonVietSfx. BETS 2/10/50 đóng. Không Hồng Trầu. Không per-frame crop.
Local npm test 976/976. CI Build and test PASS. Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
