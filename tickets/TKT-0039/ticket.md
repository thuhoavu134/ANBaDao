---
id: TKT-0039
title: Giao việc hall giả 3D overlay body
status: LIVE
phase: REFACTOR
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T03:45:00.000Z
acceptance_ids: ['L29-T1', 'L29-T2', 'L29-T3', 'L29-T4', 'L29-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/jobs-hall-runtime.js', 'src/ui/jobs-hall.css', 'scripts/jobs-hall-v1.mjs', 'scripts/lanes/tkt-0039-jobs.mjs', 'scripts/qa-jobs-hall.mjs', 'assets/ui/jobs/jobs-hall.jpg', 'tests/jobs-hall.test.mjs', 'docs/qa/L29-JOBS-HALL/']
resource_locks: ["jobs-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l29-jobs-hall-20260912
---
# TKT-0039 — Giao việc hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side trái **Giao việc** → `navTo('jobs')` (JOURNEY_UNLOCK ch.2 — không đổi). Overlay `#hvJobsRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#jobsBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0039-jobs.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `startJob` / `claimJob` / `DATA.jobs` thưởng · 2 tướng · timer · quality. Không đổi bảng thưởng.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Guild/Clan, bịa job mới, stamCap, Combat V2.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L29-T1: công thức / command hiện có không đổi (assert source freeze)
- L29-T2: `#hvJobsRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L29-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L29-T4: stub lane `tkt-0039-jobs.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L29-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/jobs-hall-runtime.js`
- `src/ui/jobs-hall.css`
- `scripts/jobs-hall-v1.mjs`
- `scripts/lanes/tkt-0039-jobs.mjs`
- `scripts/qa-jobs-hall.mjs`
- `assets/ui/jobs/jobs-hall.jpg`
- `tests/jobs-hall.test.mjs`
- `docs/qa/L29-JOBS-HALL/`

Shared read-only: `index.html` `#jobsBody` / `showScreen` / `navTo('jobs')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L29-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.


## Result

- Overlay `#hvJobsRoot` gắn body, hall `assets/ui/jobs/jobs-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
