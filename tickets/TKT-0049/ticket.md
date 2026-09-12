---
id: TKT-0049
title: Gọi Mộng hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:00:00.000Z
updated: 2026-09-12T04:00:00.000Z
acceptance_ids: ['L39-T1', 'L39-T2', 'L39-T3', 'L39-T4', 'L39-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/summon-3d-runtime.js', 'src/ui/summon-3d.css', 'scripts/summon-3d-v1.mjs', 'scripts/lanes/tkt-0049-summon.mjs', 'scripts/qa-summon-3d.mjs', 'assets/ui/summon/summon-hall.jpg', 'tests/summon-3d.test.mjs', 'docs/qa/L39-SUMMON-3D/']
resource_locks: ["summon-3d"]
parallel_wave: C
depends_on: []
conflicts_with: []
branch_hint: work/l49-summon-3d-20260912
---
# TKT-0049 — Gọi Mộng hall giả 3D overlay body

Wave **C**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Landmark Gọi Mộng → `navTo('summon')`. Overlay `#hvSummonRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng — **không** sửa `summon-runtime.js` / `summon-screen.css` / domain. Wrap `showScreen` + `renderSummon`, gọi base. Điền stub `scripts/lanes/tkt-0049-summon.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- ×1 / ×10 · pity 60 · Hồi Ức 120
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L39-T1: domain / runtime hiện có không đổi (assert source freeze)
- L39-T2: `#hvSummonRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L39-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L39-T4: stub lane `tkt-0049-summon.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L39-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/summon-3d-runtime.js`
- `src/ui/summon-3d.css`
- `scripts/summon-3d-v1.mjs`
- `scripts/lanes/tkt-0049-summon.mjs`
- `scripts/qa-summon-3d.mjs`
- `assets/ui/summon/summon-hall.jpg`
- `tests/summon-3d.test.mjs`
- `docs/qa/L39-SUMMON-3D/`

Shared read-only: `src/ui/summon-runtime.js`, `src/ui/summon-screen.css`, `src/domain/summon/`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/forge-hall-runtime.js`. Imagegen hall jpg tươi nhiều lớp.

Builder → REVIEW. Không tự MERGED/DONE.

## Result

- Overlay `#hvSummonRoot` gắn body, hall `assets/ui/summon/summon-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
