---
id: TKT-0057
title: Kết quả + reward veil hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:45:00.000Z
updated: 2026-09-12T04:50:00.000Z
acceptance_ids: ['L47-T1', 'L47-T2', 'L47-T3', 'L47-T4', 'L47-T5', 'L47-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/end-3d-runtime.js', 'src/ui/end-3d.css', 'scripts/end-3d-v1.mjs', 'scripts/lanes/tkt-0057-end.mjs', 'scripts/qa-wave-f-3d.mjs', 'assets/ui/end/end-hall.jpg', 'tests/end-3d.test.mjs', 'docs/qa/L47-END-3D/']
resource_locks: ["end-3d"]
parallel_wave: F
depends_on: []
conflicts_with: []
branch_hint: work/l46-wave-f-3d-20260912
---
# TKT-0057 — Kết quả + reward veil hall giả 3D overlay body

Wave **F**. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Màn **Kết quả** → `showScreen('end')`. Overlay `#hvEndRoot` **kéo lên `document.body`**, move `#endScreen .card`. Hall sáng giả 3D nhiều lớp, **không** sơn mài `#121118`. CSS 3d cũng restyle `.rewardveil.show` / `.rewardcard` giấy sáng (cùng ticket, CSS-only). Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0057-end.mjs`.

## Keep (live)

- Settlement một lần rồi về Chinh chiến
- `showRewardCeremony` / `#rewardVeil` DOM trong `index.html`
- Một owner click; không `document.addEventListener('click'|pointerdown)`

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB, atlas skill trận.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L47-T1: `#endScreen` / `#endNextBtn` / `#rewardVeil` / `showRewardCeremony` trong `index.html` không đổi
- L47-T2: `#hvEndRoot` `position:fixed;inset:0;overflow:auto` + hall jpg riêng, không menu-v3233 / `#121118`
- L47-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L47-T4: stub lane `tkt-0057-end.mjs` load runtime
- L47-T5: hall jpg riêng > 50KB
- L47-P1: Chrome 390×844 + 768×1024 — mở Kết quả, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/end-3d-runtime.js`
- `src/ui/end-3d.css`
- `scripts/end-3d-v1.mjs`
- `scripts/lanes/tkt-0057-end.mjs`
- `scripts/qa-wave-f-3d.mjs`
- `assets/ui/end/end-hall.jpg`
- `tests/end-3d.test.mjs`
- `docs/qa/L47-END-3D/`

Shared read-only: `index.html` `#endScreen` / `#rewardVeil` / `showRewardCeremony`.

## Result

REVIEW. Chờ owner `live`.
