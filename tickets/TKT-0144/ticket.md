---
id: TKT-0144
title: Sửa tải atlas Linh Đồng gây áp lực bộ nhớ và chân dung trên sân
status: LIVE
phase: LIVE
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

## Result

LIVE #138 `645902f`. Cache lazy 112 MiB, 2 ảnh tải. Idle toàn thân trên sân. BETS 2/10/50 đóng. Không Hồng Trầu. Không per-frame crop.
L144-T1…T5 PASS. CI 970/970. L144-P1 Chrome BLOCKED / Safari NOT_RUN. Không tuyên bố hết crash iPhone trước khi anh kiểm trên máy.
Owner tự `git pull && vercel --prod`.
