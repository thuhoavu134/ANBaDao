# Hướng dẫn GLM 5.3 Flash: tích hợp tướng và VFX/SFX Kiếm Thế

Cập nhật 16/10/2026. Áp dụng cho repo `bktimmy247/luc-than`, game Hồn Việt / Mộng Giới / Lục Thần. Đây là hướng dẫn thao tác trong repo, không phụ thuộc API hay phiên bản SDK của model.

## 1. Đọc trước khi làm

Đọc `AGENTS.md`, `docs/AGENT-WORKFLOW-HANDOFF-2026-09-21.md`, `docs/VIBE-WORKFLOW-RULES.md`, rồi tài liệu này. Lấy main mới nhất và đọc source hiện tại; không dùng bản checkout hoặc ZIP cũ làm chuẩn. Giữ toàn bộ game 6v6, save, roster và tính năng hiện có.

Tuân thủ Vibe Builder/VibeLab theo quy định repo khi sửa runtime. Nếu thiếu skill, ticket board hoặc môi trường kiểm thử, báo đúng phần bị chặn; không tự tạo bằng chứng PASS. Docs-only dùng kiểm tra thông thường. Quyền đã được chủ dự án cấp trong tác vụ vẫn có hiệu lực; không hỏi lại cùng một việc. Không force-push, không thay branch protection, không vượt sign-in/deployment protection.

Tướng đã duyệt là tài sản chuẩn. Không tự thay thiết kế, animation, VFX hay SFX bằng bản khác vì tên file có vẻ giống hoặc vì tìm được bản gốc hơn. Muốn thay bản đã duyệt phải trình diễn khác biệt cho chủ dự án quyết định.

## 2. Bản đồ source cần đọc

Các đường dẫn dưới đây có thật ở thời điểm PR #308 được merge. Xác nhận lại bằng `rg` khi main thay đổi.

| Trách nhiệm | Nơi đọc / sửa |
|---|---|
| Sinh game production | `scripts/build-static.mjs` |
| Hồ sơ và luật tướng mẫu | `src/domain/hero/tich-dao.mjs` |
| Catalog, ID và alias | `src/domain/hero/splus-catalog.mjs`, `splus-extras.mjs`, `splus-profiles.mjs` trong cùng thư mục |
| Damage, nộ, chọn mục tiêu, dấu ấn, kết liễu | `src/domain/combat/splus-mechanics.mjs` |
| Nối lượt đánh với trình diễn | `src/runtime/splus-battle-bridge.js` |
| Animation, dịch chuyển, VFX, marker | `src/runtime/tich-dao.js` |
| Gắn tướng vào host và battle trong build | `scripts/tich-dao-runtime-v1.mjs` |
| Trang chi tiết và AFK | `src/ui/tich-dao-detail.js`, `src/ui/campaign-scene.js` và host patch ở trên |
| Audio bus dùng chung | `src/ui/audio-sfx-runtime.js` |
| Icon trạng thái | `src/domain/hero/splus-status.mjs`, `src/render/combat-status-presentation.mjs`, status lane trong battle patch |
| Cache, atlas và clock dùng chung | `src/assets/asset-loader.mjs`, `decoded-atlas-cache.mjs`, `frame-clock.mjs` |
| Dữ liệu hình và timeline | `assets/characters/tich-dao/runtime-meta.json` |
| Asset phát thực tế | `assets/characters/tich-dao/`, `assets/vfx/tich-dao/`, `assets/audio/sfx/tich-dao/` |
| Test tham khảo | `tests/tich-dao.test.mjs`, `tests/tich-dao-runtime.test.mjs`, `tests/tich-dao-audio.test.mjs` |
| Công cụ chuyển đổi cũ để đọc trước khi dùng | `scripts/tich-dao-convert-v1.mjs`, `scripts/tich-dao-content-v1.mjs`, `scripts/tich-dao-vfx-v1.mjs` |

Không chỉ sửa `dist/`: build sẽ ghi đè. Installer hiện phụ thuộc thứ tự Kỷ Vân → Tiêu Phong → Tịch Dao và các anchor của source. Đọc thứ tự thật trong build; giữ assertion anchor duy nhất và tính idempotent. Không chạy converter cũ lên asset đã duyệt trước khi kiểm tra đầu vào/đầu ra: script lịch sử có thể sinh lại một phương án VFX đã bị thay thế.

