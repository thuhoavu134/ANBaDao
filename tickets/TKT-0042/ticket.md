---
id: TKT-0042
title: Trò chuyện hall giả 3D overlay body
status: LIVE
phase: REFACTOR
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T03:45:00.000Z
acceptance_ids: ['L32-T1', 'L32-T2', 'L32-T3', 'L32-T4', 'L32-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/chat-hall-runtime.js', 'src/ui/chat-hall.css', 'scripts/chat-hall-v1.mjs', 'scripts/lanes/tkt-0042-chat.mjs', 'scripts/qa-chat-hall.mjs', 'assets/ui/chat/chat-hall.jpg', 'tests/chat-hall.test.mjs', 'docs/qa/L32-CHAT-HALL/']
resource_locks: ["chat-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l32-chat-hall-20260912
---
# TKT-0042 — Trò chuyện hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side phải **Trò chuyện** → `navTo('chat')` (ch.4 — không đổi). Overlay `#hvChatRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#chatBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0042-chat.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- 3 kênh world/guild/team · Giao Lưu 3 tin → 🪙120 · ambient local. `netChat*` giữ nguyên, không dựng server.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Friends, Guild logic, Auth/DB, socket thật.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L32-T1: công thức / command hiện có không đổi (assert source freeze)
- L32-T2: `#hvChatRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L32-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L32-T4: stub lane `tkt-0042-chat.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L32-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/chat-hall-runtime.js`
- `src/ui/chat-hall.css`
- `scripts/chat-hall-v1.mjs`
- `scripts/lanes/tkt-0042-chat.mjs`
- `scripts/qa-chat-hall.mjs`
- `assets/ui/chat/chat-hall.jpg`
- `tests/chat-hall.test.mjs`
- `docs/qa/L32-CHAT-HALL/`

Shared read-only: `index.html` `#chatBody` / `showScreen` / `navTo('chat')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L32-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.


## Result

- Overlay `#hvChatRoot` gắn body, hall `assets/ui/chat/chat-hall.jpg`.
- Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
