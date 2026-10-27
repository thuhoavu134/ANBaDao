# Hồ sơ tướng — mẫu Bạch Diện cho cả 21 tướng (27/10/2026)

Yêu cầu owner: mọi tướng dùng **đúng mẫu Bạch Diện**, chỉ thay tên, hệ, nghề, chỉ số thật và 3 icon kỹ năng.

## Đã làm
- **Bỏ khoá cứng** `id==='bach_dien'||id==='lang_chan'` → manifest `VC_HERO_PROFILES` trong `src/ui/hero-detail-tabs.js`
  (mỗi tướng: `job` nhãn nghề ngắn, `skillIcons`, `idleShiftU` căn chân, `idleScale` cho tướng cao).
- **CSS dùng chung** `#hvHeroDetailRoot[data-vc-layout]` (203 rule gộp từ `:is([bach_dien],[lang_chan])`).
  Bạch Diện + Lăng Chân sau refactor: **0 pixel khác** ngoài vùng nhân vật đang chuyển động.
- **Lăng Chân**: 3 icon owner gửi, cắt tròn nền trong suốt, WebP 256px (~28 KB/icon), thay 3 SVG cũ.
- **4 tướng cũ** (Đình Lôi, Lục Ảnh, Ông Phở, Thầy Mo): icon JPG 1408px (~12 MB tổng) → WebP 256px (~300 KB tổng).
  Runtime `skill-seals-*` cũ không còn xoá icon của tướng đã dùng mẫu mới.
- **Khung Hệ / Nghề sạch chữ in sẵn**: `element-frame.png`, `role-frame.png` (xoá chữ "Hệ Hỏa", "Sát thủ phép");
  chữ hệ và nghề là chữ sống. Huy hiệu hệ: Hỏa (gốc), Thủy, Thổ (AI, cùng hình bóng khung gốc).
- **Tên**: chỉ tên chính (bỏ danh hiệu sau " — "), tự co chữ một dòng. Nghề dùng nhãn ngắn, tên đầy đủ ở tooltip.
- **Căn chân**: đo pixel alpha thật của canvas; 21/21 tướng chân ở 455–462px (390×844), mốc Bạch Diện 456.
- **Ông Phở** (không có canvas idle): hiện ảnh toàn thân tĩnh đúng khung sân khấu, không còn trống.
- **Sửa lỗi test có sẵn của PR**: `persist()` gọi `normalizeRarityStars` có kiểm tồn tại; audit chiến dịch nạp
  helper sao SSR và dùng sao gốc theo độ hiếm (SSR = 5); test layout cập nhật sang scope chung.

## Còn thiếu (chờ)
- **Icon kỹ năng 15 tướng** đang là ấn chữ tạm theo màu hệ — owner đã duyệt sinh bằng AI; Gemini hết quota
  (~5 giờ), OpenAI hết credit. Sinh xong gửi owner duyệt từng tướng rồi mới gắn.
- **Huy hiệu Kim, Mộc** (7 tướng Kim/Mộc đang chỉ có khung + chữ, chưa có biểu tượng) — cùng lý do.

## Kiểm chứng
- `npm test`: **2259 đạt / 88 lỗi cũ / 0 lỗi mới** (TEST GATE PASS so với baseline).
- WebKit 5 viewport (320×700, 390×664, 390×844, 414×715, 1280×800) × 6 tướng: không tràn ngang,
  footer trong màn hình, không page exception, icon decode đủ.
- 21 tướng ở 390×844: đúng tên, hệ, nghề, lực chiến, chỉ số sống.
- Safari/iPhone thật: **NOT_RUN**.

| Ảnh | Nội dung |
|---|---|
| `all-21-390x844.jpg` | 21 tướng |
| `viewports-5.jpg` | Lăng Chân, Đình Lôi, Kỷ Vân × 5 viewport |
| `lang-chan-before.jpg` / `lang-chan-after.jpg` | trước / sau icon mới |
| `ong-pho-static-art.jpg` | Ông Phở dùng ảnh tĩnh |
| `element-badges.jpg` | khung Hệ sạch + 3 huy hiệu |


## Sửa vị trí chân (owner báo nhiều tướng đặt chân không giống Bạch Diện)

**Nguyên nhân**
1. 9 tướng dùng canvas riêng (Bé An, Đình Lôi, Hồng Thương, Kỷ Vân, Linh Đồng, Lục Ảnh, Thầy Mo, Tịch Dao, Tiêu Phong)
   có kích thước riêng không theo khung sân khấu → căn ở 390×844 đúng nhưng cỡ khác lệch 30–80px.
2. Đo "pixel thấp nhất" bị lừa bởi bóng đổ / vòng phép vẽ đặc dưới chân (Lăng Chân, Tiểu Linh, Lăng Tiêu, Tịnh Mặc).
3. Ông Phở (ảnh tĩnh) có lề trong suốt dưới chân → lơ lửng.

**Sửa**
- 9 canvas riêng ép vào cùng khung sân khấu (`position/top/height` theo % khung, `--vc-idle-h` = manifest `idleH`),
  giữ nguyên độ to ở 390×844 → sau sửa lệch ±0,2px ở 390×844 / 320×700 / 414×715 / 1280×800.
- Đọc đế giày bằng mắt (thước 2px), Bạch Diện chạm y≈452 @390×844; hạ Lăng Chân +15, Tiểu Linh +12, Lăng Tiêu +7,
  Tịnh Mặc +5, Bé An +5, Ông Phở +3 (px @390×844, lưu theo đơn vị artboard nên đúng mọi cỡ màn).
- Khaos giữ nguyên: thiết kế nằm bay trên mây mực, không có bàn chân chạm sàn.
- `feet-390x844.jpg`, `feet-414x715.jpg`, `feet-1280x800.jpg`: vạch đỏ = đế giày Bạch Diện.
