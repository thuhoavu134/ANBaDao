# Owner asset refresh — review, chưa chứng nhận game thật

Baseline main `1b271d439b3effd46e34e33e13701f7998d7ffde` (PR314 đã merge).
Nhánh `feat/owner-asset-refresh-20261018`. Không merge/deploy trong tác vụ này.

## Phạm vi và nguồn

Sáu ZIP mới: Victory/Defeat; Đình Đồng 6st; vfxdinhdong; sfxdinhdong;
idle vfx ulti Thầy Mo; sfx ulti Thầy Mo. Tên đầy đủ, SHA256, metadata nguồn,
cell/frame/hold và hash atlas runtime nằm trong `assets/owner-refresh-20261018/manifest.json`.
Kho khiên/tiếng kiếm: `KIEMTHE-VFX-SFX-FULL-20261017.zip` người dùng đã cung cấp.

- **Cổ Nương:** 12 cue xuyên kiếm (3 kiếm × 4 lượt xuyên) tại cùng clock với chuyển động; tiếng launch giữ riêng. Tiếng xuyên là đoạn 40–180ms của `tm_shyy_c.wav`, fade 40ms, gain .20 qua bus chung. Không khẳng định là cặp âm thanh gốc của skill. Tắt cooldown riêng cue này để x3 không nuốt nhịp; mute/abort/session vẫn do bus quản lý.
- **Cổ Nương ulti:** 3 cặp hiệu ứng tại 1380/1680, 2280/2580, 3180/3480ms; mỗi lớp 900ms. Cuối action 4500ms để không cắt echo cuối. Chỉ một lần resolve domain; giữ số đợt âm thanh ulti là 3.
- **Victory/Defeat:** lưu cả atlas và bản animated WebP 18 frame / 4 giây, crop một hình chữ nhật cố định theo metadata nguồn. Chỉ thay title image; giữ stage, card, nút, settlement và hero motion owner.
- **Đình Đồng:** ánh xạ vào tướng có sẵn `dinh_loi` (Đình Lôi — Vệ Binh Trống Đồng); giữ save, tên/ID và luật khiên 20%/28%, guard, phản kích. Đổi đủ idle/run/atk/ultimate/hit/fall. Pack sáu trạng thái không có skill1 riêng: dùng rõ ràng cast ultimate mới và VFX atk mới cho kỹ năng cấp khiên cũ. Portrait/card/icon dùng frame idle mới.
- **Khiên:** chọn `tw_70_jzz_b`, Thiên Vương, `pak/image_4.pak #436`, 15 frame × 60ms nguồn. Hình lồng bảo hộ vàng đồng; giữ RGB/alpha/offset, blend screen. Không có SFX ghép gốc trong info.json. Vòng đời theo guard của `dinh_loi`, không tự hết theo timer.
- **Thầy Mo:** đổi idle và VFX/SFX ulti; cast/basic/hit/luật không đổi. Không có Run/Fall mới trong ZIP này: giữ ngoại lệ đã ghi ở main (Victory dịch idle; Defeat synthetic fall), không gọi là animation Run/Fall tác giả.

## Build và clock

`scripts/owner-refresh-20261018.mjs` dựng atlas tương thích vào dist ngay sau copy,
**trước** mọi builder readiness, preparation, persistent pages và result motion.
Từ compact source → 16 atlas layout hiện hành → derivative/cache hiện hành.
Không tạo RAF battle, damage loop hay audio bus thứ hai. Mọi RGBA giữ alpha;
transform cố định cho cả clip, không fit lại từng frame. Bộ character compact
300×275 đủ cho thân nguồn đích 233px (Đình) / 250px (Thầy); bản gốc trong ZIP.

Clock hành động cũ được giữ: Dinh cast 4000ms, hit 1000ms, fall 4000ms;
idle tương thích 4000ms / Thầy idle 6000ms. Hold nguồn được resample lên layout
cũ; hồ sơ dùng hold nguồn trực tiếp. Dinh cast retarget pose gõ khiên vào marker
cũ: basic1550ms/frame9, skill1500ms/frame13, ulti1250ms/frame13. Không tự áp chuẩn
roster-wide đang đề xuất. VFX Dinh chia liên tục qua release/contact, dùng hệ số
visual .74 có sẵn. SFX atempo giữ pitch, fitted vào 1073/1184/2035ms tương ứng;
Thầy ulti 1536ms như clock VFX cũ. Không tăng số hit hoặc thay nộ.

