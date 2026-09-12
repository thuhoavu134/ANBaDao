---
id: TKT-0058
title: Cốt truyện VN hall giả 3D overlay body
status: REVIEW
phase: REVIEW
priority: P1
created: 2026-09-12T05:00:00.000Z
updated: 2026-09-12T05:35:00.000Z
acceptance_ids: ['L48-T1', 'L48-T2', 'L48-T3', 'L48-T4', 'L48-T5', 'L48-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/story-3d-runtime.js', 'src/ui/story-3d.css', 'scripts/story-3d-v1.mjs', 'scripts/lanes/tkt-0058-story.mjs', 'scripts/qa-story-3d.mjs', 'assets/ui/story/story-hall.jpg', 'tests/story-3d.test.mjs', 'docs/qa/L48-STORY-3D/']
resource_locks: ["story-3d"]
parallel_wave: G
depends_on: []
conflicts_with: []
branch_hint: work/l48-wave-g-3d-20260912
---
# TKT-0058 — Cốt truyện VN hall giả 3D overlay body

Wave **G**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Màn **Cốt truyện** `#storyScreen` `.vnstage` (navy đêm). `startStory` / `showScreen('story')`. Overlay `#hvStoryRoot` **kéo lên `document.body`**, move `.vnstage` (pattern Túi / Hành trình): sân đình sáng giả 3D nhiều lớp, **không** sơn mài đêm `#0d1226`. CSS override trong file 3d riêng. Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0058-story.mjs` — **không** thêm import mới vào `build-static.mjs`.

Bắt buộc: `body.story-3d-active{filter:none}` + `#hvStoryRoot{width:100vw;height:100vh;min-height:100vh}` — `body.night{filter}` tạo containing-block cho `position:fixed`.

## Keep (live)

- `playScene` / `startStory` / `showChoice` / `drawVnStars` / `#vnStars` canvas
- Thoại, chân dung, event card
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Một owner click trên overlay; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB, atlas skill trận, Hermes 27.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L48-T1: `#storyScreen` / `.vnstage` markup + `startStory` / `playScene` trong `index.html` không đổi
- L48-T2: `#hvStoryRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233
- L48-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L48-T4: stub lane `tkt-0058-story.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L48-T5: hall jpg riêng > 50KB
- L48-P1: Chrome 390×844 + 768×1024 — mở Cốt truyện, body hall hiện, overlay height > 200, 0 app error

## Affected paths (exclusive)

- `src/ui/story-3d-runtime.js`
- `src/ui/story-3d.css`
- `scripts/story-3d-v1.mjs`
- `scripts/lanes/tkt-0058-story.mjs`
- `scripts/qa-story-3d.mjs`
- `assets/ui/story/story-hall.jpg`
- `tests/story-3d.test.mjs`
- `docs/qa/L48-STORY-3D/`

Shared read-only: `index.html` `#storyScreen` / `startStory` / `playScene`.

## Pattern copy

`src/ui/bag-hall-runtime.js` (body overlay). Imagegen hall jpg sáng nhiều lớp; metadata trong `docs/qa/L48-STORY-3D/`.

Builder → REVIEW. Không tự MERGED/DONE.

Chrome 390×844 + 768×1024 PASS (height 844 / 1024). Safari NOT_RUN. Evidence `docs/qa/L48-STORY-3D/`.
