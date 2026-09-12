---
id: TKT-0051
title: Săn Boss hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:00:00.000Z
updated: 2026-09-12T04:00:00.000Z
acceptance_ids: ['L41-T1', 'L41-T2', 'L41-T3', 'L41-T4', 'L41-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/hunt-3d-runtime.js', 'src/ui/hunt-3d.css', 'scripts/hunt-3d-v1.mjs', 'scripts/lanes/tkt-0051-hunt.mjs', 'scripts/qa-hunt-3d.mjs', 'assets/ui/hunt/hunt-hall.jpg', 'tests/hunt-3d.test.mjs', 'docs/qa/L41-HUNT-3D/']
resource_locks: ["hunt-3d"]
parallel_wave: C
depends_on: []
conflicts_with: []
branch_hint: work/l51-hunt-3d-20260912
---
# TKT-0051 — Săn Boss hall giả 3D overlay body

Wave **C**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side phải Săn Boss → `navTo('hunt')`. Overlay `#hvHuntRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng — **không** sửa `hunt-runtime.js` / `hunt-screen.css` / domain. Wrap `showScreen` + `renderHunt`, gọi base. Điền stub `scripts/lanes/tkt-0051-hunt.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- hunt-run costs / rewards frozen
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L41-T1: domain / runtime hiện có không đổi (assert source freeze)
- L41-T2: `#hvHuntRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L41-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L41-T4: stub lane `tkt-0051-hunt.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L41-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/hunt-3d-runtime.js`
- `src/ui/hunt-3d.css`
- `scripts/hunt-3d-v1.mjs`
- `scripts/lanes/tkt-0051-hunt.mjs`
- `scripts/qa-hunt-3d.mjs`
- `assets/ui/hunt/hunt-hall.jpg`
- `tests/hunt-3d.test.mjs`
- `docs/qa/L41-HUNT-3D/`

Shared read-only: `src/ui/hunt-runtime.js`, `src/ui/hunt-screen.css`, `src/domain/hunt/`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/forge-hall-runtime.js`. Imagegen hall jpg tươi nhiều lớp.

Builder → REVIEW. Không tự MERGED/DONE.

## Result

- Overlay `#hvHuntRoot` gắn body, hall `assets/ui/hunt/hunt-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
