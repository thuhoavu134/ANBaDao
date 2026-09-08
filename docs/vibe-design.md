# Thiết kế Hồn Việt: Mộng Giới

## 2026-09-08 — Bàn giao L11 cho Luna: REVIEW / IN_PROGRESS

Chủ dự án yêu cầu chốt tiến độ trong lúc triển khai hồ sơ V2 và 126 nút chiêu. Source đang làm được lưu ở [handoff/l11-splus-profiles-v2-20260908](https://github.com/bktimmy247/luc-than/tree/handoff/l11-splus-profiles-v2-20260908), commit [`b6a2ae2`](https://github.com/bktimmy247/luc-than/commit/b6a2ae20a9b1b3071a8f5263740312e9d1465b04). Main nhận tài liệu/evidence; combat V2 chưa phát hành production.

[Bàn giao L11 đầy đủ](LUNA-HANDOFF-SPLUS-PROFILES-2026-09-08.md) là điểm bắt đầu mới nhất. Đã nhập 42 hồ sơ/126 chiêu, tạo 6 atlas ×21 vùng nút và viết UI giới thiệu/popup/bridge; resolver mới đồng bộ một phần. **23 test mới: 17 đạt, 6 fail; bộ S+ cũ trên WIP: 117/133 đạt, 16 fail; syntax: 17/17 đạt.** `npm test` dừng ở build do checkout local thiếu part01 atlas Lục Ảnh; GitHub đã xác nhận file gốc còn đủ. Browser/device V2 chưa chạy, REFACTOR chưa xong.

Tiếp tục sáu handler Cơ Trọng, Tiêu Hồn, Trầm Châu, Tuệ Y, Khaos, Hồi Ảnh; sau đó audit đủ84 S1/Ult và các passive theo hồ sơ mới. Không hiểu 6 fail là toàn bộ việc còn thiếu. [Machine checkpoint](qa/L11-SPLUS-PROFILES/handoff-checkpoint.json) và [log test](qa/L11-SPLUS-PROFILES/handoff-targeted.tap) ghi trạng thái thực. Ticket Board/claim-lock, doctor/smoke/boot và device backend vẫn thiếu; không giả claim, PASS, DONE hoặc MERGED.

Thiết kế nút S+: P tròn bạc/đồng không viền Nộ, S1 bát giác/khiên vàng có cooldown, Ult thoi/hoa sen rồng vàng có rãnh Nộ và glow100. Đã tạo6 atlas thật, chưa nghiệm thu crop/alpha. Dialog và thanh icon source có sẵn; kiểm tra mobile, focus, Escape, restart cùng hero và cleanup trước khi phát hành. Quy tắc mới này áp dụng cho nút kỹ năng S+, không tự thay hub/art tướng.

## Luật thiết kế hiện hành — Reference Parity

- Source of truth: `docs/ui-ux-reference-parity.md`.
- Mọi màn hình và logic tương tác phải được đối chiếu game mẫu về hierarchy, tỷ lệ, mật độ, flow và phản hồi.
- Không chấp nhận tiêu chí “đã tốt hơn bản cũ”; tiêu chí là đẹp độc lập, đúng toàn cảnh và đúng bản sắc Mộng Giới.
- Không sao chép asset/trade dress của game mẫu. Học cấu trúc và chất lượng thực thi; nội dung hình ảnh phải là Hồn Việt.
- Quy tắc icon huy hiệu sơn mài tròn của v3.23.1 đã bị hủy cho các nút chức năng hai bên. Các nhãn bên dùng icon silhouette riêng trên thanh tối trong suốt; chỉ dock năm nút dưới dùng vòng tròn nổi theo reference.
- Mỗi màn chỉ được trình duyệt sau screenshot/video runtime, kiểm tra primary action và đọc lỗi runtime.

## Thiết kế v3.23.0

## Visual rebuild v3.23.1 — đang sản xuất

- Golden Character là style anchor; môi trường và icon không được tự chọn một phong cách khác.
- Hub runtime giữ nền layered nhưng neo bởi một quần thể kiến trúc Việt Nam nổi, đặt đúng trục giữa; bầu trời/mây hai bên là khoảng thở cho nhãn chức năng. Tiền cảnh cổng đá, mái hiên, đèn lồng và bậc thang được tách thành lớp RGBA độc lập, có bóng tiếp xúc và parallax nhẹ để tạo chiều sâu 2.5D.
- Asset trong suốt sinh qua nền `#00FF00` phẳng rồi chroma-key/despill; ảnh vẽ caro giả bị loại.
- Quy tắc icon huy hiệu tròn ở giai đoạn này đã bị thay thế bởi Reference Parity Contract.
- Không dùng screenshot cắt lại làm icon. Không bake tên địa danh, số chương hoặc nhãn nút vào background.
- `prefers-reduced-motion` tắt parallax và chuyển động thở của tiền cảnh.
- Ngữ pháp chạm icon: ngay tại `pointerdown`, icon co còn 90% đồng thời vòng sáng bật và nở quanh icon; `pointerup/click` làm vòng sáng tắt ra ngoài và icon trở về 100%; điều hướng chậm 135ms để phản hồi nhìn thấy được. Reduced-motion bỏ vòng/nảy và điều hướng ngay.

- HUD dùng `HIỆP x/15`, không gọi nhầm là wave.
- Không triển khai viện binh sau khi quét sạch đội địch; bấm tiếp mới mở encounter kế.
- Sau hiệp 15, so tổng HP còn lại; nếu bằng nhau thì so tỉ lệ HP, rồi số tướng sống. Hòa tuyệt đối thì phe người chơi thắng.
- Chuyển chương dùng lớp con dấu đỏ toàn màn hình trong 2,2 giây; tên và số chương do code render để tái sử dụng.
- Asset động sau này chỉ thay phần con dấu/VFX, không bake chữ hoặc số chương.
- Sảnh có một công trình chủ thể ở giữa, nhãn chức năng dàn hai bên và ba địa danh neo nhẹ trên công trình: Chợ Mộng, Đấu Trường, Gọi Mộng; Bang Hội nằm ở vị trí icon chức năng bên phải; dock dưới giữ năm hành động gốc trong các nút tròn nổi.
- Sau mỗi hành động, combat cộng toàn bộ sát thương và trị liệu phát sinh từ đánh lan, đòn nối và phản ứng rồi hiển thị một lần.
- Nút sau kết quả gọi đúng ý nghĩa “Tiếp tục hành trình”; trận kế chỉ bắt đầu sau hành động tiếp tục từ lớp điều phối ngoài combat.
