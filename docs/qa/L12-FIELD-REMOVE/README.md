# L12 — chạm tướng trên sân để gỡ khỏi đội hình

Trên Bày trận, một lần chạm vào tướng đang ra trận gỡ tướng đó ngay. Không cần chạm ảnh tích xanh bên dưới. Ô trống vẫn chọn để thêm dự bị. Kéo vẫn đổi chỗ. Lỗ giữ nguyên, tướng còn lại giữ ô.

Chrome QA sandbox `?qa=unlock-all`, viewport 390×844:

- Đội 6/6, dòng hướng dẫn: "Bấm tướng trên sân để gỡ…"
- Chạm Ông Phở (ô 0) → 5/6, lỗ ở ô 0, Đình Lôi/Cô Đào/Thầy Mo/Lạc Yên/Nữ Cung Thủ Tre giữ 1–5.
- Chạm tiếp ô trống 0 → ô được chọn (viền vàng), chưa thêm tướng.
- Tích xanh dưới chân dung vẫn gỡ được (đường phụ).

Safari/device NOT_RUN. Không lên main/production.
