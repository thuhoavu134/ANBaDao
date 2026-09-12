---
id: TKT-0037
title: Túi đồ hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T02:35:00.000Z
acceptance_ids: ['L27-T1', 'L27-T2', 'L27-T3', 'L27-T4', 'L27-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/bag-hall-runtime.js', 'src/ui/bag-hall.css', 'scripts/bag-hall-v1.mjs', 'scripts/lanes/tkt-0037-bag.mjs', 'scripts/qa-bag-hall.mjs', 'assets/ui/bag/bag-hall.jpg', 'tests/bag-hall.test.mjs', 'docs/qa/L27-BAG-HALL/']
resource_locks: ["bag-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l27-bag-hall-20260912
---
# TKT-0037 — Túi đồ hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side phải **Túi đồ** (`labelAct('bag','bag','Túi đồ')`) → `navTo('bag')`. Overlay `#hvBagRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#bagBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0037-bag.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `renderBag` · shard → heroDetail · nút Mở Rèn · không đổi inventory schema / stamCap 120.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, Rèn hall, Mail/Jobs/Guild, thêm data-art-go, đổi JOURNEY_UNLOCK.bag.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L27-T1: công thức / command hiện có không đổi (assert source freeze)
- L27-T2: `#hvBagRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L27-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L27-T4: stub lane `tkt-0037-bag.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L27-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/bag-hall-runtime.js`
- `src/ui/bag-hall.css`
- `scripts/bag-hall-v1.mjs`
- `scripts/lanes/tkt-0037-bag.mjs`
- `scripts/qa-bag-hall.mjs`
- `assets/ui/bag/bag-hall.jpg`
- `tests/bag-hall.test.mjs`
- `docs/qa/L27-BAG-HALL/`

Shared read-only: `index.html` `#bagBody` / `showScreen` / `navTo('bag')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L27-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.


## Result

- Overlay `#hvBagRoot` gắn body, hall `assets/ui/bag/bag-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
