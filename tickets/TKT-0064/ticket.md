---
id: TKT-0064
title: Safari / Grok overlay pin — night filter + overflow-x containing-block
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-12T06:00:00.000Z
updated: 2026-09-12T06:30:00.000Z
acceptance_ids: ['L51-T1', 'L51-T2', 'L51-T3', 'L51-T4', 'L51-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/overlay-safari.css', 'src/ui/overlay-safari-runtime.js', 'scripts/overlay-safari-hotfix-v1.mjs', 'scripts/overlay-safari-hotfix-v1.mjs', 'tests/overlay-safari.test.mjs', 'scripts/qa-overlay-safari.mjs', 'docs/qa/L51-SAFARI-OVERLAY/']
resource_locks: ["overlay-safari"]
parallel_wave: G
depends_on: []
conflicts_with: []
branch_hint: work/l48-wave-g-3d-20260912
---
# TKT-0064 — Safari overlay rendering

Owner «Debug Safari overlay rendering». WebKit: `html,body{overflow-x:hidden}` + `body.night{filter}` biến `position:fixed` thành containing-block. Hall Wave G dời DOM ra body → shell ~100px → overlay Safari co.

## Goal

Pin mọi overlay `#hv*` `is-open` trên `document.body` theo `visualViewport`. `html.hv-overlay-open` / `body.hv-overlay-open` → `filter:none`, `100dvh`, `overflow-x:clip`. Inject `viewport-fit=cover`. Không sửa `index.html` nguồn. Không restyle Bày trận.

## Keep

- `body.night` nguồn, `overflow-x:hidden` nguồn
- `campaign-scene.js` / `.cs-prepare`
- Một wrap `showScreen`; không `document` click/pointerdown

## Non-goals

Combat V2, 72 tướng, Auth/DB, nan Lịch `go:null`, Hermes 27. Không merge tới `live`.

## Acceptance

- L51-T1: `index.html` night/overflow + `campaign-scene.js` không đổi
- L51-T2: CSS pin 100dvh + filter:none + overflow-x:clip
- L51-T3: `visualViewport` + wrap `showScreen` + không document click
- L51-T4: inject sau Wave G stubs; viewport-fit=cover trên dist
- L51-P1: Chrome 390 + 768, `body.night` bắt buộc — overlay height = innerHeight, iframe Grok-like, 0 app error. Safari device NOT_RUN (sandbox không có WebKit)

Builder → REVIEW.
