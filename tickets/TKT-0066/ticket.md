---
id: TKT-0066
title: Nút Thành Chính trên mọi màn còn thiếu
status: READY
phase: READY
priority: P0
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T07:20:00.000Z
acceptance_ids: ['L66-T1', 'L66-T2', 'L66-T3', 'L66-T4', 'L66-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/hub-back-runtime.js', 'src/ui/hub-back.css', 'scripts/hub-back-v1.mjs', 'scripts/lanes/tkt-0066-hub-back.mjs', 'scripts/qa-hub-back.mjs', 'tests/hub-back.test.mjs', 'docs/qa/L66-HUB-BACK/']
resource_locks: ["hub-back"]
parallel_wave: H
depends_on: []
conflicts_with: []
branch_hint: work/l66-hub-back-20260912
---
# TKT-0066 — Nút Thành Chính trên mọi màn còn thiếu

Wave **H** P0. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

Owner 12/09: kiểm tra logic **mọi màn**, cần nút quay về **Thành Chính** (`navTo('hub')`).

## Goal

Hall overlay `#hv*Root` **đã có** `[data-*-close|back]` → `navTo('hub')` (Túi/Thư/Việc/Bang/Bạn/Chat/Tộc/Kho/Rèn/Tháp/Mộng Lộ/Chợ/Gọi/Đấu/Săn/Lễ/Nhật Ký/Cốt truyện/Online/Trận Hình/Tướng). **Không** restyle hall đã live.

Chỉ **vá chỗ thiếu** bằng wrap + inject chip `[data-hv-hub]` (không sửa file hall 3d / gear runtime):

| Màn | Hiện trạng | Việc |
|---|---|---|
| Trận iframe `#hvBattleOverlay` | Escape abort, `#exitBattleButton` hidden | Chip **Thành Chính** gọi `abortIntegratedBattle()` → hub |
| Kết quả `#integratedResultV6` / `#endScreen` | back → campaign | Thêm `navTo('hub')` — **không** sửa `end-3d` (Wave F) |
| Nan Trợ trận inner (`[data-gear-view]` ≠ wheel) | 2 bước về bánh xe | Chip hub trên view inner — **không** sửa `account-gear-runtime.js` |
| Lịch Luyện `[data-lich-back]` | chỉ `hideLichWheel()` | thêm `navTo('hub')` |
| Hồ sơ tướng | close → roster (2 bước, OK) | Chip hub tuỳ chọn, không bắt buộc |
| Hành trình | `#journeyScreen .back[data-nav="hub"]` đã về hub | **Không** sửa `journey-3d` |
| Bày trận `.cs-prepare` | `.cs-back` → home Chinh chiến | **Đóng băng** — không thêm hub, không sửa `campaign-scene.js` |

Điền stub `scripts/lanes/tkt-0066-hub-back.mjs` — **không** thêm import mới vào `build-static.mjs`. Wrap `showScreen`. Một owner click trên chip; không `document.addEventListener('click'|pointerdown)` thứ hai cho cùng nút.

## Keep (live)

- Hall `[data-*-close|back]` hiện có
- Dock hub `data-art-go="hub"`
- `abortIntegratedBattle` / settlement campaign
- Nested UX 2 bước (Bày trận / gear board / hero-detail) trừ các dòng bảng trên

## Non-goals

Không sửa `index.html`. Không sửa `campaign-scene.js` / `.cs-prepare`. Không sửa `battle.html`. Không sửa `journey-3d*` / `end-3d*` (Wave F #51). Không sửa `account-gear-runtime.js` `WHEEL`. Không Combat V2. Không 72 tướng. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L66-T1: wrap `showScreen`; chip `[data-hv-hub]` gọi `navTo('hub')` trên trận overlay + kết quả + gear inner + Lịch
- L66-T2: **không** đụng `.cs-prepare` / `campaign-scene.js` / `journey-3d` / `end-3d`
- L66-T3: hall đã có close-hub **không** bị nhân đôi listener
- L66-T4: stub lane `tkt-0066-hub-back.mjs` load runtime; không `battle.html`
- L66-P1: Chrome 390×844 + 768×1024 — mở Tháp / Rèn / Trợ trận nan / trận iframe / kết quả, thấy **Thành Chính**, bấm về `#hubScreen`, 0 app error

## Affected paths (exclusive)

- `src/ui/hub-back-runtime.js`
- `src/ui/hub-back.css`
- `scripts/hub-back-v1.mjs`
- `scripts/lanes/tkt-0066-hub-back.mjs`
- `scripts/qa-hub-back.mjs`
- `tests/hub-back.test.mjs`
- `docs/qa/L66-HUB-BACK/`

Frozen: `campaign-scene.js`, `battle.html`, `index.html`, `journey-3d-runtime.js`, `end-3d-runtime.js`, `account-gear-runtime.js`.

Builder → REVIEW. Không tự MERGED/DONE.
