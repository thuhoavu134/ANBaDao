# Hướng dẫn tích hợp tướng mới từ A đến Z (chuẩn duy nhất)

Cập nhật 22/10/2026 (quy trình 1 lệnh ở ngay dưới). Tướng mẫu đã chạy thật trên game: **Khaos** (`assets/characters/khaos/`).

Đây là cách **duy nhất** để đưa tướng mới vào game. Không viết `scripts/<tướng>-integration.mjs` riêng. Không chèn regex vào `index.html`/`battle.html`. Không tạo cache ảnh hay bộ điều khiển âm thanh riêng. Các tướng cũ (Bé An, Cổ Nương, Tịch Dao…) vẫn còn script riêng do làm trước khi có chuẩn này; khi sửa tướng nào thì chuyển tướng đó sang chuẩn này.


## ⚡ QUY TRÌNH 1 LỆNH (agent nào cũng làm đúng thế này — đọc trước mọi phần khác)

Cập nhật 22/10/2026. Tướng đã đi qua quy trình này: **Bạch Y Vân Phong**, **Nguyệt Diệp**, **Tịnh Mặc**, và tướng nghiệm thu **Thử Nghiệm**.
Toàn bộ đường đi từ video owner gửi tới PR nằm trong `scripts/integrate-hero.mjs`. Không viết script riêng cho từng tướng.

### Đầu vào owner gửi

| Loại | Bắt buộc | Ghi chú |
|---|---|---|
| 6 clip nền xanh 1920×1080: `idle`, `run`, `atk`, `ultimate`, `hit`, `fall-die` | có | tên file giữ nhãn ở đầu (`idle…`, `run…`, `falldie…`, `Hit_…`, `atk…`, `ulti…`) |
| Clip VFX: `vfxatk`, `vfxulti` (tuỳ chọn `vfxnoitai`) | có | cùng chuẩn nền xanh, có tiếng |
| **Brief luật chơi** (`docs/templates/hero-brief.json`) | có | nội tại + đánh thường + tuyệt kỹ: %, số hit, mục tiêu, hiệu ứng |

Brief chỉ chứa **luật chơi**. Không điền thời gian, không điền đường dẫn ảnh/âm thanh, không điền marker — pipeline tự suy.

### Bước A — chép bộ video vào một chỗ

Để nguyên tên file. Không đổi tên, không cắt ghép, không xuất lại qua app khác.

### Bước B — chạy đúng 1 lệnh

```powershell
# Tướng mới hoàn toàn: video + brief
node scripts/integrate-hero.mjs --slug <slug> --id hero_splus_<x> --brief docs/templates/<brief>.json \
     --files <idle.mp4> <run.mp4> <atk.mp4> <ulti.mp4> <hit.mp4> <fall.mp4> <vfxatk.mp4> <vfxulti.mp4>

# Bộ video đã nằm trong thư mục inbound của agent (tự chọn bản mới nhất, chặn clip cũ)
node scripts/integrate-hero.mjs --slug <slug> --id hero_splus_<x> --brief <brief.json>

# Đã có pack sẵn (tích hợp lại tướng cũ), không cần video
node scripts/integrate-hero.mjs --slug <slug> --id hero_splus_<x> --pack <packDir>
```

Thêm `--allow-reuse` khi bộ video đó **đã từng pack cho tướng khác** (dùng để nghiệm thu, hoặc owner cố ý dùng lại).

### Bước C — lệnh tự chạy 16 bước, dừng ngay ở bước lỗi

| # | Bước | Công cụ | Chặn lỗi gì |
|---|---|---|---|
| 1 | intake | `scripts/hero/intake.mjs` | bộ thiếu clip, clip cũ lẫn vào, sai 1920×1080, không có phông xanh, file đã pack cho tướng khác |
| 2 | pack | `kiemthe-animation-packager --framing uniform` | khung chung, foot line cố định, idle khoá anchor, loop seam IoU ≥ 0.92 |
| 3 | validate | `validate_package.py` | pack thiếu/hỏng |
| 4 | parity | `scripts/qa-idle-source-parity.mjs` | **idle rung hơn video gốc** (>1.5 lần) |
| 4b | seam | `scripts/qa-idle-loop-seam.mjs` | **mối nối idle khựng**: bước nhảy ở chỗ nối lớn hơn nhịp thường của bản pack |
| 5 | import | `scripts/import-sixstate-pack.mjs` | từ chối pack có anchor idle lệch giữa các frame |
| 6 | vfx | `scripts/hero/key_vfx.py` | VFX key hỏng, atlas vượt ngân sách ảnh |
| 7 | sfx | `scripts/hero/extract_sfx.py` | cắt tiếng từ audio clip anh gửi (chạy `--allow-missing`, phần thiếu để bước 7b lo) |
| 7b | sfx-source | `scripts/hero/sfx-source.mjs` | vai nào clip không có tiếng → lấy kho Kiếm Thế → thư viện Pixabay; vẫn thiếu thì ghi `sfx-todo.json` và FAIL |
| 8 | scaffold | `scripts/hero/scaffold.mjs` | brief thiếu trường, tướng chưa đăng ký, thiếu test |
| 9 | portrait | `scripts/hero-portrait-from-idle.mjs` | ảnh đại diện không phải frame 0 của idle |
| 10 | build | `scripts/build-static.mjs` (có HERO DOCTOR) | dung lượng trang, tên hash, đăng ký tướng, marker, cue |
| 11 | test | `npm test` + `scripts/hero/compare-test-fails.mjs` | **test fail mới** so với baseline `origin/main` |
| 12 | battle | `scripts/qa-authored-battle.mjs` | trận thật không vẽ atlas của tướng, hoặc có lỗi JS |
| 13 | detail | `scripts/qa-detail-probe.mjs` | màn chi tiết không có idle chạy |
| 14 | evidence | `scripts/qa-idle-frames.mjs` → GIF | bằng chứng canvas thật cho PR |
| 15 | deliver | `--deliver` | nhánh mới + commit + verified push + PR (không bao giờ đẩy `main`) |

Kết quả: `INTEGRATE PASS` + báo cáo `docs/qa/integrate/<slug>.md` + GIF `docs/qa/idle-anchor/detail-<x>.gif` + ảnh trận `docs/qa/<slug>/battle-*.png`.

### Tướng có VFX nằm sẵn trong clip (không có clip VFX riêng)

