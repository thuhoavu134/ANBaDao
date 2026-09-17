## 17/09 — TKT-0158: audio trận phát cùng game

Owner: tab iPhone sống sau TKT-0157 nhưng Hiệp 01 câm. Host không mở loa combat trong cử chỉ Xuất chiến; iframe `HTMLAudio` autoplay bị chặn; fallback 1.8s `location.assign` phá AudioContext.
Patch dist: unlock + `playBgm('combat')` trên host, iframe nhờ parent, `enterFallback` chỉ đổi chữ, `hushParentBgm` không pause.
Safari/iPhone NOT_RUN. Chờ owner `live` rồi `git pull && vercel --prod`.

## 17/09 — TKT-0157: iOS trận chết tab vì atlas S+

Owner gửi video Hiệp 01: tướng ra sân, Bạch Diện chiêu, màn đen, Chrome «Không thể mở trang này».
Linh Đồng idle vẫn 77 MiB; Bạch Diện Ultra v5 ~29 MiB; campaign-lite ~84 MiB còn giữ dưới iframe trận.
Downsample atlas >32 MiB về 0.5, nhả ATK/VFX hết chiêu, `purge` Chinh chiến ngay khi overlay mở.
LIVE #156 `ef2af5e`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

## 17/09 — TKT-0160: 3Q-derived campaign resource lifecycle (branch only)

- Studied the static 3Q Laya H5 source: replay-driven preload, model/effect dedupe, queued pack loading, caller ownership/ref-count and delayed cleanup.
- Added a clean-room `campaign-resource-pack-cache` with bounded decoded bytes, max loading, shared keys and delayed scope release.
- Bày trận now uses generated `campaign-lite` atlases for the preview surface and reserves the native Ultra v5 assets for Battle. This tier is a Lục Thần adaptation, not a claimed 3Q feature.
- Six managed campaign-lite assets total ~84.6 MiB decoded under a 96 MiB campaign budget. Local focused/full verification is being run before PR. Main has not been changed.

## 17/09 — Fix Bạch Diện Ultra v5 Bày trận flicker

- Root cause: `src/ui/campaign-scene.js` still read the old 94-frame/8-column contract after the Ultra v5 atlas replacement. This sent Canvas source rectangles outside the 32-frame idle and 45-frame run atlases, making Bạch Diện appear/disappear.
- Fix: Bày trận metadata now uses idle `32 frames / 6 cols` and run `45 frames / 6 cols`; pivot/foot/body remain unchanged.
- Evidence: all Ultra v5 atlas frames have non-empty alpha; focused runtime suite and full `npm test` pass.
- Main commit pending this verification: direct-main fix after `a68701b`; no combat numbers changed.

## 17/09 — Direct main rollback to Bạch Diện Ultra v5

- Extreme v6 was rejected in the actual game visual review because aggressive frame thinning caused visibly poor motion. Replaced the 8 Bạch Diện runtime atlases on `main` with the preserved Ultra v5 sampling: **269 frames**, native 480×440 character / 440×248 VFX cells.
- Canonical Canvas Sprite Runtime and hero/roster contracts remain unchanged; only asset atlas content, runtime metadata version, and matching regression expectations changed.
- Focused Bạch Diện runtime tests: 10/10 PASS. Full `npm test`: EXIT 0.
- Rollback checkpoint before this direct-main change: `226e99b` (`backup/main-pre-ultra-v5-20260917` local).
- Production deploy: not run.

## 16/09 — TKT-0156: Bạch Diện tướng đầy đủ

Owner: extras TKT-0155 làm mất Linh Đồng, Bạch Diện không vào hồ sơ. DATA.heroes + roster chính thức + kit v2 + idle canvas. Ô 1 Bạch Diện, ô 2 Linh Đồng. Chạm mở hồ sơ, không trận QA.
LIVE #152 `85a35d5`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

## 16/09 — TKT-0155: Hiện thẻ Bạch Diện trên Tướng

Owner chưa thấy tướng mới. Extra card portrait trên Tướng/Đồ Giám, chạm mở trận S+ authored. Không vào roster 12, không DATA.heroes, lưới 42 giữ.
LIVE #151 `7a700e9`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0154: Bạch Diện Canvas Sprite Runtime

Bind pack q90-480. Catalog alias, atlas native, SFX wav, trận 477×440, S+ token. Không Spine, không mở roster 12, không đổi lưới 42.
GREEN L152 7/7 + L154 6/6 + npm test 1030/1030. Chrome idle/ATK/Ultimate desktop + 390×844. Safari/iPhone NOT_RUN.
LIVE #150 `aedd4cb`. #148 TKT-0152 closed. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0153: Chinh chiến đi đường Linh Đồng Run

Owner gửi ảnh Ấn Phố đội đang đi. `specForAfk` nối `run-atlas.webp`. Bày trận vẫn Idle. Safari NOT_RUN. LIVE #149 `7c70c69`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0152: Bạch Diện extra S+ (cơ chế)

Khóa bible Bạch Diện Thần Quân. Extra ngoài lưới 42. Hỷ/Nộ, Thế Thân, S1 máu thấp 240%, Ult 100 Nộ cắp Công. Ảnh tham chiếu + 8 prompt chroma. Roster 12 đóng. LIVE cùng #150.


## 15/09 — TKT-0151: Canvas Sprite Runtime


Catalog + lazy loader + LRU decoded 128 MiB + renderer metadata. Linh Đồng native 480×440, trận 477×440. Boot chỉ idle; ATK/VFX khi ra chiêu. Không Spine, không đổi công thức.
GREEN 1014/1014. LIVE #147 `e8cd581`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0150: trận hiện VFX và SFX

Không nén diễn hoạt 80ms. Atlas Linh Đồng load sẵn. SFX lần đầu không bị bỏ vì tải chậm.
GREEN 992/992. LIVE #146 `7baca81`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0149: trận một tướng xong mới đến tướng kia

Trận thường 1×, không nén 0.45. Nghỉ giữa lượt 480ms. Auto chờ hành động xong. Không đổi công thức/tốc/AI.
GREEN 988/988. LIVE #145 `506a7f8`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0148: địch Bày trận quay trái + Tướng cuộn được

Bày trận lật mọi địch, kể cả bản trùng. Lưới tướng cuộn; thanh icon không đè thẻ cuối.
GREEN 984/984. Ảnh owner. LIVE #144 `5de296f`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0147: Ải 1-2 không còn khóa sau thắng ải trước

Chinh chiến dùng con trỏ ải đã thắng để mở ải kế. Ghi mốc thắng theo ải đang đánh, không phụ thuộc mã trận lệch.
GREEN 982/982. Ảnh owner Ải 1-2 khóa. LIVE #143 `4e61e58`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0146: S+ Linh Đồng dùng cùng clock ATK/Ultimate

Trận thử S+ không còn `sleep(linhDur)` × 0.35 (ATK 524 / Ult 693). `performSplusAction` đi clock chung: release → emit VFX/SFX → impact một lần → recovery. Thanh S+ Linh Đồng chỉ nội tại + tuyệt kỹ. Hurt reset idle. `timingScale` 0.35 của 41 tướng S+ kia không đổi.
RED L146-T1/T2 fail → GREEN 3/3 + npm test 979/979. Chrome 390×844 ATK wall 1506ms. Safari NOT_RUN. LIVE #142 `c517cd8`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0145: Clock animation/VFX/SFX Linh Đồng

ATK và Ultimate dùng một elapsedMs. VFX cắt ở recovery, không chạy 4s. SFX wav HonVietSfx. Không đổi BETS/loot/công thức.
GREEN presentation + static + npm test 976/976. CI Build and test PASS. LIVE #140 `00a6e2c`. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0144: giảm bộ nhớ Linh Đồng và sửa ảnh trên sân

Loại bỏ tải sẵn atlas ở host/trận; cache theo URL tối đa 112 MiB RGBA ước lượng, 2 ảnh tải đồng thời, giải phóng khi rời màn. Bày trận/Chinh chiến dùng idle toàn thân thay bust; fallback khi clip chưa sẵn sàng; hồ sơ giữ tỷ lệ và dừng vẽ khi rời màn. Không đổi art gốc/save/combat/kinh tế.
RED 8 lỗi → GREEN 8/8 → focused 46/46; CI 970/970. LIVE #138 `645902f`. L144-P1 Chrome BLOCKED; Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0143: Thay pack Linh Đồng Blender rekey

