---
id: TKT-0124
title: Hoạt lực cùng PNG · ô sự kiện Bách Bảo Rương · hoa văn tâm vành
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T11:36:00.000Z
updated: 2026-09-13T11:45:45.000Z
acceptance_ids: ['L124-T1', 'L124-T2', 'L124-T3', 'L124-T4', 'L124-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/bach-bao-ruong.css
  - src/ui/festival-3d-runtime.js
  - src/ui/festival-3d.css
  - tests/bbr-hub-unify.test.mjs
  - docs/qa/L124-BBR-HUB/
resource_locks: ["festival-bbr-hub"]
branch_hint: work/l124-bbr-hoat-hub-20260913
---
# TKT-0124

Owner 13/09 18:30:

1. Hoạt lực túi ≠ Hoạt lực vành Bách Bảo
2. Ô sự kiện Lễ Hội thiếu chữ **Rương**
3. Tâm vành trống — cần hoa văn / hình chìm

## Goal

- Cùng một PNG `assets/items/materials/hoat-luc.png` (bình đỏ) cho túi và vành
- Tile sự kiện: `Bách Bảo Rương`
- Tâm vành: khung sơn son + rương chìm + chữ 寶 mờ; bảng sao vẫn đọc được

Không đổi cược/pay/pity. Không crop icon.

## Non-goals

Không sửa `index.html`. Không 72 tướng. Không kem Thành chính.

## Acceptance

- L124-T1: ART.hoat và ICO túi cùng `materials/hoat-luc.png`
- L124-T2: tile wheel tên `Bách Bảo Rương`
- L124-T3: hub có mark + 寶; chest ≥64px; BETS 2/10/50
- L124-T4: không document click
- L124-P1: Chrome 390×844 + 768×1024 — tâm không trơn, chữ Rương hiện; 0 app error
