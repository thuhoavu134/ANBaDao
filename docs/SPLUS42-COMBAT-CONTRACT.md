# L10-SPLUS42 — cơ chế 42 tướng và ấn ký HUD

Contract: `luc-than-splus42/2026-09-08-v1`. Quality: gameplay review. Target: Vercel existing static build. Baseline upstream: `d3ee56cd1391208ae262652b383e5b7d443308c7`.

## Yêu cầu được tiếp nhận

Hồ sơ 42 tướng S+ và hồ sơ 42 icon nội tại do chủ dự án gửi ngày 08/09/2026 là nguồn mới cho nhóm S+. 6 hệ × 7 tướng, ID giữ nguyên tuyệt đối (bao gồm `hero_splus_hoa_duc`). Đây là phạm vi gameplay mới L10, thay cho việc tiếp tục L04b. Các nội dung lịch sử 12 tướng vẫn giữ đầu tư/save và asset đã duyệt.

Code cơ chế cả nội tại, đánh thường, Kỹ năng 1 và Ultimate riêng biệt. Không nhập Kỹ năng 1 thành đánh thường vì Tước Khí, câm lặng và kéo dài hồi chiêu cần phân biệt. Chưa có ảnh/atlas nhân vật mới trong đầu vào; không gán art tướng cũ thành hình mới. Không thay seed, phần thưởng, chiêu mộ hoặc migration save. Chỉ nhận roster mới trong cấu hình trận S+ và đường kiểm thử riêng cho đến khi đủ art và chính sách mở tướng.

## Acceptance và phạm vi

- S42-A1: catalog 42 ID duy nhất, đủ 7/hệ, đúng vai trò/vị trí, ba mô tả chiêu và liên kết icon.
- S42-A2: 42 nội tại có trigger đúng; các giá trị phần trăm/nộ/số đòn/số tầng được kiểm bằng hành vi.
- S42-A3: Kỹ năng 1 và Ultimate của mọi tướng có resolver; target hàng trước/sau/cột/kề nhau dùng slot 0..5; RNG có seed và không phụ thuộc tốc độ trình diễn.
- S42-A4: effect owner phân biệt root/disarm/silence/hard CC, cleanse, shield-ban, overheal, true damage, reflection, interception, resurrection, additional attack/action. Không đệ quy phản đòn hoặc kích thêm lượt vô hạn.
- S42-A5: HUD đọc trạng thái trên mục tiêu, có ID nguồn, số tầng, số đòn bảo hộ và thời hạn; trạng thái hết hạn/đã giải không còn hiển thị. Metadata lưu đủ 42 tên icon; artwork chỉ được gọi là integrated khi có asset thật.
- S42-A6: source module nối build owner và resolver/scheduler hiện có; không tạo clock/router/audio owner mới. Kiểm byte parity embedded battle và giữ regression legacy.
- S42-A7: focused RED/GREEN/REFACTOR; full test/build thật; Chrome UI/production; device và Ticket Board báo riêng, không nhận PASS nếu thiếu.

Path scope: `src/domain/combat/splus-*.mjs`, `src/domain/hero/splus-*.mjs`, `src/runtime/splus-*.js`, `splus-lab.html`, `scripts/splus-*.mjs`, integration import trong `scripts/build-static.mjs`, tests S+, dữ liệu/art HUD tương ứng, tài liệu và evidence. Quyết định reuse: KEEP_EXISTING scheduler/seeded RNG/renderer/observation; không port source mẫu.

## Semantics bổ sung cần REVIEW

Đây là các mặc định triển khai cho chỗ hồ sơ chưa định lượng, không được gọi là balance đã chốt:

| Khoảng chưa chốt | Mặc định review |
|---|---|
| Đánh thường/cost | Giữ nộ engine: đánh thường +15, skill 25, Ultimate 60; trần 100 |
| Hồi chiêu Kỹ năng 1 | 2 hiệp; Vong Niệm cộng thêm 1; Ultimate dùng nộ, không thêm hồi chiêu |
| Sát thương chưa cho hệ số | basic 100% Công, skill 140%, Ultimate đơn 240%, toàn đội 120%; multi-hit chia tổng hệ số theo số hit; dữ liệu tập trung để chỉnh |
| Thời hạn không ghi | buff/debuff 2 hiệp; dấu vết tồn tại 3 hiệp; aura tồn tại khi nguồn sống và nội tại hoạt động |
| Hiệp | Tick DoT/HoT một lần cuối hiệp; 1 hiệp hiệu lực bao gồm lượt hành động kế tiếp của mục tiêu, không hết trước khi dùng |
| Root / airborne | Root ngăn dịch chuyển chiến thuật và animation tiến tới; không cấm đánh/niệm. Hất tung 1 giây là gián đoạn trình diễn, không tự đổi thành choáng 1 hiệp |
| Bánh răng Cơ Trọng | +5% giáp mỗi hành động đồng minh khác, tối đa 20 tầng; reset khi bắt đầu trận |
| Tuệ Y cứu cấp | 1 lần/đồng minh/trận; hồi sinh Ultimate riêng 1 lần/trận |
| Tằm Nương/Vân Pháp/Mục Chiêu | Kén 2 hit đầu ở đầu trận; Mộng Khiên 1 phản CC mỗi đồng minh đầu trận; Mục Chiêu cứu 1 đồng minh mỗi trận tổng cộng |
| Cửu Triều | +1 tầng/hành động tự thân, +5% công/+3 điểm % crit mỗi tầng, tối đa 12; từ 8 tầng đốt 6% HP sau hành động, tối đa 1 extra turn/hiệp |
| Trầm Châu | Anti-crit trên bản thân + 2 hậu quân gần nhất; chặn crit +5% giáp (10 tầng); sát thương đổi nộ theo 50% tỷ lệ HP đã mất ×100 |
| Khaos/Thạch Mộng | Phân thân hấp thụ 50%, pool bằng 50% HP nguồn; không chiếm slot. Nghê gánh 30%, pool kích đẩy khi gánh bằng 30% HP |
| Chống hồi máu | Dùng mức cao nhất, không cộng >100%; Hắc Đao nội tại 80%, Ultimate 100%. Đổi máu thành damage tính từ phần heal còn lại sau anti-heal |
| Thời gian đóng băng | Cấm hành động/dịch chuyển, không tạm ngừng thời hạn hiệu ứng khác; không biến time-freeze thành dừng clock toàn trận |
| Tàng hình | Không nhận target đơn trừ khi mọi địch sống đều ẩn; AoE vẫn chạm |
| Lân cận | Hai hàng × ba cột, kề cạnh Manhattan; cột gồm slot n và n+3; hoán đổi luôn giữ slot duy nhất |
| Hồi máu % | Theo max HP của người nhận; Thạch Kinh dùng 15% HP đã mất |

