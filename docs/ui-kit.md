# Chuẩn UI Lục Thần (hv-kit)

Chốt 06/11/2026. Chuẩn gốc là **Thành Chính** và bộ icon `assets/ui/menu-v3233/icons` mà owner đã duyệt. Mọi màn đều theo file này. Màn nào lệch là lỗi.

## Luật bắt buộc
1. **Hình vẽ bằng gpt_image, không vẽ khung bằng CSS.** Khung, nút, tab, ô vật phẩm, nút quay về, popup đều lấy từ `assets/ui/kit/`. Cần hình mới thì tạo bằng gpt_image cùng phong cách (sơn mài đen, viền vàng, thủy mặc), tách nền, lưu webp.
2. **Chữ dễ đọc.** Dùng font hệ thống (`--hvk-font`), chữ nhỏ nhất **12px**, nội dung 14px, tiêu đề 15–18px đậm. Không dùng font thư pháp hay serif cho nội dung. Font thư pháp chỉ dùng trong ảnh.
3. **Không emoji.** Dùng icon ảnh: vàng, ngọc, năng lượng lấy `resource-*-imagen.png`, icon chức năng lấy `menu-v3233/icons`.
4. **Nút cao ≥ 44px, rộng ≥ 44px** (đo ở 390×844).
5. **Nội dung chính hiện ngay, không phải cuộn.** Danh sách chính (đối thủ, nhiệm vụ, vật phẩm) phải nằm trong màn đầu ở 390×844.
6. **Chức năng phụ mở popup** (`.hvk-sheet`) nổi giữa màn. Không mở rộng trang kéo xuống.
7. **Nút quay về giống nhau ở mọi màn**: `.hvk-back`, vuông, góc dưới trái.
8. **Nền là tranh phủ kín màn.** Không dùng nền màu kem đặc hay khối thẻ kiểu web. Chữ đặt trên nền thì phải nằm trong `.hvk-panel` hoặc có bóng chữ.

## Bộ khung (`src/ui/kit/hv-kit.css`)
| Class | Dùng cho | Ảnh |
|---|---|---|
| `.hvk-panel` | khung bảng nội dung, giãn theo nội dung, góc hoa văn giữ nguyên | `kit/panel.webp` |
| `.hvk-plaque` | bảng tên, tiêu đề màn | `kit/plaque.webp` |
| `.hvk-btn` / `.hvk-btn.is-2` | nút chính đỏ / nút phụ xanh ngọc | `kit/btn-primary.webp`, `kit/btn-secondary.webp` |
| `.hvk-tab` (+ `.is-on`) | tab chuyển nhánh trong màn | `kit/tab.webp` |
| `.hvk-back` | nút quay về | `kit/back.webp` |
| `.hvk-slot` | ô vật phẩm, ô thưởng | `kit/slot.webp` |
| `.hvk-sheet` | popup | dùng `.hvk-panel` bên trong |
| `.hvk-dock` | hàng nút đáy cho chức năng phụ | — |
| `.hvk-row` | 1 dòng danh sách: trái ảnh/hạng · giữa tên · phải nút | — |
| `.hvk-dot` | chấm đỏ báo việc cần làm | — |

Đã có sẵn từ Đấu Trường: băng rôn treo dọc, huy hiệu tròn, bảng tên nhỏ (`assets/ui/arena/kit`), dùng cho màn có nhiều khu.

Trang mẫu: `src/ui/kit/demo.html`.

## Hiện trạng 24 màn (đo 06/11, 390×844)
Tổng: **145 nút nhỏ hơn 44px · 557 chữ nhỏ hơn 12px · 237 emoji**. Không có ảnh lỗi, không có lỗi JS.

- **Thiếu nút quay về:** hub (đúng, vì là sảnh), campaign, team, forge, bag, vault, shop.
- **Phải cuộn mới thấy hết:** arena, team, daily, festival, jobs, mail.
- **Nặng nhất:** jobs (15 nút nhỏ, 63 chữ nhỏ), chat (15/56), clan (15/34, 26 emoji), net (13/30), bag (13/38), heroes (39 emoji, trộn Arial, Georgia và Noto Serif).
- **Chưa đo:** battle, end, heroDetail (cần dựng trận hoặc chọn tướng), làm ở nhánh tương ứng.

Số liệu thô: `tmp/proof/ui-audit/audit.json`, ảnh ghép `sheet.jpg`. Công cụ đo: `C:\lt\tools\pw\ui-audit-all.cjs`.

## Nhánh làm (giai đoạn 1, chờ owner duyệt)
A. Chiến đấu: campaign, journey, story, hunt, expedition, end
B. Nuôi tướng: team, heroes, heroDetail, forge, bag
C. Kinh tế: shop, vault, daily, festival, jobs
D. Xã hội: guild, clan, friends, chat, mail
E. Đồng bộ lại theo kit: summon, tower, arena, net

Mỗi nhánh có worktree riêng và cổng preview riêng. Cổng chất lượng: đo bằng `ui-audit-all.cjs` ra 0 lỗi, `npm test` 0 fail mới, owner duyệt ảnh rồi mới merge.
