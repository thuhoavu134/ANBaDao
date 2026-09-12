---
id: TKT-0054
title: Nhật Ký Mơ hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:30:00.000Z
updated: 2026-09-12T04:30:00.000Z
acceptance_ids: ['L44-T1', 'L44-T2', 'L44-T3', 'L44-T4', 'L44-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/daily-3d-runtime.js', 'src/ui/daily-3d.css', 'scripts/daily-3d-v1.mjs', 'scripts/lanes/tkt-0054-daily.mjs', 'scripts/qa-wave-e-3d.mjs', 'assets/ui/daily/daily-hall.jpg', 'tests/daily-3d.test.mjs', 'docs/qa/L44-DAILY-3D/']
resource_locks: ["daily-3d"]
parallel_wave: E
depends_on: []
conflicts_with: []
branch_hint: work/l44-wave-e-3d-20260912
---
# TKT-0054 — Nhật Ký Mơ hall giả 3D overlay body

Wave **E**. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side trái **Nhiệm vụ** → `navTo('daily')`. Overlay `#hvDailyRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài đêm `#100c08`. CSS override trong file 3d riêng — **không** sửa `daily-runtime.js` / `daily-screen.css` / domain. Wrap `showScreen` + `renderDaily`, gọi base. Điền stub `scripts/lanes/tkt-0054-daily.mjs`.

## Keep (live)

- Điểm danh / Chợp Mắt / Ca Trực / Việc vặt / Việc tuần formulas
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB, atlas skill trận.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L44-T1: domain / runtime hiện có không đổi (assert source freeze)
- L44-T2: `#hvDailyRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L44-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L44-T4: stub lane `tkt-0054-daily.mjs` load runtime
- L44-P1: Chrome 390×844 + 768×1024 — mở Nhật Ký, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/daily-3d-runtime.js`
- `src/ui/daily-3d.css`
- `scripts/daily-3d-v1.mjs`
- `scripts/lanes/tkt-0054-daily.mjs`
- `scripts/qa-wave-e-3d.mjs`
- `assets/ui/daily/daily-hall.jpg`
- `tests/daily-3d.test.mjs`
- `docs/qa/L44-DAILY-3D/`

Shared read-only: `src/ui/daily-runtime.js`, `src/ui/daily-screen.css`, `src/domain/daily/`.

Builder → REVIEW. Không tự MERGED/DONE.
