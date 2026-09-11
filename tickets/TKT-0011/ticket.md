---
id: TKT-0011
title: Compact lacquer campaign HUD CSS
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T08:40:00.000Z
updated: 2026-09-11T09:05:00.000Z
acceptance_ids: ["L12-H1","L12-H2","L12-H3","L12-H4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["battle.html","tests/battle-hud-css.test.mjs","scripts/qa-hud-css.mjs"]
resource_locks: ["battle-hud"]
---
# TKT-0011 — Tối ưu CSS HUD trận

Goal: Campaign HUD looks like Hồn Việt lacquer, not generic boxes. Embedded fights hide the brand topbar (Âm / 1× / Tự động). Ribbon is a short night/bronze strip. Speed and skip are 44px circular chips on the dock.

Non-goals: combat rules, seed/reward, overlay Rút lui/Bật tiếng (already gone), per-hero 4-slot, other wheel nodes, canvas battlefield art, standalone tactical lab layout beyond icon chips.

## Acceptance

- L12-H1: `.embedded-battle .topbar` is `display:none`
- L12-H2: campaign HUD does not use mint `#e7f4ef` / `#d8eee6` identity; ribbon is lacquer night/bronze and mobile min-height ≤ 52px
- L12-H3: `.reference-battle-speed` and `.reference-battle-skip` are 44px circular chips
- L12-H4: Chrome 390×844 — topbar not visible, ribbon + dock visible, no `#hvBattleExit` / `Bật tiếng`, 0 app errors

## Result

- RED 0/3 → GREEN 3/3 `tests/battle-hud-css.test.mjs` (plus 8/8 enter-loading still green)
- Chrome 390×844: topbar hidden, ribbon 48px, speed/skip 44×44, body `rgb(6,23,22)`, dock visible, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L12-HUD-CSS/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