## Ma trận bàn giao

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
|---|---|---|
| ZIP/hash/frame/alpha | ĐÃ KIỂM | Source metadata + decode toàn bộ 13 atlas; contact sheets đã xem |
| Tướng/Đồ Giám/hồ sơ | ĐÃ KIỂM | Source: canonical ID giữ nguyên; portrait Đình mới; hai idle detail nối RAF hiện có. Browser CHƯA KIỂM |
| Bày trận/đội hình | ĐÃ KIỂM | Source/build adapter: campaign-lite và atlas compatibility thay trước sinh preparation pages. Save/domain không sửa. Browser CHƯA KIỂM |
| AFK | ĐÃ KIỂM | Source/build adapter: path idle/run/ATK/VFX hiện hành nhận bản mới. Browser CHƯA KIỂM |
| Battle sáu trạng thái | ĐÃ KIỂM | Build riêng 16 replacement atlases; đọc ảnh cell idle/cast/fall/Thầy/khiên. Trận thật BỊ CHẶN |
| Victory Run → Idle | ĐÃ KIỂM | Source: result motion vẫn trỏ các path run/idle được build mới; Cổ Nương regression pass. Chuyển cảnh thật CHƯA KIỂM |
| Defeat Fall → hold | ĐÃ KIỂM | Unit resample giữ frame cuối; ảnh Đình nằm xuống đầy đủ. Thầy giữ ngoại lệ main. Browser CHƯA KIỂM |
| VFX/neo/scale/hai phe | ĐÃ KIỂM | Unit Cổ x1/x2/x3 và mirror; source giữ mirror Dinh owner, sửa ulti uniform aspect và khiên ôm thân. Toàn trận CHƯA KIỂM |
| SFX marker/lifecycle | ĐÃ KIỂM | Unit Cổ đủ 12 marker, mute/abort/skip/speed; file mới fitted qua ffmpeg và bus chung. Nghe thực tế trong game CHƯA KIỂM |
| Skill/HUD | ĐÃ KIỂM | Real-domain unit Cổ single settlement, parasite stack/removal, đúng mục tiêu. Domain/HUD hai tướng legacy không sửa |
| Desktop/mobile | BỊ CHẶN | Checkout thưa thiếu `scripts/luc-anh-idle-asset.mjs`, `npm test` dừng import trước build. Không có bằng chứng Chrome/Safari/iPhone mới |

## Kết quả kiểm

- RED: yêu cầu 12 cue + echo300ms làm test timeline thất bại trên baseline; test adapter thất bại khi module chưa có.
- GREEN: 35 test Cổ Nương/result/facing hiện có; thêm 4 test adapter (resample cuối clip, đầy đủ mapping, fail-closed, pose tại release). Tổng 39 test pass.
- Build riêng module sinh 16 atlas đúng lưới/padding; đọc ảnh compatibility cells. Đây **không** phải full normal game build.
- Patch thử trên owner fragments main (raw battle + production Thầy fragment + readiness anchor) và raw host: 4 script battle / 3 script host parse. Đây là kiểm source seam, không chứng minh thứ tự toàn bộ installer.
- `npm test`: BỊ CHẶN vì thiếu module nêu trên. Không thay test hoặc bỏ gate để gọi PASS.
- CI, preview bình thường, trận từ nộ 0 → ulti → kết quả → quay lại, nghe tiếng desktop/mobile và Safari thật: còn phải kiểm trên checkout/deployment đầy đủ.

Owner đã có waiver Ticket Board unavailable; không bịa ticket/claim/lock. VibeLab
RED/GREEN được ghi, full evidence gate chưa hoàn tất. Bàn giao PR để review, không
gọi bộ tích hợp là hoàn chỉnh trước khi các dòng browser/audio còn thiếu được kiểm.

Preview có tiếng: [asset-study.mp4](owner-refresh-20261018/asset-study.mp4). Đây là study atlas trên nền trống, không phải game preview. Log RED/GREEN, lỗi full build và lưới output nằm trong cùng thư mục.
