# Linh Đồng crash / TKT-0144 — 14/09/2026

Baseline: `3accc0ed82261cba2c8adeb34a6dc9771abbb37e`. Bản sửa đang EVIDENCE/REVIEW, chưa phát hành.

## Nguyên nhân xác định từ source

- Host tạo sẵn 6 Image atlas Linh Đồng dù chỉ màn hồ sơ sử dụng idle. Battle tạo sẵn 9 Image (8 URL; attack và skill1 trùng file). Theo runtime-meta, 8 atlas cần khoảng 263 MiB RGBA khi giải mã, ngoài các tướng khác. Đây là nguồn áp lực bộ nhớ phù hợp với triệu chứng Chrome iPhone đóng cả trang; chưa có crash log iOS để khẳng định OOM là nguyên nhân duy nhất.
- `spriteSpecs` của Chinh chiến/Bày trận thiếu `linh_dong`, nên lấy `portraitSrc(id,'master')`: ảnh bust bị dùng làm thân. Idle gốc có đủ chân, alpha bbox frame 0 `(72,80)-(275,319)` trong cell 347×320.
- `drawLinhDongHero` trả true ngay cả khi atlas chưa tải, chặn fallback và có thể làm tướng vô hình. Hồ sơ ép cell 347×320 vào hình vuông, và RAF cũ không kiểm tra màn đã ẩn.

## Bản sửa

`src/domain/character/atlas-image-cache.mjs`: tải theo truy cập, chia sẻ theo URL, tối đa 112 MiB RGBA ước lượng và 2 ảnh đang tải. LRU bỏ nguồn ảnh cũ; lỗi/ảnh sai kích thước không retry mỗi frame; clear hủy nguồn và callbacks. Đây là ngân sách của cache Linh Đồng, không phải giới hạn tổng RAM trình duyệt/GPU.

`scripts/linh-dong-memory-v1.mjs` patch hai document sau các patch cũ, trước đồng bộ base64. Host chỉ tải idle khi mở hồ sơ, giữ aspect ratio, dừng khi rời màn; giải phóng cache ở route/iframe lifecycle hiện có. Battle dùng idle khi clip chưa sẵn sàng, trả false khi chưa vẽ để renderer cũ tiếp tục fallback.

`src/ui/campaign-scene.js`: thêm idle toàn thân 347×320, 96 frame, pivot 173.5, foot 320, body 240; giải phóng cả ảnh Linh Đồng đã tải khi scene scope kết thúc. Không đổi RGBA, crop từng frame, roster, save, auth, luật combat, SFX owner hay kinh tế.

## Kiểm chứng

- RED: 8/8 kiểm thử hồi quy fail trên source cũ (log `red.tap`). GREEN: 8/8. REFACTOR + scene/pointer/slot/lifecycle: 46/46.
- Syntax: 3 source JS/MJS PASS. Build PASS; battle nhúng khớp byte với `dist/battle.html` (1,458,341 bytes).
- Local `npm test`: 970 test, 897 PASS, 73 FAIL trong checkout không tải đủ asset/ticket/API cũ. Không coi đây là suite PASS. `npm-test.log` giữ nguyên lỗi; CI GitHub phải kiểm trên repository đầy đủ.
- Chrome production cũ: mở được trận QA Linh Đồng và bắt đầu trận; atlas idle tải về khớp SHA-256 main. Không dùng quan sát này để nghiệm thu bản sửa.
- Chrome bản sửa: BLOCKED `net::ERR_BLOCKED_BY_CLIENT` khi mở preview cục bộ. Không dùng browser khác hoặc tắt bảo vệ để vượt chặn. Không có screenshot trình duyệt bản sửa.
- Safari/iPhone thật: NOT_RUN. Production: NOT_DEPLOYED. Vercel kết nối hiện tại không nhìn thấy project `luc-than-neon`; không tạo project khác.

## Tiếp tục / release

Owner đã xác nhận «ok a cho phép» ngày 14/09 cho việc đưa bản sửa, tài liệu và log lên private repo bktimmy247/luc-than, tạo PR và chạy CI. CI PASS: build + 970/970 trên runtime f3f0714, run 34820015965, PR #138. Theo bàn giao 13/09, owner chọn live và tự deploy PC. Sau deploy kiểm trên iPhone: mở/đóng hồ sơ Linh Đồng; Chinh chiến → Bày trận đủ chân; xuất chiến, xem S1/Ultimate, thoát và vào lại ít nhất 3 lần; chuyển app rồi quay lại. Không tuyên bố hết crash iPhone trước bước này.

Ticket Board không khả dụng; dùng ticket-file fallback đã được owner cho phép. Không giả claim/lease hay MERGED/DONE. Nguồn fingerprint và bằng chứng nằm trong `docs/qa/L144-LINH-DONG-MEMORY/`. Rollback bằng revert commit, không xóa save.
