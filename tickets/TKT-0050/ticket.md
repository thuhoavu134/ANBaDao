---
id: TKT-0050
title: Đấu Trường hall giả 3D overlay body
status: LIVE
phase: REFACTOR
priority: P1
created: 2026-09-12T04:00:00.000Z
updated: 2026-09-12T04:10:00.000Z
acceptance_ids: ['L40-T1', 'L40-T2', 'L40-T3', 'L40-T4', 'L40-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/arena-3d-runtime.js', 'src/ui/arena-3d.css', 'scripts/arena-3d-v1.mjs', 'scripts/lanes/tkt-0050-arena.mjs', 'scripts/qa-arena-3d.mjs', 'assets/ui/arena/arena-hall.jpg', 'tests/arena-3d.test.mjs', 'docs/qa/L40-ARENA-3D/']
resource_locks: ["arena-3d"]
parallel_wave: C
depends_on: []
conflicts_with: []
branch_hint: work/l50-arena-3d-20260912
---
# TKT-0050 — Đấu Trường hall giả 3D overlay body

Wave **C**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Landmark Đấu Trường → `navTo('arena')`. Overlay `#hvArenaRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng — **không** sửa `arena-runtime.js` / `arena-screen.css` / domain. Wrap `showScreen` + `renderArena`, gọi base. Điền stub `scripts/lanes/tkt-0050-arena.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- Đấu Hạng / Mùa / Võ Đài · LP
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L40-T1: domain / runtime hiện có không đổi (assert source freeze)
- L40-T2: `#hvArenaRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L40-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L40-T4: stub lane `tkt-0050-arena.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L40-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/arena-3d-runtime.js`
- `src/ui/arena-3d.css`
- `scripts/arena-3d-v1.mjs`
- `scripts/lanes/tkt-0050-arena.mjs`
- `scripts/qa-arena-3d.mjs`
- `assets/ui/arena/arena-hall.jpg`
- `tests/arena-3d.test.mjs`
- `docs/qa/L40-ARENA-3D/`

Shared read-only: `src/ui/arena-runtime.js`, `src/ui/arena-screen.css`, `src/domain/arena/`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/forge-hall-runtime.js`. Imagegen hall jpg tươi nhiều lớp.

Builder → REVIEW. Không tự MERGED/DONE.

## Result

- Overlay `#hvArenaRoot` gắn body, hall `assets/ui/arena/arena-hall.jpg`.
- LIVE 12/09 squash #48 → main `9f2bbff`.
