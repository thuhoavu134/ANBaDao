# LỤC THẦN — audit VFX / SFX / voice gốc, 26/09/2026

Repo: `bktimmy247/luc-than`. Branch: `fix/restore-mixed-roster-vfx-sfx-voice-20260926`. PR #231 vẫn Draft; chưa merge main.

## Kết luận và phạm vi bằng chứng

Có **6 owner có asset combat riêng thật**: Lục Ảnh, Đình Lôi, Thầy Mo, Ông Phở, Linh Đồng, Bạch Diện. Năm tướng trừ Ông Phở có đúng **15 manifest `hon-viet-skill/v1`**. Ông Phở dùng sprite legacy embedded, không phải một pack manifest bị thiếu.

Đã xác minh SHA Git blob của **718/718 file trong `assets/`** tại đầu bàn giao `5c6ed6f`. Audit lịch sử gồm **113 commit thay đổi assets**, metadata tên cũ/rename/delete, cây khởi tạo và source battle đầu tiên. Hợp các đường dẫn lịch sử có 719 file; file bị xóa duy nhất là atlas idle Lục Ảnh đã chuyển sang ghép từ `asset-sources/`. Không tìm thấy pack combat riêng cho tám tướng legacy còn lại trong phạm vi này. Đây là kết luận về lịch sử repo có thể truy cập, không phải khẳng định chúng chưa từng tồn tại trong máy riêng của tác giả.

Không tạo VFX/SFX/voice mới, không vẽ bù asset. Source asset giữ nguyên byte. Các bản `ready-v1`, `ready-mobile-v1` là derivative do pipeline sẵn có tạo; không được gọi chúng là asset mới do task này sáng tác.

## Phân loại roster chính thức

A = AUTHORED FULL trong phạm vi action canonical đã có: file thật, owner thật, draw/audio và action browser đã quan sát. A **không** có nghĩa mọi tướng đều có voice riêng.

B = AUTHORED PARTIAL: còn một đường authored legacy chưa bind production. C = GENERIC ONLY: có gameplay/runtime generic nhưng chưa tìm được pack skill riêng. D = DESIGN ONLY: chỉ có brief/ID, không có action runtime. Không tướng playable nào ở D; nhiều **ID hiệu ứng/âm thanh** vẫn ở D.

| Tướng | Nhóm duy nhất | Basic / Skill / Ultimate live | Audio/voice riêng |
|---|---|---|---|
| Lục Ảnh | A | Authored / authored / authored; browser PASS | SFX chung; voice Ultimate MP3 thật đã phát |
| Đình Lôi | A | Authored / authored / authored; browser PASS | SFX chung; chưa tìm voice combat riêng |
| Ông Phở | A | Embedded 11 / embedded 15 / sheet 64; browser PASS | SFX chung; `hammer-keng` là design-only |
| Thầy Mo | B | Basic v2, Skill và Ultimate production đều PASS | SFX chung; chưa tìm voice riêng. Bộ Basic legacy “Ấn Trấn” vẫn là QA, không giả nhận đã bind live |
| Linh Đồng | A | ATK / alias ATK / Ultimate; browser PASS | `atk.wav`, `ult.wav`; chưa tìm voice riêng |
| Bạch Diện | A | ATK / alias ATK / Ultimate; browser PASS | `atk.wav`, `ult.wav`; chưa tìm voice riêng |
| Lạc Yên | C | Generic / generic nâng cấp / generic | SFX chung; ID skill trong kit không phải file |
| Cung Thủ Tre | C | Generic / generic nâng cấp / generic | SFX chung; chưa tìm voice riêng |
| Cô Đào Gánh Hội | C | Generic / generic nâng cấp / generic | SFX chung; chưa tìm voice riêng |
| Phong Tử | C | Generic / generic nâng cấp / generic | SFX chung; chưa tìm voice riêng |
| Thủy Nương Rối Nước | C | Generic / generic nâng cấp / generic | SFX chung; chưa tìm voice riêng |
| Hồng Liên Đao Nương | C | Generic / generic nâng cấp / generic | SFX chung; chưa tìm voice riêng |
| Thạch Quyền | C | Generic / generic nâng cấp / generic | SFX chung; chưa tìm voice riêng |
| Tố Điệp | C | Generic / generic nâng cấp / generic | SFX chung; chưa tìm voice riêng |