Tướng **cận chiến** thường đã có hiệu ứng nằm ngay trong clip `atk`/`ulti` (kiếm, băng, lửa… bay ra từ chính khung
hình nhân vật). Khi đó **không cần clip `vfxatk`/`vfxulti` riêng** — thêm cờ `--no-vfx`:

```bash
node scripts/integrate-hero.mjs --slug <slug> --id hero_splus_<x> --brief <brief.json> \
     --files idle.mp4 run.mp4 hit.mp4 fall.mp4 atk.mp4 ult.mp4 --no-vfx
```

Pipeline bỏ bước 6 (không key atlas VFX), `scaffold` ghi `no VFX clip supplied` và không khai projectile/area VFX,
còn `hero-doctor` chỉ FAIL khi kit **khai** VFX mà thiếu atlas — nên vẫn qua. Hiệu ứng hiển thị vì **nằm trong khung
animation** của đòn đó. Muốn tách VFX riêng để game vẽ đè thì vẫn phải có clip VFX sạch (không có nhân vật).

### Pipeline tự suy những gì (đừng làm tay)

| Thứ tự làm tay trước đây | Nay do đâu |
|---|---|
| đọc tên clip, gõ đường dẫn vào manifest | intake đọc nhãn từ tên file, tự ghi `bundle.json` + `manifest.json` |
| chọn điểm cắt vòng lặp idle bằng cảm giác | packager chấm mối nối theo **độ lệch thị giác so với nhịp thường của bản pack** (không chỉ IoU silhouette); cổng `seam` chặn nếu mối nối lệch > 1.6 lần |
| chọn cửa sổ cắt SFX bằng mắt trên đường bao RMS | `extract_sfx.py` tự tìm sự kiện âm thanh (đỉnh, ngưỡng, gộp khoảng lặng) |
| đặt `release` / `hits` / `vfxEnd` / `recovery` | scaffold suy từ **thời điểm bắt đầu tiếng vung đao trong chính clip**; không có tiếng thì 45% độ dài clip |
| đặt `lead` cho từng cue | scaffold tính `lead = marker − lúc tiếng bắt đầu`, nên tiếng khớp đúng khung hình |
| khai `victory.runVisualScale` | scaffold đo chiều cao thân idle vs run từ atlas |
| đăng ký tướng vào 3 file code | scaffold chèn qua marker `@scaffold`, `AUTHORED_KITS`, `AUTHORED_HIT` |
| viết test cho tướng | scaffold sinh `tests/<slug>.test.mjs` (đăng ký, số hit, mục tiêu) |

### Cơ chế khai báo trong brief (không viết code cho hiệu ứng thường gặp)

Mỗi kỹ năng trong brief có mảng `effects`. Scaffold kiểm từng dòng (sai tên/giá trị là **dừng và chỉ đúng trường sai**),
ghi vào `src/domain/combat/authored-effects-registry.mjs`, và **sinh 1 test cho mỗi hiệu ứng** trong `tests/<slug>.test.mjs`.
Engine chạy chúng bằng `src/domain/combat/authored-effects.mjs` qua 7 móc chung; tướng không khai effects chạy y như cũ.

**Đòn đánh** (`kit.basic.effects`, `kit.ultimate.effects`) chạy sau hit cuối: `who: target` áp cho từng mục tiêu bị đánh,
còn `self / allies / lowestAlly / enemies` chỉ áp **1 lần mỗi chiêu** (kể cả tuyệt kỹ đánh toàn bộ).

| `do` | Tham số | Ví dụ |
|---|---|---|
| `status` | `status`, `value` (sức mạnh), `turns` 1..5, `maxStacks` | `{"do":"status","status":"armorDown","value":0.15,"turns":2}` |
| `status` (DOT) | `burn` / `poison` / `bleed` + `pctAtk` hoặc `pctMaxHp` mỗi lượt | `{"do":"status","status":"burn","pctAtk":0.2,"turns":2}` |
| `heal` / `shield` | `pctAtk` hoặc `pctMaxHp`, `who` | `{"do":"shield","who":"allies","pctMaxHp":0.1}` |
| `energy` | `value` (Nộ, âm được) | `{"do":"energy","who":"self","value":20}` |
| `cleanse` | `count` | `{"do":"cleanse","who":"lowestAlly","count":1}` |
| `execute` | `belowHp` | `{"do":"execute","belowHp":0.2}` kết liễu kẻ dưới 20% máu |
| `damage` | `pctAtk` / `pctMaxHp`, `type` (mặc định `true`) | `{"do":"damage","who":"enemies","pctMaxHp":0.02}` |
| `stack` | `name`, `max`, `add` | `{"do":"stack","name":"uHon","max":5}` |

Mọi dòng nhận thêm `chance` (0..1). `who`: `target | self | allies | lowestAlly | enemies`.

Trạng thái hỗ trợ — tốt: `attackUp armorUp magicArmorUp speedUp critUp critDamage resistUp evasionUp lifesteal mitigation`;
khống chế: `stun sleep paralysis fear root disarm silence confusion`; xấu: `healDown antiHeal armorDown magicArmorDown attackDown speedDown blind rageSlow rageBan shieldBan buffBan damageDown critDown resistDown`; DOT: `burn poison bleed`.

**Nội tại** (`kit.passive.effects`) thêm `when`:

| `when` | Nghĩa | Ví dụ |
|---|---|---|
| `always` + `do:"stat"` | chỉ số luôn có: `attack defense magicDefense speed crit critDamage resist lifesteal mitigation`; `perStack` nhân theo bộ đếm | `{"when":"always","do":"stat","stat":"attack","value":0.04,"perStack":"nghiepLuc"}` |
| `immune` | miễn nhiễm trạng thái | `{"when":"immune","status":["blind","stun"]}` |
| `kill` | khi hạ gục (`target` là kẻ vừa chết) | `{"when":"kill","do":"heal","pctMaxHp":0.1}` |
| `hit` | khi đánh trúng (`action` lọc basic/ultimate) | `{"when":"hit","action":"basic","do":"stack","name":"nghiepLuc","max":5}` |
| `receive` | khi bị đánh (`target` là kẻ tấn công) | `{"when":"receive","do":"status","status":"attackDown","value":0.1,"chance":0.3}` |
| `roundStart` | đầu mỗi hiệp | `{"when":"roundStart","do":"energy","value":5}` |

