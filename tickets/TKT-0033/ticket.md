---
id: TKT-0033
title: Icon sơn 11 nan Trợ trận
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T03:00:00.000Z
updated: 2026-09-12T03:20:00.000Z
acceptance_ids: ["L23-T1","L23-T2","L23-T3","L23-P1","L23-P2"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","tests/account-assist-spokes.test.mjs","scripts/qa-assist-spokes.mjs","assets/ui/account-gear/spokes/"]
resource_locks: ["assist-wheel-icons"]
---
# TKT-0033 — Icon sơn 11 nan Trợ trận

Goal: Owner 12/09 «ngay bên trợ trận cũng ko có icon». Pattern Lịch Luyện: 11 file sơn `assets/ui/account-gear/spokes/{key}.jpg` thay `spokeGlyph` SVG trên bánh xe `#hvGearRoot`. Hall `assist-hall.webp` giữ. 11 nan / `open` / góc / nhãn giữ nguyên.

Non-goals: đổi `heroStats` / luật 11 nan / Trang bị / Dung luyện / Combat V2 / seed / banner / roster 12 / overlay Thành Chính / thêm `data-art-go` / hall Rèn.

Branch: `work/l23-assist-spoke-icons-20260912` from main `82f1c61`.

## Keep (live)

- WHEEL 11 keys: relic, gear, fish, pet, spirit, divine, star, antique, luck, illusion, formation
- Nan Quân Trận vẫn `navTo('team')` (Bày trận)
- `heroStats` = base + gear + relics + pets + spirits + antiques + illusions + fish, rồi nhân `(1 + divinePct + luckPct)`
- `#hvGearRoot` inset 0 z-index 80 · `assist-hall.webp` · `assist-core.webp`

## Acceptance

- L23-T1: WHEEL 11 keys / label / angle / open không đổi
- L23-T2: runtime dùng `<img src="assets/ui/account-gear/spokes/{key}.jpg">`, không còn `spokeGlyph` SVG
- L23-T3: 11 file jpg unique tồn tại; `assist-hall.webp` vẫn nền; `heroStats` wrapper không đổi công thức
- L23-P1: CSS clip tròn `object-fit:cover`; pointer-events vẫn none trên button / auto trên span
- L23-P2: không thêm `data-art-go`; Chrome 390×844 11 src unique

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN `tests/account-assist-spokes.test.mjs` (L23-T1..P2)
- Chrome 390×844: evidence `docs/qa/L23-ASSIST-SPOKES/`
- Safari / device: NOT_RUN
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim / MERGED / DONE
