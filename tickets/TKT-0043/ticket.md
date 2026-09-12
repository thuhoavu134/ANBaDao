---
id: TKT-0043
title: Gia Tộc hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T02:35:00.000Z
acceptance_ids: ['L33-T1', 'L33-T2', 'L33-T3', 'L33-T4', 'L33-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/clan-hall-runtime.js', 'src/ui/clan-hall.css', 'scripts/clan-hall-v1.mjs', 'scripts/lanes/tkt-0043-clan.mjs', 'scripts/qa-clan-hall.mjs', 'assets/ui/clan/clan-hall.jpg', 'tests/clan-hall.test.mjs', 'docs/qa/L33-CLAN-HALL/']
resource_locks: ["clan-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l33-clan-hall-20260912
---
# TKT-0043 — Gia Tộc hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

**Không** thêm nút Thành Chính. Mở từ Bang `navTo('clan')` hoặc journey. Overlay `#hvClanRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#clanBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0043-clan.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `setClanName` / roles / duties / reunion. `clanPct` / `clanIdleMult` / `clanAtkBonus` không đổi.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Guild hall (TKT-0040), thêm data-art-go, Friends, Combat V2.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L33-T1: công thức / command hiện có không đổi (assert source freeze)
- L33-T2: `#hvClanRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L33-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L33-T4: stub lane `tkt-0043-clan.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L33-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/clan-hall-runtime.js`
- `src/ui/clan-hall.css`
- `scripts/clan-hall-v1.mjs`
- `scripts/lanes/tkt-0043-clan.mjs`
- `scripts/qa-clan-hall.mjs`
- `assets/ui/clan/clan-hall.jpg`
- `tests/clan-hall.test.mjs`
- `docs/qa/L33-CLAN-HALL/`

Shared read-only: `index.html` `#clanBody` / `showScreen` / `navTo('clan')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L33-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.


## Result

- Overlay `#hvClanRoot` gắn body, hall `assets/ui/clan/clan-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