Tất cả thông số thiếu khác sẽ được ghi cạnh field `reviewDefaults` trong catalog hoặc evidence. Không giảm các số đã ghi rõ trong hồ sơ để test xanh.

## Gate và bàn giao

Ticket Board/claim/lease/lock: `TICKET_BOARD_NOT_AVAILABLE` (không có tool hoặc `scripts/ticketctl.mjs`). Chủ dự án đã chỉ thị tiếp tục source/test khi thiếu board; tài liệu này không giả mạo claim/lock. Workflow trace dùng skill vibe-lab đã chạy thật. Device capabilities cần probe lại; chỉ báo evidence đã chạy. Trạng thái đích `REVIEW / IN_PROGRESS`, không DONE/MERGED.

Rollback: revert các commit của L10-SPLUS42, không reset hoặc ghi đè main. Save không migration nên không cần thu hồi đầu tư.

## Chỗ thiếu số trong hồ sơ — triển khai thử, chưa duyệt balance

- QA fixture: HP 24000, Công 1700, Giáp 400, tốc 100 giảm dần theo thứ tự chọn, 35 Nộ đầu trận, crit 10%, accuracy 100%. Không áp vào roster/save cũ. Seed riêng của fixture `splus42-review-v1`, không đổi thuật toán RNG/session hiện có.
- Damage S+ giữ đường cong giáp `100/(100+0.82*def)`, variance 0.94–1.06 và hệ số 1.22 của nền combat; trần tối thiểu 12 cho đòn tính theo Công. Sát thương Chuẩn bỏ giáp, vẫn chịu giảm thương/gánh hộ trừ Dạ Xoa Ultimate.
- Thiềm Ngân heal thường kèm 10% giáp; Skill 1 là 20% đúng hồ sơ. Khaos pool 50% HP, Kính Nương phản 100% đòn thường khi roll 25% thành công; mù của Kính Nương là 30%.
- Hà Lãng lan 30%; khiên Thủy Ngọc 20% max HP và nổ 50% Công. Hỏa Bài Skill 1 phá 20% giáp. Hắc Đao bleed 3% max HP/hiệp; Sơn Cương bleed thường 2%, nặng 4%. Mãng Xà Skill 1 xuyên 30% giáp.
- Hạc Phá Ultimate 200% Công; Cổ Nương Ultimate 12% max HP; Hàn Nương Ultimate 3 hit chia 120%; Hỏa Tiêu 3 hit chia 180%; Hỏa Bài 3 hit chia 150%; Cửu Tính nổ thêm 20% Công/tầng; Sơn Cương Ultimate 210% Công; Cửu Triều 9 hit chia 180%.
- Kén tằm hết 2 charge thì mất chặn đòn, giáp 30% giữ đến hết trận hoặc dispel. Giảm thanh hành động của Trầm Tuệ dời mục tiêu xuống 40% số vị trí còn lại trong queue hiện tại; không tự đổi thành debuff tốc độ.
- Mục Chiêu cân bằng về tỷ lệ HP trung bình sau hồi 35%; phần tăng HP phải qua anti-heal/conversion, phần cho đi không gây tử vong. Mọi case miễn tử vẫn tôn trọng cấm hồi máu; không resurrect bằng heal.
- Hất tung dùng render clock hiện có trong 1 giây; dịch nửa ô là trình diễn, không làm mất invariant slot. Tốc đánh sắp thứ tự từ hiệp sau; không tạo action clock khác. Taunt ưu tiên mục tiêu đơn; AoE vẫn tác động hàng/vùng đã mô tả.
- Tạm hiển thị số tướng và text ấn ký có stack/charge/hiệp/nguồn; manifest không trỏ nhầm icon cũ thành art mới. Cần nhập 42 asset alpha thật để đóng acceptance art.