Tám tướng C có portrait/showcase/skill seal thật. Những hình UI này không chứng minh có animation hoặc VFX combat riêng. Browser action riêng của tám tướng C trong đợt này: **NOT_RUN**; phân loại dựa vào audit file + owner generic.

## Mapping file cho từng action

Mọi đường bên dưới tương đối từ gốc repo. SFX B/S/U lần lượt là ba WAV chung ở bảng audio. Ông Phở có hiệu ứng trong chính frame sheet và presentation legacy; không có bằng chứng file projectile/impact tách riêng của ông.

| Owner / action | Animation thật | VFX / projectile / impact thật | SFX live | Ghi chú |
|---|---|---|---|---|
| Lục Ảnh Basic | `assets/characters/luc-anh/basic-atlas.webp` | `assets/characters/luc-anh/basic_projectile-atlas.webp`; `assets/characters/luc-anh/basic_impact-atlas.webp` | B | Đã thấy cả ba atlas vẽ |
| Lục Ảnh Skill | `assets/characters/luc-anh/skill1-atlas.webp` | `assets/characters/luc-anh/skill1_vfx-atlas.webp` | S | VFX kết hợp; không bịa thêm impact riêng |
| Lục Ảnh Ultimate | `assets/characters/luc-anh/ultimate-atlas.webp` | `assets/characters/luc-anh/ultimate_vfx-atlas.webp` | U + voice MP3 | Voice bridge phát file thật |
| Đình Lôi Basic | `assets/characters/dinh-loi/basic-cast-atlas.png` | `assets/characters/dinh-loi/basic-projectile-atlas.png`; `assets/characters/dinh-loi/basic-impact-atlas.png` | B | Cold-load đã có đủ projectile/impact |
| Đình Lôi Skill | `assets/characters/dinh-loi/skill1-cast-atlas.png` | `assets/characters/dinh-loi/skill1-wave-atlas.png`; `assets/characters/dinh-loi/skill1-impact-atlas.png`; `assets/characters/dinh-loi/skill1-shield-atlas.png` | S | Shield được quan sát tiếp trong trận |
| Đình Lôi Ultimate | `assets/characters/dinh-loi/ultimate-cast-atlas.png` | `assets/characters/dinh-loi/ultimate-vfx-atlas.png`; `assets/characters/dinh-loi/ultimate-impact-atlas.png` | U | Atlas được giữ đến recovery |
| Thầy Mo Basic v2 | `assets/characters/thay-mo/skill1-cast-v3204-atlas.png` | `assets/characters/thay-mo/skill1-wave-v3205-atlas.png`; `assets/characters/thay-mo/skill1-impact-v3206-atlas.png` | B | Mapping “Chuông Chấn Phách” của kit hiện tại |
| Thầy Mo Skill | Cùng cast v3204 trên | Cùng wave v3205 + impact v3206 trên | S | Action nâng cấp; không phải một pack mới |
| Thầy Mo Ultimate | `assets/characters/thay-mo/ultimate-cast-v3210-atlas.png` | `assets/characters/thay-mo/ultimate-vfx-v3212-atlas.png` | U | Giữ timing/frame nguồn; vòng bind thủ tục đã có trong QA cũ không được nhận là bitmap authored mới |
| Ông Phở Basic | `assets/battle-runtime/embedded-11.png` | Có trong sheet + presentation legacy hiện hành | B | Basic live hiện dùng sheet 11, không gán nhầm sheet 15 |
| Ông Phở Skill | `assets/battle-runtime/embedded-15.png` | Có trong sheet Skill1 | S | Build phục hồi dữ liệu PNG có checksum đúng; browser đã vẽ |
| Ông Phở Ultimate | `assets/characters/ong-pho/ultimate-sheet-64-alpha-clean-v310.png` | Có trong sheet Ultimate + owner legacy | U | Đã quan sát 64 frame khác nhau |
| Linh Đồng Basic/ATK | `assets/characters/linh-dong/basic-atlas.webp` | `assets/characters/linh-dong/skill1_vfx-atlas.webp` | LD-ATK | URL browser desktop là `assets/characters/linh-dong/ready-v1/` + cùng basename |
| Linh Đồng Skill/Skill1 | Cùng ATK | Cùng ATK | LD-ATK | Manifest legacy tồn tại; **không có action Skill1 độc lập live** |
| Linh Đồng Ultimate | `assets/characters/linh-dong/ultimate-atlas.webp` | `assets/characters/linh-dong/ultimate_vfx-atlas.webp` | LD-ULT | Cùng derivative `ready-v1/` ở desktop |
| Bạch Diện Basic/ATK | `assets/characters/bach-dien/basic-atlas.webp` | `assets/characters/bach-dien/skill1_vfx-atlas.webp` | BD-ATK | Một VFX kết hợp, không có projectile/impact riêng |
| Bạch Diện Skill/Skill1 | Cùng ATK | Cùng ATK | BD-ATK | Manifest legacy không tạo ra action live thứ ba |
| Bạch Diện Ultimate | `assets/characters/bach-dien/ultimate-atlas.webp` | `assets/characters/bach-dien/ultimate_vfx-atlas.webp` | BD-ULT | Mixed idle pins trước đây làm action không bắt đầu; đã sửa |

