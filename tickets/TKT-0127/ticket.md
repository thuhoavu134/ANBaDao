---
id: TKT-0127
title: Hoạt ảnh mở rương rồi mới loot · nút ‹ về Thành Chính
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T12:58:00.000Z
updated: 2026-09-13T13:28:20.000Z
acceptance_ids: ['L127-T1', 'L127-T2', 'L127-T3', 'L127-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/festival-3d-runtime.js
  - assets/ui/festival/fx/chest-open.mp4
  - assets/ui/festival/fx/supreme-open.mp4
  - assets/ui/festival/fx/chest-open.webp
  - tests/fest-chest-back.test.mjs
  - docs/qa/L127-CHEST-BACK/
resource_locks: ["festival-chest-fx"]
branch_hint: work/l127-chest-anim-back-20260913
---
# TKT-0127

Owner 13/09 19:56 iOS:

1. Không còn hoạt ảnh mở rương — hiện icon thưởng ngay
2. Nút ‹ không về Thành Chính

## Goal

- Video/webp 60fps (duration 17ms) chơi xong mới hiện khung loot
- `data-fest-back`: đóng ô sự kiện, nếu đang thành phố thì `navTo('hub')`

## Non-goals

Không đổi loot. Không 72 tướng.

## Acceptance

- L127-T1: video + onended showLoot; loot hidden trước
- L127-T2: capture back luôn xử lý, navTo hub khi không is-tile-open
- L127-T3: BETS 2/10/50; không document click
- L127-P1: Chrome 390×844
