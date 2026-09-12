---
id: TKT-0060
title: Trận Hình hall giả 3D overlay body
status: REVIEW
phase: REVIEW
priority: P1
created: 2026-09-12T05:00:00.000Z
updated: 2026-09-12T05:35:00.000Z
acceptance_ids: ['L50-T1', 'L50-T2', 'L50-T3', 'L50-T4', 'L50-T5', 'L50-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/team-3d-runtime.js', 'src/ui/team-3d.css', 'scripts/team-3d-v1.mjs', 'scripts/lanes/tkt-0060-team.mjs', 'scripts/qa-team-3d.mjs', 'assets/ui/team/team-hall.jpg', 'tests/team-3d.test.mjs', 'docs/qa/L50-TEAM-3D/']
resource_locks: ["team-3d"]
parallel_wave: G
depends_on: []
conflicts_with: []
branch_hint: work/l48-wave-g-3d-20260912
---
# TKT-0060 — Trận Hình hall giả 3D overlay body

Wave **G**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Màn **Trận Hình** legacy `#teamScreen` `.team-art-screen` — **không** phải Bày trận `.cs-prepare`. Mở qua `navTo('team')` từ Trợ trận / Tháp / hồ sơ tướng. Overlay `#hvTeamRoot` **kéo lên `document.body`**, move nội dung `#teamScreen`: sân đình sáng giả 3D nhiều lớp, **không** sơn mài `#04070c`. CSS override trong file 3d riêng. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0060-team.mjs` — **không** thêm import mới vào `build-static.mjs`.

Bắt buộc: `body.team-3d-active{filter:none}` + `#hvTeamRoot{width:100vw;height:100vh;min-height:100vh}`.

**Đóng băng** `src/ui/campaign-scene.js` và `.cs-prepare` — đây là màn khác.

## Keep (live)

- `#fieldPrev` / `#teamGrid` / `#petStrip` / `#bondBar` / `#teamSave` / `#teamQuick` / 6 slot tiền-hậu
- `navTo('team')` từ gear / tower / hero-detail
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Visual Bày trận, `campaign-scene.js`, `.cs-prepare`, Combat V2, nan Lịch `go:null`, Auth/DB, Hermes 27.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L50-T1: `#teamScreen` markup + `campaign-scene.js` / `.cs-prepare` không đổi
- L50-T2: `#hvTeamRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L50-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L50-T4: stub lane `tkt-0060-team.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L50-T5: hall jpg riêng > 50KB
- L50-P1: Chrome 390×844 + 768×1024 — mở Trận Hình, body hall hiện, overlay height > 200, 0 app error

## Affected paths (exclusive)

- `src/ui/team-3d-runtime.js`
- `src/ui/team-3d.css`
- `scripts/team-3d-v1.mjs`
- `scripts/lanes/tkt-0060-team.mjs`
- `scripts/qa-team-3d.mjs`
- `assets/ui/team/team-hall.jpg`
- `tests/team-3d.test.mjs`
- `docs/qa/L50-TEAM-3D/`

Shared read-only: `index.html` `#teamScreen` / `navTo('team')`. Frozen: `src/ui/campaign-scene.js`.

## Pattern copy

`src/ui/bag-hall-runtime.js` (body overlay). Imagegen hall jpg sáng nhiều lớp; metadata trong `docs/qa/L50-TEAM-3D/`.

Builder → REVIEW. Không tự MERGED/DONE.

Chrome 390×844 + 768×1024 PASS (height 844 / 1024). Safari NOT_RUN. Evidence `docs/qa/L50-TEAM-3D/`.
Open path QA: `ST.hvOpenFormation=true` rồi `navTo('team')` — Trợ trận chặn `navTo('team')` trần.
