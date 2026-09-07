# Hồn Việt / Lục Thần — hướng dẫn bắt đầu

Đọc `docs/LUNA-HANDOFF.md` trước khi sửa game. Tài liệu có bản đồ nguồn, pipeline asset, các lỗi đã gặp, cách kiểm tra và quy trình deploy.

Bàn giao mới nhất 07/09/2026: đọc `docs/HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md` và `docs/LUNA-EXECUTION-PLAN-2026-09-07.md` để nhận đúng ticket. Phân tích source mẫu Hermes nằm ở `docs/HERMES-SOURCE-AUDIT-2026-09-07.md`. L02a là lát cắt code tiếp theo; các phần lịch sử không phải danh sách lỗi hiện tại.

- Runtime production được tạo bởi `scripts/build-static.mjs`. Sửa nguồn hoặc patch sinh ra runtime; không dùng chỉnh sửa riêng trong `dist/` làm kết quả bàn giao.
- Giữ nguồn RGBA, tỷ lệ đồng nhất và offset/pivot của animation. Không key màu đen hoặc căn lại từng frame để che lỗi renderer.
- Router, combat scheduler và audio event mỗi loại cần một chủ quản. Không thêm nhiều listener để “chữa” một nút mà chưa tìm handler hiện tại.
- Chạy `npm test` và kiểm tra UI thực tế. Báo riêng build/test, Chrome responsive, Safari thật và production deployment.
- Chỉ đẩy đúng thay đổi của tác vụ, giữ việc đang có và tuân thủ quyền người dùng đã cấp. Không force push hoặc thay cấu hình bảo vệ để vượt lỗi quyền truy cập.

## Quy tắc mỹ thuật của chủ dự án (07/09/2026)

- Khi phát triển màn còn thiếu hình, dùng image generation để tạo background, icon, bản đồ và khung UI cần thiết theo bản sắc Hồn Việt. Tích hợp asset thực vào game; CSS phụ trách bố trí, tương tác và responsive.
- Ưu tiên tái sử dụng asset đã có nếu phù hợp; không thay tướng chính thức bằng hình sinh mới khi chưa được yêu cầu.
- Lưu prompt, nguồn và metadata của asset mới trong repo. Giữ chữ, số tài nguyên và nút tương tác là nội dung sống, không in chúng vào background.

