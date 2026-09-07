# L02b — Đề xuất thay reward legacy theo chương

Trạng thái: **PROPOSAL / CHƯA ÁP DỤNG**. Tài liệu này chốt phương án để review; không thay DATA.chapters, seed, balance, save migration hoặc reward runtime.

## Nguyên tắc

- Giữ nguyên vàng, ngọc và số lượng mảnh hiện tại.
- Đổi reward.shardHero sang ID playable chính thức.
- Bỏ unlockHero khỏi reward chương vì defaultPlayer() và migrateSave() đã mở cả 12 ID chính thức.
- Không xóa hero legacy khỏi DATA.heroes; các nhân vật đó vẫn là lore/NPC.
- Save đã nhận reward không bị thu hồi hoặc cấp lại. Save chưa nhận sẽ được xử lý một lần ở L02c, sau khi có receipt/claim boundary rõ ràng.
- Các unlockHero trong scene và 5 first scene đang thiếu là việc liên kết scene riêng, chưa sửa trong L02b.

## Bảng đề xuất

| Chương | Reward hiện tại | Reward đề xuất | Lý do | Tác động save |
|---|---|---|---|---|
| ch1 · Mộng Phố | 900 vàng, 80 ngọc, 40 mảnh ong_chu_wifi; unlockHero: ong_chu_wifi | 900 vàng, 80 ngọc, 40 mảnh co_dao_ganh_hoi; bỏ unlockHero | Cô Đào giữ vai trò hỗ trợ/điều nhịp tương ứng hơn; Ông Chú Wifi giữ là NPC | Save mới cộng mảnh Cô Đào, không tạo ownership key mới; save đã clear giữ nguyên |
| ch2 · Rừng Deadline | 1.100 vàng, 100 ngọc, 40 mảnh ky_lan_ca_phe; unlockHero: ky_lan_ca_phe | 1.100 vàng, 100 ngọc, 40 mảnh phong_tu; bỏ unlockHero | Phong Tử giữ bản sắc tốc độ/cắt lượt của tuyến Deadline | Không mở Kỳ Lân Cà Phê; claim chưa nhận chuyển một lần sang mảnh Phong Tử |
| ch3 · Biển Khô | 1.400 vàng, 120 ngọc, 40 mảnh nang_tien_ca_can; unlockHero: ca_tre_biet_buon | 1.400 vàng, 120 ngọc, 40 mảnh thuy_nuong_roi_nuoc; bỏ unlockHero | Gộp hai ref legacy tuyến biển vào playable hệ nước chính thức | Không thu hồi shard legacy đã lưu; claim mới chỉ ghi mảnh Thủy Nương |
| ch4 · Nhà Máy Giấc Ngủ | 1.700 vàng, 140 ngọc, 40 mảnh chi_ve_chai_thien_ha; unlockHero: chi_ve_chai_thien_ha | 1.700 vàng, 140 ngọc, 40 mảnh luc_anh; bỏ unlockHero | Lục Ảnh gắn trực tiếp với giấc mộng/hình nhân; Chị Ve Chai giữ là lore/NPC | Save cũ không bị cấp lại hoặc thu hồi; save chưa claim nhận mảnh Lục Ảnh |
| ch5 · Vùng Quên | 2.000 vàng, 160 ngọc, 40 mảnh hon_cay_bang; unlockHero: hon_cay_bang | 2.000 vàng, 160 ngọc, 40 mảnh to_diep; bỏ unlockHero | Mộc bản và dấu ấn của Tố Điệp phù hợp chủ đề lưu giữ ký ức | Không xóa ownership/shard legacy; chỉ đổi đích của claim chưa nhận |
| ch6 · Người Gác Mộng | 2.600 vàng, 220 ngọc, 40 mảnh thang_be_dieu_set | 2.600 vàng, 220 ngọc, 40 mảnh dinh_loi | Đình Lôi là playable hộ vệ chính thức, phù hợp vai trò canh giữ trận cuối; Thằng Bé Diều Sét vẫn là lore | Giữ toàn bộ reward cũ đã nhận; không tự thêm legacy hero vào roster |

## Điều cần chốt trước L02c

1. Duyệt 6 đích playable ở trên, hoặc thay từng đích trong file đề xuất.
2. Chốt quy tắc save: clearedChapters được coi là đã nhận; không có receipt thì không tự bù reward để tránh double grant.
3. Chốt riêng các scene unlockHero legacy. Không dùng bảng reward này để xóa nhân vật khỏi lore.

Validator và test máy:

- src/domain/catalog/reward-mapping-proposal.mjs
- tests/catalog-reward-proposal.test.mjs
- Active catalog hiện có 11 legacy reward refs; proposal bao phủ đủ 11 và giữ nguyên các giá trị vàng/ngọc/mảnh.