Cơ chế lạ ngoài bảng này (triệu hồi, đổi vị trí, phản đòn có điều kiện, đếm theo sự kiện của đồng minh…) vẫn viết tay
trong `AUTHORED_HIT.<key>` (`src/domain/combat/splus-mechanics.mjs`) và thêm test vào `tests/<slug>.test.mjs`.
`desc` trong brief là chữ cho người chơi đọc — **phải khớp với `effects`**; người duyệt PR so hai phần này.

### Bước D — giao cho owner duyệt

```powershell
# tự làm: nhánh mới + commit + verified push + PR
node scripts/integrate-hero.mjs ... --deliver --branch feat/<slug> --title "feat(hero): <slug>"

# hoặc làm tay
git checkout -b feat/<slug>
git add <đúng file của tướng>
git commit -m "feat(hero): <slug>"
node scripts/tools/verified-push.mjs <origin/main> HEAD feat/<slug>
gh pr create --base main --head feat/<slug>
```

Đính GIF + ảnh trận vào PR. Owner duyệt bằng mắt và nghe tiếng rồi **owner merge**. Agent không push/merge `main`.

### Cấm (đã từng gây lỗi thật)

- Sửa idle ở khâu render: bù vị trí chân, đổi nhịp từng frame, cắt đoạn rồi chạy tới–lui. Màn chi tiết vẽ y hệt trận (`authoredBodyFrame`: nhịp đều, một anchor).
- Pack lại tướng cũ bằng packager khác phiên bản rồi để kích thước trong trận đổi mà owner không yêu cầu. Pack lại thì phải so hash các clip trận; nếu đổi thì dùng đúng phiên bản packager đã tạo pack cũ (`KIEMTHE_PACKAGER_DIR=<thư mục>`).
- Tin ảnh thu nhỏ hoặc nhận xét của model thị giác về độ rung. Phải đo bằng `qa-idle-source-parity.mjs`.
- Chạy `--deliver` khi owner chưa đồng ý mở PR, hoặc bỏ qua bước 11–14 vì "chắc là ổn".
- Commit những thư mục QA cũ và script debug có sẵn trong repo. Bước deliver chỉ stage đúng file của tướng.

---

## QUY ĐỊNH ẢNH ĐẠI DIỆN (bắt buộc từ 2026-10-20)

**Ảnh đại diện của tướng = FRAME ĐẦU TIÊN (frame 0) CỦA IDLE.** Áp dụng cho mọi bề mặt: thẻ tướng ở màn Tướng,
ô Bày trận/dự bị, avatar, dialogue, icon. Không dùng `avatar.webp` / `card.webp` / `hud-icon.webp` vẽ riêng nữa.

- Sinh ảnh: `node scripts/hero-portrait-from-idle.mjs <slug>` → cắt frame 0 từ atlas idle độ phân giải cao nhất
  (`runtime-meta.detail` nếu có, không thì idle page 0), trim viền trong suốt, ghi `portrait-<sha8>.webp` và trỏ
  `hero.json` → `art.portrait`.
- Đổi idle ⇒ chạy lại script.
- `hero-doctor` FAIL nếu `art.portrait` không phải `portrait-<sha8>.webp`.
- Chỉ khai báo `art.card` / `art.avatar` / `art.icon` riêng khi anh Cường Đức duyệt ngoại lệ.

## LÀM SẠCH FRAME TRƯỚC KHI PACK (bắt buộc từ 2026-10-23)

Một frame video chỉ được dùng khi **chỉ còn nhân vật**. Ảnh chụp màn hình từ công cụ AI thường mang thêm:
logo/ngôi sao Gemini (góc dưới-phải), chữ chú thích kiểu `#00FF00` (góc trên-trái vùng phông xanh),
con trỏ chuột, phông xanh, và **nền đen của màn hình khi anh chụp** (không phải một phần của frame).

**Tự chạy trong lệnh 1 bước** (từ 2026-10-23): packer `kiemthe-animation-packager/scripts/package_six_states.py` gọi
`scrub_strays()` ngay sau khi Blender key phông, TRƯỚC khi đo/cắt khung. Kết quả nằm ở `PACK-MANIFEST.json → states[].strayScrub`.

Luật nhận diện: **mảnh rời nhỏ đứng YÊN cùng một chỗ ở ≥80% số frame** = chữ in sẵn / logo AI / con trỏ → xoá;
mảnh rời **bay** (cánh hoa, khói, tia lửa) → giữ. Mảnh nằm hẳn ngoài khung nhân vật → xoá như vụn.
(Đã thử luật theo màu: hoặc sót `#00`, hoặc xoá nhầm cánh hoa đào — vì sau khi key, cánh hoa nhạt như chữ trắng.)

Kiểm chứng trên clip idle_7 của owner (144 frame): xoá 526 mảnh tĩnh (chữ `#00FF00` + logo Gemini) + 39 vụn,
**0 pixel bị xoá trong khung nhân vật**.

Không có script làm sạch riêng: việc tách phông là của Blender, việc xoá vật lạ là của packer.

## 0. Vì sao có chuẩn này

Trước đây, mỗi lần thêm tướng mới thì các lỗi dưới đây lại quay lại. Toàn bộ đều đã được tìm ra nguyên nhân trong code:

| Triệu chứng | Nguyên nhân gốc | Cái gì chặn nó bây giờ |
|---|---|---|
| Tướng không có trong màn Tướng / chọn đội | Mới upload ảnh, chưa đăng ký vào `DATA.heroes` và roster | Installer chung đọc `hero.json`; `hero:doctor --dist` FAIL nếu thiếu |
| Tàng hình hoặc hiện ảnh đại diện nền trắng trên iPhone | iPhone có khoảng 45 MiB ảnh cho cả 12 tướng và chỉ giải mã 1 ảnh mỗi lần. Idle 26 MiB thì không kịp hiện | Trang idle ≤ 8 MiB, mọi trang khác ≤ 12 MiB (doctor FAIL nếu vượt) |
| Hình vỡ thành mảng sau khi cập nhật ảnh | `/assets` được cache 1 năm (`immutable`). Ảnh mới nhưng tên cũ, nên máy dùng ảnh cũ rồi cắt theo khung mới | Tên ảnh bắt buộc có mã nội dung `-<sha8>.webp` (doctor FAIL nếu sai) |
| Mất tiếng khi đánh | SFX chỉ được tải lúc ra chiêu, trễ quá 150 ms thì bị bỏ | Mọi cue khai trong `hero.json` được giải mã từ lúc vào trận |
| Trận đứng hình tới lượt tướng mới | Hàm chọn mục tiêu trả về `[x, undefined]`, làm crash HUD | Có test chọn mục tiêu; runtime tự bỏ lượt rõ ràng, không treo khóa |
| Màn Tướng mờ | Màn chi tiết phóng to ảnh trong trận (đã bị giảm kích thước) | Ảnh `detail` riêng ở độ phân giải gốc |
| Màn Victory không phải tướng mới | Màn kết quả có danh sách diễn hoạt khai tay | Màn kết quả tự lấy mọi tướng có `hero.json` |
| Lúc chạy ra Victory bé hơn lúc đứng idle | Clip chạy sải bước dài làm khung bao phủ rộng, khi ép vào ô thì nhân vật bị nhỏ hơn clip idle | Khai báo `battle.victory.runVisualScale = chiều_cao_idle / chiều_cao_run` trong `hero.json` để cân bằng 100% |
| Idle rung giật ở màn chi tiết dù video gốc mượt (Nguyệt Diệp, Tịnh Mặc) | Packager `--framing uniform` tính anchor ngang riêng từng frame theo dải đáy; kiếm/tua/vạt áo đung đưa kéo cả người lệch | Packager luôn khoá anchor idle; importer từ chối anchor lệch; `qa-idle-source-parity.mjs` FAIL nếu rung > 1.5 lần video |
| Tướng cũ không có idle ở màn chi tiết (Cổ Nương) | Tích hợp trước chuẩn `hero.json`, chưa từng đăng ký canvas chi tiết | `LEGACY_DETAIL_IDLE` trong `authored-hero-install.mjs`; bước `detail` của `integrate-hero.mjs` |

---

## 1. Chuẩn bị nguyên liệu

1. **6 clip video** nền xanh `#00FF00`, camera đứng yên, nhân vật quay mặt **phải**, không bị cắt chân hay vũ khí: `idle`, `run`, `atk`, `ultimate`, `hit`, `fall-die`.
2. **Bộ kỹ năng đã được chủ dự án chốt**: chỉ gồm **nội tại + đánh thường + tuyệt kỹ**. Ghi rõ số %, số hit, số tầng, số lượt, chi phí nộ, mục tiêu.
3. **Ảnh đại diện** `avatar.webp`, 512×512, mắt mở và rõ mặt.
4. **VFX/SFX**: tìm trong kho SKILLPACK Kiếm Thế (mục 4). Phải được chủ dự án duyệt hình và nghe tiếng trước khi chốt.

Kiểm tra trước mỗi clip: độ phân giải 1920×1080, 24 fps, số frame, SHA-256, không watermark.

---

## 2. Đóng gói animation (workflow Kiếm Thế)

Chạy workflow `skill:kiemthe-animation-packager/package-six-state-set`. Yêu cầu:

- `idle`: **30 frame** lấy cách đều theo PTS, vòng lặp liền mạch. IoU đầu–cuối ≥ 0.92 và **vận tốc ở chỗ nối phải cùng chiều** (nếu ngược chiều sẽ thấy giật ở chỗ nối).
- `run`, `atk`, `ultimate`, `hit`, `fall-die`: mỗi clip **18 frame**.
- Giữ nguyên đáy chân (bottom_y/mid_foot) giữa các frame. Không cắt cụt ngọn bút hay vũ khí.
- Bắt buộc: `validate_package.py` PASS, xem contact sheet bằng mắt, gửi preview MP4 cho chủ dự án duyệt.

Kết quả: mỗi clip là 1 trang atlas, ô 480×440.

---

## 3. Ngân sách ảnh và tên file (bắt buộc)

| Loại ảnh | Giới hạn khi giải mã (rộng × cao × 4 byte) | Ghi chú |
|---|---|---|
| Trang idle dùng trong trận | **≤ 8 MiB** | Luôn nằm trong bộ nhớ trên iPhone |
| Mọi trang khác trong trận (run/atk/ult/hit/fall/VFX) | **≤ 12 MiB** | |
| Cạnh dài nhất của mọi trang | ≤ 4096 px | |
| Ảnh `detail` (chỉ dùng ở màn chi tiết) | ≤ 32 MiB | Mỗi lần màn này chỉ hiện 1 tướng |

Thực tế với ô 480×440: idle 30 frame (lưới 8×4) nặng 25.8 MiB, nên **phải thu nhỏ 0.5×** cho trong trận (ô 240×220, 6.4 MiB). Giữ bản gốc làm ảnh `detail`.

- Thu nhỏ **cả trang một lần** bằng Lanczos với tỉ lệ đúng 0.5, để lưới ô vẫn chính xác. Sau đó chia đôi các giá trị `cellW/cellH/pivot/foot/body` trong `runtime-meta.json`, và `bodyHeight/footX/footY` trong `presentation.json`.
- **Tên ảnh = tên + 8 ký tự đầu SHA-256 của nội dung**, ví dụ `idle-0-52f8ddff.webp`. Mỗi lần đổi nội dung ảnh thì đổi tên theo. `hero:doctor` sẽ báo đúng tên cần đặt.

---

## 4. Chọn SFX từ kho SKILLPACK và Pixabay

Bước 7b (`scripts/hero/sfx-source.mjs`) tự lo, theo đúng thứ tự này cho **từng vai** (basic, basic-hit, ultimate,
ultimate-vfx, ultimate-hit, hit, passive):

1. **Tiếng trong clip anh gửi** — `scripts/hero/extract_sfx.py` cắt theo envelope RMS. Có thì giữ, không đụng tới.
2. **Kho Kiếm Thế** — `knowledge/kiemthe-skillpack/data/skillpack.json` (193 SFX + 342 chưa đặt tên) trong workspace
   agent; file lấy từ `KIEMTHE-VFX-SFX-FULL-20261017.zip`. Chọn phái theo `he` của brief (kim→Thiếu Lâm/Thiên Vương,
   thủy→Thúy Yên, …; `soul`/`mong` → phái `public`), rồi chọn mã trong phái đó theo vai.