Idle/run/hit/fall: Lục Ảnh, Đình Lôi, Linh Đồng và Bạch Diện có bộ thật trong cùng thư mục. Lục Ảnh idle runtime desktop dùng `idle-rgba-v1-battle-atlas.webp` do pipeline ghép nguồn. Thầy Mo có `idle-v3193-atlas.png`, `hit-v3218-atlas.png`; không bịa bộ run/fall riêng. Ông Phở: idle `embedded-12.png`, hit `embedded-13.png`, fall `embedded-14.png`. Fall đã giải mã hợp lệ nhưng chưa ép chết Ông Phở trong browser của đợt này.

## Audio thật và design-only

| Mã trong bảng | File thật | Owner đang gọi |
|---|---|---|
| B | `assets/audio/sfx/201800_se_atk.wav` | `HonVietSfx.play('basic')` |
| S | `assets/audio/sfx/201800_se_s1.wav` | `HonVietSfx.play('skill')` |
| U | `assets/audio/sfx/201800_se_s2.wav` | `HonVietSfx.play('ultimate')` |
| LD-ATK | `assets/audio/sfx/linh-dong/atk.wav` | `linh-dong-atk` |
| LD-ULT | `assets/audio/sfx/linh-dong/ult.wav` | `linh-dong-ult` |
| BD-ATK | `assets/audio/sfx/bach-dien/atk.wav` | `bach-dien-atk` |
| BD-ULT | `assets/audio/sfx/bach-dien/ult.wav` | `bach-dien-ult` |
| Voice combat | `assets/audio/voice-luc-anh-ultimate.mp3` | Lục Ảnh Ultimate; HTMLAudio `playing`, không muted, volume 1 |
| Voice ngoài combat | `assets/audio/voice-luc-anh-hero.mp3` | Hero detail; không dùng để nhận đã đủ voice chiến đấu |
| Âm thanh khác | `assets/audio/sfx/400500_se_s1_beaten.wav` | `forge-reveal`; không phải SFX riêng của tướng |

Các OGG Linh Đồng tồn tại trong lịch sử/asset nhưng đường live hiện kiểm là WAV. `ong-pho.hammer-keng`, `luc-anh.ultimate-voice-impact` có `needs-user-created` trong kit: đây là **design ID**, không phải tên file. MP3 Ultimate Lục Ảnh là một file riêng đã tồn tại; không dùng nó để giả nhận mọi design brief đã hoàn thành. Chưa tìm combat voice riêng của các tướng khác trong phạm vi lịch sử đã audit.

