# Chinh chiến — cảnh AFK và chuẩn bị đội

Nhánh triển khai: `feat/campaign-afk-squad-v1` · [PR #16](https://github.com/bktimmy247/luc-than/pull/16) **đã merge** vào main ở `92b503c9be9e8b85a84288501d18907423d5f9b2`. Cập nhật trạng thái 07/09/2026. Bằng chứng Chrome bên dưới thuộc commit preview được ghi rõ; hotfix audio thoát trận tiếp theo ở `c8fefca` có 171 test và deployment READY, chưa có device smoke sau hotfix. Xem [progress](HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md).

Đây là một phần triển khai của hướng tham khảo trong `SAMKOK-REFERENCE-ALIGNMENT.md`: vào Chinh chiến, thấy đội đang thám hiểm và rương tích lũy, chuẩn bị đội rồi xuất chiến. Mỹ thuật giữ Hồn Việt; giá, tiến trình, bộ kỹ năng và luật trận dùng dữ liệu hiện hành.

## Hành vi đã bổ sung

- Cảnh Mộng lộ hiện sáu tướng theo đội đã lưu, chương/ải hiện tại, lực chiến và tài nguyên thật. Cập nhật số thưởng riêng với diễn hoạt để tránh dựng lại toàn màn mỗi giây.
- Khiêu chiến mở màn chuẩn bị: xem đối thủ, chọn một vị trí rồi thay tướng, hoặc đổi hàng bằng cách hoán đổi hai vị trí đối diện. Luôn giữ ba vị trí trước và ba vị trí sau đúng bố trí của engine.
- Danh sách chọn dùng `OFFICIAL_ROSTER_12_IDS` và trạng thái sở hữu. Tướng thưởng chương thuộc nội dung cũ không tự xuất hiện trong danh sách này.
- Hủy bỏ bản nháp; Xuất chiến mới lưu đội bằng giao dịch hiện có. Chặn nhấn đúp, thiếu thể lực, lỗi lưu và thay đổi tiến trình trong lúc chuẩn bị. `startChapter` tiếp tục sở hữu chi phí, mở trận và chuyển ải.
- Rương vẫn giới hạn 15 giờ, nhận bằng giao dịch nguyên tử và có bảng biên nhận. Nút Thưởng treo máy trên màn thua dẫn đến Chinh chiến.
- Ảnh MVP dùng asset tương ứng với roster, qua bộ vẽ trong engine. Ông Phở và Lục Ảnh giữ đường vẽ riêng hiện có.

## Mỹ thuật

Bốn asset imagegen mới đã tích hợp trong `assets/ui/campaign-v1/`: nền Mộng lộ, khung giấy ngọc, nút đồng vàng và rương AFK. Xem [prompt và cách đóng gói](../assets/ui/campaign-v1/README.md), [manifest](../assets/ui/campaign-v1/manifest.json).

Quy tắc của chủ dự án đã ghi trong `AGENTS.md`: dùng imagegen khi cần background, icon, bản đồ hoặc khung UI còn thiếu; tận dụng asset phù hợp đã có. CSS phụ trách bố trí và tương tác; chữ và số vẫn là nội dung sống.

Cảnh dùng atlas idle đã có của Ông Phở, Lục Ảnh, Thầy Mo và Đình Lôi. Tướng chưa có atlas riêng dùng ảnh hiện có của roster. Bản này chưa tạo bộ ảnh nhận diện và animation riêng mới cho toàn bộ 12 tướng.

## Nguồn và điểm nối

| Nguồn | Vai trò |
| --- | --- |
| `src/domain/campaign/campaign-view.mjs` | Đọc checkpoint, thay vị trí, hoán đổi hàng trên bản sao |
| `src/ui/campaign-scene.js` | Một chủ quản màn AFK/chuẩn bị; gọi router, giao dịch và engine hiện có |
| `src/ui/campaign-scene.css` | Bố trí mobile, khung ảnh, vùng cuộn và nút cuối màn |
| `scripts/afk-chest-runtime-v1.mjs` | Ghép domain/UI và điểm nối route vào bản build |
| `scripts/m0-p0-runtime-repair-v1.mjs` | Đích điều hướng Thưởng treo máy và nhãn Xác nhận |
| `scripts/dinh-loi-retina-portrait-v1.mjs` | Cache ảnh và cầu nối vẽ MVP vào engine |

Vòng vẽ AFK chỉ chạy khi màn hoạt động và tab hiển thị; dừng trong màn chuẩn bị. Chế độ giảm chuyển động dùng frame tĩnh. Khi route Chinh chiến hoạt động, vô hiệu bộ lọc `body.night` cũ để fixed viewport không bị kéo theo chiều cao shell; giữ thông báo lỗi ở trên lớp UI.

## Kiểm tra

- `npm test`: **162/162 đạt**, không bỏ qua ca nào. Kiểm tra thêm ngay sau lệnh: embedded battle khớp byte với `dist/battle.html` và QA unlock vẫn opt-in.
- Hồi quy có các ca: checkpoint không tự tiến, con trỏ ải sai, hủy bản nháp, hoán đổi không trùng tướng, bố trí 3/3, nhấn đúp xuất chiến, thiếu thể lực, lỗi lưu, tiến trình thay đổi và tướng thưởng cũ ngoài roster.
- Ca MVP chạy tách phạm vi engine/UI để phát hiện truy cập biến cục bộ sai; xác minh identity và asset đều tồn tại.
- Chrome qua `qa-runtime.html`: khung 390 × 844 và 430 × 932; trận trên khung PC 1280 × 900. Đây là kiểm tra responsive trong trình duyệt, chưa phải Safari/iPhone thật.
- 390 × 844: cảnh có đúng chiều cao 844; dock ở y=773–844; vùng nội dung không bị tràn. 430 × 932: màn chuẩn bị đúng cao 932, footer ở y=814–932, nút xuất chiến vẫn nhìn thấy.
- Đã thao tác đổi Cô Đào thành Lục Ảnh, xuất chiến và tải lại: đội giữ Lục Ảnh. Đổi hàng Lục Ảnh rồi hủy và mở lại: Ông Phở vẫn ở vị trí 1 như bản lưu.
- Trên commit `e8d1c56cf7068de1aca562f8726d754fc25d7508`, chọn đội hiện đúng 12 tướng; MVP Nữ Cung Thủ Tre hiện đủ hình giống ảnh roster. Lượt chạy cuối không ghi nhận lỗi JavaScript của game; tốc độ trận đổi được từ ×1 lên ×3.
- Sau Xác nhận, trận 2–2 mở đúng tiến trình. Nút Chinh chiến trong trận trở về cảnh AFK với Ải 1 đã hoàn tất và mục tiêu 2–2; rút khỏi trận không cộng tiến trình trận đang chạy.
- Nhận AFK tăng vàng một lần, rương về 0. Xuất chiến đầu tiên trừ 120 → 114 thể lực; Ải sau sang trận boss trừ tiếp 114 → 108. Hoàn tất Mộng Phố mở Rừng Deadline theo phần thưởng hiện hành.
- Preview có bảo vệ Vercel. Link chia sẻ tạm thời được cấp qua tài khoản đã kết nối; không lưu token vào repo.

Ảnh kiểm chứng ở [docs/qa/campaign-afk-v1](qa/campaign-afk-v1/). Ảnh cảnh/đội hình phản ánh các bố cục đã kiểm tra; ảnh PC chụp trận boss đang chạy.

## Phạm vi còn lại

Chưa kiểm Safari thật, chưa chạy đủ mọi chương/hoạt động hoặc một trận thua tự nhiên trong đợt này. PR #16 đã merge vào `main`; không nhận lại việc merge nhánh này. Các nội dung chương cũ và phần thưởng tướng cũ vẫn thuộc cấu hình hiện có; màn chọn đội mới giới hạn đúng roster chính thức. Không coi bản này là hoàn tất toàn bộ roadmap theo video.