Owner: dùng pack Drive mới thay asset Linh Đồng. Blender Compositor Keying, hết viền xanh. Cell 347×320, trận 477×440. Không đổi BETS/loot/công thức.
RED L143-T1…T4 fail → GREEN 4/4 + npm test 962. Chrome 390×844 L143-P1 PASS. Safari NOT_RUN. LIVE #137 `a39b587`. Owner tự `git pull && vercel --prod`.


## 14/09 — TKT-0142: Gắn tỷ lệ trận + VFX/SFX Linh Đồng

Owner: tỷ lệ hình trận, VFX, SFX chưa gắn đúng pack authored. Cell 328×320 × 330/240 → 451×440, VFX source-over, SFX wav qua HonVietSfx. Không đổi BETS/loot/công thức.
RED L142-T1…T5 fail → GREEN 5/5 + npm test 958. Chrome 390×844 L142-P1 PASS. Safari NOT_RUN. LIVE #136 `2dba572`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0141: Linh Đồng tướng đầy đủ như Lục Ảnh

Owner: tích hợp Linh Đồng vào toàn bộ tính năng giống các tướng khác, y hệt Lục Ảnh. DATA.heroes + roster chính thức + kit v2 + hồ sơ idle + trận campaign atlas. Không đổi BETS/loot/công thức 12 tướng cũ. Không mở 42 S+ còn lại.
RED L141-T1…T5 fail → GREEN 6/6 + npm test 953. Chrome 390×844 L141-P1 PASS. Safari NOT_RUN. LIVE #135 `8a79dcc`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0140: Hiện thẻ Linh Đồng trên Tướng và Đồ Giám

Owner iOS: Tướng và Đồ Giám 12/12 không có Linh Đồng. Thẻ extras preview, chạm mở trận thử. SUPERSEDED bởi TKT-0141 / #135 — Linh Đồng là tướng chính thức.

## 14/09 — TKT-0139: Bind Linh Đồng authored animation, VFX, SFX

Owner: lấy pack Drive RGBA isolated-pass tích hợp vào trận thử S+. Atlas lưới đồng nhất 328×320 char / 320×180 VFX, không crop từng frame, không key đen. Portrait đồ giám. Roster 12 đóng. Cược/loot/công thức không đổi.
RED 6 fail → GREEN 6/6 L139 + npm test 944. Chrome L139-P1 PASS. Safari NOT_RUN. LIVE #133 `6215a85`. Owner tự `git pull && vercel --prod`.

## 14/09 — Hướng dẫn Animation / VFX / SFX tướng

Owner khóa quy chuẩn chroma `#00FF00`, isolated pass, 8 template + mẫu Linh Đồng. File [docs/HUONG-DAN-ANIMATION-VFX-SFX.md](./HUONG-DAN-ANIMATION-VFX-SFX.md). Không đổi runtime/cược/loot. LIVE #132 `7d6fb93`.

## 14/09 — TKT-0138: Vệt sáng loop mượt, không khựng

Owner: vệt khựng loop. Bỏ hold 78%, 0→100% translate3d + fade hai đầu. 1.5s. Vệt trắng. Cược/loot không đổi.
RED 1 fail → GREEN 3/3 L138 + npm test 938. Chrome 390×844 L138-P1 PASS. Safari NOT_RUN. LIVE #131 `0cbb993`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0137: Vệt sáng trắng, không đường vàng

Owner: đừng đường vàng, là vệt sáng. Thanh chéo `#fff`, translate3d 1.5s. Ô hold không flood trắng. Cược/loot không đổi.
RED 1 fail → GREEN 3/3 L137 + npm test 935. Chrome 390×844 L137-P1 PASS. Safari NOT_RUN. LIVE #130 `ab75870`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0136: Vệt loáng là đường chéo chạy

Owner iOS (video 00:44): wash cả ô, không phải vệt. iOS không animate background-position. Thanh `rotate(45deg)` + `translate3d`, 1.5s/lần, clip trong ô. Cược/loot không đổi.
RED 1 fail → GREEN 3/3 L136 + npm test 932. Chrome 390×844 L136-P1 PASS. Safari NOT_RUN. LIVE #130 `ab75870`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0135: Sheen phủ hết ô trúng · 1.5s/lần

Owner iOS (IMG_7324): vệt loáng chỉ một góc nhỏ. Phủ `inset:0` chéo 135deg hết ô, 1.5s/lần. Không sheen lúc quay. Cược/loot không đổi.
RED 1 fail → GREEN 3/3 L135 + npm test 929. Chrome 390×844 L135-P1 PASS. Safari NOT_RUN. LIVE #129 `50fee93`. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0134: Quay sáng đều · ô trúng mới loáng

Owner iOS: vệt loáng đang hiện lúc quay, ô trúng lại sáng đều. Tắt `bbrSweep` khi quay; `bbrSheen` chỉ khi `is-hold`. Cược/loot không đổi.
RED 2 fail → GREEN 3/3 L134 + npm test 926. Chrome 390×844 L134-P1 PASS. Safari NOT_RUN. PR REVIEW. Owner gõ live rồi tự `git pull && vercel --prod`.

## 14/09 — TKT-0133: Ô trúng sheen chéo góc TL→BR

Owner iOS (IMG_7321): spotlight ổn, muốn đường sáng kéo từ trên-trái xuống dưới-phải, sáng loáng. Không pulse cả ô. `bbrSheen` infinite trên `:after` khi `is-hold`. Cược/loot không đổi.
RED 3 fail → GREEN 3/3 L133 + npm test 923. Chrome 390×844 L133-P1 PASS. Safari NOT_RUN. LIVE #127 `4cb1b79`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0132: Đổi sò pop nhỏ tự tắt · spotlight steady

Owner iOS: Đổi sò icon to + nút Nhận bất tiện; spotlight bập bùng khó chịu. Pop sò 48px tự tắt 1s, sò đã cộng, không nút. Ô trúng sáng đều, bỏ pulse. Cược/loot không đổi.
RED 3 fail → GREEN 3/3 L132 + npm test 920. Chrome 390×844 L132-P1 PASS. Safari NOT_RUN. LIVE #126 `7683ada`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0131: Spotlight dừng trên ô trúng

Owner: vòng quay kết thúc thì ánh sáng vẫn chiếu vật phẩm ấy, không tắt. Chờ Thưởng hoặc Đổi sò mới tắt. Quay tiếp thì ánh sáng đi tiếp từ `lastIdx`.
`paintDesk` gắn `is-hot is-win` đúng ô, vành `is-hold` (ô khác tối). Cược/loot không đổi.
RED 2 fail → GREEN 3/3 L131. Chrome 390×844 L131-P1 PASS. Safari NOT_RUN. LIVE #125 `32072ad`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0130: Đổi sò hiện icon sò cowrie, không ốc

Owner iOS: đổi sò ra icon ốc (`so-icon.jpg` / 🐚). `SO_IC` + overlay nhận dùng `assets/ui/festival/bbr/so.png` (cowrie túi Đạo cụ). Overlay `#hvSoFx` khung như rương. Không toast 🐚. Cược/convertQty không đổi.
RED 3 fail → GREEN 3/3 L130 + npm test. Chrome 390×844 L130-P1 PASS. Safari NOT_RUN. LIVE via #125 `32072ad`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0129: Chợ 2 ô, rương mở nắp chroma rồi loot

Owner iOS: Chợ Mộng grid Chợ Đêm + Shop điểm; bỏ icon shop trên màn quay BBR. Rương live còn hộp đen + loot sớm. Sprite RGBA 12×145 60fps (magenta key), nắp mở bung vàng rồi mới khung thưởng. Cược/shop giá không đổi.
RED 3 fail → GREEN 3/3 L129 + npm test 911. Chrome 390×844 L129-P1 PASS. Safari NOT_RUN. LIVE #123 `ab00dc7`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0128: Rương không đổi sò, điểm tự cộng, shop icon

Owner: trúng rương không được đổi sò; bỏ Nhận điểm, tự +1 điểm / 1 sò; Shop là icon cô gái; Quay to, dưới Thưởng + Đổi sò. Cược 2/10/50 và giá shop giữ.
RED 3 fail → GREEN 3/3 L128 + npm test. Chrome 390×844 L128-P1 PASS. Safari NOT_RUN. LIVE #122 `5815756`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0127: Hoạt ảnh mở rương rồi loot, nút ‹ về Thành Chính