3. **Thư viện Pixabay** — `assets/audio/sfx/_pixabay/` + `index.json` (mỗi mục: `file`, `tags`, `source`, `license`).
   Trang web chặn HTTP thường và **nút Download của nó đòi đăng nhập**, nhưng **file trên CDN tải trực tiếp được** —
   dùng đúng cách đã chạy từ 20/10 (`C:\lt\hero7\sword_sfx.py`):
   browser mở trang tìm kiếm → bấm **Play** → đọc `document.querySelector('audio').src` (URL `cdn.pixabay.com/audio/...`)
   → `node scripts/hero/pixabay-get.mjs --preview "<url>" --name <tên>.mp3 --tags "a,b,c" --source "<trang>" --author "<tác giả>"`
   (script tự đổi sang `.../download/audio/...`, tải file, ghi `index.json`). **Không cần đăng nhập, không cần API key.**
4. **Còn thiếu** → ghi `C:/lt/packs/<slug>/sfx-todo.json` (kèm từ khóa gợi ý) và **FAIL**, không im lặng bỏ qua.

**Ghim mã trong brief khi cần chắc** (đường tin cậy nhất, bỏ qua bước chọn tự động):

```json
"kit": {
  "basic":    { "...": "...", "sfx": "cy_bhcs_c" },
  "ultimate": { "...": "...", "sfx": "tw_zxzy_c" }
},
"sfx": { "hit": "sb013", "sect": "cuiyan" }
```

Mọi cue ghi vào `assets/vfx/<slug>/provenance.json["sfx"]` với `source` (`SKILLPACK/...` hoặc `pixabay:...`) và
`owner review pending`. Tra tay khi cần: `python scripts/search-skillpack.py <từ khóa> [--sect <phái>] [--element <hành>]`
(công cụ trong workspace agent). **VFX từ kho/Pixabay chưa nối tự động** — VFX vẫn key từ clip `vfxatk`/`vfxulti`.

## 5. Cấu trúc thư mục của một tướng

```
assets/characters/<slug>/
  hero.json                 nguồn sự thật duy nhất
  runtime-meta.json         clip trong trận + "detail"
  presentation.json         kích thước thân / chân để scale đúng
  avatar.webp               512×512
  idle-0-<sha8>.webp  run-0-<sha8>.webp  basic-0-<sha8>.webp
  ultimate-0-<sha8>.webp  hit-0-<sha8>.webp  fall-die-0-<sha8>.webp
  detail-<sha8>.webp        idle độ phân giải gốc cho màn chi tiết
assets/vfx/<slug>/          atlas VFX + provenance.json
assets/audio/sfx/<slug>/    WAV
```

### 5.1 `hero.json` (xem mẫu `assets/characters/khaos/hero.json`)

| Trường | Ý nghĩa |
|---|---|
| `schema` | `luc-than-authored-hero/v1` |
| `id` / `slug` / `sourceId` | `khaos` / tên thư mục / `hero_splus_khaos` (phải khớp catalog S+ và domain) |
| `host` | Hệ (`he`: `thuy`, `hoa`, `kim`, `moc`, `tho`, `phong`, `mong`, `soul`…), phe, `rarity`, tên, vai trò, màu, `stats` |
| `kit.passive/basic/ultimate` | Tên và mô tả hiển thị; `basic.cost` = 0; `ultimate.cost` = 60 |
| `art.portrait` | Đường dẫn avatar |
| `vfxBase` / `vfxMeta` | `assets/vfx/<slug>/` và `provenance.json` |
| `battle.tempo` | Hệ số tốc độ phát clip cho `basic` / `ultimate` |
| `battle.victory.runVisualScale` | Tỉ lệ phóng to cho clip chạy ở màn Victory (mặc định 1). Nếu clip chạy gốc có nhân vật nhỏ hơn idle (ví dụ Khaos chạy chỉ chiếm 48% chiều cao ô trong khi idle chiếm 65%), đặt hệ số này = 1.35 để lúc chạy vào và lúc dừng idle có đúng cùng kích thước |
| `battle.actions.basic/ultimate` | `clip`, các mốc **ms trên clip gốc**: `release`, `hits[]`, `vfxEnd`, `recovery` (release ≤ hits ≤ recovery ≤ độ dài clip) |
| `…projectile` | `{vfx, from:[tỉ lệ ngang, tỉ lệ cao so với thân], scale}`: bay từ tay tới mục tiêu |
| `…impact` / `…area` | `{vfx, anchor:"body", scale}`: nổ tại mục tiêu / phủ từng địch |
| `…sfx[]` | `{cue, at:"release"|"hit", lead}` |
| `battle.events` | Hiệu ứng khi domain phát sự kiện (ví dụ `inkBind` → VFX + SFX) |
| `sfx` | Bảng cue → file, ví dụ `"khaos-basic": "khaos/basic.wav"` |
| `approval` | Trạng thái duyệt animation / VFX / SFX |

Cách đặt mốc: xem contact sheet của clip `atk`/`ultimate`, xác định frame tay vung (`release`) và frame chạm (`hit`), rồi đổi sang ms bằng `frame × durationMs / frames`.

### 5.2 `runtime-meta.json`

`clips.<idle|run|basic|ultimate|hit|fall-die>` gồm: `frames`, `cols`, `cellW`, `cellH`, `durationMs`, `pageFrames`, `pivot`, `foot`, `body`, `pages:[{file, frames, cols, rows, atlasWidth, atlasHeight}]`.

Thêm `detail: {file, frames, cols, cellW, cellH, durationMs, atlasWidth, atlasHeight}` cho màn chi tiết.

Đo `foot` (đáy chân) và `body` (chiều cao thân) trên alpha thật. Không chép số của tướng khác.

### 5.3 `presentation.json`

`heroId` = `sourceId`. `referenceBodyHeight` = `body`. Mỗi clip trong 6 clip có `{bodyHeight, footX: pivot, footY: foot}`. `vfxClips: []` (VFX nằm ở `assets/vfx`).

### 5.4 Chân dung màn Tướng

Thêm landmark vào `src/domain/hero/roster-portrait.mjs` theo dạng `[mắtX%, mắtY%, bề rộng má%]`, đo trên chính `avatar.webp`. Quy chuẩn ở `docs/ROSTER-PORTRAIT-STANDARD.md`.

### 5.5 Cân bằng kích thước màn Victory (Run → Idle)