## Asset từng tồn tại nhưng chưa được gọi đúng

1. Thầy Mo: production bị khóa sau QA; cuối build còn fail anchor vì owner movement đã gộp nhánh return. Sửa patch theo **hai** nhánh QA thực còn lại, đặt sau owner formation cuối; chờ ảnh decode trước action; phát SFX ở release thật. Không thay timing/frame gốc.
2. Bộ Basic legacy Thầy Mo `basic-cast-v3198-atlas.png`, `projectile-v3201-atlas.png`, `impact-v3200-atlas.png` vẫn tồn tại cùng frames JSON. Nó là đường QA “Ấn Trấn”, không phải Basic v2 live; không tự đổi kit để ép dùng lại.
3. Lục Ảnh/Đình Lôi: atlas có thật nhưng action lạnh có thể chạy hết trước khi decode; VFX còn bị bỏ khi RAF timestamp sớm hơn thời điểm tạo effect. Chờ readiness, giữ working set qua recovery, giữ effect đang chờ frame đầu. Không thêm hình hay đổi duration.
4. Bạch Diện: hai idle Linh Đồng/Bạch Diện bị pin chiếm cache, Ultimate không đủ chỗ. Nhả idle pin trước action lease; không repin trong action; idle iOS vẫn evictable.
5. Ông Phở: `embedded-14.png` và `embedded-15.png` đã hỏng IDAT ngay trong commit khởi tạo. Đã tìm hiệu chỉnh một byte duy nhất ở mỗi file khôi phục **CRC PNG lưu sẵn và Adler32 zlib lưu sẵn**, kiểm SHA trước/sau và strict decode. Build sửa bản trong `dist`; nguồn repo không đổi. Không nội suy, không resample, không sinh ảnh.

`embedded-03/04` là sheet vai trò phe ta/địch; `05..10` là guardian/ranger/healer/striker/duelist/mystic. Đã xem contact sheet, không mặc định mọi embedded là generic: **11..15 thuộc Ông Phở**. Không tìm thấy tám pack riêng bị giấu trong những sheet này hoặc data URI của battle khởi tạo.

PNG UI `assets/ui/menu-v3233/icons/friends.png` còn lỗi/truncated; không sửa trong task combat. Không gọi toàn bộ cây asset đều giải mã tốt chỉ vì SHA đúng.

## Browser evidence và cách đọc PASS

File trong `docs/qa/authored-restore-20260926/` ghi successful `drawImage` (URL, số lần vẽ, các frame, mốc đầu/cuối), kết quả playback thật từ bus/HTMLAudio, trace start/release/impact/recovery/complete và vị trí trước/sau. Bấm nút QA gọi **performAction production**, chỉ fixture máu/nộ cao và chọn actor; không giả renderer hoặc phát file ngoài action để lấy PASS.

- `browser-2793-evidence.json`: 9 action Lục Ảnh/Đình Lôi/Ông Phở trên commit `2793ea4`; VFX và SFX đã hiện. Lục Ảnh voice chưa được chứng minh trong lần này.
- `browser-aca94-evidence.json`: Thầy Mo 3 action, hai S+ 6 nút (gồm 2 alias), Lục Ảnh Ultimate kiểm lại và voice MP3 **PASS**.
- `browser-f72-evidence.json`: giữ kết quả FAIL cũ do atlas/clock/observer; không xóa để biến lịch sử thành toàn PASS.
- `browser-action-matrix.json`: tổng hợp lần kiểm mới nhất, mỗi owner/action một dòng, kiểm frame thật/SFX/trace/return; có timestamp và revision gốc.

