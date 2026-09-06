# Ảnh kiểm chứng Chinh chiến

Ảnh JPEG trực tiếp từ Chrome trên Vercel preview, không chỉnh sửa nội dung ảnh. Khung điện thoại dùng `qa-runtime.html`, chưa thay thế kiểm tra Safari thật.

| Ảnh | Commit chụp | Nội dung |
| --- | --- | --- |
| [afk-390.jpg](afk-390.jpg) | `286179d` | Mộng lộ, đội đang thám hiểm, rương, nút và dock trong khung 390 × 844 |
| [preparation-390.jpg](preparation-390.jpg) | `f0958e1` | Sáu vị trí, hàng trước/sau, danh sách 12 tướng và nút xuất chiến |
| [battle-1280.jpg](battle-1280.jpg) | `03b45f9` | Trận boss đang chạy trong khung PC 1280 × 900 |
| [mvp-390.jpg](mvp-390.jpg) | `e8d1c56` | Ảnh MVP Nữ Cung Thủ Tre đầy đủ và khớp roster |

Thay đổi sau ảnh cảnh/chuẩn bị tập trung vào ảnh MVP, không đổi bố cục đã chụp. Kết quả code cuối: `npm test` 162 pass, 0 fail, 0 skip; embedded battle byte-identical, QA unlock opt-in. Chi tiết luồng đã thao tác và giới hạn nghiệm thu ở [CAMPAIGN-AFK-V1.md](../../CAMPAIGN-AFK-V1.md).
