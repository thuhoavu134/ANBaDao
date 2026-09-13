---
id: TKT-0121
title: Túi đồ icon PNG đồng nhất — Hoạt lực bình đỏ
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T10:40:00.000Z
updated: 2026-09-13T10:50:00.000Z
acceptance_ids: ['L121-T1', 'L121-T2', 'L121-T3', 'L121-T4', 'L121-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bag-hall-runtime.js
  - src/ui/bag-hall.css
  - src/ui/shop-runtime.js
  - src/ui/bach-bao-ruong-runtime.js
  - assets/items/materials/hoat-luc.png
  - assets/ui/festival/bbr/hoat.png
  - tests/bag-currency-icons.test.mjs
  - docs/qa/L121-BAG-ICONS/
resource_locks: ["bag-hall", "currency-icons"]
branch_hint: work/l121-bag-icons-20260913
---
# TKT-0121 — Icon túi đồng nhất

Owner 13/09 screenshot Túi → Đạo cụ: emoji bé trong khung nâu; Hoạt lực là đống lửa.

## Goal

1. Năm đạo cụ vàng / ngọc / tinh / hoạt / sò dùng **cùng PNG** với Rèn / Bách Bảo / HUD.
2. **Hoạt lực** = bình lục giác giống Tinh lực, **màu đỏ** — không lửa.
3. Icon trong ô túi **to**, `object-fit:contain` ≥ 78% cạnh ô.

Không đổi số lượng, công thức rèn, cược Bách Bảo, roster. Không merge tới khi owner gõ `live`.

## Non-goals

Không sửa `index.html` / `battle.html` / `campaign-scene.js`. Không `document.addEventListener('click')`. Không 72 tướng. Không phủ kem Thành chính.

## Acceptance

- L121-T1: túi Đạo cụ `img.hv-bag-ico` trỏ `gold.png` / `gems.png` / `tinh-luc.png` / `hoat-luc.png` / `so.png`; không `🔥` ô Hoạt
- L121-T2: `hoat-luc.png` + `bbr/hoat.png` 256² RGBA, tâm đỏ (không cam lửa), góc trong suốt
- L121-T3: `.hv-bag-ico` rộng/cao ≥ 78%; Chợ `stallIcon` Tinh/Hoạt local path, không `luc-than.vercel.app`
- L121-T4: không document click; `BBR_SHOP` pts không đổi
- L121-P1: Chrome 390×844 — 5 ô to, Hoạt bình đỏ; 0 app error
