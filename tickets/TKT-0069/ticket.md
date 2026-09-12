---
id: TKT-0069
title: Thử Thách overlay giả 3D từ Mộng Lộ
status: REVIEW
phase: REVIEW
priority: P2
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T12:30:00.000Z
acceptance_ids: ['L69-T1', 'L69-T2', 'L69-T3', 'L69-T4', 'L69-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/challenge-3d-runtime.js', 'src/ui/challenge-3d.css', 'scripts/challenge-3d-v1.mjs', 'scripts/lanes/tkt-0069-challenge.mjs', 'scripts/qa-challenge-3d.mjs', 'assets/ui/challenge/challenge-hall.jpg', 'tests/challenge-3d.test.mjs', 'docs/qa/L69-CHALLENGE-3D/']
resource_locks: ["challenge-3d"]
parallel_wave: H
depends_on: []
conflicts_with: ['TKT-0047']
branch_hint: work/l69-challenge-3d-20260912
---
# TKT-0069 — Thử Thách overlay giả 3D từ Mộng Lộ

Wave **H**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

`startChallenge` / `settleChallenge` đã đánh iframe (`DATA.encounters.__challenge`, clone roster). **Không có hall riêng** — kẹt trong Mộng Lộ. Overlay `#hvChallengeRoot` kéo lên `document.body.append`, giả 3D sáng nhiều lớp, **không** sơn mài.

Wrap `startChallenge`: mở hall chọn ải **trước** khi `runBattle`. Nút đánh mới gọi base `startChallenge`. Chip `[data-challenge-back]` → `navTo('hub')` (và/hoặc về expedition). Không sửa `expedition-3d-runtime.js` / `expedition-3d.css`.

Điền stub `scripts/lanes/tkt-0069-challenge.mjs` — **không** thêm import mới vào `build-static.mjs`. Wrap `showScreen`. Imagegen `assets/ui/challenge/challenge-hall.jpg`.

Bắt buộc: `body.challenge-3d-active{filter:none}` + `#hvChallengeRoot{width:100vw;height:100vh;min-height:100vh}`.

## Keep (live)

- `startChallenge` / `settleChallenge` / `challengeWaveDefs` / stamina-gold hiện có
- Hall Mộng Lộ `#hvExpeditionRoot` 3D LIVE
- iframe `runBattle('__challenge')`

## Non-goals

Không sửa `index.html`. Không sửa `battle.html`. Không sửa `campaign-scene.js`. Không sửa file `expedition-3d*`. Không thêm `data-art-go`. Không Combat V2. Không 72 tướng. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L69-T1: `#hvChallengeRoot` `position:fixed;inset:0;overflow:auto` + `document.body.append` + wrap `showScreen` / `startChallenge`
- L69-T2: hall jpg riêng > 50KB, không menu-v3233
- L69-T3: back `navTo('hub')`; đánh xong settle cũ
- L69-T4: stub lane `tkt-0069-challenge.mjs` load runtime; không `expedition-3d`; không `battle.html`
- L69-P1: Chrome 390×844 + 768×1024 — mở Thử Thách thấy hall, đánh mở iframe, 0 app error

## Affected paths (exclusive)

- `src/ui/challenge-3d-runtime.js`
- `src/ui/challenge-3d.css`
- `scripts/challenge-3d-v1.mjs`
- `scripts/lanes/tkt-0069-challenge.mjs`
- `scripts/qa-challenge-3d.mjs`
- `assets/ui/challenge/challenge-hall.jpg`
- `tests/challenge-3d.test.mjs`
- `docs/qa/L69-CHALLENGE-3D/`

Shared read-only: `startChallenge`. Frozen: `index.html`, `battle.html`, `campaign-scene.js`, `expedition-3d-runtime.js`.

## Pattern copy

`src/ui/bag-hall-runtime.js`. Imagegen hall jpg; metadata `docs/qa/L69-CHALLENGE-3D/`.

Builder → REVIEW. Không tự MERGED/DONE.
