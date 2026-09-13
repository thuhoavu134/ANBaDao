---
id: TKT-0116
title: Chinh chiến xuyên chương — bản đồ, tuyến đường và quái riêng
status: IN_PROGRESS
phase: EVIDENCE
acceptance_ids: [AC01, AC02, AC03, AC04]
branch_hint: work/l116-chapter-travel-worlds-20260913
resource_locks: [campaign-afk-home]
---
Owner duyệt cơ chế #109, yêu cầu áp dụng xuyên chương/ải, đường theo map tạo, quái khác hình thù.
AC01: giữ cơ chế cả đội/damage/crit/loot; chọn world theo chapterIndex, mọi stage cùng chương có world đúng.
AC02: 6 chương có map và tuyến riêng, minimap/camera cùng nguồn; thay chương reset diễn hoạt, đổi ải cùng chương không reset.
AC03: quái khác silhouette, alpha/pivot được đo riêng; không thay tướng chính thức hoặc mở roster mới.
AC04: không đổi thưởng/save/combat; missing/future chapter fallback rõ ràng. Runtime/browser gate vẫn yêu cầu evidence thật.
Assets authorized by this request: 5 maps + 5 decorative monster bodies, giữ city/slime đã duyệt. Không mở các ticket NPC khác.
Base main 305002f. Không merge trước live cho PR mới. Vibe Builder/VibeLab read earlier; board unavailable, ticket-file fallback; Chrome preview BLOCKED bởi automatic review, Safari NOT_RUN.

Evidence: docs/qa/L116-CHAPTER-WORLDS/{red.tap,green.tap,status.md}; 85 focused PASS, build PASS; Chrome BLOCKED, Safari NOT_RUN.