## 3. Chốt bộ kỹ năng trước khi code

Lập bảng ngắn: tên/ID, Basic, Ultimate, passive, cost/gain nộ, mục tiêu, số hit, thời điểm hit, buff/debuff, xác suất, số lượt, số tầng, cách tiêu thụ, ngưỡng kết liễu, giới hạn mục tiêu. Dùng đúng yêu cầu chủ dự án; thiếu thông tin quan trọng mới hỏi. Không tự thêm điều kiện hàng sau, dấu ấn hoặc cooldown.

Phân biệt ba việc: logic combat quyết định kết quả; animation thể hiện chuyển động; VFX/SFX thể hiện sự kiện. Renderer không tự trừ HP, cộng nộ hay chọn một nạn nhân khác engine. Chỉ resolve mỗi hit một lần, kể cả x3 hoặc FPS thấp.

Với mẫu Basic + Ultimate + passive, `skill` có thể là alias hiển thị để tương thích hồ sơ. Phải kiểm tra `canUse`/AI và đường gọi action để alias không trở thành đòn tiêu nộ ngoài ý muốn. Kiểm tra từ nộ 0, đánh thường tích nộ, đủ nộ tự ra ultimate. Không chỉ ép nộ đầy trong trang test.

## 4. Nhận và chuẩn hoá animation

1. Kiểm kê archive trước khi giải nén: kiểm tra định dạng thật, file lỗi/tải dở, kích thước, đường dẫn; không cho entry `../` hoặc absolute path ghi ra ngoài thư mục staging. Không chạy executable trong pack.
2. Đọc manifest, FPS, số frame, kích thước cell, alpha, pivot và phase. Xuất contact sheet để xem idle/run/atk/ultimate/hit/fall-die; không đoán từ tên atlas.
3. Giữ RGBA và offset tác giả. Nếu chỉ có nền xanh, key đúng màu nền, giữ viền tóc/vũ khí, kiểm trên nền sáng và tối. Không key màu đen để xoá nền VFX; đen có thể là thành phần của blend `screen`.
4. Đo kích thước phần thân thật, lấy Bạch Diện làm mốc hiển thị đã chốt. Giữ một hệ scale ổn định giữa idle/atk/ultimate/run/hit/fall. Không auto-fit từng frame theo alpha bbox vì làm nhân vật phập phồng; tư thế cúi/nhảy có thể thay đổi chiều cao tự nhiên.
5. Neo chân bottom-center, giữ hướng 3/4 và mirror theo phe đúng một lần. Scale trong AFK, đội hình, hồ sơ và battle phải cùng ý nghĩa; atlas AFK giảm nửa không được làm thân nhỏ nửa lần nữa.
6. Với timeline có biến mất, giữ phase `visible:false` và cell rỗng. Không nội suy hình nhân vật qua khoảng ẩn. Giữ thời gian từng phase thay vì chia đều mọi cell nếu dữ liệu tác giả không đều.
7. Chia atlas theo ngân sách decode; RAM gần đúng là width × height × 4, không phải dung lượng WebP trên đĩa. Tham khảo paging/lazy load/cache của tướng hiện có. Preload clip sắp dùng, giải phóng khi đóng scene; tránh decode toàn bộ roster cùng lúc trên iPhone.

Ghi metadata: file, cols/rows, frames, cellW/H, frame durations, pivot, content scale, nguồn và SHA-256. Không sao chép số của Tịch Dao sang tướng mới mà không đo.

## 5. Tìm và lựa chọn VFX/SFX từ kho Kiếm Thế

### Nguồn và cách tìm

Ưu tiên asset đã được duyệt trong repo. Kho gốc người dùng từng cung cấp có `SKILLPACK.zip`, `ASSET_LIB.zip`/`.rar`; các archive này không được đảm bảo có trong checkout GitHub. Nếu không có, xin đường dẫn/pack cần thiết; không bịa một đường dẫn máy cũ hoặc nói đã nghe file chưa đọc được.

Tìm asset và wiring bằng:

```sh
rg --files assets scripts src | rg 'vfx|sfx|runtime-meta|convert|audio'
rg -n 'sourceCode|provenance|SndFile|missile|blendMode' assets scripts docs
rg -n 'HonVietSfx|sword-rain|nextTichDaoExecution' src scripts
```

