---
id: TKT-0130
title: Đổi sò hiện icon sò cowrie, không ốc
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T14:22:00.000Z
updated: 2026-09-13T16:18:00.000Z
acceptance_ids: ['L130-T1', 'L130-T2', 'L130-T3', 'L130-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/bach-bao-ruong.css
  - tests/bbr-so-icon.test.mjs
  - docs/qa/L130-SO-ICON/
resource_locks: ["bbr-spin"]
branch_hint: work/l130-so-icon-20260913
---
# TKT-0130

Owner 13/09 21:21: đổi sò ra icon ốc, không phải sò.

## Goal

Cùng PNG sò cowrie `assets/ui/festival/bbr/so.png` (túi Đạo cụ) cho cược / Quay / Đổi sò. Overlay nhận thưởng dùng khung sò, không `so-icon.jpg` (ốc) và không 🐚.

## Non-goals

Không đổi BETS 2/10/50, convertQty, loot table. Không 72 tướng. HUD `rSoBtn` 🐚 ngoài phạm vi.

## Acceptance

- L130-T1: SO_IC = bbr/so.png; không so-icon.jpg
- L130-T2: Đổi sò mở khung so.png; không toast 🐚
- L130-T3: BETS đóng băng; không document click
- L130-P1: Chrome 390×844

## Result

RED 3 fail → GREEN 3/3 L130 + npm test. Chrome 390×844 L130-P1 PASS. Safari NOT_RUN.
LIVE via #125 `32072ad` (gộp với TKT-0131).

