---
id: TKT-0132
title: Đổi sò pop nhỏ tự tắt · spotlight steady
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T16:42:00.000Z
updated: 2026-09-13T16:50:00.000Z
acceptance_ids: ['L132-T1', 'L132-T2', 'L132-T3', 'L132-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/bach-bao-ruong.css
  - tests/bbr-hold-light.test.mjs
  - tests/bbr-so-pop.test.mjs
  - docs/qa/L132-SO-POP/
resource_locks: ["bbr-spin"]
branch_hint: work/l132-so-pop-hold-steady-20260913
---
# TKT-0132

Owner iOS 13/09 23:38 (IMG_7319, IMG_7320):

1. Đổi sò: icon ~1/4 size ảnh, tự biến mất, sò đã cộng. Không nút Nhận.
2. Ô trúng sáng đều như ảnh 2, không bập bùng.

## Non-goals

Không đổi BETS 2/10/50, convertQty, loot. Không 72 tướng. HUD 🐚 ngoài phạm vi.

## Acceptance

- L132-T1: showConvertLoot không Nhận; setTimeout tự tắt; ART.so
- L132-T2: icon ≤56px; không chest-fx-frame; overlay pointer-events none
- L132-T3: không @keyframes bbrHold; is-hold steady; BETS đóng băng; không document click
- L132-P1: Chrome 390×844

## Result

RED 3 fail (còn Nhận / bbrHold) → GREEN 3/3 L132 + npm test 920 PASS.
Chrome 390×844 L132-P1 PASS. Safari NOT_RUN.
Builder dừng REVIEW. Gõ **live** để squash-merge.

