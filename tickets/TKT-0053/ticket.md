---
id: TKT-0053
title: Hồ sơ tướng hall giả 3D overlay body + 9 nền showcase
status: LIVE
phase: REFACTOR
priority: P1
created: 2026-09-12T04:20:00.000Z
updated: 2026-09-12T04:25:00.000Z
acceptance_ids: ['L43-T1', 'L43-T2', 'L43-T3', 'L43-T4', 'L43-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/hero-detail-hall-runtime.js', 'src/ui/hero-detail-hall.css', 'scripts/hero-detail-hall-v1.mjs', 'scripts/lanes/tkt-0053-hero-detail.mjs', 'scripts/qa-hero-detail-hall.mjs', 'assets/ui/hero-detail/hero-detail-hall.jpg', 'tests/hero-detail-hall.test.mjs', 'docs/qa/L43-HERO-DETAIL-HALL/']
resource_locks: ["hero-detail-hall"]
parallel_wave: D
depends_on: []
conflicts_with: []
branch_hint: work/l43-hero-detail-3d-20260912
---
# TKT-0053 — Hồ sơ tướng hall giả 3D overlay body + 9 nền showcase

Wave **D**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Từ màn **Tướng** chạm thẻ → `renderHeroDetail` / `showScreen('heroDetail')`. Overlay `#hvHeroDetailRoot` gắn `document.body` (pattern Túi/Rèn/Tướng): hall sáng giả 3D nhiều lớp, **không** sơn mài, **không** mint `#edf6ef`. Di chuyển `#hdBody` vào overlay lúc runtime. Wrap `showScreen` + `renderHeroDetail`, gọi base. Điền stub `scripts/lanes/tkt-0053-hero-detail.mjs` — **không** thêm import mới vào `build-static.mjs`.

9 tướng chưa có `detailBackground` nhận jpg riêng. Giữ 3 nền đã có: Ông Phở · Lục Ảnh · Thầy Mo.

## Keep (live)

- Tabs Thuộc tính / Kỹ năng / Trang bị / Duyên phận / Tinh thông
- `heroStats` / `teamPower` / kit v2 / upgrade / star / awaken commands
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB, atlas skill trận.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L43-T1: renderHeroDetail + 3 showcase PNG đóng băng
- L43-T2: `#hvHeroDetailRoot` `position:fixed;inset:0;overflow:auto` + hall jpg
- L43-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L43-T4: stub lane load runtime
- L43-P1: Chrome 390×844 + 768×1024 — mở từ Tướng, overlay hiện, 9 tướng có hv-depth-bg, 0 app error

## Affected paths (exclusive)

- `src/ui/hero-detail-hall-runtime.js`
- `src/ui/hero-detail-hall.css`
- `scripts/hero-detail-hall-v1.mjs`
- `scripts/lanes/tkt-0053-hero-detail.mjs`
- `scripts/qa-hero-detail-hall.mjs`
- `assets/ui/hero-detail/hero-detail-hall.jpg` + 9 `*-showcase-bg.jpg`
- `tests/hero-detail-hall.test.mjs`
- `docs/qa/L43-HERO-DETAIL-HALL/`

Shared read-only: `src/ui/hero-detail-tabs.js`, `src/ui/hero-detail-tabs.css`, `index.html` `#hdBody`.

## Result

LIVE 12/09 squash [#49](https://github.com/bktimmy247/luc-than/pull/49) → main `ea59313`. Production đã phục vụ `hero-detail-hall.jpg`.

