---
id: TKT-0115
title: Chinh chiến — cả đội hành quân, đánh bầy quái và nhặt thưởng
status: IN_PROGRESS
phase: EVIDENCE
acceptance_ids: [AC01, AC02, AC03, AC04, AC05]
branch_hint: work/l115-party-travel-loot-20260913
resource_locks: [campaign-afk-home]
---
Owner 13/09 sau merge #108: cho phép cả đội di chuyển bằng Idle tạm dù chưa có Run; cùng đánh nhiều quái; damage nảy, crit đỏ/to; vật phẩm rơi rồi bay về rương; map rộng có camera di chuyển.
AC01: cả squad di chuyển trên tuyến đường, camera/minimap đồng bộ, không nhảy khi vòng lặp đổi hướng.
AC02: mọi tướng đã xếp tham gia đánh nhóm nhiều quái; đúng slot, không tạo tướng ngoài squad.
AC03: damage tại mục tiêu, crit đỏ/lớn; HP và death cùng hit timeline.
AC04: quái chết trước khi loot rơi, loot nằm rồi bay tới đúng vị trí rương khi resize.
AC05: diễn hoạt không ghi save, thưởng hoặc progression; pause/reduced-motion/lifetime thuộc scene owner.
Release: PR mới từ main be983ff. Không merge khi chưa live cho PR này. Chrome gate vẫn BLOCKED bởi automatic approval review của preview đăng nhập; Safari NOT_RUN.
Workflow: Vibe Builder/VibeLab instructions read earlier remain applicable. Cached skill files no longer present; board unavailable, ticket-file fallback per existing handoff. No fabricated claim or visual PASS.

Evidence: docs/qa/L115-PARTY-TRAVEL/{red.tap,green.tap,status.md}. 82 focused tests PASS; syntax PASS. Chrome BLOCKED, Safari NOT_RUN.
