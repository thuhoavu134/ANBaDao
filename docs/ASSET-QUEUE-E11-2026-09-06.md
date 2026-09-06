# Hồn Việt — E11 asset queue / forge v1

Lát cắt: Rèn Mộng (E11-07/E11-08), Samkok v2.1. Asset tĩnh đã được gắn theo định nghĩa `slot + rarity`; không dùng asset để quyết định rarity, stat, pity hay kết quả giao dịch.

## Đã tích hợp

| ID | Đối tượng | Vị trí | Nguồn | Trạng thái |
|---|---|---|---|---|
| IMG-E11-ITEM | 20 mẫu vũ khí/giáp/bùa/giày | Song Rèn, kết quả, kho, chọn mặc, hồ sơ | Imagen, 384×384 RGBA | Đã gen, QC nhanh, tích hợp |
| IMG-E11-MATERIAL | Tinh Lực, Hoạt Lực, Vàng | Chip số dư và bảng cost Rèn | Imagen, 256×256 RGBA | Đã gen, QC nhanh, tích hợp |
| UI-E11-ITEM-CARD | Preview món và trạng thái món | Phôi, kho, hồ sơ tướng | CSS + registry cố định | Đã tích hợp; có `prefers-reduced-motion` |
| UI-E11-REVEAL | Thẻ “Đã ghi sổ sau khi lưu” | Sau craft/choose thành công | CSS reveal + ảnh món đúng instance | Đã tích hợp; chỉ hiện sau commit |

## Cần anh tạo / theo dõi

Các mục dưới đây không được giả nhận là đã sản xuất. Bản runtime hiện dùng fallback nguồn có sẵn khi thiếu.

| ID | Brief sản xuất | Điểm phát | Trạng thái |
|---|---|---|---|
| ANIM-E11-FORGE | 1 animation lò rèn 6–8 frame, nền alpha, khung vuông 384×384, thời lượng 0.55–0.75s; búa gõ 2 contact beat rõ, tia lửa vàng-jade bật lên rồi tắt; camera cố định, anchor giữa lò; cảm giác đẹp, sống động, tươi sáng; xuất sprite/APNG/WebP dễ lazy-load | Bắt đầu Rèn → trước bảng kết quả | Cần anh tạo |
| SFX-E11-HAMMER | WAV 48kHz mono, 2 hoặc 3 hit “keng keng” kim loại sáng, mỗi hit 120–180ms, tổng đuôi dưới 420ms; hit 1 nhẹ, hit 2 có lực, không lẫn voice/nhạc; có khoảng lặng đủ để đọc UI; cảm giác sạch, sáng, đã tai | Đồng bộ contact beat; dừng khi rời màn | Cần anh tạo |
| VFX-E11-REVEAL | 1 burst VFX alpha 12 frame, 256×256 hoặc 384×384, 0.45–0.60s; vòng sáng vàng nhạt + hạt jade + một tia lấp lánh tại tâm icon; không phủ text; dùng lại cho craft/choose/enhance nếu phù hợp | Chỉ phát sau giao dịch đã lưu thành công | Cần anh tạo |

Khi nhận nguồn động/âm thanh: đặt đúng thư mục asset, cập nhật registry/version, kiểm nhịp âm–hình trên UI thật, reduced-motion, retry/reload và không phát chồng khi cùng `commandId` bị gửi lại.
