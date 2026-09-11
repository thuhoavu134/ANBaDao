---
id: TKT-0035
title: Màn Tướng hiện lại trên overlay body
status: REVIEW
phase: REFACTOR
priority: P0
created: 2026-09-12T03:40:00.000Z
updated: 2026-09-12T04:10:00.000Z
acceptance_ids: ["L24-T1","L24-T2","L24-T3","L24-T4","L24-P1"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/ui/hero-roster-runtime.js","scripts/hero-roster-phase-a-v4.mjs","tests/hero-roster-route.test.mjs"]
resource_locks: ["hero-roster-portal"]
---
# TKT-0035 — Màn Tướng không hiện

Goal: Owner «màn Tướng ko hiện ra» rồi «vẫn thế» / «vẫn ko hiện» — header Hồn Việt còn, 12 thẻ trắng trên iOS Grok. `#heroesScreen` nằm trong `.wrap` nên iframe/WebKit clip lưới. Overlay `#hvHeroRosterV4` gắn `document.body` như `#hvGearRoot`: `position:fixed;inset:0;overflow:auto`, thẻ `min-height:150`, lưới `min-height:420`.

Non-goals: Combat V2 / seed / banner / roster 12 ID / `heroStats` / 11 nan Trợ trận / Lịch Luyện / thêm listener click / thêm `data-art-go` / visual Bày trận.

Branch: `work/l24-hero-roster-visible-20260912` from main `8282bc1`.

## Keep (live)

- 12 ID `OFFICIAL_ROSTER_12_IDS`, tap → `renderHeroDetail` + `showScreen('heroDetail')`
- Một chủ quản route: wrap `showScreen`, không `document.addEventListener` click/pointer
- Dock Tướng `data-art-go="heroes"` → `navTo('heroes')`

## Acceptance

- L24-T1: `document.body.append(root)` + `is-open`
- L24-T2: CSS không `body.hero-roster-active #heroesScreen{display:none`
- L24-T3: overlay `overflow:auto`, không `overflow:hidden` trên portal, thẻ min-height 150, lưới min-height 420
- L24-T4: một route owner
- L24-P1: Chrome 390 + 768 + iframe 768 — 12 thẻ, thẻ > 80px, filter + dock

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
