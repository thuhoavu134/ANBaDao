# Bàn giao Lục Thần / Hồn Việt cho Luna và các model tiếp theo

Cập nhật: **07/09/2026**. Đây là điểm vào cho Luna. Các mục pixel/render và evidence 05/09 phía dưới là lịch sử kỹ thuật; trạng thái hiện tại nằm ở mục 1 và progress.

## 1. Đọc nhanh: hiện có gì và làm tiếp ở đâu

- Repo `bktimmy247/luc-than`; [production](https://luc-than.vercel.app/). Game HTML/JavaScript + Canvas 2D, shell index và iframe battle, build bằng `scripts/build-static.mjs`.
- Code baseline của đợt phân tích: `c8fefca0e31b6ddb926921454413d38860171665`. Hotfix âm thanh thoát trận đã deploy Vercel READY; 171/171 test đạt. Chưa có kiểm tương tác production/nghe loa Safari sau hotfix; lần kiểm HTTP sau deploy bị treo rồi hủy.
- [Progress](HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md) ghi trạng thái từng hệ; [execution plan](LUNA-EXECUTION-PLAN-2026-09-07.md) chia L01–L20. **L02a đã hoàn thành: audit/validator catalog ở commit 7272ede748eed62af4814e13776e468ebe7e9d15; code tiếp theo là L02b review reward/scene.** Chưa thay balance/seed. L01 là device verification, không viết lại bus audio.
- [Phân tích source Hermes](HERMES-SOURCE-AUDIT-2026-09-07.md) là tài liệu học tổ chức game mẫu; [manifest](reference/hermes-source-manifest-2026-09-07.json) kiểm kê/hash. Archive là Cocos client đã tách mã + config/protocol; chưa có backend/project editor đầy đủ để deploy lại.
- **Anh đã yêu cầu dùng lại code mẫu.** [Hướng dẫn tái sử dụng](HERMES-CODE-REUSE-GUIDE.md) thay quy tắc cũ chỉ học kiến trúc/cấm toàn bộ source. Guide xác định 27 phương thức trong archive đã nhận, dependency và lỗi cần sửa khi port. Mã gốc chưa được đưa lên GitHub do xét duyệt tự động chặn việc phân phối lại; repo chứa phần phân tích/hướng dẫn do agent viết. Luna được tự trích/port phần phù hợp vào owner hiện có; chưa có đoạn nào được tích hợp trong đợt tài liệu này.
- Giữ bản sắc Hồn Việt, 12 ID chính thức, 6 slot (3 trước/3 sau), 15 hiệp, không multi-wave. Capacity được chốt trong plan là 72 (32 SSR/16 SR/16 A/8 B), hiện chưa có đủ nội dung; không tạo placeholder để đủ số.
- Ông Phở/Lục Ảnh có kit v2 Basic + Ultimate + passive; 10 tướng còn lại chưa chuyển đủ. Không hỏi lại định hướng hai đòn và không tráo legacy Skill 1/Ultimate hoặc bỏ đầu tư.
- PR #16 campaign/AFK/preparation/MVP đã merge tại `92b503c`. Cap AFK 15 giờ, cảnh diễn hoạt không tự tiến ải/nhận thưởng. Bốn ảnh campaign đã có.
- Điểm vướng đã thấy từ code: seed/migration mở cả 12; thưởng chương còn ID legacy ngoài roster; event combat cần đủ sub-action và seeded RNG; transaction/event chưa phủ mọi luồng. Không dùng API hooks để khẳng định backend/rank/chat thật đã có.
- Khi sửa runtime chạy npm test và bấm UI thật. Báo riêng build/unit/integration, Chrome responsive, Chrome interaction, Safari thiết bị thật và production deployment.

Thứ tự đọc tối thiểu mỗi phiên: AGENTS → mục này → progress → đúng ticket Lxx → guide tái sử dụng và đoạn source liên quan khi port. Master plan giữ mã E/R/M và quyết định D; chỉ đọc phần liên quan. Không dump dòng BATTLE_HTML_BASE64 khổng lồ khi tìm kiếm; dùng rg với giới hạn cột hoặc đọc theo function boundary.

## 2. Bản đồ code: sửa đúng nguồn tạo ra sản phẩm

| Thành phần | Nguồn cần đọc/sửa | Vai trò |
|---|---|---|
| Shell game | `index.html` | Router, player state, màn tướng, đội hình, tạo iframe giao đấu |
| Engine giao đấu | `battle.html` | Combat, Canvas, animation và thời điểm hành động |
| Build | `scripts/build-static.mjs` | Copy nguồn rồi chạy các patch theo thứ tự; đầu ra là `dist/` |
| Danh sách tướng | `src/ui/hero-roster-runtime.js` | Đọc state, lọc, sort, điều hướng và giữ vị trí cuộn |
| CSS danh sách | `scripts/hero-roster-phase-a-v4.mjs` | Chèn runtime + CSS vào index sau build |
| Dữ liệu thẻ tướng | `src/domain/hero/roster-view.mjs` | Chỉ lấy danh sách tướng chính thức và dữ liệu player hiện tại |
| Chi tiết tướng | `src/ui/hero-detail-tabs.js`, `src/ui/hero-detail-tabs.css` | Các tab dùng chung canvas Idle đang chạy |
| Hợp đồng Idle | `src/domain/character/luc-anh-idle.mjs` | File, grid, số frame, nguồn và crop cố định |
| Hình học Basic | `src/domain/character/luc-anh-spatial.mjs` | Tỷ lệ và baseline đo từ atlas thực tế |
| Áp dụng hình học | `scripts/luc-anh-spatial-pipeline-v1.mjs` | Sinh map kích thước/baseline riêng cho từng động tác |
| Bản vá alpha cũ | `scripts/m0-p0-runtime-repair-v1.mjs` | Chốt đúng nguồn RGBA, renderer, nền và luồng nút kết quả |
| Bản vá lần này | `scripts/runtime-mobile-render-sfx-v1.mjs` | Nối SFX, ổn định canvas/camera và bỏ chuyển động phụ của Lục Ảnh |
| Bus âm thanh | `src/ui/audio-sfx-runtime.js` | Unlock, preload/decode, phát, mute và giới hạn âm đồng thời |
| SFX nguồn | `assets/audio/sfx/sources.json` | Tên file gốc trong ZIP, codec và hash để đối chiếu |
| Kiểm tra khung hẹp | `qa-runtime.html` | Iframe 390×844, 430×932 và 1280×900; không giả lập Safari |
| Regression mới | `tests/mobile-render-sfx.test.mjs` | Pixel, audio, bố cục và mã sau build |
| Campaign/chuẩn bị | `src/ui/campaign-scene.js`, `src/domain/campaign/campaign-view.mjs` | AFK scene, draft sáu slot, gọi transaction/startChapter hiện có |
| AFK domain | `src/domain/afk/afk-chest.mjs` | Thời gian/rate/claim/cap 15 giờ |
| Transaction | `scripts/transaction-contract-v1.mjs`, `src/domain/transaction/receipt-contract.mjs` | Owner commit/rollback/receipt và các caller được migrate |
| Result/navigation | `scripts/settlement-navigation-v1.mjs` | Kiểm bridge/session, settle và navigate một lần |
| Hotfix audio close | `scripts/battle-audio-lifecycle-v1.mjs` | Cancel parent SFX/voice/result và dispose child trước about:blank |
| Audio hồi quy | `tests/battle-audio-lifecycle.test.mjs` | 9 ca active/pending/voice/HTML fallback/stale iframe/result/close ordering |


**Không sửa trực tiếp `dist/` để làm bản sửa chính.** Vercel chạy build và sẽ ghi đè. Theo dấu từ file trong `dist` về script tạo nó. Chỉ thêm/chỉnh patch ở đúng giai đoạn; đừng sửa nhiều patch cũ cùng lúc bằng tìm-thay toàn cục.

## 3. Quy trình làm một lỗi, dành cho model ít context

1. Ghi lại câu người dùng báo, màn hình, thiết bị và bước tái hiện. Không tự đổi sang một tính năng khác.
2. Đọc trạng thái Git/commit hiện tại, thay đổi đang có và hướng dẫn dự án. Không ghi đè việc của người khác.
3. Đọc nguồn liên quan trong bảng trên. Tìm bằng `rg`, hạn chế đọc tràn toàn bộ hai HTML lớn.
4. Nêu một giả thuyết cụ thể và cách kiểm tra: ví dụ chiều cao cơ thể khác nhau hay cả atlas bị scale khác nhau.
5. Đo/kiểm tra trước khi sửa. Tách **quan sát được**, **suy luận**, **chưa xác minh**.
6. Làm một bản sửa nhỏ; được port code mẫu theo guide, ghi nguồn/dependency/khác biệt và nối vào owner hiện có. Giữ renderer, router, scheduler đang hoạt động. Build phải báo lỗi nếu không tìm thấy vị trí patch mong đợi.
7. Chạy `npm test`, đọc kết quả thực sự. Test đã bao gồm build. Không chỉ đọc dòng “build successful”.
8. Kiểm tra bằng UI thật: vào màn, thao tác, quay lại, lặp lần hai. Không gọi trực tiếp hàm nội bộ để thay cho thử thao tác người dùng.
9. Commit/push đúng repository và nhánh đã được người dùng cho phép; kiểm tra Vercel và chính URL production.
10. Báo ngắn gọn: sửa gì, commit nào, đã thử gì, còn giới hạn gì. Cập nhật tiến độ nếu công việc lâu; không nói “xong” khi mới viết code.

## 4. Tạo asset nhân vật: đầu vào đến đầu ra

### 4.1 Chọn đúng nguồn

- File ZIP/RAR là đầu vào, không phải asset tải trực tiếp trong game. Tự giải nén bằng công cụ có sẵn; không bắt người dùng giải nén hộ khi có thể tự làm.
- Kiểm tra số frame, thứ tự tên, kích thước, FPS/thời lượng, alpha channel và một số frame đầu/giữa/cuối.
- Lục Ảnh có hai nguồn khác nhau: `IDLE.rar` cũ là RGB trên nền đen; `IDLE(2).rar` mới là RGBA. Không chọn chỉ vì tên gần giống hoặc file nhỏ hơn.
- Nguồn đúng của Idle hiện tại: **96 PNG RGBA, 1510×1004**, từ `IDLE(2).rar`.
- Alpha trong suốt và RGB màu đen là hai chuyện khác nhau. Áo/tóc/khói đen có thể là chi tiết thật. Không xóa mọi pixel tối để “hút nền”.
- Nguồn có alpha rất thấp vẫn có thể thấy vệt mờ trên nền sáng. Cần đối chiếu frame gốc trước khi kết luận runtime làm bẩn ảnh.

### 4.2 Quy tắc crop, tỷ lệ và chân

Phương án an toàn đang dùng là một crop cố định cho toàn chuỗi:

```
crop: left=230, top=7, width=976, height=976
output cell: 480×480
grid: 8 cột × 12 hàng = 96 frame
atlas: 3840×5760
frame duration: 42 ms
```

Crop sát từng frame vẫn làm được nhưng bắt buộc lưu và dùng offset:

```
drawX = anchorX + (trimX - pivotX) * scale
drawY = anchorY + (trimY - pivotY) * scale
drawW = trimWidth  * scale
drawH = trimHeight * scale
```

`pivotX/pivotY` phải ở hệ tọa độ canvas nguồn chung. `trimX/trimY` là vị trí phần bị cắt trên canvas đó. `scale` là một hệ số chung cho X/Y. Nếu atlas có xoay frame khi đóng gói, renderer phải đọc rotation; nếu chưa hỗ trợ thì tắt rotate lúc pack.

**Tuyệt đối không làm:** crop từng frame rồi kéo mỗi phần crop vào cùng một ô hiển thị; căn giữa lại từng bbox; lấy mép dưới bbox của từng frame làm chân mới. Các cách đó làm nhân vật co giãn, rung chân hoặc nhảy vị trí. Không sửa mất rung bằng cách xóa frame hay đổi FPS tùy ý.

### 4.3 Pack và kiểm chứng

- Script: `scripts/pack-luc-anh-idle-rgba.mjs`.
- Chỉ nhận đúng 0001.png…0096.png, đúng kích thước và RGBA. Thiếu frame/RGB thì báo lỗi.
- Dùng crop cố định, resize có xử lý alpha rồi đóng WebP lossless. Không flatten lên nền, không threshold alpha, không đổi màu viền.
- Decode lại đầu ra: alpha phải khớp; RGB của pixel có alpha > 0 phải khớp. RGB của pixel alpha=0 không có ý nghĩa hiển thị.
- Giữ hash nguồn, hash đầu ra, kích thước và số frame trong manifest.
- File tải nhỏ không đồng nghĩa ít RAM/VRAM: atlas 3840×5760 RGBA giải mã khoảng 84,4 MiB trước overhead. Không preload mọi animation chỉ để hiện một thẻ tướng.
- Atlas Idle RGBA hiện tại là **21.682.860 byte**. Con số “177 MB còn hơn 5 MB” của bản trước không được dùng để mô tả file hiện tại. Lossless không có tỷ lệ nén cố định cho mọi nguồn.

### 4.4 Lưu và build asset lớn

Repository lưu Idle dưới hai phần ở `asset-sources/luc-anh/`. `scripts/luc-anh-idle-asset.mjs` ghép và kiểm tra SHA-256 trước build. Không đưa một file part riêng lẻ vào đường dẫn ảnh runtime.

Hash atlas chuẩn:

```
9fc7ba71a302b232068b3ac54c2c9c0e72e5cd183cd1c04fcfeae42e12a0fa8a
```

Khi thay asset, dùng tên/version mới hoặc đổi URL. `/assets/` đang được cache `immutable` một năm; ghi đè nội dung nhưng giữ URL có thể khiến máy người dùng chạy ảnh cũ với metadata mới.

## 5. Vì sao Basic nhỏ và cách đã sửa

Kích thước ô atlas không phải kích thước người. Đo frame đầu với alpha ≥128:

| Đại lượng | Idle | Basic trước sửa |
|---|---:|---:|
| Ô atlas | 480 | 240 |
| Cao cơ thể có alpha | 398 px | 148 px |
| Mép dưới cơ thể trong ô | 427 | 190 |
| Kích thước ô khi vẽ | 330 | 372 |
| Cao cơ thể khi vẽ | 273,625 | 229,4 |
| Baseline cũ | 48 | 54 |

Basic trước sửa nhỏ khoảng 16%, đồng thời chân lệch lên khoảng 35 đơn vị world. Công thức đang dùng:

```
targetBodyHeight = idleDisplay * idleBodyHeight / idleCell
targetFootY = idleBaseline - idleDisplay * (1 - idleFootY / idleCell)
basicDisplay = targetBodyHeight * basicCell / basicBodyHeight
basicBaseline = targetFootY + basicDisplay * (1 - basicFootY / basicCell)
```

Kết quả: Basic vẽ **443,716216×443,716216**, baseline **104,003378**. Đây là hiệu chỉnh cố định cho cả động tác, không đo lại từng frame khi game chạy. Không dùng hệ số này cho Skill 1/Ultimate vì chúng có crop khác; muốn sửa động tác nào thì đo động tác đó.

Bản sửa còn bỏ `idleBob` và xoay nghiêng giả lập ngoài atlas cho Lục Ảnh. Chuyển động đã có trong frame thì không thêm một lớp thở/nghiêng thứ hai.

## 6. Danh sách tướng trống trên điện thoại

Quan sát: ảnh lỗi vẫn hiện header và tab, phần dưới trống. Chrome trước sửa vẫn thấy thẻ; chưa tái hiện trên Safari thật.

Rủi ro thấy trong code: roster `position:fixed` nằm trong screen cũ có pseudo-element và CSS cụ thể hơn; thêm sticky/overflow/fixed lồng nhau dễ tạo vấn đề bố cục hoặc lớp vẽ.

Cách sửa:

- `#hvHeroRosterV4` là portal trực tiếp dưới `body`, ngoài lớp screen cũ.
- Router hiện có vẫn quản lý `root.hidden`. Không tạo router riêng, không dùng MutationObserver để dò text rồi dựng lại thẻ.
- Root chia ba hàng: header / `minmax(0,1fr)` danh sách / dock.
- Chỉ `.v4-grid` cuộn; có `min-height:0`. Header và dock là hàng bình thường, không sticky/fixed lồng nhau.
- Giữ filter, sort, tướng đang chọn và scroll khi vào chi tiết rồi quay lại.
- Chi tiết tướng giữ lại canvas Idle khi đổi tab/nâng cấp, tránh tạo lại animation mỗi thao tác.

Kiểm tra bắt buộc: mở Tướng; thấy đủ thẻ theo bộ lọc; lọc một hệ; mở Lục Ảnh; quay lại; trở về Thành Chính; mở Tướng lần hai; thử cuộn và đổi chiều màn hình.

## 7. PC nháy màn giao đấu

Trong code cũ, mỗi impact tạo flash cả màn hình, camera shake và zoom. Canvas nằm trong flex layout còn có thể góp kích thước nội tại khi resize.

Cách sửa:

- Canvas đặt absolute trong viewport đã có kích thước; không để kích thước canvas tác động ngược lại chiều cao viewport.
- Mỗi frame vẽ nền opaque trên toàn backing store với transform identity, rồi đặt transform world và vẽ nền/nhân vật cùng frame.
- Bỏ `clearRect` theo tọa độ world vốn có thể để phần rìa trong suốt.
- Trong layout `reference-simple`, đặt flash/shake/zoom về 0 trước khi render. Vẫn giữ VFX tại mục tiêu và số sát thương.

Kiểm tra trong trận đang đánh, không chỉ màn Victory đứng yên: kích thước backing canvas không dao động; nhân vật còn chuyển động; camera flash luôn 0 ở chế độ này; đổi kích thước cửa sổ vẫn vẽ đủ nền. Nếu vẫn nháy, thu tiếp evidence về mất context/ảnh chưa decode/RAM; đừng khẳng định nguyên nhân chỉ từ một screenshot.

## 8. SFX: file đã có nhưng runtime phải phát đúng lúc

**Cập nhật 07/09 — đã sửa lỗi âm trận còn chạy khi thoát:** `src/ui/audio-sfx-runtime.js` cấp `createBattleChannel` theo session, `endBattle`/`dispose` vô hiệu callback cũ. Patch `battle-audio-lifecycle-v1.mjs` nối đúng `closeOverlay` để dừng âm cha và âm HTML trong child trước blank iframe. Voice WebAudio/HTML fallback được theo dõi trong `ios-audio-unlock-patch.mjs`; result music hủy pending unlock và kiểm live session/source/origin. Guaranteed ultimate fallback cũng kiểm session còn active. Không thay bằng `stopCombat` đơn lẻ rồi cho callback cũ bật lại combat.

Pagehide của iframe cũ không được tắt trận mới; không suspend AudioContext chung làm mất tiếng UI/hồ sơ. Diagnostics bổ sung trên DOM: `data-sfx-active`, `data-sfx-combat-enabled`, `data-sfx-battle-active`, `data-voice-combat-active`; chúng là theo dõi nguồn phát, không chứng minh loa phát trên iPhone. Chạy L01 để khép gate thiết bị.

Hai gói nguồn: `SFX-UI-ALL-2026-09-01.zip` và `SFX-COMBAT-ALL-2026-09-01.zip`. Dùng `scripts/import-supplied-sfx.py <thư-mục-chứa-hai-zip>` để khôi phục bộ đang dùng. Không tải lại hay chuyển đổi tất cả 332 âm để sửa một hook.

| Event | File runtime | Nơi gọi |
|---|---|---|
| Bấm nút | `se_button_click.mp3` | Một listener click |
| Chọn | `se_icon_click.wav` | Điều khiển lựa chọn |
| Basic cast | `201800_se_atk.wav` | `playActionSound` |
| Skill cast | `201800_se_s1.wav` | `playActionSound` |
| Ultimate cast | `201800_se_s2.wav` | `playActionSound`, gồm nhánh riêng Lục Ảnh |
| Impact | `400500_se_s1_beaten.wav` | `applyDamage`, ở thời điểm trúng đòn |
| Hồi phục | `se_gift.mp3` | `applyHeal`, mặc định tạm theo event |
| Thắng | `se_battlewin.mp3` | Kết quả trận |
| Thua | `se_battlelose.mp3` | Kết quả trận |

**Đây là mapping event mặc định dùng chung, chưa phải mapping SFX riêng được duyệt cho từng tướng.** Không được nói ID 201800 là Lục Ảnh chỉ dựa trên tên file. Muốn cá nhân hóa cần bảng mapping nghệ thuật/tướng được xác nhận.

Một số file trong ZIP có đuôi WAV nhưng bytes là MP3. Script nhận diện header và đổi đuôi sang `.mp3`; giữ nguyên bytes và hash, không encode lại. Tổng 9 âm khoảng 978.638 byte.

Audio bus dùng AudioContext của trang cha đã unlock bằng thao tác thật, iframe dùng lại bus đó. Không chỉ gọi `new Audio().play()` lúc auto-battle rồi nuốt lỗi autoplay. Không ghi trạng thái “unlocked” nếu context thực tế vẫn suspended.

- Cache buffer đã decode, không decode lại mỗi lần đánh.
- Impact AOE gộp trong 120 ms; giới hạn 6 âm đồng thời để tránh cộng âm quá lớn.
- Mute dừng âm combat và hủy lệnh còn đang chờ decode. Không phát dồn âm cũ sau khi mở khóa.
- Không phát cả beep giả lập lẫn file thật cho cùng một event; cast không phát lần hai ở projectile release.
- DOM diagnostics: `data-sfx-state`, `data-sfx-loaded`, `data-sfx-played`, `data-sfx-last`, `data-sfx-error` trên documentElement của bus owner.
- `played` nghĩa là AudioBufferSource đã được start, không chứng minh người dùng nghe thấy loa. Kiểm tra nút âm, âm lượng, tab và iPhone thật khi cần.

## 9. Build, test và deploy không để hai engine khác nhau

```
npm install --ignore-scripts --no-audit --no-fund
npm test
```

`npm test` tự build rồi chạy test tuần tự vì các bài đọc atlas lớn có thể vượt RAM nếu chạy đồng thời. Không giảm chất lượng asset để làm test qua.

Cuối build, `BATTLE_HTML_BASE64` trong `dist/index.html` được đồng bộ với `dist/battle.html`. **So byte hai đầu ra sau tất cả patch**, không so bản template trước build rồi kết luận iframe production đúng. Sai bước này có thể làm trang xem thử và trận tích hợp dùng hai engine khác nhau.

Luồng Git bình thường: xem diff → commit → push nhánh được ủy quyền → chờ Vercel thành công → mở production và kiểm tra mã/asset mới. Không force push. Giữ các phần asset lớn và file nguồn cần ghép trong commit.

Nếu môi trường chỉ có GitHub connector, không có Git credential local:

1. Đọc `main` và `tree SHA` mới nhất.
2. Tạo blob cho đúng file thay đổi; file nhị phân dùng base64 và đối chiếu Git blob SHA.
3. Tạo tree trên **base tree hiện tại**, không dựng lại toàn repository từ bản scratch thiếu file.
4. Tạo commit có parent là main đã đọc. Kiểm tra main không thay đổi rồi update ref không force.
5. Kiểm tra status Vercel của commit và URL production. Nếu có người push xen vào, lấy main mới và áp lại thay đổi; không ghi đè lịch sử.

Tài liệu không cấp quyền mới để deploy, gửi tin, đổi cấu hình bảo vệ hay thay credential. Làm theo quyền đã có trong cuộc trò chuyện và công cụ đang kết nối.

## 10. Checklist bàn giao một bản sửa

- [ ] File nguồn và patch đúng; không chỉ thay `dist`.
- [ ] Không đổi màu/alpha hoặc scale X/Y khác nhau.
- [ ] Đúng số frame, đúng file/version, đúng grid và baseline.
- [ ] Mở tướng → chi tiết → quay lại → mở lần hai hoạt động.
- [ ] PC chạy ít nhất một trận; khung hình ổn định qua Basic/skill/impact.
- [ ] SFX tải/decode/start thực tế, không chỉ tồn tại trong thư mục.
- [ ] `npm test` đạt; bản embedded bằng byte bản standalone.
- [ ] Commit đã có trên GitHub; Vercel báo thành công và production dùng mã mới.
- [ ] Ghi rõ kiểm tra Safari thật đã làm hay chưa; không gọi iframe Chrome là iPhone.
- [ ] Ghi lại phần còn thiếu, đặc biệt mapping SFX riêng từng tướng.

## 11. Những cách đã gây lỗi: không lặp lại

- Chọn nhầm nguồn RGB nền đen rồi key mất chi tiết tối.
- Crop mỗi frame, bỏ offset/pivot rồi kéo đầy ô: nhân vật rung/co giãn.
- Dùng cùng chiều cao ô cho Idle mới và Basic cũ mà không đo cơ thể.
- Đổi metadata nhưng để trình duyệt cache ảnh cũ ở URL immutable.
- Tạo nhiều bộ điều khiển click/pointer/touch cho một nút quay lại hoặc Victory.
- Sửa CSS bằng thêm lớp fixed/sticky lên một screen đã bị đè.
- Có file SFX nhưng chỉ gọi oscillator beep; manifest audio vẫn null.
- Giữ flash cả màn hình cho từng cú đánh rồi nhầm thành “nâng chất lượng hiệu ứng”.
- Chỉ build hoặc sửa bản xem thử rồi báo production đã xong.

## 12. Lịch sử kiểm chứng production — bản sửa 05/09

Commit code: `641658e544511d40ad15ad5e5472e826079f194c`. GitHub báo Vercel **success**; trang `qa-runtime.html` mới đã trả HTTP 200. Những mục dưới đây là quan sát thực tế sau deploy, không phải checklist dự định:

- Chrome, iframe 390×844: đủ 12 thẻ tướng, có Lục Ảnh; nhìn thấy cả bộ lọc và dock. Mở chi tiết Lục Ảnh thấy nhân vật đầy đủ và đúng tỷ lệ.
- Lọc Hệ Mộng → mở Lục Ảnh → Quay lại: trở về đúng hai thẻ Thầy Mo/Lục Ảnh và giữ bộ lọc. Đổi khung 430×932 → Thành Chính → Tướng: mở lại được.
- Lưu đội có Lục Ảnh bằng UI, chạy Chinh chiến ở khung PC 1280×900. 24 mẫu DOM trong khoảng quan sát: canvas giữ 1280×828 khi giao đấu, flash luôn `0.000`, có trạng thái attack/hurt/ultimate. Khi chuyển sang Victory, canvas đổi một lần sang cao 900 theo layout kết quả; đây không phải dao động chiều cao trong trận.
- Đã thấy nhánh Ultimate của Lục Ảnh chạy trong mẫu live. **Chưa có ảnh chụp riêng đúng thời điểm Basic trên browser**; kết luận sửa tỷ lệ Basic dựa trên test pixel atlas thật và metadata renderer đã build, không giả nhận là đã đối chiếu screenshot Basic trên iPhone.
- Cả 9 URL SFX trả HTTP 200, đúng MIME, đúng hash nguồn. Chrome giải mã 9/9; AudioContext `running`, bộ đếm ghi 46 lần source start và event cuối `victory`, không có `data-sfx-error`. Không dùng các bộ đếm này để khẳng định loa trên iPhone đã phát âm.
- Nút `Ải sau` chuyển sang thông báo hoàn thành nhiệm vụ 1/2 và mở nhiệm vụ kế tiếp. Không ghi nhận việc nút bị chặn trong lần kiểm tra đó.
- Safari/iPhone thật: **chưa kiểm tra**. Cần người dùng xác nhận trên thiết bị từng gặp lỗi.

**Ghi chú cập nhật 07/09:** các phát hiện MVP/Đình Lôi trong đoạn lịch sử sau đã có các patch tiếp theo, gồm PR #16 và golden runtime. Chỉ dùng để truy lỗi; xem progress mới nhất trước khi nhận việc.

Phát hiện ngoài bốn lỗi đang sửa: phần ảnh MVP Ông Phở trên màn Victory có lúc hiện ô placeholder thay cho ảnh nhân vật; một ảnh chụp trận PC còn thấy frame của Đình Lôi bị cắt phần đầu. Hai renderer này không được chỉnh tỷ lệ trong bản vá lần này. Ghi làm việc tiếp theo, kiểm tra grid/source của chính nhân vật trước khi sửa; đừng ghi “toàn bộ màn Victory/nhân vật đã đạt” dựa trên việc nút Ải sau bấm được. SFX riêng từng tướng cũng chưa được duyệt mapping; hiện là bộ event dùng chung như bảng ở mục 8.

