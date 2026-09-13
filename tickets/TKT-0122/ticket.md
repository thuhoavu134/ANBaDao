---
id: TKT-0122
title: Đồng vàng — một PNG chung mọi tính năng
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T11:20:00.000Z
updated: 2026-09-13T11:28:00.000Z
acceptance_ids: ['L122-T1', 'L122-T2', 'L122-T3', 'L122-T4', 'L122-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/shop-runtime.js
  - src/ui/shop-screen.css
  - scripts/hub-responsive-visibility-v1.mjs
  - assets/ui/festival/bbr/gold.png
  - assets/ui/menu-v3233/icons/resource-gold-imagen.png
  - tests/gold-icon-unify.test.mjs
  - docs/qa/L122-GOLD-ICON/
resource_locks: ["currency-gold"]
branch_hint: work/l122-gold-icon-20260913
---
# TKT-0122 — Icon vàng nhất quán

Owner 13/09: đồng vàng chưa cùng một hình giữa các tính năng.

## Goal

Một PNG nguồn `assets/items/materials/gold.png` (thỏi vàng) cho:

- Túi Đạo cụ, Rèn, Chợ, HUD
- Thành chính chip vàng
- Bách Bảo ô vàng
- Ví Chinh chiến (`resource-gold-imagen.png` cùng bytes — không sửa `campaign-scene.js`)

Không đổi số vàng, công thức, cược. Không merge tới khi owner gõ `live`.

## Non-goals

Không sửa `index.html` / `battle.html` / `campaign-scene.js`. Không `document.addEventListener('click')`. Không 72 tướng.

## Acceptance

- L122-T1: BBR `ART.gold`, túi `ICO.gold`, Chợ stall vàng cùng `materials/gold.png`
- L122-T2: hub `res-icon-gold` url `materials/gold.png`
- L122-T3: `bbr/gold.png` và `resource-gold-imagen.png` cùng hash với `materials/gold.png`
- L122-T4: chip Chợ dùng `img` gold.png; không document click
- L122-P1: Chrome 390×844 — Thành chính / Túi / Bách Bảo cùng thỏi vàng; 0 app error
