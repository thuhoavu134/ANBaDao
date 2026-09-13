---
id: TKT-0128
title: Rương không đổi sò · điểm tự cộng · shop icon
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-13T13:10:00.000Z
updated: 2026-09-13T13:30:38.000Z
acceptance_ids: ['L128-T1', 'L128-T2', 'L128-T3', 'L128-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/domain/festival/bach-bao-ruong.mjs
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/bach-bao-ruong.css
  - assets/ui/festival/bbr/shop-girl.jpg
  - tests/bbr-chest-pts.test.mjs
  - docs/qa/L128-BBR-PTS/
resource_locks: ["bbr-spin"]
branch_hint: work/l128-bbr-chest-pts-20260913
---
# TKT-0128

Owner 13/09 20:03:

1. Trúng rương chỉ nhận rương, không đổi sò
2. Bỏ Nhận điểm — tự cộng 1 điểm / 1 sò tiêu (100 sò = 100 điểm)
3. Shop là icon cô gái quầy trên màn; Quay to nhất, dưới là Thưởng + Đổi sò

## Non-goals

Không đổi BETS 2/10/50, BBR_BUCKET, BBR_SHOP giá, pity 200. Không 72 tướng.

## Acceptance

- L128-T1: convert chest/supreme fail CHEST_NO_CONVERT
- L128-T2: spinStep cộng pts = stake; không data-bbr-pts
- L128-T3: shop-girl icon, hv-bbr-go, Thưởng + Đổi sò
- L128-P1: Chrome 390×844
