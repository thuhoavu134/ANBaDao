# Lăng Chân — Vô Cực Kiếm Tử · hồ sơ thiết kế

Tướng thứ 4. Võ Đang chân truyền, cận chiến burst, hệ Băng/Lôi (Thái Cực lam bạch).

## Trạng thái
- Brief kỹ thuật: `C:\lt\tmp\brief-lang-chan.json` (he `thuy`, basic 1.2 / enemy, ulti 2.2 / aoe_enemy, effects speedDown + root).
- Ảnh concept: đã sinh bằng gemini_image (phông xanh), gửi owner 24/10 04:47.
- **Chưa có clip hoạt ảnh.**

## Quy đổi so với thiết kế gốc
| Thiết kế | Trong game | Lý do |
|---|---|---|
| Hệ Băng/Lôi | Thủy | game không có hệ Lôi |
| Ulti 110 Nộ | 100 | trần Nộ = 100 (owner chốt) |
| Cấm kỹ năng dịch chuyển/áp sát | `root` 2 hiệp | engine không có cơ chế teleport |
| "Đẩy 15% Thanh Hành Động" | hồi Nộ | engine đánh theo lượt, không có thanh hành động |

## ATK Lưu Tinh Cản Nguyệt — tách 2 lớp (owner chốt 24/10 04:46)
1. **Diễn hoạt nhân vật** (`atk` clip): lướt dash chớp nhoáng, vệt lam bạch, chém vòng cung Thái Cực, dừng ở thế thủ một chân. Vệt sáng **bám thân kiếm**, không bắn đạn rời.
2. **VFX tại mục tiêu** (`vfxatk` clip): ấn Thái Cực Âm Dương Bát Quái khổng lồ dưới đất, xoáy tốc độ cao, chém liên hoàn, kết bằng xung kích lam bạch rồi tan thành bụi linh khí.

→ Khớp đúng 2 file pipeline cần: `atk_*.mp4` + `vfxatk_*.mp4`. Ulti tương tự: `ulti_*.mp4` + `vfxulti_*.mp4`.

## Ulti Bát Quái Kiếm Trận
- Nhân vật: phóng kiếm lên không, giẫm mạnh xuống, ấn bát quái lan rộng dưới chân, kiếm ảnh xoáy quanh người, áo và tóc bay ngược trọng lực, kết ở thế kiếm quyết.
- VFX toàn sân: trận đồ bát quái khổng lồ + cá âm dương xoay, cự kiếm cắm 8 điểm, xung kích lan, hút tâm, ngàn mảnh kiếm khí.

## Cơ chế đã ghi trong brief
- Nội tại: +15% Tốc độ; 10% sát thương gây ra → hút máu (đại diện giáp khí hộ thể).
- ATK: 120%, 50% giảm 15% Tốc độ 1 hiệp.
- Ulti: 220% toàn sân, −25% Tốc độ 2 hiệp, root 2 hiệp.
