# Quy định chung: số sát thương và bóng chân

Owner approved: 18/10/2026. References: IMG_7503.png, IMG_7504.png supplied in the task.

## Hợp đồng bắt buộc

1. Mỗi sự kiện gây mất HP phải có feedback trên đúng người nhận, kể cả giá trị 1 và hit kết liễu. Hiện tại nguồn chân lý là damage event hoặc legacy settlement; không suy ra damage từ âm thanh hay số sprite VFX.
2. Hit nhiều nhịp hiển thị tại từng marker va chạm của timeline hiện hành. Không dồn damage đến recovery/cuối combo. Không tạo hit/HP giả để khớp số trang trí. SFX, VFX và settlement dùng clock tác giả hiện hành ở x1/x2/x3.
3. Damage thường màu vàng. Chí mạng màu đỏ đô (#bd3a56 → #9e2345 → #74152f), có ngôi sao va chạm vector trước số; ký hiệu không phụ thuộc font/emoji. Số giữ đúng giá trị settlement. Chữ đậm nghiêng, viền tương phản, bounce ngắn rồi nổi đều.
4. Các số của một mục tiêu xếp một cột theo thời gian, cách 28 world px; không lệch ngẫu nhiên hoặc tái sử dụng lane mỗi 6 hit. Neo theo body/head và theo mục tiêu khi di chuyển. Chữ dài phải vừa chiều ngang viewport.
5. Miss/miễn/chặn/khiên/nộ/heal là feedback riêng; không bịa HP damage bằng 1 nếu engine báo 0. Chỉ số mất nộ không được vẽ thành damage vàng.
6. Bóng chân dùng oval trung tính alpha 0.18, bán kính tỷ lệ thân, tỷ lệ dẹt 0.22. Vẽ đúng một lần trước dispatch tướng, không phụ thuộc phe/độ hiếm. Dùng chân đã đăng ký, theo pose di chuyển của Hồng Thương/Tịch Dao, không còn bóng khi Tịch Dao ẩn hoặc fall đã kết thúc. Không chỉnh alpha gốc của asset để làm bóng.

## Owner trong source

- `src/runtime/splus-battle-bridge.js`: damage event → số, ngay lúc impact; chỉ healing được gom. Flush tách batch trước khi phát.
- `src/runtime/{tieu-phong,tich-dao,hong-thuong}.js`: giữ nguyên marker/resolver; bỏ vòng requeue-then-clear đã làm mất damage.
- `src/runtime/battle-hit-feedback.js`: neo body, hàng số, follow target, bóng chân chung.
- `src/runtime/damage-floater-renderer.js`: font, màu, dấu chí mạng vector và clamp chiều ngang.
- `scripts/battle-hit-feedback-v1.mjs`: nối owner cuối vào build, sau owner-refresh và mọi renderer tướng. Không chỉ sửa `dist`.

## Gate cho tướng mới / thay đổi combat

- Test damage 1, crit/non-crit, miss, shield, lethal, nhiều hit cùng mục tiêu, AoE và hủy/đổi trận.
- Đối chiếu events với popup theo target/amount/critical; test marker của các cast deferred, không chỉ kiểm chuỗi tên trong source.
- Kiểm hình/nhịp trong full game ở desktop/mobile, hai phe, x1/x2/x3; kiểm số không bị VFX che, bị crop hoặc đè nhau.
- Kiểm bóng khi idle/run/attack/fall, airborne và phase ẩn; không vẽ hai bóng.
- Ghi riêng source/unit, full build, browser, physical iPhone/Safari và deploy. Không gọi source pass là đã live.
