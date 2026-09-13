---
id: TKT-0126
title: Hoa Đăng sáng hơn · rương chroma-key 60fps · icon khung to
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T12:35:00.000Z
updated: 2026-09-13T12:40:00.000Z
acceptance_ids: ['L126-T1', 'L126-T2', 'L126-T3', 'L126-T4', 'L126-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/festival-3d.css
  - src/ui/festival-3d-runtime.js
  - assets/ui/festival/fx/chest-open.webp
  - assets/ui/festival/fx/supreme-open.webp
  - assets/ui/festival/fx/png/
  - scripts/blender-chest-chroma.py
  - tests/fest-chest-chroma.test.mjs
  - docs/qa/L126-CHEST-CHROMA/
resource_locks: ["festival-chest-fx"]
branch_hint: work/l126-chest-chroma-20260913
---
# TKT-0126

Owner 13/09 19:30:

1. Nền Hoa Đăng tối — sáng lên
2. Diễn hoạt nhận thưởng: rương rung, ≥60fps, chroma-key bỏ nền, rương nhỏ, icon thưởng to có khung

## Goal

- Lamp panel sáng hơn (filter brightness)
- Video rương nền xanh, canvas hút green, rung CSS, 60fps
- Stage rương ≤220px; khung icon ≥104px
- Không đổi loot table

## Non-goals

Không sửa `index.html`. Không 72 tướng.

## Acceptance

- L126-T1: Hoa Đăng brightness ≥1.2
- L126-T2: canvas chromakey + fps 60 + shake
- L126-T3: frame icon ≥104px; stage rương ≤220px
- L126-T4: không document click; BETS 2/10/50
- L126-P1: Chrome 390×844 + 768×1024
