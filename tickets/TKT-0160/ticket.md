# TKT-0160 — iPhone WebKit vào trận trực tiếp

Updated: 2026-09-24  
Status: REVIEW (không phải chuyển trạng thái Ticket Board)  
Branch: `fix/ios-webkit-canvas-autostart-20260924`  
Baseline: `888e9559e0af6c0f0dc229d456ecc18976407763`

## Contract

Ảnh thiết bị thật cho thấy trang trận đã nhận cấu hình 6v6 nhưng dừng trước khi runtime dựng nền: nền đen, `HIỆP —/15`, intro **Khiêu chiến** còn hiện và nút chưa hoạt động. Runtime production tạo Canvas 2D duy nhất với `{ alpha:false, desynchronized:true }` rồi ném lỗi nếu WebKit trả `null`; lỗi này xảy ra trước khi gắn handler và autostart.

## Acceptance

- **BE-1:** iPhone/iPad bỏ tuỳ chọn `desynchronized`, thử Canvas `{alpha:false}` trước rồi thử cấu hình mặc định.
- **BE-2:** desktop vẫn ưu tiên Canvas hiện tại và có hai mức fallback nếu tuỳ chọn bị từ chối hoặc trả `null`.
- **BE-3:** battle nhúng/trực tiếp gọi `beginBattle()` ngay sau khi trạng thái intro được chuẩn bị; các lần retry hiện có vẫn giữ lại.
- **BE-4:** URL battle trực tiếp dùng cache token mới để thiết bị không giữ tài liệu cũ.
- **BE-5:** không đổi combat math, save, reward, đội hình, kích thước tướng, VFX/SFX hay result flow.

## RED → GREEN

- RED trên baseline patch owner: `node --test tests/battle-entry-webkit-canvas.test.mjs` = 0/3 PASS, thiếu cả Canvas fallback, autostart đồng bộ và cache token mới.
- GREEN sau sửa: 3/3 PASS; `node --check` PASS cho hai build patch.
- Full build, full suite, Vercel preview và browser evidence phải được kiểm tra trên branch/PR trước merge.
- Physical iPhone/WebKit vẫn cần owner xác minh sau production; không gọi responsive Chromium là thiết bị thật.

## Workflow note

Ticket Board, claim, lease và path lock không có trong workspace này, nên không tuyên bố claim/lock hoặc tự chuyển MERGED/DONE. File này giữ contract và evidence revision cho vòng sửa khẩn cấp.