Nếu có source game gốc, lần theo skill → missile/effect → sprite + sound ở chính bảng cấu hình. Kiểm tra tên cột, encoding và ID của pack đang dùng. `.pak`/`.spr` cần decoder đúng định dạng/version; không đổi đuôi thành PNG/WAV và không giả định có sẵn CLI giải mã. Ghi lại công cụ và lệnh thực tế đã dùng để tái tạo được.

Xem frame/contact sheet hoặc GIF để phân loại: vòng đất, projectile, slash, hit, aura, rain, dash/vanish. Chọn theo hành vi kỹ năng, hướng, điểm neo và mật độ; không chọn chỉ vì cùng màu. Nghe SFX riêng và trong tổ hợp: launch, whoosh, hit, sustain, finish có vai trò khác nhau. Có hình không có nghĩa là có âm thanh.

### Bảng ứng viên phải ghi trước khi trình duyệt

| Trường | Nội dung cần điền |
|---|---|
| Nguồn | Archive/version, đường dẫn gốc, skill/missile ID nếu đã xác minh |
| VFX | Sprite code, frame/FPS, alpha/blend, hướng, pivot, kích thước dự kiến |
| SFX | File thật, thời lượng, sample rate/channels, launch hay impact |
| Mức xác minh | Cặp gốc có bảng nguồn / tái sử dụng / phối mix / chưa tìm thấy tiếng |
| Sự kiện ingame | Cast, blink, từng hit, hit thành công, execute, recovery |
| Duyệt | Preview nào, ngày duyệt, hash file duyệt |

Một VFX có thể không có SFX riêng. Nếu mượn tiếng từ môn phái khác hoặc mix, ghi rõ và cho nghe duyệt. Không gọi đó là “âm thanh gốc đúng skill” chỉ vì nghe hợp.

### Mẫu đang được duyệt: Tịch Dao

Nguồn quyết định runtime là `runtime-meta.json` và wiring hiện tại, không phải mọi file còn nằm trong thư mục.

| Vai trò | Asset đang dùng | Sprite code |
|---|---|---|
| Biến mất | `assets/vfx/tich-dao/vortex.webp` | `jgm_120_ftw_c` |
| Hiện thân/vòng hoa | `assets/vfx/tich-dao/flower.webp` | `jgm_30_hxc_c` |
| Mưa kiếm | `assets/vfx/tich-dao/rain.webp` | `zgm_110_qzzh_c` |

Ba clip giữ alpha gốc, blend `screen`. Vòng hoa neo ngang thắt lưng địch, không trên đầu. Bốn cue duyệt là `blink.wav`, `slash.wav`, `sword-rain.wav`, `execute-impact.wav` trong `assets/audio/sfx/tich-dao/`; đây là tiếng tái sử dụng/mix Đường Môn và Võ Đang. Không tự đổi sang các file legacy `basic/strike/rain.wav`.

Metadata còn có `sfx.provenance.jx1PairTable`, ghi nhận audit bảng `1fightskill/missile.txt`: missile 518 ghép `jgm_110_znwz_c` với `cy_mylx_f/c`; 522 ghép `zgm_105_lgss_c` + `zgm_110_qzzh_c` với `sl_dmdj_c`; 547 ghép `jgm_120_ftw_c` với `cy_bxxl_c`; 548/574 ghi `jgm_50_byhw_c` không kèm tiếng. Đây là thông tin nguồn được phiên trước ghi lại, không phải quyền thay bản mix đã duyệt. Muốn chọn cặp mới, mở bảng/file thật và xác minh lại; không coi ghi chú này là bằng chứng đã nghe hoặc có file nguồn trong repo.

## 6. Preview để duyệt và khoá asset

Xuất GIF để duyệt chuyển động; GIF không có âm thanh, nên kèm MP4 có tiếng hoặc WAV riêng. Preview cần tên ứng viên, nền tối/sáng, kích thước gần ingame, điểm neo ở thân địch và timeline cast → hit → finish. Chỉ đưa vài phương án phù hợp.

Sau khi chủ dự án duyệt, lưu trong repo bản runtime được chọn cùng manifest nguồn/hash và mốc duyệt. Kiểm hash file tích hợp so với bản duyệt. Không thay bằng hiệu ứng “tương đương” khi chuyển từ preview sang game. Preview chỉ là bước chọn asset, chưa chứng minh skill chạy trong trận thật.

