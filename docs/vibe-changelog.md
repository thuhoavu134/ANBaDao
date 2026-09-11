## 11/09/2026 — CI/CD tự động (TKT-0025)

GitHub Actions: mỗi PR và mỗi lần đẩy `main` chạy cài đặt → build → test. Vercel vẫn tự deploy live. Job production xác nhận luc-than.vercel.app trả 200.

## 11/09/2026 — Tối ưu deploy (TKT-0024)

Bản live không còn đóng gói 23MB ảnh QA. Vercel bỏ cài `sharp`. HTML không cache cứng để nhận bản mới ngay.

## 11/09/2026 — Tháp khóa lực chiến + bù ngày (TKT-0023)

Mỗi tầng có mốc lực chiến (3800 + (tầng−1)×420). Đủ thì Leo tầng auto-qua. Thiếu thì Thử leo tốn 5⚡, không tụt tầng, bắt đầu đếm ngày bù +12%/ngày (trần 5 ngày = +60%). Hố lớn vẫn phải tăng lực ở Trợ trận / Rèn / sao.

## 11/09/2026 — Tháp Trắng Đêm sơn mài (TKT-0022)

Thành Chính có địa danh Tháp. Leo tầng bất biến: 5⚡, vàng 120+tầng×30, ấn thử, Tháp Ấn. Thua không tụt tầng, không tăng chiến dịch.

## 11/09/2026 — Trợ trận bánh xe đủ 11 nan (TKT-0021)

Mở **Đồ Giám Cẩu Cá**: 8 loài, Câu vàng + Hoạt Lực, ngẫu nhiên +1. Cả đàn cộng chỉ số. Bậc Thầy khi cả 8 cùng cấp. Không còn nan khóa.

## 11/09/2026 — Trợ trận → Ảo Hình (TKT-0020)

Sáu ảo ảnh tuồng/chèo. An vị **chính 100% + phụ 50%**. Cường hóa vàng + Hoạt Lực. Bậc Thầy khi cả 6 cùng cấp.

## 11/09/2026 — Trợ trận → Tuệ Vận (TKT-0019)

Năm ấn ngũ phúc. Chọn đúng một vận, buff **%**. Cường hóa vàng + Hoạt Lực. Bậc Thầy khi cả 5 cùng cấp.

## 11/09/2026 — Trợ trận → Cổ Vật (TKT-0018)

Sáu cổ vật Việt, an vị đúng một. Chỉ món đang an vị cộng chỉ số. Cường hóa vàng + Hoạt Lực. Bậc Thầy khi cả 6 cùng cấp.

## 11/09/2026 — Trợ trận → Tướng Tinh (TKT-0017)

Mở nan Tướng Tinh: 12 tướng chính thức, thăng sao bằng mảnh hồn (20 × ★ hiện tại, trần 6★). Dùng `P.heroes[id].stars` sẵn có — mỗi sao +12% chỉ số gốc. Không wrap thêm heroStats.

## 11/09/2026 — Trợ trận → Thần Binh (TKT-0016)

Bốn đạo quân (Cấm Quân, Nỏ Binh, Voi Chiến, Thủy Quân) buff **%** HP/Công/Thủ/Tốc toàn đội. Cả 4 luôn hiệu lực. Cường hóa vàng + Hoạt Lực. Bậc Thầy khi cả 4 cùng cấp.

## 11/09/2026 — Trợ trận → Cửu Ứ Chiến Linh (TKT-0015)

Chín chiến linh (Sơn Thủy / Tiên Thánh / Hồng Bàng). An vị 3 ô — chỉ ô đã an mới cộng chỉ số. Bộ 3 cùng hệ thêm bonus. Cường hóa vàng + Hoạt Lực.

## 11/09/2026 — Trợ trận → Linh Thú (TKT-0014)

Sáu thú Việt (Kim Quy, Rồng Lạc, Hổ Thiêng, Hạc Trắng, Cá Chép, Trâu Vàng). Xuất chiến 1 con = 100% chỉ số, thú khác 25%. Cường hóa vàng + Hoạt Lực. Bậc Thầy khi cả 6 cùng cấp.

## 11/09/2026 — Bánh xe Trợ trận không đè icon (TKT-0013)

11 nan xếp đều ≥32°. Huy hiệu 54px không chồng; chỉ vòng tròn nhận chạm. Nhãn tối đa 2 dòng.

## 11/09/2026 — Trợ trận → Bảo Vật (TKT-0012)

Nhánh `work/l13-relics-20260911`. Spoke Bảo Vật mở bảng 8 bảo vật hai bên chân dung. Cường hóa bằng vàng/Hoạt Lực. Bộ Lạc Việt / Đế Vương và Bậc Thầy Bảo Vật cộng vào toàn đội. Không đổi seed/reward/rèn.

## 11/09/2026 — HUD trận sơn mài gọn (TKT-0011)

Nhánh `work/l12-hud-css-20260911`. Trận nhúng ẩn topbar Âm/1×/Tự động; ribbon 48px đêm/đồng; tốc độ và tua là chip tròn 44px. Bỏ identity mint `#e7f4ef`. 3/3 HUD CSS tests; Chrome 390×844 ribbon 48 / speed 44 / skip 44; Safari NOT_RUN.

