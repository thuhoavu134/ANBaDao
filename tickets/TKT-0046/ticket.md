---
id: TKT-0046
title: Tháp Trắng Đêm hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:00:00.000Z
updated: 2026-09-12T04:00:00.000Z
acceptance_ids: ['L36-T1', 'L36-T2', 'L36-T3', 'L36-T4', 'L36-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/tower-3d-runtime.js', 'src/ui/tower-3d.css', 'scripts/tower-3d-v1.mjs', 'scripts/lanes/tkt-0046-tower.mjs', 'scripts/qa-tower-3d.mjs', 'assets/ui/tower/tower-hall.jpg', 'tests/tower-3d.test.mjs', 'docs/qa/L36-TOWER-3D/']
resource_locks: ["tower-3d"]
parallel_wave: C
depends_on: []
conflicts_with: []
branch_hint: work/l46-tower-3d-20260912
---
# TKT-0046 — Tháp Trắng Đêm hall giả 3D overlay body

Wave **C**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Nan Lịch Luyện + landmark Tháp → `navTo('tower')`. Overlay `#hvTowerRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng — **không** sửa `tower-runtime.js` / `tower-screen.css` / domain. Wrap `showScreen` + `renderTower`, gọi base. Điền stub `scripts/lanes/tkt-0046-tower.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- TOWER_CLIMB_STAMINA 5 · power gate · sigil
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L36-T1: domain / runtime hiện có không đổi (assert source freeze)
- L36-T2: `#hvTowerRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L36-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L36-T4: stub lane `tkt-0046-tower.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L36-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/tower-3d-runtime.js`
- `src/ui/tower-3d.css`
- `scripts/tower-3d-v1.mjs`
- `scripts/lanes/tkt-0046-tower.mjs`
- `scripts/qa-tower-3d.mjs`
- `assets/ui/tower/tower-hall.jpg`
- `tests/tower-3d.test.mjs`
- `docs/qa/L36-TOWER-3D/`

Shared read-only: `src/ui/tower-runtime.js`, `src/ui/tower-screen.css`, `src/domain/tower/`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/forge-hall-runtime.js`. Imagegen hall jpg tươi nhiều lớp.

Builder → REVIEW. Không tự MERGED/DONE.

## Result

- Overlay `#hvTowerRoot` gắn body, hall `assets/ui/tower/tower-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