Khi tướng làm MVP ở màn Victory, nhân vật sẽ chạy từ mép màn hình vào giữa (`canvas.run`), sau đó ẩn canvas chạy và hiện canvas đứng thở (`canvas.idle`).
- Nếu clip chạy gốc có nhân vật sải bước dài hoặc vung vũ khí rộng, thuật toán đóng gói sẽ phải thu nhỏ toàn bộ khung hình để nhét vừa ô. Khi đó nhân vật lúc chạy sẽ thấp hơn nhân vật lúc đứng idle.
- Hậu quả: Lúc chạy vào nhân vật bé tí, đến khi dừng lại chuyển sang idle thì đùng một cái to vọt lên (như trường hợp Khaos bị lệch tới 35%).
- **Cách xử lý:**
  1. Dùng script đo chiều cao nhân vật bên trong ô `run` và ô `idle` (đo trên alpha > 20):
     ```python
     # Đo chiều cao trung bình nhân vật bên trong ô (pixels)
     hRun = measure_alpha(run_cell)    # ví dụ: 106 px (chiếm 48.1% ô)
     hIdle = measure_alpha(idle_cell)  # ví dụ: 143 px (chiếm 65.0% ô)
     scale = round(hIdle / hRun, 2)    # 143 / 106 = 1.35
     ```
  2. Khai báo vào `hero.json`:
     ```json
     "battle": {
       "victory": {
         "runVisualScale": 1.35
       }
     }
     ```
  3. Màn Victory tự động nhân `runVisualScale` khi vẽ canvas chạy và bám chân đáy sàn. Khi chạy xong chuyển sang idle, kích thước và vị trí chân sẽ khớp nhau từng pixel mà không bị giật to/bé.

---

## 6. Luật combat (domain)

Tất cả nằm trong `src/domain/combat/splus-mechanics.mjs`:

1. `AUTHORED_KITS.<key> = {basic:{hits, area}, ultimate:{hits, area}}`.
2. `AUTHORED_HIT.<key>(actor, target, cast, index)`: xử lý **một** hit cho **một** mục tiêu (damage, cộng/tiêu dấu, debuff). Runtime gọi `resolveAuthoredImpact` đúng một lần cho mỗi cặp mục tiêu/hit tại mốc animation. `finishAuthoredCast` tự cộng nộ cho đánh thường và gọi `afterAction`.
3. Tướng chỉ có 3 chiêu, nên `canUse(…, 'skill')` trả `false` (tự động nhờ có `AUTHORED_KITS`). **Không** để `authoredTargets` của `skill` trả mảng có phần tử `undefined`; trả `null` nếu không dùng.
4. Mô tả hiển thị cho người chơi: `src/domain/hero/splus-profiles/<hệ>.mjs` (passive/skill/ultimate). Tên trong catalog: `src/domain/hero/splus-catalog.mjs`.
5. Nếu tướng thay cho một tướng catalog cũ thì **xóa luật cũ** (ví dụ phân thân của Khaos cũ) ở mọi chỗ `key(...)==='<key>'`.
6. Trạng thái mới (dấu, debuff) cần icon SVG ở `assets/ui/status/` và được khai trong `STATUS_ICON_SOURCES` (installer chung đã làm cho `inkMark`; tướng mới thêm icon tương tự).

---

## 7. Test

Bổ sung test tại `tests/` cho:
- nội tại cộng tầng, ngưỡng kích hoạt, tiêu thụ dấu;
- mỗi hit chỉ resolve một lần, `finishAuthoredCast` gọi lần hai không có tác dụng;
- tuyệt kỹ đánh đúng số mục tiêu;
- `targets(id, action)` không bao giờ trả phần tử rỗng.

Tham khảo `tests/authored-hero.test.mjs` và các test Khaos trong `tests/splus-kits.test.mjs`.

```sh
node scripts/hero-doctor.mjs          # kiểm source nhanh
npm test                              # build (đã gồm doctor trước và sau khi cài) + toàn bộ test
```

So số test fail với `main` trước khi sửa. **Không được thêm fail mới.** Lưu ý: `main` hiện có sẵn khoảng 89–90 test fail cũ (CI bị chặn vì billing).

---

## 8. Build làm những gì tự động

`scripts/build-static.mjs` gọi `scripts/authored-hero-install.mjs`, đọc mọi `assets/characters/*/hero.json` rồi:
- đăng ký `DATA.heroes`, `CHARACTER_MANIFEST`, roster, và trao tướng cho save cũ đúng một lần;
- tạo idle/run/atk cho đội hình, AFK, Chinh chiến;
- tạo canvas idle độ phân giải gốc ở màn chi tiết;
- nạp runtime chung `src/runtime/authored-hero.js` vào trận;
- đưa bảng cue vào `HonVietSfx` (cả trang chính lẫn iframe trận);
- `scripts/result-character-motion-v1.mjs` tự thêm diễn hoạt Victory/Defeat (chạy vào → idle; ngã).

`hero:doctor --dist` sau đó kiểm tra tướng có thật trong roster, trận và SFX của bản build chưa.

---

## 9. Kiểm trên game thật (bắt buộc trước khi báo xong)

Chạy `npm run build` rồi `node scripts/preview-with-api.mjs` (PORT tùy chọn). Mở trong Chrome:

| Bước | Kiểm gì |
|---|---|
| Màn Tướng | Có thẻ tướng, mặt căn đúng khung |
| Màn chi tiết | Idle động, **nét**, đủ 3 chiêu |
| Bày trận | Thân đúng cỡ, chân chạm đất, đúng hướng hai phe |
| Trong trận | Idle, đánh thường, tuyệt kỹ, bị đánh, ngã; VFX đúng chỗ; trận không treo |
| Victory / Defeat | MVP chạy vào rồi idle bằng chính hình tướng; lúc chạy và lúc dừng idle cùng kích thước (không bị giật to/bé); Defeat ngã một lần rồi giữ |
| Giả lập iPhone | DevTools: UA iPhone, CPU chậm 4×, mạng Fast 4G. Không có thông báo "Không tải đủ hình", không có thẻ trắng |

Trong trận, mở console của iframe trận để xem:
- `window.__HV_AUTHORED_QA()`: log từng đòn `decode → sfx → act → release → recovery → done`;
- `window.__HV_NATIVE_ATLAS_CACHE.inspect()`: bộ nhớ ảnh đang dùng.

