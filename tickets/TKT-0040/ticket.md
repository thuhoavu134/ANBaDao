---
id: TKT-0040
title: Bang Hội hall giả 3D overlay body
status: LIVE
phase: REFACTOR
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T03:45:00.000Z
acceptance_ids: ['L30-T1', 'L30-T2', 'L30-T3', 'L30-T4', 'L30-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/guild-hall-runtime.js', 'src/ui/guild-hall.css', 'scripts/guild-hall-v1.mjs', 'scripts/lanes/tkt-0040-guild.mjs', 'scripts/qa-guild-hall.mjs', 'assets/ui/guild/guild-hall.jpg', 'tests/guild-hall.test.mjs', 'docs/qa/L30-GUILD-HALL/']
resource_locks: ["guild-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l30-guild-hall-20260912
---
# TKT-0040 — Bang Hội hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side phải **Bang Hội** → `navTo('guild')` (ch.4 — không đổi). Overlay `#hvGuildRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#guildBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0040-guild.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `joinGuild` / donate / tech / missions / boss / campaign / war / shop. Nút **Mở Gia Tộc** vẫn `navTo('clan')`. Không viết lại clan.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Clan hall (TKT-0043), Friends, Chat, Auth/DB, guildIdleMult công thức.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L30-T1: công thức / command hiện có không đổi (assert source freeze)
- L30-T2: `#hvGuildRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L30-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L30-T4: stub lane `tkt-0040-guild.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L30-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/guild-hall-runtime.js`
- `src/ui/guild-hall.css`
- `scripts/guild-hall-v1.mjs`
- `scripts/lanes/tkt-0040-guild.mjs`
- `scripts/qa-guild-hall.mjs`
- `assets/ui/guild/guild-hall.jpg`
- `tests/guild-hall.test.mjs`
- `docs/qa/L30-GUILD-HALL/`

Shared read-only: `index.html` `#guildBody` / `showScreen` / `navTo('guild')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L30-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.


## Result

- Overlay `#hvGuildRoot` gắn body, hall `assets/ui/guild/guild-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
