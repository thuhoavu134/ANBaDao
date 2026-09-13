---
id: TKT-0120
title: CSS popup đồ — thẻ ôm nội dung, không khoảng trống
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T10:10:00.000Z
updated: 2026-09-13T10:10:00.000Z
acceptance_ids: ['L120-T1', 'L120-T2', 'L120-T3', 'L120-T4', 'L120-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/shop-runtime.js
  - src/ui/shop-screen.css
  - src/ui/bag-hall-runtime.js
  - src/ui/bag-hall.css
  - src/ui/bach-bao-ruong.css
  - src/ui/overlay-safari.css
  - tests/item-tip-css.test.mjs
  - docs/qa/L120-ITEM-TIP/
resource_locks: ["item-tip", "bag-hall"]
branch_hint: work/l120-item-tip-css-20260913
---
# TKT-0120 — CSS popup đồ

Owner 13/09 screenshot Túi → Sách Tinh Thông: thẻ kem cao, khoảng trống giữa header và Cách nhận.

## Goal

1. `#hvItemTip .hv-tip-card` ôm nội dung, không kéo theo overlay 100dvh / túi 75vh.
2. Bỏ `id="hvShopInfo"` trên thẻ tip (CSS Bách Bảo `#hvShopInfo{padding}` làm header không sát mép + thẻ méo).
3. Một thẻ: icon, tên, sao, số lượng, mô tả, **Cách nhận** + Đi, nút ×.
4. Sách Tinh Thông có icon + nguồn Bách Bảo / Chinh chiến.

Không đổi cược Bách Bảo, roster, kem Thành chính. Không merge tới khi owner gõ `live`.

## Non-goals

Không sửa `index.html` / `battle.html` / `campaign-scene.js`. Không `document.addEventListener('click')`. Không Combat V2.

## Acceptance

- L120-T1: không `id="hvShopInfo"` trên tip; Bách Bảo không còn `#hvShopInfo{padding}`
- L120-T2: `.hv-tip-card` `flex:0 0 auto; height:auto; max-height:min(...)`; overlay `align-items:center`
- L120-T3: `data-tip-close` + `hv-tip-how-title` + sao; không view `how` riêng
- L120-T4: túi nhận diện Sách Tinh Thông + `tinh-thong.png` + `how:['fest','camp']`
- L120-P1: Chrome 390×844 — thẻ compact, header sát mép, Cách nhận ngay dưới mô tả, 0 app error
