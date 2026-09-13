---
id: TKT-0134
title: Quay sáng đều · ô trúng mới loáng
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T17:21:00.000Z
updated: 2026-09-13T17:26:00.000Z
acceptance_ids: ['L134-T1', 'L134-T2', 'L134-T3', 'L134-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong.css
  - tests/bbr-spin-steady.test.mjs
  - docs/qa/L134-SPIN-STEADY/
resource_locks: ["bbr-spin"]
branch_hint: work/l134-spin-steady-win-sheen-20260914
---
# TKT-0134

Owner iOS 14/09 00:20: hiểu nhầm. Vệt loáng đang hiện khi quay; ô trúng lại sáng đều.
Muốn **khi quay thì sáng đều**, **ô trúng mới có vệt loáng** chéo góc.

## Non-goals

Không đổi BETS 2/10/50, convertQty, loot, lastIdx. Không 72 tướng. Không bbrHold pulse cả ô.

## Acceptance

- L134-T1: không `bbrSweep`; `is-hot:after` không animate khi quay (`content:none` hoặc `animation:none`)
- L134-T2: hold `:after` vẫn `bbrSheen` infinite `rotate(45deg)`
- L134-T3: không bbrHold; BETS đóng băng; không document click; reduced-motion tắt sheen
- L134-P1: Chrome 390×844 — is-run animation none; is-hold animationName=bbrSheen

## Result

RED 2 fail (còn bbrSweep) → GREEN 3/3 L134 + npm test 926 PASS.
Chrome 390×844 L134-P1 PASS (spin anim none, hold bbrSheen). Safari NOT_RUN.
LIVE #128 `ea4aac9`.