## 7. Nối tướng vào game thật

1. Đăng ký ID canonical, alias, catalog/profile; nối host DATA/manifest/roster đúng owner. Tướng phải có mặt ở Tướng, Đồ Giám/đội hình liên quan, AFK và trận thật; không chỉ ở trang test.
2. Viết logic trong combat domain; dùng RNG của engine, quy tắc damage/status/turn hiện hành. Viết test cho ngưỡng, lượt, stack, chết giữa combo và đủ/thiếu nộ.
3. Thêm runtime/installer tương ứng, nối vào bridge và build. Tái dùng scheduler và audio bus hiện có; không tạo combat loop hoặc audio controller thứ hai.
4. Chọn mục tiêu trình diễn qua cùng selector engine. Khi mục tiêu chết giữa các hit, preview vị trí và nạn nhân nhận damage phải vẫn khớp.
5. Khai báo marker trên clock tác giả: release, impact(s), recovery. Ở x2/x3, animation, VFX, damage, SFX và fall cùng clock; tránh chia tốc độ hai lần. Kiểm đổi tốc độ giữa chiêu theo contract hiện có.
6. VFX neo theo mục đích: vòng đất ở chân, vòng thân ở eo, projectile đi từ nguồn đến đích, mưa rơi trên nạn nhân. Dùng toạ độ battle và depth scale; không lấy CSS pixel của trang để đặt effect lên canvas.
7. Preload/decode SFX trước marker. Phát qua `HonVietSfx` với cơ chế speed, mute/unlock và abort hiện tại. Một event chỉ một cue; kiểm cả host và iframe để tránh phát đôi. Dừng voice/effect khi huỷ trận; không để cue cũ lọt sang trận sau.
8. Status phải vào HUD dùng chung: icon, số tầng, số lượt, xoá khi hết hạn/tiêu thụ. Có VFX vòng hoa không thay được icon Hoa Ấn trên đầu.
9. Cuối action giải phóng khoá lượt đúng lúc; recovery/execute phụ chưa xong thì không cho tướng tiếp theo đánh chồng.

## 8. Hợp đồng Tịch Dao hiện hành — tránh lặp lỗi PR #308

Basic Ảnh Bộ miễn phí, ưu tiên địch hàng sau xa nhất. Basic gây sát thương vào HP và mục tiêu còn sống thêm 1 Hoa Ấn trên chính địch đó, tối đa 3. Nếu khiên hấp thụ hết, không mặc nhiên cộng dấu. Basic tích nộ; hiện tại 4 Basic từ nộ 0 đạt 60 nếu không có tác động khác.

Ultimate Tam Ảnh Đoạt Mệnh tốn 60 nộ. Ba nhát ưu tiên ba địch hàng sau khác nhau, thiếu thì chọn địch sống khác theo selector. Mỗi nhát tiêu thụ dấu của nạn nhân, +35% sát thương mỗi tầng, tối đa +105%. Dấu không tự kích hoạt mưa kiếm khi đủ 3.

Sau đủ ba nhát, xét địch sống **ở cả hai hàng**, HP **nhỏ hơn 30%** maxHP. Đúng 30% không đủ điều kiện. Chọn xa nhất trước, phát rain rồi resolve kết liễu ở marker; hạ được mới tiếp tục địch kế tiếp, tối đa 2. Không có địch đủ điều kiện thì không phát rain/cue. Kết liễu hiện dùng true damage bỏ qua shield/guard, nhưng vẫn tôn trọng kết quả sống/chết của engine; nếu bị cứu sống thì dừng chuỗi.

API tham khảo: `tichDaoOpeningTarget`, `tichDaoStrikeTarget`, `resolveTichDaoImpact`, `nextTichDaoExecution`, `resolveTichDaoExecution`, `finishTichDaoCast`. Không gọi wrapper resolve toàn bộ trước khi trình diễn các nhịp riêng vì sẽ gây damage sớm hoặc lặp.

Lỗi đã sửa ở `070f73c`: chỉ xét `back(foes(actor))` khiến địch hàng trước thấp máu không nhận rain. Một số tài liệu QA/PR cũ còn nói “chỉ hàng sau”, hoặc mô tả bộ VFX/SFX tạm; đó là lịch sử đã bị thay thế. Đọc source, metadata đã duyệt và test hiện tại trước khi port.

