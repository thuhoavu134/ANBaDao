---
id: TKT-0056
title: Hành trình hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:45:00.000Z
updated: 2026-09-12T04:50:00.000Z
acceptance_ids: ['L46-T1', 'L46-T2', 'L46-T3', 'L46-T4', 'L46-T5', 'L46-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/journey-3d-runtime.js', 'src/ui/journey-3d.css', 'scripts/journey-3d-v1.mjs', 'scripts/lanes/tkt-0056-journey.mjs', 'scripts/qa-wave-f-3d.mjs', 'assets/ui/journey/journey-hall.jpg', 'tests/journey-3d.test.mjs', 'docs/qa/L46-JOURNEY-3D/']
resource_locks: ["journey-3d"]
parallel_wave: F
depends_on: []
conflicts_with: []
branch_hint: work/l46-wave-f-3d-20260912
---
# TKT-0056 — Hành trình hall giả 3D overlay body

Wave **F**. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Màn **Hành trình** → `navTo('journey')` (cũng là đích khi `featLocked`). Overlay `#hvJourneyRoot` **kéo lên `document.body`**, move `#journeyBody` (pattern Túi): hall sáng giả 3D nhiều lớp, **không** sơn mài đêm. CSS override trong file 3d riêng — **không** sửa `index.html` / `JOURNEY_UNLOCK` / domain. Wrap `showScreen` + `renderJourney`, gọi base. Điền stub `scripts/lanes/tkt-0056-journey.mjs`.

## Keep (live)

- `JOURNEY_UNLOCK` / `featLocked` không đổi (preview wrap `featLocked=false` giữ nguyên)
- Chương / khóa / toast vượt ải
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB, atlas skill trận.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L46-T1: `#journeyScreen` / `#journeyBody` / `renderJourney` trong `index.html` không đổi
- L46-T2: `#hvJourneyRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L46-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L46-T4: stub lane `tkt-0056-journey.mjs` load runtime
- L46-T5: hall jpg riêng > 50KB
- L46-P1: Chrome 390×844 + 768×1024 — mở Hành trình, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/journey-3d-runtime.js`
- `src/ui/journey-3d.css`
- `scripts/journey-3d-v1.mjs`
- `scripts/lanes/tkt-0056-journey.mjs`
- `scripts/qa-wave-f-3d.mjs`
- `assets/ui/journey/journey-hall.jpg`
- `tests/journey-3d.test.mjs`
- `docs/qa/L46-JOURNEY-3D/`

Shared read-only: `index.html` `#journeyScreen` / `renderJourney` / `JOURNEY_UNLOCK`.

## Result

REVIEW. Chờ owner `live`.
