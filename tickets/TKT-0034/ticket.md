---
id: TKT-0034
title: Lịch Luyện icon/nền giả 3D tươi
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T03:17:00.000Z
updated: 2026-09-12T03:17:00.000Z
acceptance_ids: ["L21-T1","L21-T2","L21-T3","L21-P1","L21-P2","L21-P3","L21-P4","L21-P5"]
required_gates: ["vibelab","tdd"]
affected_paths: ["assets/daily/","src/ui/daily-screen.css","tests/daily-run.test.mjs","scripts/qa-daily-screen.mjs"]
resource_locks: ["daily-screen","lich-luyen-wheel"]
---
# TKT-0034 — Lịch Luyện icon/nền giả 3D tươi

Goal: Owner 12/09 «sao e cứ để background dạng sơn mài… icon và background của a tươi sáng đẹp đẽ phong cách giả 3D có nhiều layer» rồi hỏi «lịch luyện đã đổi theo chưa». Đổi 11 nan + hall Lịch Luyện sang token giả 3D tươi (cùng hướng art sẵn có). **Không** reuse `menu-v3233` hub icons. **Không** overlay Thành Chính. Công thức daily / 11 nan / `go` đóng băng.

Non-goals: Trợ trận (TKT-0033), Nhật Ký Mơ, Combat V2, seed/banner, roster, bịa ải `go:null`, hall Rèn.

Branch: `work/l23-assist-spoke-icons-20260912` (stacked trên TKT-0033, chưa live).

## Keep (live formulas)

Giữ nguyên TKT-0032: stamCap 120, nap, idle, điểm danh, JOURNEY_UNLOCK, 11 keys `LICH_LUYEN_SPOKES`.

## Acceptance

- L21-T1..P5 vẫn GREEN (đường file `lich-hall.jpg` + `spokes/{key}.jpg` giữ)
- Chrome 390: dock Lịch Luyện → hall sáng 3D, 11 nan token giả 3D độc lập, không icon hub
- Safari/device: NOT_RUN

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
