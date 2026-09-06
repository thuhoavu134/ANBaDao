# Samkok v2 — đội hình và trang bị: giao dịch lưu an toàn

Baseline: `59d2fbc55a5a01a2a45f1435b2fa50aee005d64e`.
Phạm vi: E10-01/02 và E11-03; nối với transaction R07 và opening loop R10.

## Vấn đề

Handler lưu đội và mặc đồ sửa player trước khi gọi persist nhưng bỏ qua kết quả ghi. Khi storage thất bại, UI vẫn báo thành công và rời màn đội hình. Progress R10 ghi riêng sau giao dịch cũng có thể lệch với đội/đồ vừa lưu.
Rèn Mộng yêu cầu tháo đồ trước phân giải nhưng chưa có nút tháo.

## Thay đổi

- `src/domain/hero/loadout.mjs`: chuẩn bị/validate đội 6 tướng sở hữu không trùng và liên kết trang bị; không sửa player đầu vào.
- `src/ui/party-command-runtime.js`: lệnh lưu đội, mặc/chuyển/tháo dùng transaction R07. Một UID chỉ liên kết với một tướng; item cũ vẫn ở inventory, không tạo bản sao.
- `scripts/transaction-contract-v1.mjs`: thay đúng handler đang có, chặn bấm lưu đôi; lỗi giữ draft và màn hiện tại, cho thử lại. Bổ sung nút Tháo trong Rèn Mộng.
- `scripts/opening-loop-v1.mjs`: tiến độ formation/equip được áp dụng trong cùng giao dịch với loadout; rollback chung khi persist thất bại. Bỏ câu mô tả kỹ thuật khỏi màn hành trình.
- `tests/settlement-navigation.test.mjs`: khôi phục dấu đóng test bị thiếu ở baseline, giữ nguyên các assertion.

Không thay seed, banner, giá/phần thưởng, rarity, asset hoặc luật combat. Quy mô dự kiến theo anh: 32 SSR + 16 SR + 16 A + 8 B; 12 tướng có dữ liệu hiện tại được giữ nguyên.

## Kiểm chứng

`npm test`: **123/123 đạt**, gồm build sạch, pixel/hash asset hiện hữu và embedded battle bằng byte với standalone.

9 test loadout mới kiểm: đội sai/khóa/trùng; chuyển đồ giữ UID; thay món; tháo; retry/duplicate; lỗi storage; rollback receipt và progress; reload; handler lưu đội không rời màn khi thất bại. Test integration chạy chính save function và transaction helper lấy từ output build, với lỗi được gây tại storage.

Chrome cloud không truy cập localhost của workspace. UI preview/production cần được ghi riêng sau deploy; không coi unit/integration là kết quả Safari/iPhone.

## Cách thử trên UI

1. Trợ trận → đổi một tướng → Lưu đội hình → quay lại, rồi reload: đội mới giữ nguyên.
2. Rèn Mộng → Trang bị → chọn tướng → chuyển cùng món sang tướng khác: chỉ một chủ sở hữu.
3. Tháo → món trở về kho, không tăng số lượng; reload vẫn trong kho.
4. Với storage fixture bị chặn ghi: thao tác báo lỗi, không báo đã lưu; đội/đồ đã lưu trước đó còn nguyên và có thể thử lại.

Rollback bằng revert cả gói code này; không hạ schema hoặc sửa/xóa save người chơi.
