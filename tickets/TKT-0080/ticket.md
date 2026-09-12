---
id: TKT-0080
title: Cơ chế địch bên phải nhìn trái — mọi tướng
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-12T12:15:00.000Z
updated: 2026-09-12T12:22:00.000Z
acceptance_ids: ['L80-T1', 'L80-T2', 'L80-T3', 'L80-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['battle.html', 'scripts/luc-anh-runtime-patch.mjs', 'scripts/runtime-qa-polish-v2.mjs', 'scripts/luc-anh-spatial-pipeline-v1.mjs', 'scripts/luc-anh-retina-sharpness-patch.mjs', 'tests/ong-pho-enemy-flip.test.mjs', 'scripts/qa-ong-pho-enemy-flip.mjs', 'docs/qa/L80-ONG-PHO-FLIP/', 'tickets/TKT-0080/ticket.md']
resource_locks: ["battle-facing"]
parallel_wave: J
depends_on: ['TKT-0065']
conflicts_with: []
branch_hint: work/l80-ong-pho-enemy-flip-20260912
---
# TKT-0080 — Địch bên phải nhìn trái (cơ chế team)

Owner: không riêng Ông Phở. Team địch đứng phải → luôn nhìn trái.

## Goal

`drawUnit` sau lean: `if (unit.team === TEAM_ENEMY) context.scale(-1, 1)` rồi mới vẽ thân. Sheet authored nhìn phải. Phe ta không lật.

Gỡ lật rời ở Ông Phở / Đinh Lôi / Lục Ảnh body / pose atlas / stick — tránh lật hai lần. VFX đạn Lục Ảnh (world space) giữ `flip:actor.team`.

## Keep

- Pivot, sheet, HUD
- Campaign `#cs-prepare` đã mirror spec
- Projectile / impact world-space

## Non-goals

Không sửa `index.html` / `campaign-scene.js`. Không 72 tướng. Không merge tới `live`.

## Acceptance

- L80-T1: `drawUnit` scale −1 địch trước `drawOngPhoGifHero` chain
- L80-T2: drawer thân không scale thêm
- L80-T3: `isOngPho` nhận `sourceHeroId`
- L80-P1: Chrome 390×844 Tháp — địch nhìn trái

Builder → REVIEW. Không merge tới `live`.
