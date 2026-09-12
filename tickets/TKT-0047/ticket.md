---
id: TKT-0047
title: Mộng Lộ hall giả 3D overlay body
status: LIVE
phase: REFACTOR
priority: P1
created: 2026-09-12T04:00:00.000Z
updated: 2026-09-12T04:10:00.000Z
acceptance_ids: ['L37-T1', 'L37-T2', 'L37-T3', 'L37-T4', 'L37-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/expedition-3d-runtime.js', 'src/ui/expedition-3d.css', 'scripts/expedition-3d-v1.mjs', 'scripts/lanes/tkt-0047-expedition.mjs', 'scripts/qa-expedition-3d.mjs', 'assets/ui/expedition/expedition-hall.jpg', 'tests/expedition-3d.test.mjs', 'docs/qa/L37-EXPEDITION-3D/']
resource_locks: ["expedition-3d"]
parallel_wave: C
depends_on: []
conflicts_with: []
branch_hint: work/l47-expedition-3d-20260912
---
# TKT-0047 — Mộng Lộ hall giả 3D overlay body

Wave **C**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Landmark phải Mộng Lộ → `navTo('expedition')`. Overlay `#hvExpeditionRoot` **kéo lên `document.body`** (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng — **không** sửa `expedition-runtime.js` / `expedition-screen.css` / domain. Wrap `showScreen` + `renderExpedition`, gọi base. Điền stub `scripts/lanes/tkt-0047-expedition.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- 5 tầng · Ngã Rẽ · Phúc Mộng · Mộng Ấn
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L37-T1: domain / runtime hiện có không đổi (assert source freeze)
- L37-T2: `#hvExpeditionRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L37-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L37-T4: stub lane `tkt-0047-expedition.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L37-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/expedition-3d-runtime.js`
- `src/ui/expedition-3d.css`
- `scripts/expedition-3d-v1.mjs`
- `scripts/lanes/tkt-0047-expedition.mjs`
- `scripts/qa-expedition-3d.mjs`
- `assets/ui/expedition/expedition-hall.jpg`
- `tests/expedition-3d.test.mjs`
- `docs/qa/L37-EXPEDITION-3D/`

Shared read-only: `src/ui/expedition-runtime.js`, `src/ui/expedition-screen.css`, `src/domain/expedition/`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/forge-hall-runtime.js`. Imagegen hall jpg tươi nhiều lớp.

Builder → REVIEW. Không tự MERGED/DONE.

## Result

- Overlay `#hvExpeditionRoot` gắn body, hall `assets/ui/expedition/expedition-hall.jpg`.
- LIVE 12/09 squash #48 → main `9f2bbff`.
