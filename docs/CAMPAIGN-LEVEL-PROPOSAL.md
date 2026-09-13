# Đề xuất 108 ải — cấp người chơi 1–60

Trạng thái: PROPOSED, chờ owner chốt. Không có khóa level mới đang hoạt động.

Mục tiêu owner: 6 chương × 18 ải = 108 ải. Đề xuất dùng **cấp người chơi riêng**, không lấy cấp một tướng làm khóa. Hiện runtime có cấp tướng tối đa 30 (`scripts/transaction-contract-v1.mjs`); không nâng trần tướng hoặc đổi chỉ số tướng trong đề xuất này.

| Chương | Ải toàn tuyến | Khoảng cấp yêu cầu |
|---|---|---|
| 1 · Ấn Phố | 1–18 | 1–10 |
| 2 · Ấn Rừng | 19–36 | 11–20 |
| 3 · Ấn Biển | 37–54 | 21–30 |
| 4 · Ấn Lò | 55–72 | 31–40 |
| 5 · Ấn Quên | 73–90 | 41–50 |
| 6 · Lục Thần | 91–108 | 51–60 |

Với c là chương 1..6, s là ải trong chương 1..18:
`requiredLevel = 1 + 10 * (c - 1) + floor(9 * (s - 1) / 17)`.
Mốc trong mỗi chương: 1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,10; cộng 10 cho chương tiếp theo. Cấp 60 mở điều kiện ải 108; vẫn cần thắng ải trước, không tự bỏ ải.

Luật dự kiến:
- Cấp người chơi tăng bằng EXP tích lũy, không phải Tinh thông có thể tiêu để nâng tướng.
- Nguồn EXP: thưởng thắng ải lần đầu, nhiệm vụ và AFK đã nhận; phải còn nguồn EXP khi ải tiếp theo bị khóa để tránh kẹt vòng lặp. EXP/level và thời gian đạt cấp cần cân riêng, chưa chốt số.
- Đã vượt ải thì giữ quyền chơi lại; đổi đội không làm khóa lại.
- Save cũ cần migration bảo toàn tiến độ, không khóa lại chương đã vượt. Điều kiện phải kiểm tra ở lệnh bắt đầu trận, không chỉ làm mờ nút.
- Thiếu level: hiện “Cần cấp X” và lối tới nguồn EXP, không tiêu hoạt lực.
- Kiểm tra danh sách encounter thực tế trước khi chuẩn hóa thành 18/chương; không đếm hội thoại là ải, không đổi reward/seed chỉ để đủ số.

Quyết định owner cần chốt: dùng cấp người chơi riêng 1–60, hay dùng cấp tướng hiện có (trần 30). PR nút hai kiếm không kích hoạt hệ cấp mới.
