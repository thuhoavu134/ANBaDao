# Hướng dẫn tích hợp tướng mới từ A đến Z (chuẩn duy nhất)

Cập nhật 19/10/2026. Tướng mẫu đã chạy thật trên game: **Khaos** (`assets/characters/khaos/`).

Đây là cách **duy nhất** để đưa tướng mới vào game. Không viết `scripts/<tướng>-integration.mjs` riêng. Không chèn regex vào `index.html`/`battle.html`. Không tạo cache ảnh hay bộ điều khiển âm thanh riêng. Các tướng cũ (Bé An, Cổ Nương, Tịch Dao…) vẫn còn script riêng do làm trước khi có chuẩn này; khi sửa tướng nào thì chuyển tướng đó sang chuẩn này.

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

## 4. Chọn VFX/SFX từ kho SKILLPACK

- Tra cứu: `python scripts/search-skillpack.py <từ khóa> [--sect <phái>] [--extract <mã> --out <thư mục>]` (công cụ trong workspace của agent; kho gốc là `KIEMTHE-VFX-SFX-FULL-20261017.zip`).
- **Xem frame thật trước khi chọn**, không chọn theo tên mã. Mỗi PNG đã bị cắt viền: phải dán lên canvas `w×h` tại vị trí `ox/oy` lấy từ `info.json`, nếu không hiệu ứng sẽ bị nhảy.
- Nhiều sprite là **sprite 16 hướng**, không phải chuỗi hoạt ảnh. Với projectile loại này chỉ lấy đúng 1 frame hướng phải; runtime tự xoay theo đường bay.
- Ưu tiên cặp VFX+SFX đi cùng nhau trong bảng skill gốc. SFX giữ nguyên file WAV gốc, không cắt, không mix.
- Đóng gói vào `assets/vfx/<slug>/vfx-<vai trò>-<sha8>.webp`. Ghi `assets/vfx/<slug>/provenance.json` gồm: mã nguồn, frame dùng, `frameMs`, `blend: "screen"`, SHA-256, vai trò.
- SFX đặt ở `assets/audio/sfx/<slug>/*.wav`.
- Gửi preview có tiếng cho chủ dự án duyệt. Chưa duyệt thì ghi `pending` trong `hero.json > approval`.

---

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

## Idle phải khoá anchor khi pack (bắt buộc từ 2026-10-22)

**Sự cố:** Nguyệt Diệp và Tịnh Mặc rung giật ở màn chi tiết dù video idle gốc mượt. Nguyên nhân: `package_six_states.py --framing uniform` mặc định tính `anchorX` **riêng từng frame** theo trọng tâm alpha của 20% dải đáy (`bottom-band alpha centroid`, làm mượt 3 frame). Với tướng có kiếm / tua / vạt áo đung đưa ở dải đáy, mỗi frame bị dời ngang vài px → rung mà video gốc không có (đo: Nguyệt Diệp mép phải gấp 5.9 lần video, Tịnh Mặc tâm thân gấp 2.6 lần). Các tướng pack kiểu cũ (một khung cắt chung — Bạch Diện, Khaos, Bé An, Cổ Nương) không bị.

**Luật:** manifest pack phải có `"fixedAnchorStates": ["atk", "idle"]` (giữ thêm state nào đã khoá trước đó). Idle là chu kỳ tại chỗ, anchor khoá một lần thì atlas là bản thu nhỏ y nguyên video gốc.

**Kiểm:** so atlas với video gốc trên cùng các frame loop — tổng dao động mép trái/phải/tâm thân của atlas không được vượt quá ~1.5 lần video. Script: `C:\lt\tmp\jitter-any.py <video idle> <pack cũ> <pack mới>`.

**Màn chi tiết** vẽ idle y hệt trận (`authoredBodyFrame`: nhịp đều, một anchor cố định). Không bù vị trí chân, không đổi nhịp từng frame ở khâu render.
