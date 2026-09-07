
## 2026-09-07 — L04-A2 stale draft revision runtime wiring

- `scripts/return-context-v1.mjs` now reads the live `P.revision` when capturing a hero-detail return context and supplies it to both navigation and post-render resolution.
- RED was a real build-owner assertion failure; GREEN/REFACTOR focused L04 suite is `19/19 PASS` with syntax and diff checks passing.
- This slice changes only return-context lifecycle behavior. No seed, reward, balance, save migration, roster, art, audio, gameplay rule or dist-only change.
- Code commit `6e1bb9c28538ee65355f59f8bf6601b9934807d2`; Vercel
  `dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` is READY and runtime errors are `0`.

## 2026-09-07 — L04-A2 hero-detail route/back viewport surface

- Added explicit `100vh`/`100dvh` sizing to the source-owned state roster portal;
  the fix keeps the single grid scroll owner and avoids new document-level route
  listeners.
- TDD evidence: RED was a real missing-height contract; GREEN route test `1/1`;
  REFACTOR focused route/roster/return-context/roster-plan `23/23 PASS` plus
  syntax and diff checks.
- Production Chrome now passes Ông Phở card → detail → back with one visible
  roster root, 12 cards and the selected card retained; app-origin errors `0`.
- Code commit `935a472c111b3d4096307cc5a95c434ee7bc9b1f`; Vercel
  `dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is READY. Device/Ticket Board/full local
  asset harness blockers remain; keep `REVIEW / IN_PROGRESS`.
- Chrome alias smoke: campaign and roster roots each `1` and visible, 12 roster
  cards, app-origin errors `0`; hero-card → detail was unstable and is not a
  PASS claim. Device capabilities are `[]`.
- Ticket remains `REVIEW / IN_PROGRESS`; Ticket Board, complete local asset
  checkout, doctor/smoke, archive and hero-detail route gates remain open.

## 2026-09-07 — L04b completed scene timer cleanup

- Source-owned `trackTimeout` now removes its one-shot disposer after the callback, preventing completed timer registrations from accumulating between campaign activations.
- RED was a real `pending=1` failure; GREEN/REFACTOR focused L04 suite is `18/18 PASS` with syntax checks passing.
- Code commit `e37c6df342e912a3c8ef15ac2ad5ed152547db21`; Vercel deployment `dpl_8ZUUaBWq4z4yd58Br8piF7UNN68N` is READY and runtime errors are 0.
- Production Chrome re-entry passed 20 Tướng → Chinh chiến rounds with one visible roster root and one visible campaign root. Device/Ticket Board/local complete-harness gates remain open; status stays REVIEW / IN_PROGRESS.
- No seed, reward, balance, save migration, roster, art, audio, gameplay rule or dist-only change.

## 2026-09-07 — L05c-f semantic impact-case coverage

- Added source-owned `impactTypeCoverage` counts and `impactCaseCoverage` flags for damage, heal, DoT, status and multi-hit impacts.
- RED recorded 3 focused failures; GREEN `10/10 PASS`; full combat regression `39/39 PASS`; syntax checks pass.
- Production deployment `dpl_6Zu9TgEAKBcgwAxWcLz9KQRSxZXy` is READY. Chrome fixture finished `28/81/219`, all semantic cases true, impact snapshots `219/219`, final snapshots `28/28`, `gaps=[]`.
- Evidence-only observer change; no seed, reward, balance, save migration, roster, art, audio or dist change. Status remains REVIEW / IN_PROGRESS.

## 2026-09-07 — L05c-d explicit final action snapshot

- Added source-owned `finalSnapshot` and `finalSnapshotBoundary=resolveAction.complete` to combat observation; report closes the final-action gap only with complete action coverage.
- Added boundary-missing regression and parity drift coverage; focused combat regression is `39/39 PASS` after RED → GREEN → REFACTOR.
- Production deployment `dpl_DZtRfRZGyWeDUnhxtQcVjn2GZAnZ` is READY. Chrome 1×/2× both finish `28/81/219`, final snapshots `28/28`, fingerprint `282374be`.
- Per-impact/device/Ticket Board/archive/game-dev blockers remain explicit; status stays REVIEW. No seed, reward, balance, save, roster, art or audio changes.

## 2026-09-07 — L05c-c round cap and replay/speed parity

- Added parity schema/projection/digest over full rule outcomes while ignoring session identity and presentation speed.
- Added source-owned opt-in `l05c-round-cap` browser fixture with terminal completion metadata and no action beyond round 15.
- Fixed fixture terminal handling so native early win/loss still works, then added a query-only sentinel to keep the cap fixture alive through round 15 without changing live/default combat.
- Verified `37/37` focused tests, source/build-owner syntax, inline payload compile, Vercel `READY`, production cap evidence and valid 1×/2× parity (`0757b35e`).
- Status remains `REVIEW`; next gate is device QA. No gameplay data, save migration, reward, roster, art or audio changes.

## L05c-b — Direct Combat Boundary Evidence (07/09/2026)

- Nối capture before/after ở build-owner runtime cho action-cost, `tickStatuses` DoT/heal/control/expired và metadata effect phase; report có coverage boundary và multi-hit counts.
- Commit [005dc3a](https://github.com/bktimmy247/luc-than/commit/005dc3a09661589ff7b96b6b7402212b1a26581e). Focused suite **34/34 pass**; Vercel production READY; Chrome fixture finished 28 action/81 result/219 impact, thấy burn DoT, regen/direct heal và 5 action multi-hit.
- Trạng thái **REVIEW**; report còn hai gap cũ, round cap 15/full replay/speed parity/device còn mở. Giữ `SOURCE_NOT_AVAILABLE` và `TICKET_BOARD_NOT_AVAILABLE` trung thực.


## v3.26.0 — Lục Ảnh Golden Complete
- Tích hợp Lục Ảnh thành Golden Character hoàn chỉnh: card/avatar/master, hero-detail Idle, Basic/Projectile/Impact, Skill 1, Ultimate, Hit, Run, Fall.
- Skill 1 `Kéo Đèn Lục Ảnh`: VFX hình nhân tại đủ 6 vị trí địch, giảm 20% Tốc trong 2 lượt.
- Ultimate `Độc Vân Phủ Thế`: VFX độc vân render x3 phủ toàn đội địch, gây Độc 3 lượt, mỗi lượt 6% HP tối đa.
- Chỉ dùng đúng 2 voice Lục Ảnh: mở giao diện tướng và Ultimate.
- Định tuyến 3 BGM mới: sảnh/tính năng, combat, và vượt ải-vượt tháp.
- `npm test`: 29/29 PASS; `npm run build`: PASS. Visual browser QA chưa đánh dấu PASS.
## v3.25.5 — Đình Lôi Starter Squad + Runtime Asset Package

- Kept the full `assets/` runtime package in the static preview build so the new QA package carries Đình Lôi's authored atlases and all battle/result assets.
- Moved Đình Lôi into the default 6v6 starter lineup for new saves: front row now opens with Ông Phở / Đình Lôi / Cô Đào Gánh Hội.
- Added a one-time save migration that injects Đình Lôi into older preview saves when he is still absent, replacing `phong_tu` first and otherwise preserving a 6-slot team safely.
- Preserved the v3.25.4 reference-combat spacing adapter so Đình Lôi still advances and casts using the readable game-mẫu lane distance rules.


## v3.25.4 — Đình Lôi Reference Spacing QA Patch

- Fixed `referenceCombatAnchor` for Đình Lôi so Basic no longer holds a fixed 205 px gap before the target. The release anchor now clamps to a readable reference-style standoff of 76–112 px, derived from target distance.
- Fixed support/ultimate cast anchoring so Đình Lôi no longer moves to an off-screen `x = ±42` lane. Skill and Ultimate now move from the base slot into a safe team combat line and keep `y` on the original lane.
- Basic approach now uses the standard `TIMING.approach` duration so the advance to strike distance is visible at runtime; Skill/Ultimate use a capped cast-lane move.
- Added regression coverage for the new reference spacing adapter and kept the authored impact/damage/return-home choreography intact.

# Changelog

## v3.24.7 — Official Roster 12 Runtime

- Đưa 12 tướng chính thức từ Ông Phở đến Tố Điệp vào dữ liệu runtime; khóa đúng tên, hệ, vai trò, chỉ số, Skill 1 và Ultimate, không tự thêm nội tại cho các tướng chưa có chuẩn passive chung.
- Hồ sơ mới và hồ sơ cũ được migrate để sở hữu đủ 12 tướng; đội mặc định dùng 6 tướng đầu và 6 tướng còn lại có thể thay trong kho đội hình/dự bị.
- Đồ Giám và pool chiêu mộ chính chỉ hiển thị roster Hồn Việt đã khóa, không lẫn roster prototype cũ.
- Thêm chế độ kiểm thử `?qa=roster12`: chia toàn bộ 12 tướng thành hai đội 6v6, tự chạy combat nhanh tới Victory/Defeat và dùng MVP động của trận.
- Đồng bộ lại `battle.html` vào engine nhúng trong `index.html`; thêm regression test chặn hai bản engine lệch byte.
- Runtime visual/animation Golden mới hoàn chỉnh cho Ông Phở và Thầy Mo; 10 tướng còn lại mới đạt tầng gameplay data/logic, chưa được tuyên bố hoàn thiện animation.

## v3.24.6 — Result Flow Runtime Repair

- Sửa hai khối CSS/JavaScript Victory V6 + Defeat V4 bị đóng gói với ký tự `\\n` dạng chữ làm trình duyệt không parse được result integration.
- Khóa package version theo đúng build mới và bổ sung regression test cho cú pháp inline script, MVP động, chuỗi Victory Run → Idle, Defeat Fall và các route phục hồi.
- Giữ nguyên campaign source-of-truth: trận 6v6 độc lập, tối đa 15 hiệp, thắng nối ải kế tiếp và thua dừng chuỗi.
- Visual/runtime browser QA chưa được đánh dấu PASS khi chưa có trình duyệt khả dụng để chụp và tương tác thật.

## v3.24.4 — Continuous Chinh Chiến (WIP, chưa đóng gói)

- Bỏ danh sách chọn 6 chương/ải khỏi đường chơi chính; màn Chinh Chiến chỉ hiện đúng nhiệm vụ hiện tại.
- Thắng trận và bấm `Tiếp tục` trên kết quả sẽ tự mở nhiệm vụ kế tiếp, không quay về bắt người chơi chọn lại.
- Kết thúc chương tự mở chương tiếp theo; mỗi nhiệm vụ vẫn trừ thể lực độc lập và dùng đội hình hiện tại.
- Khi thua mới dừng tuyến, hiển thị lối `Thử lại`, `Đổi đội hình` hoặc `Tăng lực chiến`.
- Giữ nguyên combat 6v6, giới hạn 15 hiệp và phân xử theo HP còn lại; không thêm wave hay quân tiếp viện nội trận.

## v3.24.3 — Large icon upscale and hub swap (WIP, chưa đóng gói)

- Upscale/sharpen bộ icon menu alpha lên 2× và tăng kích thước hiển thị hai bên để silhouette đọc rõ trên mobile lẫn desktop.
- Hoán đổi đúng ngữ nghĩa bố cục: `Đấu Trường` vào địa danh trung tâm trước đây là `Bang Hội`; `Bang Hội` vào vị trí icon đấu trường bên phải.
- Giữ icon hai bên nền trong suốt; chỉ nhãn địa danh trên công trình và dock điều hướng có nền riêng.

## v3.24.2 — Transparent icon and crisp hub pass (WIP, chưa đóng gói)

- Đưa icon chức năng hai bên về asset alpha lớn, đặt trực tiếp trên nền cảnh như game mẫu; bỏ toàn bộ thanh nền đen quanh icon.
- Chỉ giữ nhãn nền tối cho các địa danh gắn với công trình trung tâm; dock dưới là dải điều hướng độc lập, không bị hiểu là một phần của ngôi nhà.
- Gỡ lớp phủ toàn màn làm giảm độ nét, sharpen lại tiền cảnh cổng/bậc thang và giữ công trình trung tâm sắc nét.

## v3.24.1 — Hub depth pass (WIP, chưa đóng gói)

- Tách tiền cảnh cổng đá, mái hiên, đèn lồng và bậc thang thành PNG RGBA riêng; đặt đúng trục giữa để tạo occlusion rõ với công trình phía sau.
- Thêm bóng tiếp xúc, đổ bóng mềm và parallax rất nhẹ cho lớp tiền cảnh; giữ nguyên khoảng thở bầu trời, nhãn chức năng hai bên và dock năm nút tròn.
- Giữ kích thước nền 2048×3072, không quay lại khung cổng bao quanh màn hình.

## v3.24.0 — Reference hub composition (WIP, chưa đóng gói)

- Thay lớp cổng/khung bao quanh bằng một quần thể kiến trúc Việt Nam nổi, đặt cân giữa màn hình trên nền trời xanh và mây trắng.
- Đổi các chức năng hai bên thành nhãn nổi tối trong suốt có icon nhỏ, bám đúng nhịp bố cục của game mẫu nhưng giữ tên và asset Hồn Việt.
- Đổi dock dưới thành khay tối mềm với năm nút tròn nổi, có co nút/vòng sáng khi ấn.
- Bỏ thẻ nhiệm vụ lớn khỏi sảnh; đường vào Chinh chiến nằm ở dock như game mẫu. Dấu cộng tài nguyên vẫn dẫn thẳng tới hoạt động tương ứng.

## v3.23.9 — Vietnamese hub architecture frame (WIP, chưa đóng gói)

- Thêm lớp cổng/lầu chợ Việt Nam trong suốt làm kiến trúc đỡ nhóm chức năng hai bên, giữ hở lối đi trung tâm.
- Tăng độ nổi của icon bằng bóng tiếp xúc và tách icon khỏi nền cảnh thay vì phủ hộp UI.
- Thêm dấu `+` cho vàng/ngọc/thể lực; chạm hoặc dùng bàn phím sẽ mở Chinh chiến/Lịch Luyện để kiếm tài nguyên.

## v3.23.8 — Hub reference cleanup (WIP, chưa đóng gói)

- Gỡ toàn bộ lock glyph/placeholder đen khỏi icon Hub; trạng thái khóa chỉ còn là giảm nhẹ độ bão hòa.
- Thay emoji tiền/ngọc/thể lực bằng icon vector màu sạch, không phụ thuộc font emoji của thiết bị.
- Bỏ các khối hộp phủ quanh HUD tài nguyên, nhiệm vụ chính và dock dưới; icon/CTA đứng trực tiếp trên nền minh họa như reference.

## v3.23.7 — Direct hub entry (WIP, chưa đóng gói)

- Bỏ popup “Sảnh Hồn Việt” khi mở game.
- Mở thẳng giao diện sảnh, giữ nguyên dock và các CTA điều hướng trong sảnh.
- Xóa handler onboarding cũ để không còn lớp phủ làm mờ nền hoặc chặn thao tác.

## v3.23.6 — Reference loop cleanup (WIP, chưa đóng gói)

- Làm sạch onboarding và kết quả để đường chơi chính không chen lời dẫn chuyện.
- Giữ nguyên map → Khiêu chiến → trận tự động → kết quả → map; chữ chiến thắng/thất bại lấy đúng cấu hình của encounter.
- Nhánh Chinh chiến im lặng phần thư/nhật ký/chat cốt truyện; dock chính giữ đúng 5 điểm chạm: Thành Chính, Tướng, Trợ trận, Lịch Luyện, Chinh chiến.

## v3.23.5 — Reference campaign loop (WIP, chưa đóng gói)

- Đưa Chiến Dịch về đúng nhịp map → Khiêu chiến → một encounter 6v6 tự động → kết quả → quay lại map; mỗi lần chạm chỉ chạy một ải, không tự nối nhiều trận.
- Mọi ải campaign dùng luật 15 hiệp: loại khi một phe bị quét; nếu còn cả hai bên sau hiệp 15 thì xét tổng HP, tỉ lệ HP, số tướng sống và hòa tuyệt đối thuộc phe người chơi.
- Gỡ route buff khỏi đường chơi chính để chỉ đội hình/tướng quyết định kết quả; route/lore vẫn là lớp phụ không chặn CTA.
- Thêm dock điều hướng dưới chiến trường theo bố cục game mẫu (×3, tua nhanh, Thành Chính, Tướng, Trợ trận, Lịch Luyện, Chinh chiến), có message bridge an toàn về shell.

## Reference Parity Contract — toàn bộ UI/UX và logic (đang sản xuất)

- Khóa ba câu hỏi duyệt bắt buộc cho mọi chi tiết: đẹp độc lập, đúng toàn cảnh game mẫu và đúng bản sắc Mộng Giới.
- Thêm hệ chấm 7 trục: bố cục, tỷ lệ, hình ảnh, màu/sáng, phản hồi, luồng logic và bản sắc.
- Hủy tiêu chuẩn icon huy hiệu tròn cũ; cấm fallback sai nghĩa và cấm trùng chức năng.
- Chốt thứ tự rebuild toàn game từ global shell → Hub → Tướng → Trận Hình → Chiến Dịch → Gọi Mộng → tài nguyên → mode → xã hội → combat/kết quả.
- Chưa đóng gói; mọi evidence cũ chỉ có giá trị cho phạm vi đã quay và không đại diện toàn game.

## v3.23.1 — Visual Rebuild (WIP, chưa đóng gói)

- Tạo master visual Hub Hồn Việt mới và tách thành bốn layer runtime độc lập.
- Thêm parallax theo pointer với bốn cấp chiều sâu và fallback reduced-motion.
- Chroma-key/despill ba lớp alpha; loại bản sinh caro giả.
- Tạo asset pack 15 icon menu, tách thành PNG alpha 256×256 và nối 14 icon vào Hub.
- Thêm phản hồi chạm thống nhất cho icon: ngay khi ấn xuống vòng sáng bật đồng thời icon co; thả tay vòng sáng tắt ra ngoài, icon hồi kích thước rồi mới điều hướng sau 135ms.
- Loại đường dẫn dock cũ không tồn tại; dùng asset sạch hiện có làm fallback tạm để runtime không hiện biểu tượng ảnh hỏng trong giai đoạn WIP.
- Giữ trạng thái WIP; chưa release/đóng ZIP trước khi hoàn thành visual system và QA runtime.

## v3.23.0

- Tái cấu trúc sảnh thành ba địa danh trung tâm: Chợ Mộng, Bang Hội, Mộng Giới; bỏ các lối vào trùng nhau.
- Chuẩn hóa dock dưới thành năm mục và dọn bớt tiện ích phụ gây nặng giao diện.
- Thêm bảng tổng sát thương, tổng trị liệu hoặc tổng hiệu quả sau từng hành động; tính cả đánh lan và đòn nối.
- Đổi lời kêu gọi sau kết quả thành “Tiếp tục hành trình”, tránh ngụ ý nhiều wave trong cùng trận.
- Nâng build tag lên `HV-MG-3.23.0-PLAYER-JOURNEY-CORE`.

## v3.22.0

- Bỏ wave viện binh nội trận.
- Thêm giới hạn và phân xử 15 hiệp.
- Đổi HUD từ `LƯỢT` sang `HIỆP x/15`.
- Thêm lý do phân xử vào kết quả trận.
- Thêm transition con dấu đỏ khi kết thúc chương.
- Tích hợp animation con dấu do anh cung cấp: crop bỏ dấu góc, tăng tốc còn 2,25 giây, chroma-key thành APNG alpha và giữ CSS fallback.
- Cập nhật build tag.

## v3.24.5 — Victory V6 / Defeat V4 integration
- Integrated approved Victory V6 and Defeat V4 presentation into battle result flow.
- Result MVP is resolved dynamically from the player battle snapshot (damage, then kills) and name/stats are not hardcoded.
- Victory preserves Run -> Idle presentation using the actual MVP art rendered from the game's hero atlas.
- Defeat preserves one-way fall presentation and uses the actual MVP art.
- Defeat recovery icons are actionable routes: daily, heroes, summon, forge.
- Campaign result publishing remains the existing v3.24.4 source-of-truth.
- `npm test`: 4/4 PASS. `npm run build`: UNVERIFIED/BLOCKED because node_modules/vite is not installed in this source package/environment.

## v3.24.6 — L05c round-cap and full replay parity evidence (REVIEW)

- Exposed the authored combat fixture seed in `replayParity`, next to the
  existing full-replay-rule-outcome fingerprint, so speed parity is machine
  auditable without changing gameplay.
- RED: missing seed assertion; GREEN: L05c focused test `4/4 PASS`;
  REFACTOR: full combat suite `39/39 PASS`, syntax and diff checks pass.
- Production 1×/2× Chrome evidence: same seed `l05a-production-seed`, same
  fingerprint `86267582`, `93` actions, `644` impacts, round cap `15`, no
  round beyond cap, empty gaps, and visible `Khải hoàn` at `HIỆP 15/15`.
- Code commit `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`; Vercel deployment
  `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` READY; runtime-error query empty.
- Remains WIP/REVIEW pending device backend, Ticket Board, complete local
  asset harness and other previously recorded environment gates.