PASS ở đây là luồng đã thấy asset/audio/recovery. Không phải chứng nhận mọi frame đúng ở 60 FPS, không phải chứng nhận SFX đồng bộ từng sample. Legacy Lục Ảnh/Đình Lôi/Ông Phở vẫn phát SFX theo vị trí gọi gốc (thường đầu cast); marker `release` legacy có thể được ghi gần impact. Thầy Mo và hai S+ có marker clock riêng. Các mốc `firstMs` của atlas là bằng chứng trực tiếp về lần vẽ, không dùng marker cũ để giả khẳng định timing tuyệt đối.

## Build, test và giới hạn nghiệm thu

- `npm run build`: đã hoàn tất thật, Thầy Mo patch qua anchor, generated battle có owner production. Các inline script được parse riêng bằng `vm.Script`.
- Focused restore tests: **31/31 PASS**. Controller QA: **32/32 PASS**.
- Full `npm test`: xem `test-summary.json` và log trong thư mục evidence. **Không coi full suite PASS khi còn assertion thất bại.** Một số test vẫn đòi base64 iframe mặc dù main đã chuyển sang `battle.html`; một số fixture âm thanh/movement thiếu owner mới. Không sửa combat/save/reward để chiều test.
- Browser desktop Chromium: 18/18 nút action có evidence. Mobile là iframe Chromium 390×844 khởi tạo lại trận ở kích thước này, không giả user agent iOS. Lần đổi kích thước giữa trận ban đầu có draw nhưng nhân vật ngoài khung: FAIL_VISUAL, đã giữ trong mobile notes và không tính PASS. Sau Reset thấy lại 12 nhân vật; một số sprite ngoài mép trái/phải bị cắt bởi bố cục hiện hành. Task này không sửa formation/scale, không gọi mobile layout đạt đầy đủ. Memory profile Safari chưa được kiểm.
- **Physical iPhone/iPad/Safari: NOT_RUN.** Cần kiểm cold load 6v6, mọi action, audio unlock/mute/thoát trận, hồi vị trí, low-memory reload. Không lấy desktop PASS thay thế.
- Native action Đình Lôi có working set nguyên gốc tới khoảng 94.92 MiB. Action lease tạm giữ đúng các atlas cần thiết thay vì để trần native 64 MiB đẩy VFX ra cache; cap bình thường không đổi. Chưa có số đo peak RAM trên iPhone thật.

Không merge main. PR ở REVIEW/Draft cho đến khi xử lý gate test còn đỏ và chủ dự án yêu cầu merge.

## PR và lịch sử đã đối chiếu

Đã xem các PR quanh owner/asset: #2, #3, #61, #132, #133, #136, #140, #147, #150, #175, #178, #196, #198, #202, #205, #207, #226, #229, #230, #231. #229/#230 thuộc branch QA riêng chưa merge, không lấy kết quả của chúng làm evidence của branch này. Commit đầu `5d612521d4bb19b2e96dee5e37b3855157ab98da` đã chứa các embedded Ông Phở với byte lỗi; không tìm được bản lịch sử sạch để thay bằng file khác.

Workflow: vibe-builder/vibe-lab, run `20260926-125653-dkfotee`; ticketctl không khả dụng, không giả claim/lock hoặc trạng thái DONE. Evidence RED/GREEN và scope được lưu để review; board không được cập nhật thay người có quyền.

## Phụ lục roster S+ catalog/lab

Catalog có 43 identity (42 + Bạch Diện); Linh Đồng và Bạch Diện đã nằm trong roster chính thức. 41 identity dưới đây không có pack combat riêng trong audit; dùng fallback generic S+ của PR #231. Cùng với 14 chính thức là **55 identity duy nhất**. Không nhận portrait/profile/126 skill icon là animation combat.