Owner iOS: webp đứng hình nên không thấy bung nắp; ‹ không về hub vì hai #hvFestivalRoot. Video mp4 60fps từ PNG Blender, onended mới hiện khung thưởng. Capture ‹: đóng ô / navTo hub. Gỡ root trùng.
RED 2 fail → GREEN 3/3 L127 + npm test. Chrome 390×844 L127-P1 PASS. Safari NOT_RUN. LIVE #121 `93669c4`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0126: Hoa Đăng sáng, rương chroma-key 60fps, icon có khung

Owner: nền Hoa Đăng tối; diễn hoạt rương cần rung, ≥60fps, hút nền xanh, rương nhỏ, icon to có khung. Lamp brightness 1.28. Blender Keying node → PNG RGBA 60fps → webp alpha. CSS shake, stage 200px, khung 108px. Không đổi loot.
RED 3 fail → GREEN 4/4 L126 + npm test. Chrome 390×844 + 768×1024 L126-P1 PASS. Safari NOT_RUN. LIVE #120 `0cd2d76`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0125: Hoa đăng sông đêm, mở rương bung sáng, chữ banner đỏ

Owner: màn thả đèn nhạt; mở rương cần video bung nắp + icon thưởng; chữ trên banner khó đọc. Sông đêm + đèn nổi, overlay mp4 rương gỗ/Chí Bảo rồi icon loot. Chữ hero đỏ. Không đổi tỉ lệ rương.
RED 3 fail → GREEN 4/4 L125 + npm test 898. Chrome 390×844 + 768×1024 L125-P1 PASS. Safari NOT_RUN. LIVE #119 `05bed00`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0124: Hoạt lực cùng PNG, ô Bách Bảo Rương, hoa văn tâm vành

Owner: túi Hoạt lực ≠ vành; ô sự kiện thiếu chữ Rương; tâm vành trống. ART.hoat = `materials/hoat-luc.png` (bình đỏ). Tile `Bách Bảo Rương`. Tâm: khung son, rương chìm, chữ 寶 mờ. Cược/pay không đổi.
RED 3 fail → GREEN 4/4 L124 + npm test 890. Chrome 390×844 + 768×1024 L124-P1 PASS. Safari NOT_RUN. LIVE #118 `21d3736`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0123: vành Bách Bảo icon gần full ô

Owner screenshot: icon bé trong ô xám. Trim padding PNG, scale LANCZOS đều tỉ lệ 92% canvas, CSS n1 100% / n2 88% / n3 80%, stack absolute fill, `contain` không crop. Tinh vành = bình túi. Không đổi cược/pay.
RED 3 fail → GREEN 4/4 L123 + npm test 890. Chrome 390×844 + 768×1024 L123-P1 PASS (n1 ≥0.95). Safari NOT_RUN. LIVE #117 `36f824a`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0122: đồng vàng một PNG chung

Owner: vàng lệch giữa Thành chính (đồng tròn), Túi (thỏi), Bách Bảo (đống xu). Gộp về `assets/items/materials/gold.png`. Copy cùng bytes sang ví Chinh chiến + file BBR. Chip Chợ dùng img. Không đổi số vàng/cược.
RED 4 fail → GREEN 4/4 L122 + npm test 886. Chrome 390×844 + 768×1024 L122-P1 PASS. Safari NOT_RUN. LIVE #116 `2d14c58`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0121: túi đồ icon PNG đồng nhất, Hoạt lực bình đỏ

Owner screenshot Đạo cụ: emoji bé, Hoạt lực là đống lửa. Năm ô vàng/ngọc/tinh/hoạt/sò dùng PNG chung Rèn–Bách Bảo–HUD. Hoạt lực = bình lục giác giống Tinh, màu đỏ. Ô túi icon 92% cạnh. Chợ Tinh/Hoạt local path. Không đổi số lượng/công thức/cược.
RED 3 fail → GREEN 4/4 L121 + npm test 882. Chrome 390×844 + 768×1024 L121-P1 PASS. Safari NOT_RUN. LIVE #115 `472a9de`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0120: CSS popup đồ ôm nội dung

Owner screenshot Sách Tinh Thông: thẻ kem cao, khoảng trống giữa header và Cách nhận. Cắt `id="hvShopInfo"` (CSS Bách Bảo đệm padding), thẻ `height:auto` / `max-height:min(72dvh,540px)`, một mặt icon+sao+số lượng+Cách nhận+×. Chrome 390×844 PASS. Safari NOT_RUN. LIVE #114 `bb34ae3`. Owner tự `git pull && vercel --prod`.

## 13/09 — TKT-0119: icon Lễ Hội đúng hoạt động + popup Shop điểm

Owner gửi screenshot play: 3 ô Lễ Hội đang nhà isometric sai việc; Shop điểm Bách Bảo chỉ vài dòng chữ. Đổi tile Hoa Đăng / Bách Bảo / Rương Báu thành icon thả đèn, vòng quay, rương thật. Shop điểm mở overlay full-hall: ảnh chủ shop, ruy băng vàng, lưới 2 cột thẻ kem có icon + SL + tên + giá điểm (giá BBR_SHOP đóng băng 100/250/400/800/1500/3000). Panel quay giữ nút Quay. Không đổi cược/pity/công thức. Không 72 tướng.
RED 4 test thiếu data-fact/#hvBbrShop → GREEN 12/12 L119+L109+L98/L99+L42. Build PASS. Chrome 390×844 + 768×1024 L119-P1 PASS. Safari NOT_RUN. LIVE #113 `52e6577`. Owner tự `git pull && vercel --prod`.

## 13/09 — Gộp bản owner đã duyệt live: #111 + #112

#112 cấp người chơi đã merge tại147325b. Ghép #111 huy hiệu hai kiếm vào cùng cây nguồn, giữ đề xuất cấp đã chốt/implementation TKT-0118. Không quay lại trạng thái chờ chốt level. Kiểm tra bản kết hợp trước cập nhật main; Chrome390×844 BLOCKED (preview đăng nhập bị auto-review từ chối), Safari NOT_RUN. Owner tự deploy.

## 13/09 — TKT-0118: owner chốt cấp người chơi 1–60

Triển khai khóa108 ải theo cấp + thắng ải trước, giữ catalog lt_seal hiện có. Cấp tướng trần30 không đổi. EXP lần đầu/việc ngày-tuần/nhận rươngAFK ghép transaction cũ; migration cấp bù theo tiến độ, backup additive, clear keys chống nhậnEXP lại. UI cấp/EXP và đường rương/nhiệm vụ khi khóa. Sửa truyền Next qua2 wrapper lore và cursor replay. Chi tiết: docs/CAMPAIGN-LEVEL-PROPOSAL.md.
Tests domain + built owners kiểm gate trước hoạt lực, đủ108, migration3 save, duplicate/rollback/AFK cap và fractional carry. Full CI cần kiểm ở revision PR. Chrome390×844 vẫn BLOCKED do automatic approval review từ chối preview đăng nhập; Safari NOT_RUN. IN_PROGRESS/EVIDENCE, chưa merge/deploy. PR111 kiếm vẫn riêng, không hiểu «ok chốt» là live.

## 13/09 — TKT-0116: cơ chế AFK xuyên 6 chương

Owner duyệt cơ chế #109, main 305002f. Giữ hành quân cả đội, đánh bầy, damage/crit và loot về rương. Registry 6 world theo chapterIndex: Ấn Phố dùng art đã duyệt; 5 chương sau có map và quái khác silhouette. Waypoint được đặt sau khi xem từng ảnh, không dùng chung đường cũ. Chương mới reset clock và đổi cảnh lớn/minimap cùng nguồn; cùng chương không reset khi đổi ải. Chương chưa có cấu hình fallback Ấn Phố, cần bổ sung world trước khi phát hành chương mới.
5 map + 5 quái mới có prompt/metadata, RGBA giữ nguyên, pivot/bounds đo alpha 128 một lần; jelly/step/hover tách chuyển động. Không thay tướng, roster hoặc mở ticket NPC khác. Không thay thưởng/save/progression/combat.
RED 2 lỗi thiếu world resolver → GREEN 85/85 campaign/AFK; syntax và build PASS. Chrome 390×844 vẫn BLOCKED do automatic review từ chối preview đăng nhập; Safari NOT_RUN. Asset đã xem, UI runtime mới chưa nghiệm thu. VibeLab browser gate còn thiếu; ticket-file fallback, không claim giả. Chưa merge/deploy, chờ live riêng.