Ghi riêng những phần **chưa kiểm**: iPhone/Safari thật, nghe tiếng bằng tai.

---

## 10. Commit, PR và Vercel

- Làm trên **nhánh mới từ `main`**, mở PR, **không đẩy thẳng `main`**. Chỉ merge khi chủ dự án duyệt.
- Vercel **chặn deploy** nếu commit không được GitHub xác minh (verified) hoặc tác giả không có quyền trong team. Commit tạo bằng `git` trên máy (kể cả email noreply) đều bị chặn. Hãy đẩy bằng commit do GitHub ký:

```sh
node scripts/tools/verified-push.mjs <commit gốc đang ở đầu nhánh remote> <commit local> <tên nhánh>
```

Script dùng GraphQL `createCommitOnBranch` (cần `gh` đã đăng nhập), chia ảnh thành từng đợt ≤ 6 MB. Nhánh remote phải tồn tại sẵn và đang trỏ tới `<commit gốc>`.
- Deploy chỉ thành công ở project `cuonggmn/luc-than`. Các project Vercel khác báo đỏ do quyền team, không ảnh hưởng.

---

## 11. Checklist cuối

- [ ] 6 clip đóng gói PASS, contact sheet đã xem, idle không giật ở chỗ nối
- [ ] Ảnh trong trận ≤ 8/12 MiB, ảnh `detail` ≤ 32 MiB, mọi tên có `-<sha8>`
- [ ] VFX/SFX có `provenance.json`, chủ dự án đã duyệt (hoặc ghi `pending`)
- [ ] `hero.json`, `runtime-meta.json`, `presentation.json`, landmark avatar
- [ ] Domain: `AUTHORED_KITS` + `AUTHORED_HIT` + mô tả profile + bỏ luật cũ
- [ ] Test mới; `npm test` không thêm fail so với `main`
- [ ] Đo chiều cao nhân vật trong ô `run` vs `idle`, đặt `runVisualScale` nếu có độ lệch
- [ ] Kiểm game thật đủ 6 bước ở mục 9, kể cả giả lập iPhone và màn Victory chuyển tiếp mượt
- [ ] PR có ảnh bằng chứng, danh sách phần chưa kiểm, Vercel preview deploy thành công

## QUY TRÌNH ẢNH 6 STATE (bắt buộc từ 2026-10-20, áp dụng từ Bạch Y Vân Phong)

1. Đóng gói bằng skill `kiemthe-animation-packager` với **`--framing uniform`**:
   `python package_six_states.py --manifest <manifest.json> --framing uniform`.
   Một tỉ lệ chung cho cả 6 state, đường chân cố định, căn ngang theo chân từng frame (chạy tại chỗ).
   Cấm dùng lại chế độ fit riêng từng state: run/atk/ulti sẽ teo (Khaos từng phải vá `runVisualScale`).
2. Nhập vào game bằng **một importer chung**:
   `node scripts/import-sixstate-pack.mjs <packDir> <slug> <heroId>`
   → atlas `-<sha8>.webp` (x0.5 cho trận), `detail-<sha8>.webp` (full), `runtime-meta.json`, `presentation.json`
   (body/foot đo từ alpha idle, giống nhau cho mọi clip). Importer từ chối pack không phải `uniform`.
3. `node scripts/hero-portrait-from-idle.mjs <slug>` rồi viết `hero.json` (kit/battle/sfx) và luật trong
   `splus-mechanics.mjs` (`AUTHORED_KITS` + `AUTHORED_HIT`).
4. QA trong trận thật: `node scripts/qa-authored-battle.mjs <heroKey> <slug> <tag>` (server `scripts/qa-static-server.mjs`
   phục vụ `dist/`) — tự chụp ảnh lúc basic/ultimate/VFX được vẽ và báo lỗi JS.

## IDLE LẶP MƯỢT KHÔNG NHOÈ: tìm cặp khung đầu–cuối khớp nhau (bắt buộc từ 2026-11-07)

**Vấn đề.** Khi chỗ nối chưa khớp, packager trộn 4 frame cuối vào các khung dẫn về frame đầu (`IDLE_SEAM_CROSSFADE = 4`).
Trộn hai hình khác nhau ra hình chồng mờ, nên vòng lặp có một đoạn **nhoè** (owner phát hiện trên Tịch Dao 07/11).

**Cách làm.** Không trộn nữa, mà tìm đoạn cắt có khung *sau khung cuối* gần như trùng khung đầu, rồi đóng gói với trộn = 0.

1. Tìm cặp khớp nhất:
   `python scripts/hero/find-idle-loop.py <idle.mp4> --samples 30 --min-sec 2.5`
   - Lấy 30 mẫu đều từ `start..end` (giữ cả 2 đầu). Bước giữa 2 mẫu = `(end-start)/29` khung video.
   - **seam** = khác biệt điểm ảnh trung bình giữa khung `end + bước` (nội suy) và khung `start`, đo trên vùng nhân vật thu nhỏ.
   - **tỷ lệ** = seam / bước thường (trung vị khác biệt giữa 2 mẫu liền nhau). Chọn tỷ lệ nhỏ nhất; **< 1** là chỗ nối êm hơn một bước bình thường.
2. Đóng gói bằng chính các hàm của packager, ép cửa sổ đó và tắt trộn:
   `python scripts/hero/pack-idle-fixed-loop.py <idle.mp4> --start <s> --end <e> --out <dir>`
   (gọi probe → extract → key Blender → scrub → measure_uniform (khoá anchor) → pack_state với `IDLE_SEAM_CROSSFADE=0`).
3. Cổng bắt buộc (giữ nguyên): `qa-idle-source-parity.mjs <dir> <video>` và `qa-idle-loop-seam.mjs <dir> --state idle` phải PASS.
4. Idle vẫn là **30 frame**, mỗi frame giữ đúng thời lượng nó đại diện theo PTS (không ép đều, không bỏ khung).

**Số đo ca Tịch Dao (07/11).** Cửa sổ packager tự chọn 20..126 phải trộn (bỏ trộn thì nối 1,08× bước thường → giật).
Cửa sổ tìm theo cách trên: **19..121**, tỷ lệ 0,29 → pack không trộn: seam gate **1,03×** trung vị, parity ×1,0/×1,0/×1,0,
IoU đầu–cuối 0,972, vòng 4,29 s. Hết nhoè.

