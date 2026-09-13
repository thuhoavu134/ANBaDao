---
id: TKT-0119
title: Lễ Hội icon hoạt động + popup Shop điểm
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T09:50:00.000Z
updated: 2026-09-13T09:50:00.000Z
acceptance_ids: ['L119-T1', 'L119-T2', 'L119-T3', 'L119-T4', 'L119-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/festival-3d-runtime.js
  - src/ui/festival-3d.css
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/bach-bao-ruong.css
  - assets/ui/festival/tiles/hoa-dang.jpg
  - assets/ui/festival/tiles/bach-bao.jpg
  - assets/ui/festival/tiles/ruong.jpg
  - assets/ui/festival/shop-keep.jpg
  - tests/fest-shop-popup.test.mjs
  - docs/qa/L119-FEST-SHOP/
resource_locks: ["festival-3d", "bbr-shop"]
branch_hint: work/l119-fest-icons-shop-20260913
---
# TKT-0119 — Icon Lễ Hội đúng hoạt động + Shop điểm popup

Owner 13/09 screenshot Lễ Hội + mẫu Tiệm Ngày.

## Goal

1. Ba ô Lễ Hội **không** còn nhà isometric sai việc:
   - Hoa Đăng = icon thả hoa đăng
   - Bách Bảo = vòng quay may mắn
   - Rương Báu = rương báu thật
2. Bấm **Shop điểm** trong Bách Bảo mở **popup** lưới thẻ có icon, tên, số lượng, giá điểm — không còn vài dòng chữ.

Giữ `BBR_SHOP` 6 món / giá. Không đổi cược, pity, công thức. Không 72 tướng.

## Non-goals

Không sửa `index.html` / `battle.html` / `campaign-scene.js`. Không `document.addEventListener('click')`. Không phủ kem Thành chính. Không merge tới khi owner gõ `live`.

## Acceptance

- L119-T1: tile `data-fact="lantern|wheel|chest"` + jpg > 40KB, không nhà vàng/gazebo
- L119-T2: `#hvBbrShop` overlay popup; thẻ `.hv-bbr-good` có `img` + tên + điểm
- L119-T3: side quay vẫn `data-bbr-step`; shop không thay panel bằng nút chữ
- L119-T4: không document click; `BBR_SHOP` pts 100/250/400/800/1500/3000
- L119-P1: Chrome 390×844 — 3 ô đúng hoạt động; Shop điểm mở popup lưới; 0 app error
