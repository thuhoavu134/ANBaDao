---
id: TKT-0137
title: Vệt sáng trắng, không đường vàng
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T17:54:00.000Z
updated: 2026-09-13T17:58:00.000Z
acceptance_ids: ['L137-T1', 'L137-T2', 'L137-T3', 'L137-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong.css
  - tests/bbr-sheen-light.test.mjs
  - docs/qa/L137-SHEEN-LIGHT/
resource_locks: ["bbr-spin"]
branch_hint: work/l136-sheen-slash-ios-20260914
---
# TKT-0137

Owner 14/09 00:53: đừng đường vàng — là **vệt sáng**. Thanh chéo trắng (không #ffd36a/#ffcc33), translate3d 1.5s. Ô hold không flood trắng để vệt đọc được.

## Non-goals

Không đổi BETS, loot. Không sheen lúc quay. Không pulse cả ô.

## Acceptance

- L137-T1: hold `:after` không vàng; có `#fff`/`rgba(255,255,255`; `rotate(45deg)` + `bbrSheen 1.5s`
- L137-T2: lúc quay `content:none`; không bbrSweep
- L137-T3: không bbrHold; BETS đóng băng
- L137-P1: Chrome 390×844 — transform chạy; after không gold

## Result

RED 1 fail (còn #ffd36a) → GREEN 3/3 L137 + npm test 935 PASS.
Chrome 390×844 L137-P1 PASS. Safari NOT_RUN.
LIVE #130 `ab75870`.
