---
id: TKT-0138
title: Vệt sáng loop mượt, không khựng
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T23:38:00.000Z
updated: 2026-09-13T23:42:00.000Z
acceptance_ids: ['L138-T1', 'L138-T2', 'L138-T3', 'L138-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong.css
  - tests/bbr-sheen-smooth.test.mjs
  - docs/qa/L138-SHEEN-SMOOTH/
resource_locks: ["bbr-spin"]
branch_hint: work/l138-sheen-smooth-loop-20260914
---
# TKT-0138

Owner 14/09 06:37: vệt sáng khựng loop, không mượt.
Khóa 78%–100% đứng rồi nhảy về đầu. Bỏ hold, 0→100% `translate3d` liên tục, fade hai đầu để wrap không giật. 1.5s/lần. Vệt trắng. Không đổi cược/loot.

## Non-goals

Không đổi BETS, loot. Không sheen lúc quay. Không pulse cả ô. Không đường vàng.

## Acceptance

- L138-T1: `@keyframes bbrSheen` không hold 78%; có 0% + 100% translate3d; opacity 0 ở hai đầu; hold `:after` 1.5s infinite
- L138-T2: lúc quay `content:none`; không bbrSweep
- L138-T3: không bbrHold; BETS đóng băng; không document click
- L138-P1: Chrome 390×844 — transform đổi suốt 1.5s, không đứng

## Result

RED 1 fail (hold 78%) → GREEN 3/3 L138 + npm test 938 PASS.
Chrome 390×844 L138-P1 PASS (không stall). Safari NOT_RUN.
LIVE #131 `0cbb993`.
