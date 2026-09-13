---
id: TKT-0123
title: Vành Bách Bảo — icon gần full ô, không crop, không mất nét
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T11:30:00.000Z
updated: 2026-09-13T11:40:00.000Z
acceptance_ids: ['L123-T1', 'L123-T2', 'L123-T3', 'L123-T4', 'L123-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong.css
  - src/ui/bach-bao-ruong-runtime.js
  - assets/ui/festival/bbr/
  - assets/items/materials/gold.png
  - assets/items/materials/tinh-luc.png
  - assets/items/materials/hoat-luc.png
  - tests/bbr-icon-fill.test.mjs
  - docs/qa/L123-BBR-FILL/
resource_locks: ["festival-bbr-icons"]
branch_hint: work/l123-bbr-icon-fill-20260913
---
# TKT-0123 — Icon vành gần full ô

Owner screenshot 13/09 18:27: icon trong ô vuông vành Bách Bảo nhỏ, còn nhiều nền xám.

## Goal

Hình vẽ gần full ô. Giữ tỉ lệ, `object-fit:contain`, không `cover` crop. PNG 256 LANCZOS — không méo, không mất chi tiết. Trim padding trong suốt, scale đều vào canvas.

Không đổi cược 2/10/50, bảng, pity, số thưởng.

## Non-goals

Không sửa `index.html` / `battle.html` / `campaign-scene.js`. Không kem Thành chính. Không 72 tướng.

## Acceptance

- L123-T1: CSS n1 ≥96%, n2 ≥84%, n3 ≥74%; stack img `object-fit:contain`; không `cover` trên `.hv-bbr-stack`
- L123-T2: PNG ART vành (gold/gems/tinh/hoat/sh_ss/sh_ssr/chest/supreme/so) cạnh nội dung ≥ 82% canvas
- L123-T3: BETS 2/10/50; PAY.gold 180/480/1200 đóng băng; không document click
- L123-T4: ART.tinh = `materials/tinh-luc.png` (cùng bình túi)
- L123-P1: Chrome 390×844 + 768×1024 — icon n1 chiếm ≥78% cạnh ô; 0 app error
