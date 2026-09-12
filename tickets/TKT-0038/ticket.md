---
id: TKT-0038
title: Hòm thư hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T02:35:00.000Z
acceptance_ids: ['L28-T1', 'L28-T2', 'L28-T3', 'L28-T4', 'L28-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/mail-hall-runtime.js', 'src/ui/mail-hall.css', 'scripts/mail-hall-v1.mjs', 'scripts/lanes/tkt-0038-mail.mjs', 'scripts/qa-mail-hall.mjs', 'assets/ui/mail/mail-hall.jpg', 'tests/mail-hall.test.mjs', 'docs/qa/L28-MAIL-HALL/']
resource_locks: ["mail-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l28-mail-hall-20260912
---
# TKT-0038 — Hòm thư hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side trái **Hòm thư** → `navTo('mail')`. Overlay `#hvMailRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#mailBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0038-mail.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `claimMail` / `claimAllMail` / `mailUnclaimed` · không đổi phần thưởng thư · không bịa server mail.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Chat, Friends, Guild, extra document click, Auth/DB.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L28-T1: công thức / command hiện có không đổi (assert source freeze)
- L28-T2: `#hvMailRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L28-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L28-T4: stub lane `tkt-0038-mail.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L28-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/mail-hall-runtime.js`
- `src/ui/mail-hall.css`
- `scripts/mail-hall-v1.mjs`
- `scripts/lanes/tkt-0038-mail.mjs`
- `scripts/qa-mail-hall.mjs`
- `assets/ui/mail/mail-hall.jpg`
- `tests/mail-hall.test.mjs`
- `docs/qa/L28-MAIL-HALL/`

Shared read-only: `index.html` `#mailBody` / `showScreen` / `navTo('mail')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L28-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.


## Result

- Overlay `#hvMailRoot` gắn body, hall `assets/ui/mail/mail-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
