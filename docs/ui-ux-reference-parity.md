# Hồn Việt: Mộng Giới — Reference Parity Contract

## Mục tiêu

Mọi UI và logic tương tác phải đạt độ hoàn thiện, nhịp sử dụng và khả năng đọc tương đương game mẫu; không sao chép asset, tên gọi, cốt truyện hoặc nhận diện của game mẫu. Bản sắc nhìn thấy phải là phố Việt, tín ngưỡng dân gian, nghề Việt và thế giới Mộng Giới.

## Ba câu hỏi bắt buộc cho từng chi tiết

1. **Đẹp độc lập:** hình dáng, màu, chất liệu, ánh sáng và typography đã đủ hấp dẫn khi đứng riêng chưa?
2. **Đúng toàn cảnh:** tỷ lệ, vị trí, hierarchy, mật độ và khoảng thở có khớp ngữ pháp màn hình của game mẫu chưa?
3. **Đúng Mộng Giới:** chi tiết có lý do tồn tại trong thế giới Hồn Việt hay chỉ là fantasy/AI art chung chung?

Chỉ cần một câu trả lời là “chưa” thì chi tiết chưa được duyệt.

## Bảy trục đối chiếu bắt buộc

| Trục | Tiêu chuẩn |
|---|---|
| Bố cục | Cùng loại hierarchy với game mẫu: hồ sơ và tài nguyên ở trên, chức năng thế giới ở hai mép, không gian sống ở giữa, điều hướng lõi ở dưới. |
| Tỷ lệ | Đo bằng phần trăm viewport và vùng chạm, không chỉnh theo cảm giác. Icon chính 70–78 px trên khung 620×930; icon dock 60–68 px; touch target tối thiểu 44 px. |
| Hình ảnh | Icon bên là vật thể có silhouette riêng, alpha sạch, không nhốt trong huy hiệu tròn, không dùng asset thay thế sai nghĩa, không trùng chức năng; dock dưới là ngoại lệ có năm vòng tròn nổi đúng nhịp reference. Hub tách hậu cảnh, khối chính và tiền cảnh RGBA để giữ cảm giác 2.5D. |
| Màu và sáng | Tươi, rõ, có điểm tập trung; nền hỗ trợ icon thay vì nuốt icon. Màu vàng–ngọc–đỏ Việt là nhấn, không phủ nâu tối toàn màn. |
| Phản hồi | `pointerdown` sáng ngay và co nhẹ; `pointerup` hồi có easing; khóa, badge, nhận thưởng và chuyển màn đều có trạng thái quan sát được. |
| Luồng logic | Số bước, vị trí CTA, back behavior, modal, mở khóa, badge và kết quả hành động phải nhất quán như một game thương mại hoàn chỉnh. |
| Bản sắc | Kiến trúc, đạo cụ, hoa văn, tên gọi, nhân vật và lore phải thuộc Hồn Việt: Mộng Giới; cấm bê nguyên trade dress hoặc asset của game mẫu. |

## Gate duyệt từng màn

Mỗi màn phải đi qua đúng chuỗi:

1. Chụp **before** ở viewport 620×930.
2. Ghi hierarchy và primary action của game mẫu.
3. Kiểm kê asset thật cần có; thiếu asset thì tạo đúng asset, không fallback sai nghĩa.
4. Dựng lại layout theo tỷ lệ viewport.
5. Chụp **after** và tự chấm 7 trục, mỗi trục 0–2 điểm.
6. Màn dưới 12/14 hoặc bất kỳ trục nào 0 điểm phải sửa lại.
7. Nhấn primary action và ít nhất một secondary action; kiểm tra màn đích, back flow, badge và trạng thái khóa.
8. Kiểm tra console, ảnh hỏng, tràn màn, safe area và reduced motion.
9. Chỉ báo anh duyệt sau khi có ảnh/video runtime thật. Không tự gọi PASS về cảm giác thẩm mỹ.

## Thứ tự sản xuất

### Vòng chơi chiến dịch đã khóa

`Bản đồ ải → Khiêu chiến → một trận 6v6 tự động (×3) → kết quả → quay lại bản đồ`.
Mỗi lần chạm CTA chỉ tiêu hao một lượt và mở đúng một encounter; không sinh wave/quân tiếp viện trong cùng trận. Campaign dùng tối đa 15 hiệp, sau đó phân xử theo tổng HP còn lại → tỉ lệ HP → số tướng sống → hòa tuyệt đối phe người chơi thắng.

1. **Global shell:** safe area, hồ sơ, tài nguyên, typography, motion token, loading và transition.
2. **Hub:** một công trình Việt Nam nổi ở trục giữa, nhãn chức năng hai bên, tài nguyên dạng capsule có dấu cộng, dock năm nút tròn, parallax nhiều lớp và phản hồi chạm; Chợ Mộng/Đấu Trường/Gọi Mộng là địa danh neo trên công trình, Bang Hội là icon chức năng bên phải; lớp cổng–bậc thang tiền cảnh phải tạo occlusion/bóng tiếp xúc rõ nhưng không biến thành khung bao quanh màn hình.
3. **Tướng:** roster, filter, card, rarity, chi tiết, nâng cấp và trạng thái sở hữu.
4. **Trận Hình:** 2 hàng 3+3, kéo/chọn, preview vai trò, sức mạnh và lưu đội.
5. **Chiến Dịch:** bản đồ chương, node, khóa, sao, thưởng và chuyển chương.
6. **Gọi Mộng:** banner, pool, pity, animation reveal, lịch sử và xác nhận tài nguyên.
7. **Tài nguyên:** Rèn, Túi, Shop, Thư, Nhiệm vụ, Giao việc.
8. **Mode:** Mộng Lộ, Boss, Đấu Trường, Tháp, Lễ hội.
9. **Xã hội:** Bang Hội, Bạn bè, Trò chuyện.
10. **Combat và kết quả:** HUD, lượt/hiệp, targeting, status, damage summary, thắng/thua và phần thưởng.

Không đóng ZIP trước khi toàn bộ các nhóm trên có evidence runtime và anh duyệt.