## 9. Kiểm chứng và bàn giao

Trên checkout đầy đủ, cài dependency theo lockfile rồi chạy:

```sh
npm ci
node --test tests/tich-dao.test.mjs tests/tich-dao-audio.test.mjs
node --test tests/tich-dao-runtime.test.mjs
npm test
```

Các lệnh tướng mẫu giúp hiểu contract; tướng mới cần test tương ứng, không chỉ chạy test Tịch Dao. `npm test` đã bao gồm build. Nếu checkout thưa thiếu asset/source, ghi thiếu gì; không đổi test để che lỗi. Với lỗi baseline, đối chiếu đúng revision và nêu rõ, không tự kết luận mọi CI đỏ là billing.

| Nhóm | Bằng chứng tối thiểu |
|---|---|
| Logic | Basic không tiêu nộ; đủ nộ ra ulti; xác suất/stack/duration đúng; mỗi hit chỉ resolve một lần |
| Execute | 0/1/2/3 địch đủ điều kiện, đúng 30%, dưới 30%, hàng trước/sau, chết giữa chuỗi, cứu sống |
| Asset | Hash bản duyệt, không 404/decode lỗi, đúng atlas cell, không crop/halo hoặc scale nhảy |
| Trình diễn | Idle/atk/ulti/hit/fall, cả hai phe, x1/x2/x3, đổi scene giữa chiêu, mở lại trận |
| HUD | Icon trên đầu, số tầng/lượt, dấu biến mất khi bị tiêu thụ |
| Âm thanh | Nghe thật đúng marker, không phát đôi, mute/unlock/abort đúng, kiểm realm host/iframe |
| Game thật | Trận 6v6 thường từ nộ 0; AFK, đội hình, hồ sơ; desktop và mobile |

Không dùng dummy HP cực lớn để kết luận mưa kiếm bị mất; cũng không nâng ngưỡng execute để chứng minh cơ chế 30%. Fixture cưỡng bức có thể kiểm draw, phải ghi là fixture và bổ sung trận tự nhiên/test luật. Screenshot không chứng minh có tiếng; `play()` trả true không chứng minh người dùng nghe được trên iPhone. Chromium responsive không phải Safari thiết bị thật.

Commit source/asset/metadata/test cùng tài liệu đủ tái tạo. Ghi revision, các lệnh/result đã chạy, evidence, phần chưa kiểm và trạng thái PR/deploy riêng. Cập nhật brief/design/changelog/handoff phù hợp khi contract đổi. Không báo deploy thành công chỉ vì merge thành công. Merge theo quyền chủ dự án đã cấp; chưa có quyền thì bàn giao PR để duyệt.

## 10. Prompt khởi động để dùng với GLM

> Đọc AGENTS.md và docs/GLM-HERO-VFX-SFX-GUIDE.md trước. Kiểm tra main mới nhất, trạng thái Git và nguồn asset có thật. Tích hợp tướng [tên] theo bộ kỹ năng [đã chốt], animation [đường dẫn]. Tìm VFX/SFX Kiếm Thế theo bảng nguồn khi có; ghi rõ cặp gốc hay tiếng mix. Trình GIF và MP4 có tiếng để duyệt asset chưa duyệt. Sau khi được duyệt, giữ đúng hash, nối domain → runtime → build → HUD/audio trong game 6v6 thật. Kiểm nộ, scale theo Bạch Diện, timeline x1/x2/x3 và huỷ trận. Báo đúng test/browser/device/deploy đã kiểm; không thay asset hoặc mở rộng luật ngầm.

## 11. Quy định bắt buộc: một ZIP là một lần tích hợp tướng trọn bộ

Bổ sung theo yêu cầu chủ dự án ngày 18/10/2026 sau lỗi Cổ Nương thiếu animation ở Victory và Hồng Thương sai hướng ở cú đâm sau lưng. Áp dụng cho mọi lần nhận ZIP tướng mới hoặc cập nhật ZIP tướng cũ. Không coi tích hợp battle riêng lẻ là hoàn tất bộ tướng.

### A. Kiểm kê và lập hồ sơ trước khi sửa runtime

