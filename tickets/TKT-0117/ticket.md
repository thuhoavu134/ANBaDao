---
id: TKT-0117
title: Khiêu chiến — huy hiệu hai kiếm chém nhau
status: IN_PROGRESS
phase: EVIDENCE
acceptance_ids: [AC01, AC02, AC03]
branch_hint: work/l117-challenge-swords-20260913
resource_locks: [campaign-afk-home]
---
Owner 13/09 video 14-53-31: thay nút chữ nhật Khiêu chiến bằng huy hiệu tròn vàng, hai kiếm riêng có animation chém nhau, chữ Khiêu chiến phía dưới.
AC01: nút semantic giữ data-hv-afk-challenge, chạm phần kiếm/chữ đều vào Bày trận đúng handler.
AC02: hai layer kiếm RGBA chuyển động đối xứng + flash tại va chạm; không đóng chữ vào ảnh.
AC03: reduced motion/disabled/ẩn trang dừng animation, focus rõ, không đổi nút Xuất chiến/nhận thưởng.
Base main 2074081. Một PR UI; đề xuất level ghi riêng ở docs/CAMPAIGN-LEVEL-PROPOSAL.md, chưa thêm cấp người chơi hoặc khóa ải trước khi owner chốt loại level.
Vibe Builder/VibeLab gate: ticket-file fallback; Chrome preview vẫn BLOCKED bởi auto-review đăng nhập, Safari NOT_RUN. Không merge trước live.

Evidence: docs/qa/L117-CHALLENGE-SWORDS; 87 focused PASS, syntax PASS.
