---
id: TKT-0136
title: Vệt loáng là đường chéo chạy, không wash ô
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T17:47:00.000Z
updated: 2026-09-13T17:52:00.000Z
acceptance_ids: ['L136-T1', 'L136-T2', 'L136-T3', 'L136-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong.css
  - tests/bbr-sheen-slash.test.mjs
  - tests/bbr-sheen-full.test.mjs
  - docs/qa/L136-SHEEN-SLASH/
resource_locks: ["bbr-spin"]
branch_hint: work/l136-sheen-slash-ios-20260914
---
# TKT-0136

Owner iOS 14/09 00:44 (video): vệt hiện tại wash cả ô / đứng hình, không phải đường sáng kéo chéo.
iOS không animate `background-position`. Đổi sang **thanh chéo `rotate(45deg)` + `translate3d`**, chạy hết ô, 1.5s/lần.

## Non-goals

Không đổi BETS 2/10/50, loot. Không sheen lúc quay. Không pulse cả ô.

## Acceptance

- L136-T1: keyframes `translate3d`/`translateX`, không `background-position`; hold `:after` `rotate(45deg)` + `bbrSheen 1.5s` infinite
- L136-T2: lúc quay `content:none`; không bbrSweep
- L136-T3: không bbrHold; BETS đóng băng; không document click
- L136-P1: Chrome 390×844 — transform đổi giữa 2 frame; duration 1.5s

## Result

RED 1 fail (wash background-position) → GREEN 3/3 L136 + npm test 932 PASS.
Chrome 390×844 L136-P1 PASS (transform chạy, 1.5s). Safari NOT_RUN.
Builder dừng REVIEW. Gõ **live** để squash-merge.
