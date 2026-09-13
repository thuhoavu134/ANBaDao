---
id: TKT-0135
title: Sheen phủ hết ô trúng · 1.5s/lần
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T17:37:00.000Z
updated: 2026-09-13T17:41:00.000Z
acceptance_ids: ['L135-T1', 'L135-T2', 'L135-T3', 'L135-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong.css
  - tests/bbr-sheen-full.test.mjs
  - tests/bbr-hold-sheen.test.mjs
  - tests/bbr-spin-steady.test.mjs
  - docs/qa/L135-SHEEN-FULL/
resource_locks: ["bbr-spin"]
branch_hint: work/l135-sheen-full-cell-20260914
---
# TKT-0135

Owner iOS 14/09 00:34 (IMG_7324): vệt loáng chỉ một góc nhỏ. Muốn **loáng chéo hết cả ô**, tốc độ **1.5s/lần**.

## Non-goals

Không đổi BETS 2/10/50, loot, lastIdx. Không sheen lúc quay. Không bbrHold pulse cả ô.

## Acceptance

- L135-T1: hold `:after` `inset:0` phủ ô; `135deg`; `bbrSheen 1.5s` infinite
- L135-T2: lúc quay vẫn `content:none`; không bbrSweep
- L135-T3: không bbrHold; BETS đóng băng; không document click
- L135-P1: Chrome 390×844 — hold overlay inset 0, duration 1.5s, animationName bbrSheen

## Result

RED 1 fail (inset:auto, 1.35s) → GREEN 3/3 L135 + npm test 929 PASS.
Chrome 390×844 L135-P1 PASS (inset 0, 1.5s, phủ ô). Safari NOT_RUN.
Builder dừng REVIEW. Gõ **live** để squash-merge.
