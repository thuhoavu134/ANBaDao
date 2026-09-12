---
id: TKT-0041
title: Bạn bè hall giả 3D overlay body
status: READY
phase: CONTRACT
priority: P1
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T02:35:00.000Z
acceptance_ids: ['L31-T1', 'L31-T2', 'L31-T3', 'L31-T4', 'L31-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/friends-hall-runtime.js', 'src/ui/friends-hall.css', 'scripts/friends-hall-v1.mjs', 'scripts/lanes/tkt-0041-friends.mjs', 'scripts/qa-friends-hall.mjs', 'assets/ui/friends/friends-hall.jpg', 'tests/friends-hall.test.mjs', 'docs/qa/L31-FRIENDS-HALL/']
resource_locks: ["friends-hall"]
parallel_wave: A
depends_on: []
conflicts_with: []
branch_hint: work/l31-friends-hall-20260912
---
# TKT-0041 — Bạn bè hall giả 3D overlay body

Wave **A**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Side trái **Bạn bè** → `navTo('friends')` (ch.4 — không đổi). Overlay `#hvFriendsRoot` gắn `document.body` (pattern Trợ trận / Tướng / Rèn): hall sáng giả 3D nhiều lớp, **không** sơn mài. Di chuyển `#friendsBody` vào overlay lúc runtime. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0041-friends.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `friendSend` 3⚡ · `friendClaimStamina` trần stamCap 120 · seed FRIEND_SEEDS. Không làm bạn online.
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Chat, Guild, Auth/DB, stamCap, thêm data-art-go.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L31-T1: công thức / command hiện có không đổi (assert source freeze)
- L31-T2: `#hvFriendsRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng
- L31-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L31-T4: stub lane `tkt-0041-friends.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L31-P1: Chrome 390×844 + 768×1024 — mở từ lối hiện có, body hall hiện, thẻ min-height, 0 app error

## Affected paths (exclusive)

- `src/ui/friends-hall-runtime.js`
- `src/ui/friends-hall.css`
- `scripts/friends-hall-v1.mjs`
- `scripts/lanes/tkt-0041-friends.mjs`
- `scripts/qa-friends-hall.mjs`
- `assets/ui/friends/friends-hall.jpg`
- `tests/friends-hall.test.mjs`
- `docs/qa/L31-FRIENDS-HALL/`

Shared read-only: `index.html` `#friendsBody` / `showScreen` / `navTo('friends')`.

## Pattern copy

`src/ui/forge-hall-runtime.js` + `src/ui/hero-roster-runtime.js` (body overlay). Imagegen hall jpg; metadata trong `docs/qa/L31-*-HALL/`.

Builder → REVIEW. Không tự MERGED/DONE.
