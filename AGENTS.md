## Chân dung màn Tướng — quy chuẩn chung 18/10/2026

Đọc `docs/ROSTER-PORTRAIT-STANDARD.md` khi sửa ảnh đại diện hoặc thẻ tướng. Cùng tỷ lệ mặt và cao độ mắt; giữ tỷ lệ ảnh. Frame đại diện phải mở mắt và được xem thật, không chọn theo diện tích alpha. Tướng/ảnh mới cần landmark và bằng chứng; ảnh thiếu QA không được coi là đã đạt. Không sửa thiết kế mặt nạ/che mắt authored.

## Tích hợp tướng / VFX / SFX — GLM 5.3 Flash và các coding agent

Khi làm tướng hoặc asset Kiếm Thế, đọc [docs/GLM-HERO-VFX-SFX-GUIDE.md](docs/GLM-HERO-VFX-SFX-GUIDE.md). Hướng dẫn chứa bản đồ source, chọn/duyệt asset có tiếng, timeline, HUD, kiểm thử và hợp đồng Tịch Dao hiện hành. Không lấy các bộ asset tạm trong lịch sử QA làm bản đã duyệt.

## ZIP tướng — bàn giao trọn bộ (18/10/2026)

Mỗi ZIP tướng phải thực hiện mục 11 của `docs/GLM-HERO-VFX-SFX-GUIDE.md`: kiểm kê → hồ sơ skill/asset/timeline → ma trận tất cả màn → bằng chứng → PR. Bắt buộc kiểm Victory Run → Idle, Defeat Fall, đủ animation/VFX/SFX, hướng hai phe và phase trước/sau lưng địch. Thiếu asset hoặc chưa kiểm game thật phải ghi rõ; không dùng hình mặc định để báo hoàn tất. Giữ hồ sơ dùng chung, rà mọi registry hiện có và thêm test tại các điểm nối bị thiếu. Không tự retime tướng đã duyệt theo khung thời gian còn đang đề xuất.

## Owner direction — 2026-10-06
Every merge requires explicit owner approval on GitHub. Work from a real branch of current main, preserve every existing feature and actual game logic. PR283/284 prototypes were rejected; do not integrate their simplified shells, fixtures, hidden features or mock dialogs. Preview must use the full normal game build, not a substitute application. Audit each existing screen before UI changes. No production promotion before approval.

# Hồn Việt / Lục Thần — hướng dẫn bắt đầu

> **LATEST ENTRYPOINT — 21/09/2026**
>
> Trước mọi thay đổi runtime, đọc **`docs/AGENT-WORKFLOW-HANDOFF-2026-09-21.md`**.
> Main checkpoint khi handoff được tạo: **`f535494fac8b791df7f731759b09a2f1e60786a8`** (PR #174).
> Nếu main mới hơn, luôn lấy main mới nhất làm baseline; không tiếp tục từ branch/PR cũ chỉ vì lịch sử chat nhắc tới.
>
> Quy tắc hiện hành: branch nhỏ từ main → patch owner thật → build/test → browser evidence desktop/mobile → đọc screenshot + interaction + runtime/asset errors → PR → CI xanh → review evidence → merge → cập nhật handoff nếu contract/owner/workflow đổi.
>
> Victory/Defeat hiện đã khóa bởi PR #174; không làm lại nếu không có regression evidence. Responsive Chromium không phải physical iPhone/Safari. GitHub/source pass và Vercel/deploy là hai lớp độc lập.

TKT-0158 audio trận phát cùng game LIVE #157 `343fe39`. Host unlock + `playBgm('combat')` lúc Xuất chiến; iframe không autoplay BGM khi parent sở hữu; bỏ `location.assign` 1.8s. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0157 iOS trận chết tab vì atlas S+ LIVE #156 `ef2af5e`. Downsample 0.5 atlas >32 MiB + purge Chinh chiến khi iframe trận mở. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0156 Bạch Diện tướng đầy đủ như Linh Đồng LIVE #152 `85a35d5`. DATA.heroes + roster + hồ sơ idle. Linh Đồng ô 2. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0155 extras Tướng/Đồ Giám SUPERSEDED bởi TKT-0156. LIVE #151 `7a700e9` đã nới extras; TKT-0156 thay bằng tướng chính thức.

TKT-0154 Bạch Diện Canvas Sprite Runtime LIVE #150 `aedd4cb`. ID `hero_splus_bach_dien`. Pack q90-480 → atlas 8×12 / VFX 10×10. Extra S+ TKT-0152 cùng PR. Lưới 42 giữ. Roster 12 đóng. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0153 Chinh chiến đi đường Linh Đồng Run LIVE #149 `7c70c69`. Idle Bày trận không đổi. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0151 Canvas Sprite Runtime LIVE #147 `e8cd581`. Catalog + lazy + LRU 128 MiB. Linh Đồng trước. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.


TKT-0150 trận hiện VFX và SFX LIVE #146 `7baca81`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0149 trận một tướng xong mới đến tướng kia LIVE #145 `506a7f8`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

TKT-0148 địch Bày trận quay trái + màn Tướng cuộn LIVE #144 `5de296f`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

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
