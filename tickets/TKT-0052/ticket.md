---
id: TKT-0052
title: Lễ Hội hall giả 3D overlay body
status: LIVE
phase: REFACTOR
priority: P1
created: 2026-09-12T04:00:00.000Z
updated: 2026-09-12T04:10:00.000Z
acceptance_ids: ['L42-T1', 'L42-T2', 'L42-T3', 'L42-T4', 'L42-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/festival-3d-runtime.js', 'src/ui/festival-3d.css', 'scripts/festival-3d-v1.mjs', 'scripts/lanes/tkt-0052-festival.mjs', 'scripts/qa-festival-3d.mjs', 'assets/ui/festival/festival-hall.jpg', 'tests/festival-3d.test.mjs', 'docs/qa/L42-FESTIVAL-3D/']
resource_locks: ["festival-3d"]
parallel_wave: C
depends_on: []
conflicts_with: []
branch_hint: work/l52-festival-3d-20260912
---
# TKT-0052 — Lễ Hội hall giả 3D overlay body

Wave **C**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side trái Sự kiện → `navTo('festival')`. Overlay `#hvFestivalRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng — **không** sửa `festival-runtime.js` / `festival-screen.css` / domain. Wrap `showScreen` + `renderFestival`, gọi base. Điền stub `scripts/lanes/tkt-0052-festival.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- Hoa Đăng 5/ngày · Bách Bảo Luân 20 ô
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L42-T1: domain / runtime hiện có không đổi (assert source freeze)
- L42-T2: `#hvFestivalRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L42-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L42-T4: stub lane `tkt-0052-festival.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L42-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/festival-3d-runtime.js`
- `src/ui/festival-3d.css`
- `scripts/festival-3d-v1.mjs`
- `scripts/lanes/tkt-0052-festival.mjs`
- `scripts/qa-festival-3d.mjs`
- `assets/ui/festival/festival-hall.jpg`
- `tests/festival-3d.test.mjs`
- `docs/qa/L42-FESTIVAL-3D/`

Shared read-only: `src/ui/festival-runtime.js`, `src/ui/festival-screen.css`, `src/domain/festival/`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/forge-hall-runtime.js`. Imagegen hall jpg tươi nhiều lớp.

Builder → REVIEW. Không tự MERGED/DONE.

## Result

- Overlay `#hvFestivalRoot` gắn body, hall `assets/ui/festival/festival-hall.jpg`.
- LIVE 12/09 squash #48 → main `9f2bbff`.
