# Hồn Việt / Lục Thần — hướng dẫn bắt đầu

Đọc `docs/HANDOFF-2026-09-12.md` rồi `docs/LUNA-HANDOFF.md` trước khi sửa game.

Bàn giao mới nhất **12/09/2026**: Wave F TKT-0056…0057 Hành trình+Kết quả **trên Git** [#51](https://github.com/bktimmy247/luc-than/pull/51) `5bd9382`. Wave H coordinator TKT-0065…0073 stub [#55](https://github.com/bktimmy247/luc-than/pull/55) `b4915a9`. Đăng nhập TKT-0074 LIVE [#56](https://github.com/bktimmy247/luc-than/pull/56). **Vercel alias chưa Wave F/H** — Hobby hết 100 deploy/ngày, reset 13/09 16:58 +07. **Agent tiếp:** điền P0 TKT-0065 Tháp trận NPC + TKT-0066 nút Thành Chính. 72 tướng = wave sau.










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
