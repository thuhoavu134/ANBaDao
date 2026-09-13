# Cấp người chơi 1–60 — owner đã chốt 13/09/2026

Owner «ok chốt». Implementation TKT-0118; chưa merge/deploy. Cấp người chơi tách riêng cấp tướng (trần30). Không dùng tướng dẫn đội để khóa ải.

| Chương | Ải toàn tuyến | Cấp yêu cầu |
|---|---|---|
| 1 · Ấn Phố | 1–18 | 1–10 |
| 2 · Ấn Rừng | 19–36 | 11–20 |
| 3 · Ấn Biển | 37–54 | 21–30 |
| 4 · Ấn Lò | 55–72 | 31–40 |
| 5 · Ấn Quên | 73–90 | 41–50 |
| 6 · Lục Thần | 91–108 | 51–60 |

Runtime lore `expandSeals` đã sinh đúng108 ID `lt_seal_c_s`; không mở rộng hay đổi roster/seed/thưởng/độ khó. Chuỗi truyện gốc chỉ là template, không phải số ải production.
Với chương c=1..6 và ải s=1..18: `1+10*(c-1)+floor(9*(s-1)/17)`. Mốc mỗi chương1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,10 rồi cộng10 mỗi chương.

## EXP v1 (mặc định cân bằng để chơi thử)

- Lên cấp L→L+1: `100+20*(L-1)` EXP. Tổng cấp60:40.120 EXP.
- Thắng ải lần đầu: `80+20*chapterIndex+8*stageIndex` EXP; index0-based.
- Rương AFK:240 EXP/giờ, tối đa15h=3.600 EXP/lần đầy; chỉ cộng khi nhận. Giữ phần lẻ qua các lần nhận sớm.
- Nhận việc ngày80 EXP; việc tuần240 EXP. Không cộng thêm từ các mốc/điểm danh/idle cũ.
- EXP tích lũy không thể tiêu, không phải Tinh thông. Không tự lên cấp tướng; trần cấp người chơi60.
- Người bị khóa ải vẫn vào rương và nhiệm vụ để lên cấp. Thời gian hoàn tất tuyến cần playtest; đây không phải lời hứa nhịp chơi cuối cùng.

## Khóa, lưu và tương thích

`P.hvPlayerProgress={version:1,xp,clears:["c:s"],afkRemainder}`. Cấp suy ra từxp để không lệch hai trường. Cả108 clear keys giữ lâu dài, độc lập receipt window và Biên Niên+.
Migration trong giao dịch cũ trước khi dùng tiến trình: cấp bù đến yêu cầu của ải hiện tại ở chương đã mở; đánh dấu các ải đã vượt để không nhận lại EXP lần đầu. Không sửa con trỏ/chương/tướng/tiền cũ. Backup con trỏ/chương cũ ở`hvPlayerProgressLegacy` trong cùngsave; chạy một lần.
Ải đã vượt/chương đã hoàn thành giữ chơi lại. Chương mới cần hoàn tất chương trước; ải mới cần thắng ải trước và đủ cấp. Kiểm tra tại`startChapter` trước trừ hoạt lực, cả từ Next và nhiệm vụ; UI hiển thị cấp/EXP, yêu cầu mở và đường nhậnEXP. Sửa cursor replay để đi tiếp trong chương đã qua.
XP trận ghép vào transaction settlement hiện có; XP nhiệm vụ ghép mutation hiện có; XP AFK ghép cùngreset rương. Save thất bại rollback; settlement fail không tiến ải. Không thêm listener hoặc scheduler. Hai wrapper lore truyền tiếp resultAction để Next đến đúng gate.

## Phát hành

PR riêng từ main2074081; PR111 nút kiếm vẫn riêng. Chờ owner`live` cho bản này. Chrome390×844 BLOCKED theo từ chối kiểm duyệt truy cập preview yêu cầu đăng nhập; Safari NOT_RUN. Không khẳng định UI/motion đã nghiệm thu.
