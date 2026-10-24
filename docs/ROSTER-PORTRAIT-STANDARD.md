# Quy chuẩn chân dung màn Tướng

## Yêu cầu chung

- Cùng khung thẻ và vùng hiển thị. Giữ tỷ lệ ảnh, không kéo méo chiều ngang/dọc.
- Căn theo khuôn mặt, không theo toàn bộ canvas hoặc vũ khí. Mốc tâm mắt ở 50% chiều ngang, 34% chiều cao khung; bề rộng mặt mục tiêu 38% chiều ngang khung. Đây là một chuẩn chung, không đặt mức zoom cảm tính riêng cho từng tướng.
- Landmark trong `src/domain/hero/roster-portrait.mjs` là phần trăm tọa độ trên đúng ảnh nguồn. Khi đổi ảnh hoặc trim canvas phải đo lại, không tái sử dụng số cũ.
- Ảnh đại diện phải mở mắt, rõ mặt, không giữa chớp mắt/hurt/fall, không bị hiệu ứng che. Mặt nạ, rèm mũ và thiết kế che mắt authored giữ nguyên bản sắc; không vẽ thêm mắt.
- Phải chọn frame cụ thể và xem ảnh thật. Không dùng frame có alpha lớn nhất để suy ra tư thế đẹp hoặc mở mắt.
- Tướng mới hoặc ảnh mới phải có landmark và bằng chứng mở mắt trước khi duyệt. `data-portrait-reviewed=false` là mục còn thiếu QA, không phải trạng thái đã đạt.
- Rà cả Tướng và Đồ Giám, lọc/sắp xếp/mở chi tiết/quay lại, desktop/mobile. Kiểm tóc/mũ, mặt, huy hiệu, tên và sao không chồng lên mặt. Ảnh contact sheet không thay cho screenshot trong game.

## Owner

`hero-roster-runtime.js` chọn nguồn/căn ảnh qua module chung; `hero-roster-phase-a-v4.mjs` nhúng module cùng CSS vào màn thật. Không thêm observer hoặc renderer thứ hai.

Tịch Dao dùng `roster-open-eyes.webp`, sinh bởi `buildTichDaoCampaignAssets` từ ô 0 của `idle-authored-0.webp` (480×440, giữ nguyên canvas). Frame 0 đã xem trực tiếp và mở mắt. Converter cũng khóa avatar frame 0 để không chọn lại frame 53 nhắm mắt. Không sửa nhịp idle/combat.

## Trạng thái 18/10/2026 — REVIEW, chưa hoàn tất

- Đã xem 15 nguồn ảnh, gồm 9 ảnh tướng và 6 ảnh role dùng chung; landmark dùng được cho mọi thẻ cùng nguồn.
- `evidence/roster-portraits/landmark-review.png`: render ảnh nguồn bằng phép biến đổi tương đương CSS, khung 150×240. Tịch Dao mở mắt; tâm mặt các nguồn đã được dịch về giữa. Mặt nạ Bạch Diện và rèm mũ Linh Đồng giữ nguyên. Đây là ảnh kiểm asset, không phải screenshot màn Tướng.
- Thầy Mo: GitHub connector trả nội dung rỗng cho PNG 2.3 MB; chưa đo/duyệt landmark. Runtime giữ ảnh hiển thị, gắn `data-portrait-reviewed=false`; không khai báo đã đạt chuẩn.
- 3 test portrait PASS: phép căn theo kích thước, nguồn frame có chủ đích, installer thật sinh script parse được và gọi owner chung.
- Chạy thêm suite Tịch Dao: tổng 13/15 PASS; 2 case bị chặn bởi thiếu `assets/audio/sfx/tich-dao/blink.wav` và `dist/battle.html`. Không coi suite đầy đủ đã xanh.
- Full build BLOCKED: thiếu `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01` trong workspace phục hồi. Browser desktop/mobile, physical Safari và deployment chưa kiểm. Chưa chứng nhận độ nét khi phóng nguồn role độ phân giải thấp hoặc va chạm huy hiệu ở mọi viewport.
- Trước merge: lấy ảnh Thầy Mo, đo/kiểm landmark; chạy full build/test và QA màn thật, chụp/đọc ảnh sau đổi layout. Cần owner duyệt merge theo AGENTS.

## Cập nhật 24/10/2026 — tướng từ Bé An trở đi

- Đo lại trên lưới 1% của chính file đang dùng: Bé An `avatar.webp` [54,45,9] (số cũ 23 sai bề rộng mặt, thẻ hiện cả người nhỏ);
  9 tướng pipeline (Vân Phong, Khaos, Nguyệt Diệp, Tịnh Mặc, Lăng Vân, Lăng Tiêu, Lăng Nguyệt, Tiểu Linh, Lăng Chân) khoá theo
  `portrait-*.webp`. Vân Phong, Khaos, Tịnh Mặc bịt mắt authored: dùng tâm dải băng.
- `rosterPortraitLandmark()` tra đường dẫn chính xác trước, sau đó mới tra theo mẫu `portrait-*.webp`; cả style lẫn cờ
  `data-portrait-reviewed` đi qua hàm này.
- Đã chụp thẻ thật trên màn Tướng: cả 10 thẻ `reviewed=true`, mặt cùng vị trí và cùng cỡ với các tướng cũ.
- Pipeline có cổng 9b landmark để tướng sau không lặp lại. Còn thiếu landmark từ trước: Thầy Mo (`master-reference-v1.png`),
  Đinh Lôi (`owner-portrait.webp`).