- Ghi tên ZIP, SHA-256, revision nguồn, canonical hero ID và các alias. Kiểm kê tất cả animation, VFX, SFX và metadata; liệt kê file thiếu, lỗi hoặc chưa xác định vai trò.
- Xem contact sheet và chuyển động thật của từng clip; ghi frame count, frame durations, cell/atlas/page, alpha/blend, pivot/chân, hướng gốc và các phase ẩn. Không đoán hướng vũ khí hoặc mốc nhả chiêu từ tên file hay tỷ lệ frame.
- Đọc skill từ domain và yêu cầu đã chốt; lập mapping action → animation → release/impact/recovery → VFX → SFX → trạng thái. Phân biệt số hit logic với số kiếm/đợt trình diễn.
- Với ZIP cập nhật, đối chiếu hồ sơ và hash bản đã duyệt; giữ identity/save và các asset không thuộc yêu cầu thay đổi.
- Thiếu Run, Hit, Fall hoặc tiếng phải ghi rõ. Không âm thầm dùng tướng mẫu, portrait tĩnh hoặc tiếng khác rồi báo hoàn tất. Phần chưa có chỉ được đánh dấu thiếu/chờ duyệt; ngoại lệ cần dựa vào chỉ dẫn đã có của chủ dự án.

### B. Ma trận bắt buộc cho mỗi tướng

Tạo hồ sơ tại `docs/qa/<hero>-integration-<date>.md`. Điền từng dòng dưới đây với file/revision, trạng thái và bằng chứng; không chỉ đánh dấu chung “đã tích hợp”.

| Hạng mục | Nội dung phải kiểm |
|---|---|
| Tướng / Đồ Giám / hồ sơ | Canonical ID, alias, avatar/card/icon, idle động, tên và skill; không trùng entry |
| Bày trận / đội hình | Đúng tướng, kích thước thân, pivot/chân, hướng theo phe, save đội hình cũ |
| AFK / Chinh chiến | Idle, run và ATK đúng trạng thái; không rơi về hình mặc định |
| Battle | Idle, run, ATK, Ultimate, hit, fall/die và chuyển tiếp; không mất hình/crop/nhảy scale |
| Victory | MVP đúng identity; dùng Run thật đi vào rồi chuyển Idle thật; kiểm cache lạnh và mở lại |
| Defeat | Fall thật phát một lần rồi giữ frame cuối; không trở về idle hay tướng mặc định |
| VFX | Nguồn phát, mục tiêu, hướng bay/đâm, neo thân/chân, scale, số đợt, thứ tự lớp và thời gian tồn tại |
| SFX | File thật, nghe riêng và trong trận; release/impact/từng đợt khớp hình, không phát đôi |
| Skill / HUD | Nộ, mục tiêu, sát thương, dấu ấn, số tầng/lượt, hồi máu, tiêu thụ/xóa trạng thái đúng domain |
| Hai phe / vị trí đặc biệt | Cận chiến, tầm xa, đứng trước/sau địch, cú quay người, di chuyển về home; hướng mặt phải đúng từng phase |
| Clock / vòng đời | x1/x2/x3, đổi tốc độ giữa chiêu, mute/unlock, skip, hủy trận và mở lại; không sót cue/VFX/khóa lượt |
| Thiết bị | Desktop và mobile; báo riêng Chromium responsive và Safari/iPhone thật |

Trạng thái chỉ dùng: **ĐÃ KIỂM**, **CHƯA KIỂM**, **BỊ CHẶN**, **KHÔNG ÁP DỤNG**. Mỗi “ĐÃ KIỂM” ghi rõ lớp kiểm chứng (source/unit/build/browser/device), revision và bằng chứng. “KHÔNG ÁP DỤNG” phải có lý do theo bộ tướng/ngoại lệ đã chốt. Unit pass không thay thế kiểm hình hoặc nghe tiếng trong game.

### C. Đăng ký đầy đủ, dùng chung dữ liệu

