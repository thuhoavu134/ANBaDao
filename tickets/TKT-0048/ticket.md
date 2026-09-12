---
id: TKT-0048
title: Chợ Mộng hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:00:00.000Z
updated: 2026-09-12T04:00:00.000Z
acceptance_ids: ['L38-T1', 'L38-T2', 'L38-T3', 'L38-T4', 'L38-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/shop-3d-runtime.js', 'src/ui/shop-3d.css', 'scripts/shop-3d-v1.mjs', 'scripts/lanes/tkt-0048-shop.mjs', 'scripts/qa-shop-3d.mjs', 'assets/ui/shop/shop-hall.jpg', 'tests/shop-3d.test.mjs', 'docs/qa/L38-SHOP-3D/']
resource_locks: ["shop-3d"]
parallel_wave: C
depends_on: []
conflicts_with: []
branch_hint: work/l48-shop-3d-20260912
---
# TKT-0048 — Chợ Mộng hall giả 3D overlay body

Wave **C**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Landmark Chợ Mộng → `navTo('shop')`. Overlay `#hvShopRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng — **không** sửa `shop-runtime.js` / `shop-screen.css` / domain. Wrap `showScreen` + `renderShop`, gọi base. Điền stub `scripts/lanes/tkt-0048-shop.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- 5 món/ngày · không bán lực chiến
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L38-T1: domain / runtime hiện có không đổi (assert source freeze)
- L38-T2: `#hvShopRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L38-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L38-T4: stub lane `tkt-0048-shop.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L38-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/shop-3d-runtime.js`
- `src/ui/shop-3d.css`
- `scripts/shop-3d-v1.mjs`
- `scripts/lanes/tkt-0048-shop.mjs`
- `scripts/qa-shop-3d.mjs`
- `assets/ui/shop/shop-hall.jpg`
- `tests/shop-3d.test.mjs`
- `docs/qa/L38-SHOP-3D/`

Shared read-only: `src/ui/shop-runtime.js`, `src/ui/shop-screen.css`, `src/domain/shop/`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/forge-hall-runtime.js`. Imagegen hall jpg tươi nhiều lớp.

Builder → REVIEW. Không tự MERGED/DONE.

## Result

- Overlay `#hvShopRoot` gắn body, hall `assets/ui/shop/shop-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
