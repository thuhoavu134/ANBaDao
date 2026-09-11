# Hồn Việt / Lục Thần — hướng dẫn bắt đầu

Đọc `docs/LUNA-HANDOFF.md` trước khi sửa game. Tài liệu có bản đồ nguồn, pipeline asset, các lỗi đã gặp, cách kiểm tra và quy trình deploy.

Bàn giao mới nhất 11/09/2026: bánh xe Trợ trận đủ 11 nan trên `work/l13-relics-20260911` (Cẩu Cá TKT-0021 → Ảo Hình TKT-0020 → Tuệ Vận TKT-0019 → Cổ Vật TKT-0018 → Tướng Tinh TKT-0017 → Thần Binh TKT-0016 → Chiến Linh TKT-0015 → Linh Thú TKT-0014 → bánh xe TKT-0013 → Bảo Vật TKT-0012). HUD sơn mài / Bậc Thầy / Dung luyện / bảng 12 ô đã lên live `luc-than.vercel.app`. Safari/device vẫn NOT_RUN.

- **Được tái sử dụng code mẫu theo yêu cầu của anh.** Đọc `docs/HERMES-CODE-REUSE-GUIDE.md`: bản đồ 27 phương thức, dependency, lỗi cần sửa và quy trình port từ archive người dùng đã gửi. Quy tắc này thay chỉ dẫn cũ cấm toàn bộ source mẫu. Nối vào owner Lục Thần, ghi khác biệt và test; giữ identity/save/art/luật đã chốt. Repo chứa hướng dẫn; mã gốc chưa được đưa lên GitHub và chưa tích hợp runtime.
- Runtime production được tạo bởi `scripts/build-static.mjs`. Sửa nguồn hoặc patch sinh ra runtime; không dùng chỉnh sửa riêng trong `dist/` làm kết quả bàn giao.
- Giữ nguồn RGBA, tỷ lệ đồng nhất và offset/pivot của animation. Không key màu đen hoặc căn lại từng frame để che lỗi renderer.
- Router, combat scheduler và audio event mỗi loại cần một chủ quản. Không thêm nhiều listener để “chữa” một nút mà chưa tìm handler hiện tại.
- Chạy `npm test` và kiểm tra UI thực tế. Báo riêng build/test, Chrome responsive, Safari thật và production deployment.
- Chỉ đẩy đúng thay đổi của tác vụ, giữ việc đang có và tuân thủ quyền người dùng đã cấp. Không force push hoặc thay cấu hình bảo vệ để vượt lỗi quyền truy cập.

## Quy tắc mỹ thuật của chủ dự án (07/09/2026)

- Khi phát triển màn còn thiếu hình, dùng image generation để tạo background, icon, bản đồ và khung UI cần thiết theo bản sắc Hồn Việt. Tích hợp asset thực vào game; CSS phụ trách bố trí, tương tác và responsive.
- Ưu tiên tái sử dụng asset đã có nếu phù hợp; không thay tướng chính thức bằng hình sinh mới khi chưa được yêu cầu.
- Lưu prompt, nguồn và metadata của asset mới trong repo. Giữ chữ, số tài nguyên và nút tương tác là nội dung sống, không in chúng vào background.

## Quy tắc workflow bắt buộc — Vibe Builder + VibeLab

Khi tiếp tục phát triển game, đọc docs/VIBE-WORKFLOW-RULES.md và tuân thủ hai skill riêng:

- **vibe-builder** là entrypoint xây sản phẩm, mặc định main agent code trực tiếp, giữ source/build/docs/changelog và chịu trách nhiệm implementation.
- **vibe-lab** là gate bắt buộc cho thay đổi runtime: contract → ticket/claim/lock → RED → GREEN → REFACTOR → evidence → REVIEW/handoff.
- ticket-board là nguồn sự thật cho trạng thái ticket. Builder không tự chuyển ticket sang MERGED hoặc DONE.
- Docs-only có thể kiểm tra thông thường; thay đổi code/UI/data/behavior/migration/release phải qua đầy đủ gate. Không âm thầm bỏ qua blocker, không force-push, không báo PASS chỉ từ build.

