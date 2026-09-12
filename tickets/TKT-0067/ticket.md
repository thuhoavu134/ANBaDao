---
id: TKT-0067
title: Giáo Trường hall giả 3D + vòng luyện iframe
status: LIVE
phase: LIVE
priority: P1
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T11:40:00.000Z
acceptance_ids: ['L67-T1', 'L67-T2', 'L67-T3', 'L67-T4', 'L67-T5', 'L67-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/train-3d-runtime.js', 'src/ui/train-3d.css', 'scripts/train-3d-v1.mjs', 'scripts/lanes/tkt-0067-train.mjs', 'scripts/qa-train-3d.mjs', 'assets/ui/train/train-hall.jpg', 'tests/train-3d.test.mjs', 'docs/qa/L67-TRAIN-3D/']
resource_locks: ["train-3d"]
parallel_wave: H
depends_on: []
conflicts_with: []
branch_hint: work/l67-train-3d-20260912
---
# TKT-0067 — Giáo Trường hall giả 3D + vòng luyện iframe

Wave **H**. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Nan Lịch **Giáo Trường** (`LICH_LUYEN_SPOKES` `go:'train'`) gọi `startTraining()` → trừ stamina → `runBattle('luyen_tap')` → `navTo('hub')`. **Không có hall.** Overlay `#hvTrainRoot` kéo lên `document.body.append`, sân đình sáng giả 3D nhiều lớp, **không** sơn mài.

Wrap `startTraining`: lần đầu **mở hall** (chưa trừ stamina). Nút **Luyện** trên hall mới `spendStamina(DATA.daily.costTrain)` + `runBattle('luyen_tap')`. Xong trận **quay lại hall** (không skip về hub). Chip `[data-train-back]` → `navTo('hub')`.

Đối thủ: encounter `luyen_tap` sẵn (Bóng Mộng) **hoặc** shadow 12 roster — không atlas mới. Không bịa `navTo('train')` trong `index.html`.

Điền stub `scripts/lanes/tkt-0067-train.mjs` — **không** thêm import mới vào `build-static.mjs`. Wrap `showScreen`. Imagegen `assets/ui/train/train-hall.jpg` sáng nhiều lớp.

Bắt buộc: `body.train-3d-active{filter:none}` + `#hvTrainRoot{width:100vw;height:100vh;min-height:100vh}`.

## Keep (live)

- `startTraining` / `DATA.encounters.luyen_tap` / `DATA.daily.costTrain`
- `LICH_LUYEN_SPOKES` 5 `go:null` **giữ khóa** — không mở hold/forgegate/abyss/palace/drill
- `JOURNEY_UNLOCK` không đổi
- iframe `runBattle` hiện có

## Non-goals

Không sửa `index.html`. Không sửa `battle.html`. Không sửa `campaign-scene.js`. Không sửa `daily-runtime.js` / `daily-run.mjs` công thức. Không thêm `data-art-go`. Không Combat V2. Không 72 tướng. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L67-T1: `#hvTrainRoot` `position:fixed;inset:0;overflow:auto` + `document.body.append` + wrap `showScreen` / `startTraining`
- L67-T2: hall jpg riêng > 50KB, không menu-v3233
- L67-T3: Luyện mới trừ stamina + `runBattle('luyen_tap')`; back `navTo('hub')`
- L67-T4: stub lane `tkt-0067-train.mjs` load runtime; `build-static.mjs` không thêm dòng mới
- L67-T5: không đụng 5 nan `go:null`
- L67-P1: Chrome 390×844 + 768×1024 — Lịch → Giáo Trường thấy hall, Luyện mở iframe, 0 app error

## Affected paths (exclusive)

- `src/ui/train-3d-runtime.js`
- `src/ui/train-3d.css`
- `scripts/train-3d-v1.mjs`
- `scripts/lanes/tkt-0067-train.mjs`
- `scripts/qa-train-3d.mjs`
- `assets/ui/train/train-hall.jpg`
- `tests/train-3d.test.mjs`
- `docs/qa/L67-TRAIN-3D/`

Shared read-only: `startTraining`, `LICH_LUYEN_SPOKES` train. Frozen: `index.html`, `battle.html`, `campaign-scene.js`, `daily-run.mjs`.

## Pattern copy

`src/ui/bag-hall-runtime.js` + `src/ui/tower-3d-runtime.js`. Imagegen hall jpg; metadata `docs/qa/L67-TRAIN-3D/`.

Builder → LIVE. Owner gõ live nốt. Squash [#62](https://github.com/bktimmy247/luc-than/pull/62) → main `298828b`.
