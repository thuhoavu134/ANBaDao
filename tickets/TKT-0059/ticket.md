---
id: TKT-0059
title: Trực Tuyến hall giả 3D overlay body
status: REVIEW
phase: REVIEW
priority: P1
created: 2026-09-12T05:00:00.000Z
updated: 2026-09-12T05:35:00.000Z
acceptance_ids: ['L49-T1', 'L49-T2', 'L49-T3', 'L49-T4', 'L49-T5', 'L49-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/net-3d-runtime.js', 'src/ui/net-3d.css', 'scripts/net-3d-v1.mjs', 'scripts/lanes/tkt-0059-net.mjs', 'scripts/qa-net-3d.mjs', 'assets/ui/net/net-hall.jpg', 'tests/net-3d.test.mjs', 'docs/qa/L49-NET-3D/']
resource_locks: ["net-3d"]
parallel_wave: G
depends_on: []
conflicts_with: []
branch_hint: work/l48-wave-g-3d-20260912
---
# TKT-0059 — Trực Tuyến hall giả 3D overlay body

Wave **G**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Hub cạnh trái **Online** `eb('net',…)` → `navTo('net')` / `renderNet()`. Overlay `#hvNetRoot` **kéo lên `document.body`**, move `#netBody`: giấy mint + input `#10152e` → hall sáng giả 3D nhiều lớp, **không** sơn mài. CSS override trong file 3d riêng. Wrap `showScreen` + `renderNet`, gọi base. Điền stub `scripts/lanes/tkt-0059-net.mjs` — **không** thêm import mới vào `build-static.mjs`.

Bắt buộc: `body.net-3d-active{filter:none}` + `#hvNetRoot{width:100vw;height:100vh;min-height:100vh}`.

**Auth/DB OFF.** Chỉ restyle. Không bật server, không nối `mong-gioi-server`.

## Keep (live)

- `netOnline` / `api` / `NET` token·user·server / `netAuth` / `netLogout` / cloud save buttons
- Form `#netServer` `#netUser` `#netPass` — copy và hành vi không đổi
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Bật Auth/DB, PvP online, Combat V2, nan Lịch `go:null`, visual Bày trận, Hermes 27.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L49-T1: `renderNet` / `netOnline` / `api` / `NET` trong `index.html` không đổi
- L49-T2: `#hvNetRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L49-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L49-T4: stub lane `tkt-0059-net.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L49-T5: hall jpg riêng > 50KB
- L49-P1: Chrome 390×844 + 768×1024 — mở Online, body hall hiện, overlay height > 200, 0 app error

## Affected paths (exclusive)

- `src/ui/net-3d-runtime.js`
- `src/ui/net-3d.css`
- `scripts/net-3d-v1.mjs`
- `scripts/lanes/tkt-0059-net.mjs`
- `scripts/qa-net-3d.mjs`
- `assets/ui/net/net-hall.jpg`
- `tests/net-3d.test.mjs`
- `docs/qa/L49-NET-3D/`

Shared read-only: `index.html` `#netScreen` / `renderNet` / `netOnline` / `api`.

## Pattern copy

`src/ui/bag-hall-runtime.js` (body overlay). Imagegen hall jpg sáng nhiều lớp; metadata trong `docs/qa/L49-NET-3D/`.

Builder → REVIEW. Không tự MERGED/DONE.

Chrome 390×844 + 768×1024 PASS (height 844 / 1024). Safari NOT_RUN. Evidence `docs/qa/L49-NET-3D/`. Auth/DB OFF.
