# L12 — kéo thả Bày trận không nuốt lần chạm ô trống

Lỗi: sau khi kéo tướng sang ô khác, lần chạm đầu tiên vào ô trống bị nuốt vì `suppressSlotClick` còn bật sau khi DOM slot bị dựng lại.

Sửa: mọi `pointerdown` trên ô (kể cả trống) gỡ cờ đó; drop thành công xóa ô đang chọn.

Chrome QA sandbox `?qa=unlock-all`, viewport 390×844:

- Gỡ 3 tướng → lỗ 0/3/4.
- Kéo Nữ Cung Thủ Tre 5→3, không dồn hàng.
- Lần chạm đầu vào ô 5 chọn được ô trống.
- Chọn ô 5 rồi thêm Ông Phở vào đúng lỗ đó, 4/6.

Safari/device NOT_RUN. Không lên main/production.