- Hồ sơ asset/timeline của tướng là nguồn dữ liệu chung. Các màn lấy cùng canonical ID, alias, revision và clip descriptor; tránh chép số frame/pivot/thời lượng thành các bộ không đồng nhất.
- Với kiến trúc hiện tại còn nhiều registry, bắt buộc rà tất cả owner trước khi bàn giao. Đặc biệt kiểm `scripts/result-character-motion-v1.mjs` cho Victory/Defeat; đăng ký battle không tự đăng ký màn kết quả.
- Kiểm cấu trúc single-atlas và paged-atlas đúng metadata; không ép tướng mới theo cấu trúc tướng mẫu.
- Viết kiểm tra hồi quy tại chỗ nối thực tế: identity → manifest → clip được chọn, chuyển Run → Idle, Fall giữ cuối, và mirror theo phase cho cả hai phe. Test chỉ tìm chuỗi tên tướng trong source chưa đủ.
- Hướng quay người phải nằm trong dữ liệu/phase diễn hoạt khi phù hợp; đừng áp một hướng theo phe cho toàn bộ combo có đâm sau lưng. Kết thúc phase phải trả đúng trạng thái.
- Đây là quy định tích hợp; chưa có nghĩa repo đã được refactor thành một registry duy nhất. Không tuyên bố kiểm tự động toàn bộ màn nếu chưa triển khai.

### D. Ngân sách thời gian và đồng bộ

Ghi riêng thời lượng clip nhân vật và tổng thời lượng action x1, tính từ bắt đầu đến khi có thể chuyển lượt, gồm di chuyển, kiếm bay, mọi đợt VFX và thu chiêu. Ghi riêng thời gian chờ tải asset.

Dùng chuẩn thời gian đã được chủ dự án duyệt. Khung roster-wide tại `docs/combat-timing-x1-review.md` hiện là đề xuất để duyệt, không tự áp lên toàn bộ tướng đã duyệt. Khi duyệt chuẩn mới, cập nhật nguồn chuẩn và kiểm giới hạn thay vì tự đặt thời gian riêng ở mỗi renderer.

Đặt release theo tư thế tay/vũ khí thật; impact theo tiếp xúc thật. Animation, VFX, SFX và damage marker phải cùng clock. Tăng tốc không được resolve hit hai lần, mất hit cuối hoặc cắt đợt cuối. Hiệu ứng trạng thái tồn tại theo trạng thái combat, không theo timeout tùy ý.

### E. Điều kiện bàn giao

1. Có kiểm kê ZIP và ma trận đầy đủ; không bỏ dòng Victory/Defeat hoặc hướng hai phe.
2. Có preview chuyển động kèm âm thanh để duyệt asset/diễn hoạt; ghi rõ nếu dùng mốc thân hoặc fixture.
3. Có kiểm chứng trên game thật từ nộ 0 tới Ultimate, màn kết quả và quay lại game; kiểm lỗi asset/console, lifecycle và save. Thiếu môi trường thì ghi BỊ CHẶN, vẫn bàn giao phần đã làm bằng PR nhưng không gọi là “tích hợp hoàn chỉnh”.
4. PR nêu phần sửa, test đã chạy, bằng chứng hình/tiếng và phần còn thiếu. Không lấy số lượng unit test làm bằng chứng nhìn/nghe đúng.
5. Chỉ gọi bộ tướng hoàn tất khi mọi hạng mục áp dụng đã được kiểm ở lớp phù hợp và các ngoại lệ được chấp nhận. Merge/deploy vẫn theo quyền chủ dự án đã cấp; cập nhật PR không đồng nghĩa được merge.

Mỗi lần nhận ZIP phải thực hiện lại ma trận theo revision mới, kể cả khi chỉ đổi một số clip. Có thể tái sử dụng bằng chứng còn hợp lệ cho phần không đổi, nhưng phải ghi revision và lý do.


### Quy tắc VFX sau phản hồi 18/10/2026

- Buff bọc thân phải dùng body bounds của **người nhận buff**, không dùng kích thước caster hoặc khung sân.
- VFX directional dùng hướng mặt của caster; mặc định source hướng phải, phe địch mirror đúng một lần. Helper dùng chung `battleVfxMirror(actor, sourceFacing=1)` cho legacy; choreography đổi hướng phải cấp `visualFacing` hoặc `facing`. Source hướng trái truyền `sourceFacing=-1`. Không mirror thêm tại parent khi blitter đã mirror.
- Kiểm riêng ATK, skill, cả hai pha ulti, projectile và impact của hai phe; các lệnh `drawImage` trực tiếp cũng phải qua direction owner. Với tướng authored độc lập, kiểm hợp đồng hướng riêng trước khi thay.
- Chữ UI cần sắc nét tách thành vector/live text; không phóng raster chữ đi kèm VFX.
