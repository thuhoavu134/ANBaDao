---
id: TKT-0079
title: Tắt banner đỏ AbortError video login Safari
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-12T11:25:00.000Z
updated: 2026-09-12T11:30:00.000Z
acceptance_ids: ['L79-T1', 'L79-T2', 'L79-T3', 'L79-T4', 'L79-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/abort-noise-runtime.js', 'src/ui/login-gate-runtime.js', 'scripts/login-gate-v1.mjs', 'tests/abort-noise.test.mjs', 'scripts/qa-abort-banner.mjs', 'docs/qa/L79-ABORT-BANNER/', 'tickets/TKT-0079/ticket.md']
resource_locks: ["login-gate"]
parallel_wave: J
depends_on: ['TKT-0074']
conflicts_with: []
branch_hint: work/l79-abort-banner-20260912
---
# TKT-0079 — Banner đỏ «The operation was aborted»

Owner 12/09 ảnh iPhone. Vào Thành Chính xong vẫn khung đỏ:

`promise: The operation was aborted.`

Safari hủy `play()` của video login (`autoplay` rồi `pause()` lúc vào game). Máy đo `__mgShowErr` bắt mọi unhandled rejection.

## Goal

Nuốt AbortError / NotAllowedError / play interrupted. Gỡ `#__mgDiag` nếu chỉ có abort. Video login `play().catch`, bỏ `autoplay`. **Không** sửa `index.html`.

## Keep

- Overlay đăng nhập, video nền, Du khách / email
- Lỗi JS thật vẫn hiện banner

## Non-goals

Không sửa `index.html` / `battle.html` / `campaign-scene.js`. Không 72 tướng. Không merge tới `live`.

## Acceptance

- L79-T1: filter capture `unhandledrejection` AbortError + sweep `__mgErrs` + gỡ `#__mgDiag`
- L79-T2: `video.play().catch`; không `autoplay`
- L79-T3: `login-gate-v1.mjs` inject filter vào `<head>`; không `index.html` nguồn
- L79-T4: không `document.addEventListener('click'`
- L79-P1: Chrome 390×844 — vào game, 0 banner aborted

Builder → REVIEW. L79-T1…T4 GREEN. Chrome 390×844 + 768×1024 PASS. Safari NOT_RUN. Không merge tới `live`.
