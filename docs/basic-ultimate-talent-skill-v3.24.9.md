# Combat Basic + Ultimate + Talent Skill v3.24.9

## Hợp đồng mới

- Trong trận, mỗi tướng chỉ có `Basic` và `Ultimate` như game mẫu.
- `Skill 1` không bị xóa: trở thành kỹ năng nâng cấp tự kích hoạt, dùng nguyên animation/VFX/SFX đã sản xuất.
- Talent mở mặc định từ 2 sao, không tốn Nộ và có cooldown tối thiểu 3 action toàn trận để tránh kích hoạt liên tục.
- Người chơi không thể bấm Skill 1 trực tiếp. AI cũng không được chọn Skill 1 nếu trigger chưa hợp lệ.

## Chuyển đổi 12 tướng

| Tướng | Loại Talent | Trigger |
|---|---|---|
| Ông Phở | Enhanced Basic | Mục tiêu đã có Nêm Vị |
| Thầy Mo | Proc Skill | Địch có ít nhất 2 Ấn Trấn |
| Lạc Yên | Enhanced Basic | Mục tiêu chưa bị Phá Giáp |
| Nữ Cung Thủ Tre | Enhanced Basic | Tuyến địch còn ít nhất hai mục tiêu |
| Cô Đào Gánh Hội | Proc Skill | Có đồng minh thiếu Nộ |
| Phong Tử | Enhanced Basic | Mục tiêu có buff tốc độ |
| Thủy Nương Rối Nước | Proc Skill | Địch có Nộ cao |
| Hồng Liên Đao Nương | Enhanced Basic | Mục tiêu đang Thiêu Đốt |
| Thạch Quyền | Enhanced Basic | Có nhiều địch để chấn động lan |
| Đình Lôi | Protect | Đồng minh dưới 55% HP |
| Lục Ảnh | Proc Skill | Địch có Nộ cao |
| Tố Điệp | Proc Skill | Đồng minh có buff hoặc dưới 60% HP |

Ultimate luôn được xét trước Talent khi đủ Nộ và thỏa chính sách sử dụng. Nếu Talent không mở, đang cooldown hoặc thiếu điều kiện, tướng dùng Basic.
