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
- Hồ sơ chia thành 5 tab thực: Thuộc tính (chỉ số và nâng tướng), Kỹ năng, Trang bị (4 ô đọc từ kho/đồ đang mặc và đường sang Rèn), Duyên phận, Tinh thông (kèm Thức Tỉnh). Chuyển các panel hiện có vào tab, giữ nguyên handler và điều kiện giao dịch; hỗ trợ phím mũi tên/Home/End, giữ tab khi chỉ số được cập nhật.
- Canvas Lục Ảnh tham gia bố cục bình thường với tỷ lệ 1:1, không còn đặt tuyệt đối đè lên tên/sao. Không sửa dữ liệu pixel hoặc timing của idle.
- Chặn banner có pool rỗng trước khi trừ ngọc, pity, Hồi Ức hoặc đánh dấu lượt miễn phí. Giữ đổi Hồi Ức đã có; không tự quyết xác suất banner mới.
- Chưa chuyển toàn bộ economy sang giao dịch nguyên tử; trang bị vẫn mặc/cường hóa ở hệ Rèn hiện có; chưa thực hiện toàn bộ roadmap.

## Kiểm thử / phát hành

- Tái hiện trên bản live trước sửa: Lục Ảnh lên cấp 2, vàng 500 → 440, nhưng overlay danh sách vẫn cấp 1/lực chiến 1.007/vàng 6.682/5 sao.
- Regression tests kiểm read model, pool rỗng, số lượt không hợp lệ và một chủ xử lý thao tác. Build phải đồng bộ embedded battle với battle.html.
- PR #1 đã qua 69 test và build, được merge qua GitHub theo yêu cầu phát hành của anh. Preview có bảo vệ đăng nhập và tài khoản Vercel kết nối thuộc nhóm khác; vì vậy kiểm tra runtime thực hiện trên link production sau deploy, không đổi bảo vệ hoặc tạo project khác.
- Kiểm tra live sau merge: Lục Ảnh cấp 2 → 3, lực chiến 1.068 → 1.132, vàng 440 → 320; quay lại danh sách giữ lọc Mộng, cập nhật đúng thẻ và tài nguyên. Chưa coi kết quả này là xác nhận lưu sau tải lại hoặc chất lượng idle trên Safari.
- Kiểm tra hình tìm được CSS chung của shell ghi đè vị trí roster, làm hiện cả header/tài nguyên cũ. Commit `6fe98f7` đã deploy Vercel thành công: `heroesScreen` và roster khớp viewport cao 936 px, header/tài nguyên chung được ẩn trong route tướng; khi sang hồ sơ hoặc hub màn roster ẩn hoàn toàn.
- Trình duyệt production đã xác nhận tải lại giữ Lục Ảnh cấp 3/vàng 320/ngọc 800; lọc Mộng còn 2 thẻ; sắp xếp cấp đưa Lục Ảnh lên đầu; mở hồ sơ rồi quay lại giữ lọc/sắp xếp/focus và scrollTop 111 px. Roster có đúng 12 thẻ.
- Với save kiểm thử chưa vượt chương 1, Gọi Mộng bị khóa bởi điều kiện mở tính năng hiện hành; chưa mở được màn banner trong QA live. Kiểm tra bảo toàn ngọc/pity/lượt miễn phí của guard được thực hiện bằng unit test.
- Tab hồ sơ mới đã qua build/kiểm tra cú pháp; cần kiểm tra tương tác trên production sau phát hành. Bộ regression hiện tại 69/69 pass, không thay thế kiểm tra hình/tương tác.
- Tình trạng phát hành và ca chạy thực tế được ghi ở PR/commit tương ứng, không đánh dấu các tính năng chưa thử là PASS.