| Identity | Tên | Nhóm | Basic / Ultimate / voice | Browser |
|---|---|---|---|---|
| `hero_splus_co_trong` | Cơ Trọng | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_cuong_dong` | Cường Đồng | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_lac_an` | Lạc An | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hac_pha` | Hạc Phá | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_thiet_lanh` | Thiết Lãnh | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_minh_toa` | Minh Tỏa | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_thiem_ngan` | Thiềm Ngân | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_tieu_hon` | Tiêu Hồn | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_thach_kinh` | Thạch Kinh | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_han_nuong` | Hàn Nương | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_vong_co` | Vọng Cơ | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_co_nuong` | Cổ Nương | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_muc_chieu` | Mục Chiêu | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_thuy_co` | Thủy Cơ | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_ha_lang` | Hà Lãng | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_giang_quan` | Giang Quân | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_thuy_ngoc` | Thủy Ngọc | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hai_phong` | Hải Phong | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_tram_chau` | Trầm Châu | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_da_xoa` | Dạ Xoa | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_nung` | Nung | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hoa_tieu` | Hỏa Tiêu | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hoa_khieu` | Hỏa Khiêu | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_cuu_tinh` | Cửu Tính | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hoa_bai` | Hỏa Bài | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hac_dao` | Hắc Đao | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hoa_duc` | Hỏa Dực | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_mien_nuong` | Miên Nương | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_tram_tue` | Trầm Tuệ | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hac_hoa` | Hạc Hoa | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_tam_nuong` | Tằm Nương | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_son_cuong` | Sơn Cương | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_tue_y` | Tuệ Y | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_mang_xa` | Mãng Xà | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_khaos` | Khaos | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_kinh_nuong` | Kính Nương | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_hoi_anh` | Hồi Ảnh | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_van_phap` | Vân Pháp | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_cuu_trieu` | Cửu Triều | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_thach_mong` | Thạch Mộng | C | Generic / generic / chưa tìm file voice | NOT_RUN |
| `hero_splus_to_linh` | Tố Linh | C | Generic / generic / chưa tìm file voice | NOT_RUN |

## Gate test còn đỏ

Kết quả đầy đủ cuối: **1315 tests, 1300 PASS, 15 FAIL** (`VIPS_CONCURRENCY=1 npm test`; giới hạn decode build, không đổi output runtime). Không coi tất cả 15 lỗi là baseline đã chứng minh; chưa chạy đối chứng toàn bộ trên commit cha riêng biệt. Tên assertion còn lỗi được giữ nguyên:

- result music cannot resume after stop while waiting for audio unlock
- built close owner stops both parent buses and the child before blanking the iframe
- built BGM route uses the shared music bus for screen transitions
- L158-T4: closeOverlay restores host BGM after ending the battle bus
- L158-T5: hunt overlay observer does not pause the unlocked host combat player
- final battle gates the real action before energy debit and keeps the same iframe payload
- campaign iframe and standalone battle contain exactly one identical movement owner
- L24-D3: sharp stays off the production install
- L24-D2: embedded battle payload still matches the built battle file
- built battle keeps opaque canvas and stable camera; all inline JS parses
- QA full access bypasses campaign progression gates without changing the normal-route gate owner
- result motion is installed after readiness and before iframe sync
- the embedded battle engine is byte-identical to battle.html
- battle bridge protocol annotates every parent message and remains syntactically valid
- final generated living-actor return awaits the movement owner for all four branches

## Checkpoint giao review

Runtime `5c009474ae8be7b36c1cd308cae61623df6ff16b` đã Vercel READY; `browser-5c009-smoke.json` kiểm lại Ultimate Thầy Mo/Bạch Diện. QA viewport `1c10ecf258f942b48dde8601520c79d373077a25`, auto-reset fix `49d5e3c5f3a672ca8b8321aa6cc852b48b3a4cf4` (21/21 lifecycle tests). `browser-mobile-evidence.json` giữ 5 lượt resize sai fixture và 6 Ultimate sau reset; chỉ 6 lượt sau được nhận runtime/audio PASS. Ảnh `authored-mixed-preview.jpg` và `thay-mo-mobile-after-reset.jpg` là ảnh browser thật, không ảnh sinh. Xem head/deployment cuối trong PR #231; commit docs cuối không sửa runtime.
