# Hồn Việt — triển khai theo Samkok

## Mẫu chính được anh xác nhận ngày 2026-09-05

- Game tham chiếu: **Samkok: New Force / Tam Quốc Khởi Động**.
- Video đã mở: `samkok-new-force-240p.mp4`, 426×240, 30 FPS, 1.851,373 giây (30:51). Anh xác nhận đây là đúng game sau khi trước đó gọi là video hơn 11 phút.
- Đã kiểm tra các khung lấy mẫu cách nhau 30 giây trên toàn video để nhận diện màn/luồng. Độ phân giải 240p không đủ để khẳng định công thức, chi phí hay mọi nhãn chữ nhỏ. Không dùng các giá trị đoán từ hình làm cấu hình Hồn Việt.
- Gói Fable tham khảo: `fable5-tkt0016-handoff-v1.zip`. Có `decrypted-main-index.js` với 1.748 đăng ký module; gồm `herobagv`, `herodetailv`, `heroctrl`, `heromdl`, `maincityview`, `taskctrl`, `taskmdl`, `recruitctrl`, `warjssuccv`, `warjsfailv`.
- Chỉ đọc offline để hiểu tổ chức hệ thống. Không cần chạy backend mẫu hay chờ giải mã hết để triển khai. Không đưa source/asset Tam Quốc vào bản phát hành Hồn Việt.
- 3Q là nguồn tham khảo kỹ thuật bổ sung, **không còn là mẫu mặc định quyết định toàn bộ sản phẩm**.

## Những gì quan sát được và thứ tự triển khai

| Ưu tiên | Quan sát trong video | Áp dụng vào Hồn Việt | Điều kiện nghiệm thu |
| --- | --- | --- | --- |
| 1 | Danh sách tướng 4 cột, lọc hệ, chỉ số trên thẻ, dock điều hướng | Một màn danh sách lấy trực tiếp từ save, phân biệt sở hữu/đồ giám; giữ asset và 12 ID đã chốt | Lục Ảnh luôn hiện; tăng cấp xong quay lại cập nhật thẻ; giữ bộ lọc/vị trí cuộn; mỗi lần nhấn chỉ mở một hồ sơ |
| 2 | Hồ sơ tướng có nhân vật, chỉ số, kỹ năng và thao tác nâng tướng | Hoàn thiện các tab chức năng; đưa thao tác chính đến vị trí dễ bấm trên mobile; giữ baseline và tỷ lệ idle | Tab có nội dung thật; chi phí/điều kiện rõ; nâng tướng không khởi động lại idle; đóng màn dừng vòng vẽ |
| 3 | Chọn đội từ bộ sưu tập, đội hình hiện trước khi vào trận | Liên thông hồ sơ → thay tướng → lưu 6 vị trí → trận | Không trùng tướng; phản ánh chính xác đội đã lưu; tiến trình còn sau tải lại |
| 4 | Chiêu mộ, chọn nguyên liệu/tướng, màn xác nhận và trả kết quả | Thiết kế riêng cho roster Hồn Việt toàn SSR, giao dịch trước/sau rõ ràng | Phải chốt banner trước khi mở; không lấy lại xác suất cũ với pool rỗng; không mất ngọc/lượt miễn phí khi thất bại |
| 5 | Trận và màn kết quả có thống kê, phần thưởng, đường dẫn mạnh lên | Victory/Defeat/MVP động; thắng tiếp ải, thua sang tăng tướng/trang bị rồi quay lại | Chốt thưởng một lần; CTA không bị overlay chặn; tối đa 15 hiệp và không nhiều wave như luật Hồn Việt |
| 6 | Hub và nhiều nhánh nuôi đội/hoạt động | Nhiệm vụ, nhận thưởng, trang bị rồi mở rộng hoạt động theo vòng chơi | Mỗi nút có điều kiện mở, hành động thực, lưu tiến trình và đường quay lại; chưa làm thì báo rõ thay vì tab giả |

Các mốc là thứ tự phụ thuộc, không phải tuyên bố toàn bộ đã hoàn thành. Không sao chép trần sao, rarity hay economy của Samkok: 12 tướng Hồn Việt toàn SSR, trần cấp/sao và chi phí hiện hành giữ nguyên cho đến khi anh duyệt thay đổi.

## Lát cắt triển khai lần này

- Thay màn roster quét chữ `SSR`/`Lv.1` và giấu màn cũ ngoài viewport bằng read model từ `P`, `DATA` và danh sách 12 ID chính thức.
- Cấp/sao/lực chiến, vàng/ngọc và lực chiến 6 tướng trong đội lấy từ dữ liệu hiện tại. Không còn vàng `6.682`, tài nguyên `581K`, sao `★★★★★` cố định.
- Bộ lọc hệ, sắp xếp, Tướng/Đồ Giám, quay lại và dock có hành động thực. Thẻ dùng đúng ID, không suy từ tên rút gọn.
- Giữ canvas idle khi hồ sơ cùng tướng được cập nhật; dừng RAF khi rời hồ sơ. Không đổi atlas, cắt frame, màu hay tỷ lệ nhân vật trong lần này.
- Chặn banner có pool rỗng trước khi trừ ngọc, pity, Hồi Ức hoặc đánh dấu lượt miễn phí. Giữ đổi Hồi Ức đã có; không tự quyết xác suất banner mới.
- Chưa chuyển toàn bộ economy sang giao dịch nguyên tử, chưa làm lại mọi tab hồ sơ, chưa thực hiện toàn bộ roadmap.

## Kiểm thử / phát hành

- Tái hiện trên bản live trước sửa: Lục Ảnh lên cấp 2, vàng 500 → 440, nhưng overlay danh sách vẫn cấp 1/lực chiến 1.007/vàng 6.682/5 sao.
- Regression tests kiểm read model, pool rỗng, số lượt không hợp lệ và một chủ xử lý thao tác. Build phải đồng bộ embedded battle với battle.html.
- Kiểm thử trình duyệt trên preview Vercel trước khi cập nhật main; không coi build thành công là xác nhận trải nghiệm mobile/animation.
- Tình trạng phát hành và ca chạy thực tế được ghi ở PR/commit tương ứng, không đánh dấu các tính năng chưa thử là PASS.
