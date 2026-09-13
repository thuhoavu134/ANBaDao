---
id: TKT-0129
title: Chợ Mộng 2 ô · rương sprite chroma rồi loot
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T13:38:00.000Z
updated: 2026-09-13T14:08:00.000Z
acceptance_ids: ['L129-T1', 'L129-T2', 'L129-T3', 'L129-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/shop-3d-runtime.js
  - src/ui/shop-3d.css
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/festival-3d-runtime.js
  - src/ui/festival-3d.css
  - assets/ui/festival/fx/chest-sheet.webp
  - assets/ui/festival/fx/supreme-sheet.webp
  - assets/ui/shop/tiles/cho-dem.jpg
  - tests/shop-chest-fx.test.mjs
  - docs/qa/L129-SHOP-CHEST/
resource_locks: ["shop-hall","festival-chest-fx"]
branch_hint: work/l129-shop-grid-chest-fx-20260913
---
# TKT-0129

Owner 13/09 20:35 iOS:

1. Chợ Mộng grid Chợ Đêm + Shop điểm; bỏ icon shop trên màn quay BBR
2. Rương phải sprite chroma (không nền đen), bung sáng vàng, loot sau khi mở nắp

## Non-goals

Không đổi BETS/BBR_SHOP giá, loot table. Không 72 tướng.

## Acceptance

- L129-T1: 2 ô Chợ, không hv-bbr-shop-ic
- L129-T2: chest-sheet.webp alpha, canvas 60fps, loot sau
- L129-T3: BETS đóng băng; không document click
- L129-P1: Chrome 390×844

## Result

RED 3 fail → GREEN 3/3 L129 + npm test 911. Chrome 390×844 L129-P1 PASS (black:false, loot after lid-open). Safari NOT_RUN.
Sheet 12×145 cell 180 từ video magenta → numpy key. Burst lúc nắp mở (~38%).
