---
id: TKT-0125
title: Hoa đăng sống · mở rương bung sáng · chữ banner đỏ
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T11:56:00.000Z
updated: 2026-09-13T12:02:00.000Z
acceptance_ids: ['L125-T1', 'L125-T2', 'L125-T3', 'L125-T4', 'L125-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/festival-3d.css
  - src/ui/festival-3d-runtime.js
  - assets/ui/festival/lamp-river.jpg
  - assets/ui/festival/fx/chest-open.mp4
  - assets/ui/festival/fx/supreme-open.mp4
  - tests/fest-lamp-chest.test.mjs
  - docs/qa/L125-FEST-LAMP/
resource_locks: ["festival-lamp-chest"]
branch_hint: work/l125-fest-lamp-chest-20260913
---
# TKT-0125

Owner 13/09 18:49:

1. Màn thả hoa đăng nhạt — làm thú vị, đẹp hơn
2. Mở rương: video bung nắp + sáng, rồi icon phần thưởng
3. Chữ thông tin trên banner 1/4 trên khó đọc — đổi màu đỏ

## Goal

- Hoa Đăng: sông đêm, đèn trôi, thẻ hướng sống hơn; giữ 5 đèn/ngày
- Mở rương: overlay video + icon loot (mảnh/ngọc/đồ). Loot table không đổi
- Banner: title/kicker/best màu đỏ, có viền sáng

## Non-goals

Không sửa `index.html`. Không đổi tỉ lệ rương. Không 72 tướng.

## Acceptance

- L125-T1: chữ hero đỏ
- L125-T2: lamp-river + đèn nổi; copy/log hiện khi Hoa Đăng
- L125-T3: video chest-open / supreme-open; map icon loot; cược đóng băng
- L125-T4: không document click; giữ fcity khi render
- L125-P1: Chrome 390×844 + 768×1024
