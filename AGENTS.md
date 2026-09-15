# Hồn Việt / Lục Thần — hướng dẫn bắt đầu

TKT-0147 Ải 1-2 không khóa sau thắng ải trước LIVE #143 `4e61e58`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0146 S+ Linh Đồng clock ATK/Ultimate LIVE #142 `c517cd8`. Safari/iPhone NOT_RUN. Đọc `docs/HANDOFF-LINH-DONG-TIMING-2026-09-14.md`. Owner tự `git pull && vercel --prod`.

Bản sửa Linh Đồng TKT-0145 LIVE #141 `dba09d7` trên #140. TKT-0144 LIVE #138 `645902f`. Safari/iPhone chưa kiểm; không tuyên bố hết crash trước khi owner xác minh trên máy. Đọc `docs/HANDOFF-LINH-DONG-CRASH-2026-09-14.md`.

Đọc `docs/HANDOFF-2026-09-13.md` rồi `docs/HANDOFF-2026-09-12.md` trước khi sửa game.

Bàn giao mới nhất **13/09/2026 sáng**: main `92e6708` · play [luc-than-neon.vercel.app](https://luc-than-neon.vercel.app/) · postgres/oauth gamma thuhoavu. Wave S–W #87–#107 LIVE. 72 tướng = wave sau.










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
