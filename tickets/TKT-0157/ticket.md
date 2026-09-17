---
id: TKT-0157
title: iOS trận chết tab vì atlas S+ quá nặng
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-17T12:00:00.000Z
updated: 2026-09-17T19:45:00.000Z
acceptance_ids: [L157-T1, L157-T2, L157-T3, L157-T4, L157-T5, L157-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/assets/decoded-atlas-cache.mjs
  - src/assets/campaign-resource-pack-cache.mjs
  - src/domain/character/atlas-image-cache.mjs
  - src/render/canvas-sprite-renderer.mjs
  - src/ui/campaign-scene.js
  - scripts/linh-dong-timing-main-v1.mjs
  - scripts/bach-dien-canvas-runtime-v1.mjs
  - scripts/linh-dong-memory-v1.mjs
  - tests/ios-atlas-budget.test.mjs
  - docs/qa/L157-IOS-ATLAS-BUDGET/
resource_locks: [canvas-sprite-runtime, hero-roster]
branch_hint: work/l157-ios-atlas-budget-20260917
---
# TKT-0157

Owner 17/09: trận Hiệp 01 trên iPhone Chrome, tướng ra sân rồi tab chết («Không thể mở trang này»). Video: Bạch Diện vừa ra chiêu → màn đen → Chrome jetsam.

Rebase lên main `cb9136c` (#153 Ultra v5 + #154 campaign-lite + #155 Dinh/Luc lazy). Bạch Diện idle còn ~29 MiB; Linh Đồng idle vẫn 77 MiB. Campaign-lite ~84 MiB còn nằm parent khi iframe trận mở.

## Goal

Hai tướng S+ đứng cùng trận không làm iOS đóng tab. Atlas > 32 MiB decode xong thu nhỏ; Chinh chiến `purge` texture ngay khi overlay trận mở; LRU không đạp idle mỗi frame.

## Non-goals

Không đổi BETS/loot/công thức combat. Không Spine. Không pack lại master 480. Không đổi footprint 477×440. Không mở encyclopedia 42. Không Hồng Trầu. Không rollback Ultra v5 / campaign-lite.

## Acceptance

- L157-T1: hai atlas ~77 MiB cùng ready dưới 128 MiB sau downsample 0.5; không evict lẫn nhau
- L157-T2: `drawCanvasSprite` nhân source rect theo `image.__hvAtlasScale`
- L157-T3: `atlasDecodeScale(81_100_800, 128MiB) === 0.5`; atlas nhỏ ≤8 MiB giữ scale 1
- L157-T4: overlay `#hvBattleOverlay.is-open` gọi `releaseSceneAtlases` + `sceneResourceCache.purge` (không đợi 10s)
- L157-T5: hết chiêu ATK/VFX `release` khỏi cache trận; host xóa idle Bạch Diện khi mở iframe
- L157-P1: Chrome 390×844 trận có Linh Đồng + Bạch Diện idle, không crash. Safari/iPhone NOT_RUN

## Review

RED L157-T1…T5 → GREEN 5/5. npm test 1062/1062. Chrome 390×844 `battle-both-390x844.png` PASS, Linh Đồng idle 20 MiB @ scale 0.5. Safari/iPhone NOT_RUN.

LIVE #156 `ef2af5e`. Owner tự `git pull && vercel --prod`.
