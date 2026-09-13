---
id: TKT-0133
title: Ô trúng sheen chéo góc TL→BR
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T17:08:00.000Z
updated: 2026-09-13T17:14:00.000Z
acceptance_ids: ['L133-T1', 'L133-T2', 'L133-T3', 'L133-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong.css
  - tests/bbr-hold-sheen.test.mjs
  - docs/qa/L133-HOLD-SHEEN/
resource_locks: ["bbr-spin"]
branch_hint: work/l133-hold-sheen-20260914
---
# TKT-0133

Owner iOS 14/09 00:04 (IMG_7321): spotlight ổn nhưng muốn ô trúng có **đường sáng kéo chéo** từ cạnh trên-trái xuống cạnh dưới-phải, sáng loáng. Không bập bùng cả ô.

## Non-goals

Không đổi BETS 2/10/50, convertQty, loot, lastIdx. Không 72 tướng. Không nút Nhận đổi sò. Không @keyframes bbrHold.

## Acceptance

- L133-T1: `@keyframes bbrSheen`; hold `:after` `animation:bbrSheen` infinite; `rotate(45deg)`
- L133-T2: hold không `animation:none`; không bbrHold; không pulse brightness cả ô
- L133-T3: reduced-motion tắt sheen; BETS đóng băng; không document click
- L133-P1: Chrome 390×844 — 1 ô is-hot, computed animationName chứa bbrSheen

## Result

RED 3 fail (chưa bbrSheen) → GREEN 3/3 L133 + npm test 923 PASS.
Chrome 390×844 L133-P1 PASS (`bbrSheen`, transform A≠B). Safari NOT_RUN.
LIVE #127 `4cb1b79`.