**Không làm:** trộn/hoà khung để che chỗ nối; cắt đoạn rồi chạy tới–lui (ping-pong); bỏ bớt khung để vừa số trang.

## Idle loop: chọn theo độ êm chỗ nối + hoà 4 frame (bắt buộc từ 2026-10-23)

Clip idle do AI làm gần như **không bao giờ quay về đúng tư thế đầu** (idle_7: frame gần nhất vẫn lệch 3.3 so với
bước thường 2.2), nên không có đoạn cắt nào nối khít tuyệt đối. Luật cũ "hình bóng trùng ≥ 0.92" còn ép packer chọn
đoạn **tệ hơn**: cánh hoa/khói bay quanh người làm hình bóng lệch dù thân không lệch (idle_7: chỗ nối gấp 1.89 lần
một bước thường → giật thấy rõ).

Packer (`kiemthe-animation-packager`) giờ:
1. **Xếp hạng đoạn theo độ êm chỗ nối** (bước cuối→đầu chia cho bước điển hình); hình bóng chỉ còn là **sàn 0.85**.
2. Ưu tiên đoạn có đủ frame **trước** frame đầu, rồi **hoà 4 frame cuối** vào các frame dẫn tới frame đầu
   (trọng số 0.2 / 0.4 / 0.6 / 0.8, alpha nhân trước nên không viền xám). Ghi ở `metadata.frames[].crossfade`
   và `metadata.loop.seamCrossfade`.
3. idle_7: chỗ nối **×1.89 → ×0.81** (cổng `qa-idle-loop-seam` PASS).

Cổng `qa-idle-source-parity` đã sửa để đo **khối nhân vật lớn nhất** ở cả hai phía (chữ `#00FF00` và logo là mảnh rời),
phía atlas chỉ tính **thân đặc** (alpha > 200, vì khói mờ trên phông xanh vẫn bị video coi là xanh), và hai phía
dùng **cùng độ mịn** (atlas đã ở tỉ lệ pack). Lăng Vân (đã PASS trước đây) vẫn PASS ×0.9.

## Idle phải khoá anchor khi pack (bắt buộc từ 2026-10-22)

**Sự cố:** Nguyệt Diệp và Tịnh Mặc rung giật ở màn chi tiết dù video idle gốc mượt. Nguyên nhân: `package_six_states.py --framing uniform` mặc định tính `anchorX` **riêng từng frame** theo trọng tâm alpha của 20% dải đáy (`bottom-band alpha centroid`, làm mượt 3 frame). Với tướng có kiếm / tua / vạt áo đung đưa ở dải đáy, mỗi frame bị dời ngang vài px → rung mà video gốc không có (đo: Nguyệt Diệp mép phải gấp 5.9 lần video, Tịnh Mặc tâm thân gấp 2.6 lần). Các tướng pack kiểu cũ (một khung cắt chung — Bạch Diện, Khaos, Bé An, Cổ Nương) không bị.

**Luật:** manifest pack phải có `"fixedAnchorStates": ["atk", "idle"]` (giữ thêm state nào đã khoá trước đó). Idle là chu kỳ tại chỗ, anchor khoá một lần thì atlas là bản thu nhỏ y nguyên video gốc.

**Kiểm:** so atlas với video gốc trên cùng các frame loop — tổng dao động mép trái/phải/tâm thân của atlas không được vượt quá ~1.5 lần video. Script: `C:\lt\tmp\jitter-any.py <video idle> <pack cũ> <pack mới>`.

**Màn chi tiết** vẽ idle y hệt trận (`authoredBodyFrame`: nhịp đều, một anchor cố định). Không bù vị trí chân, không đổi nhịp từng frame ở khâu render.

## Màu tướng phải giữ đúng clip gốc (bắt buộc từ 2026-10-24)

Owner thấy các tướng gần đây "hút màu xong rất nhợt nhạt". Nguyên nhân đã đo: packer gọi Blender 5.1 với `--factory-startup`
mà không đặt view transform, nên Blender dùng **AgX** — nó tone lại mọi pixel. Cùng một frame Lăng Chân: AgX lệch 8.6/255 so với
clip gốc (độ sáng -24%, tương phản -21%); **Standard** chỉ lệch 2.0/255 (kênh R, B khớp tuyệt đối).

- Packer (`package_six_states.py`, `blender_script`) đặt `view_transform="Standard"`, `look="None"`, `exposure=0`, `gamma=1`.
  Không bỏ những dòng này, không tăng saturation/contrast sau để "bù".
- Kiểm sau mỗi lần pack: `C:/lt/.venvs/pack/Scripts/python.exe C:/lt/tmp/color-compare.py <slug> --repo <repo>` — độ sáng và
  tương phản của idle phải nằm trong khoảng ±6% so với clip gốc.
- Pack lại một tướng (`--allow-reuse`) sẽ ghi đè `runtime-meta.json`: phải chạy lại
  `C:/lt/tmp/apply-scalefix.py <slug> --repo <repo>` để đo và gắn lại `scaleFix` từng clip (Tiểu Linh từng mất scaleFix vì bước này).

## Ảnh đại diện màn Tướng phải có landmark mặt (bắt buộc từ 2026-10-24)

Bước `portrait` sinh `portrait-<hash>.webp` = khung idle 0 toàn thân nhưng không biết mặt nằm đâu. Từ Bé An trở đi 9 tướng lên
game không có landmark nên thẻ hiện cả người nhỏ xíu. Từ nay `integrate-hero` có bước **9b landmark**
(`scripts/hero/portrait-landmark-check.mjs`): thiếu landmark là FAIL và sinh `docs/qa/integrate/<slug>-portrait-grid.png`
(lưới 1% trên ảnh gốc). Đọc tâm mắt (x,y %) và bề rộng má-má (%), thêm vào `ROSTER_PORTRAIT_LANDMARKS` dạng
`'assets/characters/<slug>/portrait-*.webp':[x,y,w]` (khoá theo mẫu vì hash đổi mỗi lần pack lại, hình dạng khung idle 0 thì không),
rồi chạy lại. Tướng bịt mắt/đeo mặt nạ authored: lấy tâm dải băng, không vẽ thêm mắt. Duyệt bằng ảnh chụp thẻ thật trên màn Tướng.

