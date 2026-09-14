---
id: TKT-0144
title: Sửa tải atlas Linh Đồng gây áp lực bộ nhớ và chân dung trên sân
status: IN_PROGRESS
phase: EVIDENCE
priority: P0
acceptance_ids: [L144-T1, L144-T2, L144-T3, L144-T4, L144-T5, L144-P1]
required_gates: [vibelab, tdd]
affected_paths: [src/domain/character/atlas-image-cache.mjs, src/ui/campaign-scene.js, scripts/linh-dong-memory-v1.mjs, scripts/build-static.mjs, tests/linh-dong-memory.test.mjs, docs/qa/L144-LINH-DONG-MEMORY/]
resource_locks: [linh-dong-atlas-runtime]
---

Baseline upstream: `3accc0ed82261cba2c8adeb34a6dc9771abbb37e`.
Owner gửi ảnh bày trận dùng portrait cụt người và Chrome iPhone đóng cả trang sau tích hợp Linh Đồng.

## Contract / change brief

Sửa tải sẵn atlas ở hub và trận; chỉ tải clip được sử dụng, chia sẻ attack/skill1 cùng file, giới hạn byte RGBA đang giữ và số ảnh tải đồng thời, giải phóng khi rời màn. Gắn idle toàn thân đúng cell/pivot ở Chinh chiến và Bày trận; trả fallback khi clip chưa sẵn sàng. Giữ nguyên RGBA gốc, scale giữa frame, combat, audio owner, auth, save, đội hình và kinh tế.

L144-T1: tạo cache và boot host/battle không tải sẵn atlas Linh Đồng.
L144-T2: alias không tải trùng; bộ nhớ ước lượng tối đa 112 MiB, tối đa 2 ảnh đang tải.
L144-T3: lỗi/ảnh sai kích thước không lặp tải mỗi frame; clear hủy ảnh đang tải và bỏ tham chiếu.
L144-T4: renderer không báo vẽ thành công khi atlas chưa tải; fallback idle; hồ sơ giữ aspect ratio.
L144-T5: Chinh chiến/Bày trận dùng idle atlas toàn thân; onload và teardown qua scene owner hiện có.
L144-P1: kiểm tra browser thật và luồng vào/thoát trận; báo riêng mobile viewport và Safari/iPhone thật.

Ticket Board / claim / lease không khả dụng. Dùng ticket-file fallback đã được owner cho phép (HANDOFF-2026-09-12); không giả claim hoặc lock bên ngoài. Main agent làm trực tiếp trên checkout riêng. Release: PR REVIEW; theo bàn giao mới nhất, owner chọn live và tự deploy PC. Rollback: revert commit sửa, không xóa save.

## Kết quả hiện tại

RED 8 fail → GREEN 8/8; focused 46/46. Build PASS, embedded parity PASS. Local npm test 897/970, 73 thiếu asset/ticket/API trong checkout. CI PASS: build + 970/970 tests on runtime f3f071490c072278a9c5e4b52c5b79acd6de69fb, run 34820015965, PR #138. Owner explicitly approved uploading task source/docs/test logs to private bktimmy247/luc-than and creating a PR on 2026-09-14. L144-P1 BLOCKED bởi ERR_BLOCKED_BY_CLIENT; iPhone NOT_RUN; chưa deploy. Bằng chứng trong docs/qa/L144-LINH-DONG-MEMORY/; handoff `docs/HANDOFF-LINH-DONG-CRASH-2026-09-14.md`. Giữ EVIDENCE đến khi browser gate được kiểm chứng.