## 13/09 — TKT-0115: đội hành quân, đánh bầy và loot về rương

Tiếp từ main be983ff (#108 đã merge theo live của owner). Owner cho phép di chuyển bằng Idle tạm, thay quy tắc cũ chờ Run mới di chuyển. Camera theo tuyến đường 7 điểm trong map v3, quay lại liên tục không teleport; mini map đồng bộ cùng tọa độ. Cả đội đã lưu đánh đồng thời tối đa 4 quái, hai lượt Basic, giữ timing authored; thiếu Basic dùng gesture tạm.
Damage nảy, crit đỏ/cỡ lớn; hit timeline quyết định HP/death; loot rơi → nằm → bay về tâm rương đo từ HUD. Không cộng thưởng, ghi save, đổi tiến ải hoặc gọi combat scheduler. Dùng RAF/farmTime của scene, pause khi ẩn/Bày trận; reduced-motion tĩnh.
RED 3 fail trước implementation → GREEN 82/82 campaign/AFK tests (bao gồm camera/đội/quái trong 3 viewport và 12 chặng). Syntax PASS. Browser Chrome 390×844 vẫn BLOCKED do automatic approval review từ chối preview đăng nhập; Safari NOT_RUN. Không dùng tests toán thay nghiệm thu thẩm mỹ hoặc độ mượt. VibeLab runtime/browser gate chưa hoàn tất; ticket-file fallback, không claim giả.
PR mới, chưa merge/deploy. Chờ live riêng cho PR này sau khi owner xem.


## 13/09 — TKT-0114 AC12: farm chỉ diễn hoạt

Đội lấy từ savedSceneSquad. Quái rêu RGBA xuất hiện, nhún nhẹ, nhận đòn và tan; nghỉ rồi luân phiên tướng tiếp theo. Basic authored: Ông Phở/Thầy Mo/Đình Lôi/Lục Ảnh, giữ số frame và thời gian atlas; tướng còn thiếu Basic dùng nghiêng người nhẹ + tia tiếp xúc tạm, không coi là asset hoàn chỉnh. Tướng không bị thay bằng art mới. Quái riêng phục vụ yêu cầu này, không mở roster 72 hoặc các ticket NPC.
Dùng clock/RAF của cảnh, pause khi ẩn hoặc Bày trận, reset khi vào cảnh mới, reduced motion không chạy farm. Không chạm save/thưởng/tiến ải/combat scheduler; HP quái chỉ để vẽ. Run WAITING_ASSET.
RED 2 fail → GREEN 78/78 focused. Chrome 390×844 visual/actions BLOCKED do preview chuyển tới đăng nhập Vercel, automatic approval review đã từ chối. Safari NOT_RUN. Chưa xác nhận thẩm mỹ/độ mượt; IN_PROGRESS/EVIDENCE, không merge/deploy.

## 13/09/2026 — TKT-0114 bản đồ hành quân + mini map

Owner từ chối nền sân v2, yêu cầu bám góc nhìn bản đồ của video. Bản v3 nhìn từ trên xuống có đường nối cầu/làng/cổng; cảnh chính, mini map và bản đồ mở rộng dùng cùng một ảnh. Viewport và dấu đội dùng đúng phép chiếu; không mô phỏng tiến ải. Thiếu Run: giữ Idle và camera tĩnh.
76/76 test Chinh chiến/AFK PASS sau RED 2 lỗi thiếu map. Syntax PASS. Chờ CI revision mới. Chrome visual/actions vẫn BLOCKED do preview yêu cầu đăng nhập Vercel đã bị auto-review từ chối; Safari NOT_RUN. Chưa nghiệm thu thẩm mỹ.
Tiếp tục PR108, không merge hoặc deploy. AC11: mini map đồng nhất cảnh, mở/đóng được qua handler cũ. Thuật toán được kiểm thử; thao tác UI thật chưa được kiểm chứng.

## 13/09/2026 — TKT-0114 correction, browser gate pending

Owner rejected floating party and giant chest; Codex continues PR108 from 9ddec88.
New dedicated road-v2 background, explicit full-height canvas, cover-projected staggered feet; keep popup/claim/prepare behavior. Run WAITING_ASSET.
RED: 3 grounding tests fail; GREEN/regression: 74/74. Syntax and build PASS.
Local full suite: 780/831 PASS, 51 FAIL in partial asset checkout; use remote CI to determine complete-checkout result. No tests disabled.
Cloud browser cannot access local preview; hosted PR preview redirected to Vercel login and auto-review rejected dashboard access. Chrome visual/actions PENDING; Safari NOT_RUN. No claim of visual PASS. No merge/deploy.
Evidence: docs/qa/L114-CAMPAIGN-AFK-UI/correction-contract.md and correction-*.tap.

## 13/09/2026 — Wave X TKT-0114 REVIEW

Chinh chiến: cảnh đội chiếm màn, rương fab + popup, pill ải. Idle trên đường. Run WAITING_ASSET.

## 13/09/2026 — HANDOFF 06:07 +07

Snapshot [docs/HANDOFF-2026-09-13.md](HANDOFF-2026-09-13.md) · prompt [docs/AGENT-PROMPT.md](AGENT-PROMPT.md). Main `92e6708`. PR mở: không.

## 13/09/2026 — Wave W LIVE #107

Owner gõ live. Squash [#107](https://github.com/bktimmy247/luc-than/pull/107) `7fae34c`. Icon vành đủ hình, S+ đỏ đủ màu.

## 13/09/2026 — Wave W LIVE #105–#106

Owner gõ live. Squash [#105](https://github.com/bktimmy247/luc-than/pull/105) `be059da` · [#106](https://github.com/bktimmy247/luc-than/pull/106) `b7cb9e2`.

Phóng hình bình/vàng/ngọc. Huy hiệu S+ đỏ / S / A / B, icon hệ nhỏ.

## 13/09/2026 — Wave V LIVE #104

Owner gõ live. Squash [#104](https://github.com/bktimmy247/luc-than/pull/104) `b996606`. Thẻ tướng viền vàng, lớp mờ bụng, S+/sao/phái.

## 13/09/2026 — Wave V LIVE #103

Owner gõ live. Squash [#103](https://github.com/bktimmy247/luc-than/pull/103) `e856d38`. Icon vành to vừa ô.

## 13/09/2026 — Wave V LIVE #101–#102

Owner gõ live. Squash [#101](https://github.com/bktimmy247/luc-than/pull/101) `6faf91f` · [#102](https://github.com/bktimmy247/luc-than/pull/102) `cc6d382`.

Popup đồ + Cách nhận. Nút Quay vàng, thẻ tướng crop từ đùi lên.

## 13/09/2026 — Wave U LIVE #100

Owner gõ live. Squash [#100](https://github.com/bktimmy247/luc-than/pull/100) `b1b2a3f`. Nút Quay giữa khung nâu.

## 13/09/2026 — Wave U LIVE #98–#99

Owner gõ live. Squash [#98](https://github.com/bktimmy247/luc-than/pull/98) `80eb4f7` · [#99](https://github.com/bktimmy247/luc-than/pull/99) `18d149e`.

Hoa Đăng kem, kho Rương Báu. Đổi sò 1/3/10, Quay giữa khung.

## 13/09/2026 — Wave T LIVE #95–#97

Owner gõ live. Squash [#95](https://github.com/bktimmy247/luc-than/pull/95) `66e4a16` · [#96](https://github.com/bktimmy247/luc-than/pull/96) `c07e9d8` · [#97](https://github.com/bktimmy247/luc-than/pull/97) `93d64a5`.

Chợ/Túi sheet hướng dẫn. Bách Bảo panel Kiếm Thế, shop điểm tab, Tiếp từ ô dừng. Tile Lễ Hội nền kem.

## 13/09/2026 — Wave S Chợ + Bách Bảo LIVE

Owner gõ live. Squash [#93](https://github.com/bktimmy247/luc-than/pull/93) → `4004224`, [#94](https://github.com/bktimmy247/luc-than/pull/94) → `8b2b08c`.

## 13/09/2026 — Wave S đổi sò + Rèn LIVE

Owner gõ live. Squash [#92](https://github.com/bktimmy247/luc-than/pull/92) → `8ea8d09`.

## 13/09/2026 — Wave S Bách Bảo sáng LIVE

Owner gõ live. Squash [#91](https://github.com/bktimmy247/luc-than/pull/91) → `ce25793`.

## 13/09/2026 — Wave S Bách Bảo 7×6 LIVE

Owner gõ live. Squash [#90](https://github.com/bktimmy247/luc-than/pull/90) → `c588218`.

## 13/09/2026 — Wave S vành Bách Bảo LIVE

Owner gõ live. Squash [#89](https://github.com/bktimmy247/luc-than/pull/89) → `2057d86`. TKT-0113.

## 13/09/2026 — Wave S vành Bách Bảo REVIEW

Vành chữ nhật, icon chồng, đèn chạy. Chợ hết tướng ngoài 12. Ấn món = công dụng.

## 13/09/2026 — Wave S Bách Bảo lưới LIVE

Owner gõ live. Squash [#88](https://github.com/bktimmy247/luc-than/pull/88) → `3b4979e`. TKT-0112.

## 13/09/2026 — Wave S Bách Bảo lưới REVIEW

Tiếp cộng cục (2+3=5★). Chợ Lục Châu, mảnh 12 tướng. Cắt Mộng.

## 13/09/2026 — Wave S kinh tế LIVE

Owner gõ live. Squash [#87](https://github.com/bktimmy247/luc-than/pull/87) → `a645011`. TKT-0111.

## 13/09/2026 — Wave S kinh tế REVIEW

Tinh/Hoạt nhỏ giọt daily/job/chương. Nhãn B/A/S/S+. Bible `docs/economy-bible.md`.

## 13/09/2026 — Wave S BBR quay đúng LIVE

Owner gõ live. Squash [#86](https://github.com/bktimmy247/luc-than/pull/86) → `c3eccfd`. TKT-0110. Icon sò, mảnh B/A/S/S+, Chí Bảo hiếm.

## 13/09/2026 — Wave S BBR quay đúng REVIEW

Chặn QUAY 1🐚. Sao 1–6. Chí Bảo hiếm + pity 8.

## 13/09/2026 — Wave S Bách Bảo Rương LIVE

Owner gõ live. Squash [#85](https://github.com/bktimmy247/luc-than/pull/85) → `757f3e9`. TKT-0109. Cược 2/10/50, sao, Chợ Tinh/Hoạt.

## 13/09/2026 — Wave S Bách Bảo Rương REVIEW

Cược 2/10/50 🐚, sao 1–6 (cùng loại +1), chế sò Tinh+Hoạt, shop điểm.

## 13/09/2026 — Wave S Lục Thần lore LIVE

Owner gõ live. Squash [#84](https://github.com/bktimmy247/luc-than/pull/84) → `646e280`. TKT-0108. Sáu ấn, 18 ải, bậc thưởng S.

## 13/09/2026 — Wave S Lục Thần lore REVIEW

Tên game Lục Thần. Chinh chiến = đóng sáu ấn. Bỏ Hồn Việt/Mộng Giới trên UI.

## 13/09/2026 — Wave R hub pill + arena ‹ LIVE

Owner gõ live. Squash [#82](https://github.com/bktimmy247/luc-than/pull/82) → `07b3b33`, [#83](https://github.com/bktimmy247/luc-than/pull/83) → `caae6a8`. TKT-0106, TKT-0107.

## 13/09/2026 — Wave R hub pill REVIEW

Owner gõ live. Squash [#81](https://github.com/bktimmy247/luc-than/pull/81) → `c9a52b3`. TKT-0105.

## 13/09/2026 — Wave R slot/chat/túi REVIEW

Giao việc ô tướng trống. Chat bỏ icon và dòng xanh. Túi 3/4 màn.

## 13/09/2026 — Wave Q kem panel LIVE

Owner gõ live. Squash [#80](https://github.com/bktimmy247/luc-than/pull/80) → `df066bb`. TKT-0104.

## 13/09/2026 — Wave Q kem panel REVIEW

Đè hero flex:1 + panel tối. Chat chữ sáng. Túi kem.

## 13/09/2026 — Wave Q kem hall LIVE

Owner gõ live. Squash [#79](https://github.com/bktimmy247/luc-than/pull/79) → `1fec294`. TKT-0103.

## 13/09/2026 — Wave Q kem hall REVIEW

Tháp, Chợ, Gọi Mộng, Săn, Mộng Lộ, Giao việc, Hòm thư: kem + ảnh dải trên.

## 13/09/2026 — Wave P bạn bè thật + nền kem LIVE

Owner gõ live. Squash [#78](https://github.com/bktimmy247/luc-than/pull/78) → `f24a2df`. TKT-0101…0102.

## 13/09/2026 — Wave P bạn bè thật + nền kem REVIEW

Bạn bè = tài khoản server. Lưới chức năng kem trơn. Thành Chính + login giữ nguyên.

## 13/09/2026 — Wave O Đấu Trường LIVE

Owner gõ live. Squash [#77](https://github.com/bktimmy247/luc-than/pull/77) → `375ef94`. TKT-0100.

## 13/09/2026 — Wave O Đấu Trường city REVIEW

3 ô isometric + FAB ‹ về hub (listener hoist cũ chết).

## 13/09/2026 — Wave N city halls LIVE

Owner gõ live. Squash [#76](https://github.com/bktimmy247/luc-than/pull/76) → `5e4b420`. TKT-0097…0099.

## 13/09/2026 — Wave N city halls REVIEW

Bang Hội + Nhật Ký + Lễ Hội: lưới nhà isometric, ấn ô mở hoạt động.

## 13/09/2026 — Wave N Bang Hội city REVIEW

Lưới 8 ô isometric (Gia Tộc, Võ Đường, Kho Bảo, Hổ Trấn, Chiến Dịch, Bang Chiến, Công Vụ, Bang Thương). Dock Nhật ký / Quản lý / Thông tin.

## 13/09/2026 — Wave M LIVE

Owner gõ live. Squash [#75](https://github.com/bktimmy247/luc-than/pull/75) → `347c4fb`. TKT-0092…0096.

## 13/09/2026 — Wave M chat/túi/săn/rèn REVIEW

Chat sheet trên hub. Túi lưới 5 ô. Săn FAB ‹. Rèn đập búa stub. Giao Lưu → việc vặt.

## 13/09/2026 — Wave L UX LIVE

Owner gõ live. Squash [#74](https://github.com/bktimmy247/luc-than/pull/74) → `32f3f29`. TKT-0086…0091.

## 12/09/2026 — Wave L UX halls REVIEW

TKT-0086…0091: Mộng Lộ ‹, Săn BGM+‹, skip trận, chat/túi khung dock, rèn 2 cột. Không merge tới live.

## 12/09/2026 — TKT-0085 mã quà mảnh tướng LIVE

Owner gõ live. Squash [#73](https://github.com/bktimmy247/luc-than/pull/73) → `f5fcc4a`. Cầm tay: [docs/GIFT-CODES.md](https://github.com/bktimmy247/luc-than/blob/main/docs/GIFT-CODES.md).

## 12/09/2026 — TKT-0085 mã quà mảnh tướng REVIEW

Catalog `shards` / tinh / hoạt / sò / essence. Không merge tới live.

## 12/09/2026 — TKT-0084 owner tự thêm mã quà LIVE

Owner gõ live. Squash [#72](https://github.com/bktimmy247/luc-than/pull/72) → `a373ece`. Env `GIFT_CODES` + `gift-codes.json`.

## 12/09/2026 — TKT-0084 owner tự thêm mã quà REVIEW

JSON `gift-codes.json` + env Vercel `GIFT_CODES` → POST `/api/gift`. Docs `docs/GIFT-CODES.md`. Không merge tới live.

## 12/09/2026 — Ô mã đổi gõ được LIVE

Owner gõ live. Squash [#71](https://github.com/bktimmy247/luc-than/pull/71) → `dcb6147`.

## 12/09/2026 — Avatar Ông Phở bấm được LIVE

Owner gõ live. Squash [#70](https://github.com/bktimmy247/luc-than/pull/70) → `cabac05`. `.art-player` pointer-events auto.

## 12/09/2026 — TKT-0083 hồ sơ avatar LIVE

Owner gõ live. Squash [#69](https://github.com/bktimmy247/luc-than/pull/69) → `7b85cea`. Bấm avatar Thành Chính → hồ sơ, mã quà, cài đặt.

## 12/09/2026 — TKT-0083 hồ sơ avatar + mã quà REVIEW

Bấm `.art-avatar` Thành Chính → `#hvProfileRoot`. Đổi tên, mã đổi (MONGGIOI/ONGHANGPHO + LUCTHAN/THANHCHINH), cài đặt, CSKH trong game, hình tượng 12 tướng live. Không merge tới live.

## 12/09/2026 — OAuth Google 404 + Facebook dòng đỏ LIVE

Owner gõ live. Squash [#68](https://github.com/bktimmy247/luc-than/pull/68) → `b266d69`. Rewrite `/api/auth/*` · Facebook không `FB.login(async)`.

## 12/09/2026 — Google vào Thành Chính LIVE

Owner gõ live. Squash [#67](https://github.com/bktimmy247/luc-than/pull/67) → `600a17b`. Nút Google chuyển trang, không popup GIS.

## 12/09/2026 — TKT-0077 LIVE Google + Facebook

Owner gõ live. thuhoavu health `"oauth":true` google+facebook, apple false. Bỏ Apple. Facebook Development = admin/tester. Không PR code — env Vercel.

## 12/09/2026 — Production thuhoavu, TKT-0078 bỏ

Owner: không đẩy luc-than.vercel.app. Chơi [gamma](https://hon-viet-mong-gioi-v3-25-4-dinh-loi-gamma.vercel.app/) team thuhoavu. Neon postgres. TKT-0078 SUPERSEDED.

## 12/09/2026 — TKT-0076 LIVE Neon store (chưa DATABASE_URL)

Owner gõ live. Squash [#66](https://github.com/bktimmy247/luc-than/pull/66) → `0895079`. Code postgres sẵn. Health production vẫn memory. Cần `DATABASE_URL` + TKT-0078 redeploy.

## 12/09/2026 — TKT-0076 Neon store REVIEW

`createPostgresStore` nhận sql mock, schema oauth payload JSONB, profile JOIN username. `/api/health` thêm `store`. Driver `@neondatabase/serverless`. L76A-P1 BLOCKED_ENV — chưa `DATABASE_URL`. Không merge tới live.

## 12/09/2026 — TKT-0080 LIVE cơ chế địch nhìn trái

Owner gõ live. Squash [#65](https://github.com/bktimmy247/luc-than/pull/65) → `d92bff1`. `drawUnit` lật mọi thân `TEAM_ENEMY`. Safari NOT_RUN. Vercel luc-than hết quota (TKT-0078).

## 12/09/2026 — TKT-0080 cơ chế địch nhìn trái

Owner: không riêng Ông Phở. `drawUnit` lật mọi thân `TEAM_ENEMY`. Drawer sheet không lật lần hai. VFX đạn giữ flip world-space. Không merge tới live.

## 12/09/2026 — TKT-0080 Ông Phở địch lật sang trái

Owner: Tháp NPC Ông Phở nhìn cùng hướng phe ta. `drawOngPhoGifHero` `scale(-1,1)` khi `TEAM_ENEMY`. Phe ta không lật. Không merge tới live.

## 12/09/2026 — Wave H overlay LIVE

Owner gõ live nốt. Squash [#59](https://github.com/bktimmy247/luc-than/pull/59) → `0622509` Tháp NPC. [#62](https://github.com/bktimmy247/luc-than/pull/62) → `298828b` Giáo Trường. [#61](https://github.com/bktimmy247/luc-than/pull/61) → `fa71369` ấn 3 tướng. [#63](https://github.com/bktimmy247/luc-than/pull/63) → `576d3c8` Thử Thách. Safari NOT_RUN. Vercel Hobby luc-than hết quota (TKT-0078).

## 12/09/2026 — TKT-0069 Thử Thách hall giả 3D REVIEW

Wrap startChallenge mở hall chọn ải, Xuất chiến mới iframe. Chrome 390×844 + 768×1024 PASS. Safari NOT_RUN. Không merge tới live.

## 12/09/2026 — TKT-0068 ấn UI Ông Phở · Lục Ảnh · Thầy Mo REVIEW

9 medallion jpg exclusive, wrap renderHeroDetail. Chrome 390×844 + 768×1024 PASS. Safari NOT_RUN. Không merge tới live.

## 12/09/2026 — TKT-0067 Giáo Trường hall giả 3D REVIEW

Wrap startTraining mở hall trước, Luyện mới trừ stamina + iframe luyen_tap, xong trận về hall. Chrome 390×844 + 768×1024 PASS. Safari NOT_RUN. Không merge tới live.

## 12/09/2026 tối — TKT-0065 Tháp trận NPC REVIEW

Wrap `startTower`: 6 NPC unique roster 12 + `runBattle('__tower')` iframe. Cấm auto-win / `towerPowerWinReport` trên path live. Power thấp vẫn vào trận (toast). L65-T1…T4 + Chrome 390/768 PASS. Safari NOT_RUN. Không merge tới `live`.

## 12/09/2026 — TKT-0079 LIVE

Owner gõ `live`. Squash [#64](https://github.com/bktimmy247/luc-than/pull/64) → main `6686efa`. Banner đỏ AbortError tắt. Vercel Hobby luc-than hết quota; project `dinh-loi-spacing-root` CI SUCCESS. Safari NOT_RUN.

## 12/09/2026 — TKT-0079 tắt banner đỏ AbortError

Owner ảnh iPhone `The operation was aborted`. Filter capture unhandledrejection AbortError/NotAllowedError, gỡ `#__mgDiag` abort-only. Video login `play().catch`, bỏ autoplay. Không sửa `index.html`. Không merge tới live.

## 12/09/2026 — TKT-0066 LIVE

Owner gõ `live`. Squash [#60](https://github.com/bktimmy247/luc-than/pull/60) → main `6ddad79`. Chip Thành Chính trên trận / nan inner / kết quả. Lịch Luyện chỉ mũi tên ‹. Vercel Hobby vẫn hết quota — alias chưa đổi (TKT-0078). Safari NOT_RUN.

## 12/09/2026 — TKT-0066 Lịch Luyện: ẩn chip, giữ mũi tên ‹

Owner ảnh thật: chip Thành Chính che góc trên Lịch Luyện. Chip ẩn khi `#hvLichRoot` mở; dùng `.hv-lich-back` ‹ có sẵn. Trận / nan inner / kết quả vẫn chip. L66-T5 GREEN. Không merge tới live.

## 12/09/2026 — TKT-0066 chip Thành Chính chỗ thiếu REVIEW

Chip `[data-hv-hub]` trên trận iframe, nan Trợ trận inner, Lịch Luyện, kết quả. Wrap `showScreen`. Hall đã có nút đóng không nhân listener. Chrome 390×844 + 768×1024 PASS. Safari NOT_RUN. Không merge tới live.

## 12/09/2026 tối — Wave J tickets + handoff

Owner hết quota session. TKT-0076 Neon READY · TKT-0077 OAuth WAITING_OWNER · TKT-0078 alias WAITING_QUOTA. Prompt `docs/AGENT-PROMPT.md`. Việc kế agent mới: TKT-0065.

## 12/09/2026 — TKT-0075 LIVE

Owner `cứ làm đi`. Squash [#57](https://github.com/bktimmy247/luc-than/pull/57) → main `ce1a0e1`. Nan không nướng khóa + điều khoản một câu. Vercel Hobby cũ 402 hết 100 deploy, reset 13/09 17:15 +07.

## 12/09/2026 — TKT-0075 nan Lịch Luyện không nướng khóa + điều khoản 1 dòng REVIEW

Owner ảnh thật. 3 nan hold/abyss/palace sơn lại **không ổ khóa**. Khóa chỉ overlay CSS `.hv-lich-lock` khi `is-locked`. Dòng đồng ý: «Tôi đồng ý với Thỏa thuận người dùng và Chính sách bảo mật» một câu, link nowrap, bỏ ngoặc kép. L76-T1/T2/T3 GREEN. Không merge tới `live`.

## 12/09/2026 — retrigger Vercel production Wave F+H


Owner gõ gộp live + deploy. Git `main` đã squash #51+#55 nhưng alias luc-than.vercel.app còn `dpl_Gw6KtJFxJYdGdxHVUBksnZAtYE2t` / `282df9d`. Hobby hết 100 deploy/ngày, reset **13/09/2026 16:58 +07**. CI Live check chỉ HTTP 200 nên GREEN giả. Preview sandbox đã build lại (`#hvJourneyRoot` có).

## 12/09/2026 — Wave F + Wave H coordinator LIVE

Owner gõ `live` + deploy Vercel. Squash [#51](https://github.com/bktimmy247/luc-than/pull/51) → `5bd9382` Hành trình + Kết quả hall giả 3D. Squash [#55](https://github.com/bktimmy247/luc-than/pull/55) → `b4915a9` stub TKT-0065…0073 (overlay chưa điền). Việc kế: điền Tháp trận NPC + nút Thành Chính.

## 12/09/2026 — TKT-0074 màn đăng nhập + tài khoản LIVE

Owner merge. Squash [#56](https://github.com/bktimmy247/luc-than/pull/56) → main `282df9d`. Overlay `#hvLoginRoot`, email/du khách, OAuth chờ App ID, điều khoản tiếng Việt. Wave F #51 không trộn.

## 12/09/2026 — TKT-0074 tài khoản + API cùng Vercel REVIEW

Owner: bật tài khoản, một project Vercel, user/pass + OAuth Google (email). Gateway `api/[...path].js` + wrap Trực Tuyến same-origin. Không sửa `index.html` / `battle.html`. Chưa live — cần env Neon + Google. Wave F #51 không trộn.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals LIVE

Owner gõ `live`. Squash [#54](https://github.com/bktimmy247/luc-than/pull/54) → main `d94f8a3`. 27 medallion hồ sơ 9 tướng. Wave F #51 không trộn. 72 tướng vẫn wave sau.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals REVIEW

Owner gõ `tiếp`. Wrap `renderHeroDetail`, 27 medallion jpg exclusive, CSS scoped `[data-hero-id]`. Không sửa `hero-detail-tabs.js` / `index.html` / `battle.html`. Chrome 390×844 + 768×1024 PASS. Safari NOT_RUN. Wave F #51 không trộn. Không merge tới `live`.

## 12/09/2026 — TKT-0058…0060 Wave G halls + TKT-0064 Safari pin LIVE

Owner gõ `live`. Squash [#53](https://github.com/bktimmy247/luc-than/pull/53) → main `b0d6d9d`. Cốt truyện / Trực Tuyến / Trận Hình overlay body + pin Safari. Ấn UI 0061–0063 còn READY. Wave F #51 không trộn.

## 12/09/2026 — TKT-0064 Safari overlay pin REVIEW

Owner «Debug Safari overlay rendering». `body.night{filter}` + `overflow-x:hidden` chứa `position:fixed` trên WebKit; hall dời DOM → overlay ~100px. Pin `visualViewport` + `filter:none` + `100dvh`. Không sửa `index.html` nguồn / Bày trận. Không merge tới `live`.

## 12/09/2026 — Wave G TKT-0058…0060 halls REVIEW

Owner gõ `tiếp`. Cốt truyện / Trực Tuyến / Trận Hình overlay body giả 3D. Stub lane điền, không thêm import `build-static.mjs`. 100vh + `filter:none`. Auth/DB OFF. Bày trận đóng băng. 72 tướng không đụng. Không merge tới `live`.

## 12/09/2026 — Wave G TKT-0058…0063 coordinator LIVE

Owner gõ `live`. Squash [#52](https://github.com/bktimmy247/luc-than/pull/52) → main `b77f35a`. Stub + ticket READY. 6 agent điền overlay/ấn. Owner: 72 tướng + asset đầy đủ là wave sau, **không** phải 12 nhân vật hiện tại. Wave F #51 không trộn.

## 12/09/2026 — Wave G TKT-0058…0063 coordinator READY

Owner «tạo tkt chia agent». Stub `scripts/lanes/tkt-0058`…`0063` + ticket READY. 3 hall (Cốt truyện / Online / Trận Hình) + 9 ấn UI 3×3. Overlay chưa làm. Wave F #51 không trộn. Không merge tới `live`.

## 12/09/2026 — Wave E TKT-0054…0055 LIVE

Owner gõ `live`. Squash [#50](https://github.com/bktimmy247/luc-than/pull/50) → main `f43545e`. Nhật Ký Mơ + Chinh chiến AFK home overlay body. Bày trận đóng băng.

## 12/09/2026 — Wave E TKT-0054…0055 REVIEW


Owner gõ `tiếp`. Nhật Ký Mơ + Chinh chiến AFK home restyle hall giả 3D overlay body. Bày trận đóng băng. Không merge tới `live`.

## 12/09/2026 — Wave D TKT-0053 LIVE


Owner gõ `live`. Squash [#49](https://github.com/bktimmy247/luc-than/pull/49) → main `ea59313`. Hồ sơ tướng overlay body + 9 nền showcase.

## 12/09/2026 — Wave D TKT-0053 REVIEW


Owner gõ `tiếp`. Hồ sơ tướng overlay body giả 3D + 9 nền showcase còn thiếu. Không merge tới `live`.

## 12/09/2026 — Wave C TKT-0046…0052 LIVE


Owner gõ `live`. Squash [#48](https://github.com/bktimmy247/luc-than/pull/48) → main `9f2bbff`. 7 màn sơn mài thành hall giả 3D overlay body.

## 12/09/2026 — Wave C TKT-0046…0052 REVIEW


Owner gõ `tiếp`. 7 màn sơn mài (Tháp / Mộng Lộ / Chợ / Gọi / Đấu / Săn / Lễ) restyle hall giả 3D overlay body. Domain đóng băng. Không merge tới `live`.

## 12/09/2026 — TKT-0036…0045 LIVE


Owner gõ `live`. Squash-merge PR #39–#47 (Túi/Thư/Việc/Bang/Bạn/Chat/Tộc/Kho + kit v2) rồi rebase-squash Rèn PR [#37](https://github.com/bktimmy247/luc-than/pull/37) → main `a2d8bf1`. Overlay body giả 3D; preview tạm mở khóa hành trình; tiếng rèn unlock iOS rồi mới gõ.

## 12/09/2026 — TKT-0037…0045 hall + kit squash-merge



Owner gõ `live`. Squash-merge PR #39–#47 lên main. Overlay Túi/Thư/Việc/Bang/Bạn/Chat/Tộc/Kho + kit v2. TKT-0036 Rèn rebase sau halls.

## 12/09/2026 — TKT-0037…0045 LIVE (stub làn)

Owner gõ `live` rồi cho agent chạy song song. Squash-merge PR [#38](https://github.com/bktimmy247/luc-than/pull/38) → main `c990516`. Stub `scripts/lanes/tkt-00xx-*.mjs` + ticket READY. Overlay hall chưa làm. TKT-0036 Rèn không merge trong lần này.

## 12/09/2026 — Làn song song TKT-0037…0045

Owner: rà soát chức năng còn thiếu, tách ticket độc lập cho nhiều agent. 8 hall Wave A (Túi / Thư / Việc / Bang / Bạn / Chat / Tộc / Kho) + 1 Wave B kit v2. Stub `scripts/lanes/tkt-00xx-*.mjs` đã import sẵn — agent không sửa `build-static.mjs`. Cấm đụng Combat V2, nan `go:null`, Bày trận visual, Auth/DB.
## 12/09/2026 — Tiếng rèn unlock iOS rồi mới gõ

Owner «tiếng rèn bị mất». `hvForgeReveal` gọi `HonVietSfx.unlock` trước `forge-reveal`. Hall mở cũng unlock. Gain 0.22→0.4. Combat vẫn chặn forge-reveal.

## 12/09/2026 — Preview tạm mở khóa hành trình


Owner: «làm đến chức năng nào khoá thì e tạm mở để a test». Preview wrap `featLocked=false` (không đụng `JOURNEY_UNLOCK`). `luc-than.vercel.app` vẫn khóa theo chương. Rèn mở được trên save mới.

## 12/09/2026 — TKT-0036 Rèn hall giả 3D REVIEW


Nhánh `work/l25-forge-hall-20260912`. Overlay `#hvForgeRoot` gắn body, hall `assets/ui/forge/forge-hall.jpg` sáng nhiều lớp. `forgeCommand` / CRAFT 20·200 / DUAL 42·420 / pity 30 / +15 không đổi. Chrome 390+768 PASS. Không merge tới `live`.

## 12/09/2026 — TKT-0035 LIVE

Owner gõ `live`. Squash-merge PR [#36](https://github.com/bktimmy247/luc-than/pull/36) → main `f52e5fc`. Vercel production `dpl_7N9JqoJDRJQGEX4XNKc1NYqzyAeP` READY. Overlay Tướng gắn body trên luc-than.vercel.app. Ticket kế: Rèn hall (TKT-0036).

## 12/09/2026 — Màn Tướng hiện lại (TKT-0035)

Nhánh `work/l24-hero-roster-visible-20260912`. Owner «vẫn thế» / «vẫn ko hiện»: header còn, 12 thẻ trắng trên iOS/Grok. Overlay gắn `document.body` như Trợ trận (`position:fixed;inset:0;overflow:auto`), thẻ `min-height:150`, lưới `min-height:420`. Không flex-1fr, không `height:auto`, không visualViewport. Chrome 390 + 768 + iframe 768 PASS; Safari NOT_RUN. Builder dừng REVIEW.



## 12/09/2026 — TKT-0033 + TKT-0034 LIVE

Squash-merge PR #35 → main `b5a91f6`. Vercel CD production. Trợ trận + Lịch Luyện giả 3D tươi. Owner gõ `live`. Ticket kế: chờ `tiếp`.

## 12/09/2026 — Lịch Luyện giả 3D tươi (TKT-0034)

Cùng nhánh `work/l23-assist-spoke-icons-20260912`. Owner hỏi «lịch luyện đã đổi theo chưa» — chưa, art TKT-0032 còn sơn mài tối. Đổi 11 nan + hall + lõi sang token giả 3D tươi, không reuse icon hub. Công thức daily đóng băng. Chrome 390 PASS; Safari NOT_RUN.

## 12/09/2026 — Icon sơn 11 nan Trợ trận (TKT-0033)

Nhánh `work/l23-assist-spoke-icons-20260912` từ main `82f1c61`. Owner: «ngay bên trợ trận cũng ko có icon» rồi chốt icon/nền phải **tươi, giả 3D, nhiều lớp** — không sơn dầu tối. 11 nan lấy token 3D sẵn có (trống đồng, giáp SSR, cá lóc, kim quy…). Hall `assist-hall-day.jpg` sáng như Thành Chính / Mộng Lộ. `heroStats` / 11 nan / `data-art-go` không đổi. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.


## 12/09/2026 — Lịch Luyện lên main + bàn giao (TKT-0032)

Squash-merge PR #33 → main `a1f936a`. Vercel CD production READY `dpl_G49Q6XjU29UzEYczLLRfvvq7VSpk`. Inject hunt → festival → daily. Snapshot [HANDOFF-2026-09-12.md](HANDOFF-2026-09-12.md) cho agent sau. Ticket kế TKT-0033.

## 12/09/2026 — Lịch Luyện bánh xe đi ải + Nhật Ký Mơ (TKT-0032)

Nhánh `work/l21-daily-onto-main`. Owner: Lịch Luyện là bánh xe ải trên **màn riêng**, mỗi nan icon sơn độc lập — không overlay Thành Chính, không tái icon hub. Nhiệm vụ giữ Nhật Ký Mơ. Qua Ải + Luyện mở đêm 1. Không thêm nút hub, không ải combat mới. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.




## 12/09/2026 — Lễ Hội lên main (TKT-0031)

Squash-merge PR #32 → main `3baffa8`. Vercel CD production READY. Inject hunt → festival. Mở từ đêm đầu như Chợ.

## 12/09/2026 — Lễ Hội sơn mài + domain hoa đăng / Bách Bảo (TKT-0031)


Nhánh `work/l20-festival-onto-main` từ main `d62dea1`. Giữ 5 đèn/ngày, đèn đầu miễn phí, 🪙100, 3 hướng An Khang / Duyên Phố / Khai Lộ, Tam Nguyện +1 ấn +🪙150 +💎5, mốc 3/7/12, Bách Bảo 20 ô 1🐚, bảng Rương Báu / Chí Bảo. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ / Gọi Mộng / Đấu Trường / Săn Boss. Thả đèn + quay + mở rương qua transaction. Không thêm nút hub thứ hai. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

## 12/09/2026 — Săn Boss lên main (TKT-0030)

Squash-merge PR #31 → main `f96e53d`. Vercel CD production READY. Inject arena → hunt. Painted boss tokens + 60-round hunt battle. Unlock still after 3 chapters.

## 11/09/2026 — Săn Boss sơn mài + domain khế/ấn (TKT-0030)

Nhánh `work/l19-hunt-onto-main` từ main `1139ef4`. Giữ 6⚡, 2 lượt/ngày, 3 boss xoay, Săn Khế Phá Lõi/Quét/Đoạt Mệnh, mốc ấn 3/7/12. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ / Gọi Mộng / Đấu Trường. Chọn khế + settle qua transaction. Không thêm nút hub thứ hai, không đổi trận 60 lượt. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

## 11/09/2026 — Đấu Trường lên main (TKT-0029)

Squash-merge PR #30 → main `9bd266a`. Vercel CD. Inject shop → summon → arena.

## 11/09/2026 — Gọi Mộng lên main (TKT-0028)

Squash-merge PR #29 → main `4deed0e`. Vercel CD.

## 11/09/2026 — Đấu Trường sơn mài + domain hạng/mùa/võ đài (TKT-0029)

Nhánh `work/l18-arena-20260911`. Giữ 5⚡, thắng chiếm hạng +220g, thua không tụt, LP mùa 34/−18, Võ Đài 8 tầng. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ. Settle + mốc LP qua transaction. Không thêm nút hub thứ hai, không đổi net PvP. Chrome 390 PASS; Safari NOT_RUN.

## 11/09/2026 — Gọi Mộng sơn mài + domain triệu hồi (TKT-0028)

Nhánh `work/l17-summon-20260911`. Giữ cost 80/720, pity 60, tỉ lệ 3/9/18/30/40, Hồi Ức 120. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ / Chợ. Pull + spark qua transaction. Không thêm nút hub thứ hai, không đổi seed/banner D01/D02. Pool 12 SSR-only vẫn khóa gacha như live. Chrome 390 PASS; Safari NOT_RUN.

## 11/09/2026 — Chợ Mộng lên main (TKT-0027)

Squash-merge PR #28 → main `febfd5ec`. Vercel CD.

## 11/09/2026 — Chợ Mộng sơn mài + quầy ngày (TKT-0027)

Nhánh `work/l16-shop-20260911`. Giữ 5 quầy live, 1 lần/ngày, giá 320g / 60💎 / 160g / 40💎 / 220g. Domain thuần bất biến, màn sơn mài như Tháp / Mộng Lộ. Mua qua transaction. Không thêm nút hub thứ hai, không bán lực chiến. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

## 11/09/2026 — Mộng Lộ lên main (TKT-0026)

Squash-merge PR #27 → main `571dd264`. Vercel CD.

## 11/09/2026 — Mộng Lộ sơn mài + domain run (TKT-0026)

Nhánh `work/l15-expedition-20260911`. Giữ rogue 5 tầng live: Ngã Rẽ / Phúc Mộng / Mộng Ấn / checkpoint. Domain thuần bất biến, màn sơn mài như Tháp. Công thức vàng/ấn/gem không đổi. Không thêm nút hub thứ hai. Chrome 390 PASS; Safari NOT_RUN. Builder dừng REVIEW.

## 11/09/2026 — Bàn giao toàn bộ tiến độ cho agent sau

Snapshot [HANDOFF-2026-09-11.md](HANDOFF-2026-09-11.md): live, PR #18–#25, bánh xe 11 nan, Tháp, deploy, CI. Ticket kế TKT-0026. Không đổi runtime.

## 11/09/2026 — CI/CD tự động (TKT-0025)

GitHub Actions: mỗi PR và mỗi lần đẩy `main` chạy cài đặt → build → test. Vercel vẫn tự deploy live. Job production xác nhận luc-than.vercel.app trả 200. Cổng CI 537/537 PASS.
