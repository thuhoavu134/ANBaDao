# QA — Tích hợp nữ tướng cầm thương (tên tạm "Hồng Thương") — 2026-10-16/17

Nhánh `feat/spear-hero-integration-20261016` từ main `3592311` (sau merge #308 + #309).
**PR Draft — CHƯA merge, CHƯA deploy.** VFX/SFX dùng đúng **mẫu 22 đã duyệt**
(`tw_90_zxzy_d` + `tw_zxzy_c.wav`). Toàn bộ số sát thương/chi phí là **ĐỀ XUẤT**,
không phải thông số chủ dự án đã chốt.

## 1. Danh tính & asset nguồn

- **Tên hiển thị tạm `Hồng Thương`** — ID kỹ thuật `hero_splus_hong_thuong`, alias
  `hong-thuong`. KHÔNG coi "Triệu Kình" hay đề xuất mẫu nam trước đây là tên chính thức.
- Nữ chibi cầm thương cán đỏ, tóc đen cao dân + dải lụa đỏ, đồ đỏ–trắng–vàng–đen,
  nhìn 3/4 sang phải — khớp mô tả chủ dự án (đã đối chiếu frame trích từ clip).
- Nguồn animation: 6 clip green-screen 1920×1080 24fps do chủ dự án cung cấp
  (openclaw media inbound, tối 16/10). SHA-256 từng file ghi trong
  `assets/characters/hong-thuong/runtime-meta.json → sourcePackSha256`.
- Converter: `scripts/hong-thuong-convert-v1.mjs` (node+sharp). Frame staging qua ffmpeg
  (`f%03d.png`), key chroma xanh 3 vùng (nền/HALO/bóng sàn) + despill, **không key màu đen**,
  giữ nguyên hình/màu đã duyệt ngoài vùng nền; window crop cố định theo clip (không auto-fit
  từng frame); **một hệ scale duy nhất** (thân idle ≈ 423px đúng mốc authored, đo thực
  `bodyHeightPx` từng clip trong meta); pivot = chân (footCellY) + tâm thân (bodyCx),
  chừa vùng mũi thương (cell rộng 492–693px chứa trọn thương duỗi).
- Clip đo được (bước 2 frame = 48ms/frame, 24fps nguồn):

| Module | Frame nguồn | ms clip | Hit markers (ms) | Ghi chú |
|---|---|---|---|---|
| basic (Tam Điểm Phá Giáp) | f2–f54 | 1296 | **384 / 816 / 864** | ⚠ clip chỉ có **2 cú đâm riêng biệt** — xem §5 |
| ult-prep (chuẩn bị) | f2–f26 | 624 | — | tại vị trí đội hình |
| ult-cluster (cụm 3 nhát) | f27–f55 | 720 | **96 / 384 / 672** | lặp cho từng địch |
| ult-finisher (Hồi Mã Thương) | f58–f100 | 1056 | **720** | đâm ngược sang TRÁI → nữ tướng đứng bên phải nạn nhân để mũi thương cắm vào thân |
| run | f1–f44 (loop 22f) | 1056 | — | chạy tại chỗ |
| hit | f17–f64 | 1152 | — | flinch |
| fall-die | f21–f88 | 1632 | — | ngã, giữ frame cuối |
| idle | f1–f88 (loop) | 4224 | 6 trang × 8f | paging như Tịch Dao |

- `avatar.webp` là **ảnh tạm** cắt từ idle frame 21 (`art.pending`) — portrait authored chờ owner.

## 2. VFX/SFX mẫu 22 (bắt buộc giữ nguyên)

- VFX: `SKILLPACK/vfx/tianwang/tw_90_zxzy_d/info.json` — **14 khung có nội dung**
  (khung 15 của SPR rỗng), canvas gốc 128×128, **giữ nguyên ox/oy từng khung** khi ghép
  atlas `assets/vfx/hong-thuong/impact.webp` (5 cột × 128px, blend `screen`).
- SFX: `SKILLPACK/sfx/tianwang/tw_zxzy_c.wav` → `assets/audio/sfx/hong-thuong/impact.wav`
  (22050Hz mono 16-bit, 0.479s).
- Provenance ghi trong `runtime-meta.json → vfx.provenance`: đây là **cặp dùng trong preview
  đã duyệt**, KHÔNG tuyên bố là cặp gốc đã xác minh từ bảng game.
- VFX 22 phát tại **điểm mũi thương trúng trên thân nạn nhân** (anchor theo thân, sau hit
  marker); không bắn từ vị trí đứng, không thay bằng hiệu ứng khác.
- Tiếng "keng" phá giáp: **chưa chọn asset — không tự lấy**. Hiện cue cơ bản dùng SFX 22.

## 3. Bộ kỹ năng (ý tưởng đã đồng ý; số liệu ĐỀ XUẤT)

- **Basic — Tam Điểm Phá Giáp** (0 nộ): áp sát 1 địch, 3 nhát (nhanh–nhanh–mạnh), mỗi nhát
  trúng hợp lệ +1 **Sơ Hở** trên chính địch đó (tối đa 3). Nộ cộng **một lần mỗi hành động**
  (+15 ĐỀ XUẤT, theo `basicRage` engine) — không cộng 3 lần.
- **Passive — Phá Trận**: nhát thương KẾ TIẾP của nữ tướng khi địch đủ 3 tầng **tiêu thụ**
  dấu: bỏ qua giáp (35% ĐỀ XUẤT) + thêm sát thương lên khiên (50% lượng khiên vừa hấp thụ,
  ĐỀ XUẤT). **Nhát vừa tạo tầng 3 không tự tiêu thụ** (thứ tự: kiểm dấu → resolve → cộng dấu).
- **Ultimate — Kinh Hoồng Phá Trận** (60 nộ ĐỀ XUẤT): lần lượt áp sát **tất cả** địch còn
  sống **cả hai hàng** (thứ tự bySlot, hàng trước trước — ĐỀ XUẤT), mỗi địch 1 cụm 3 nhát;
  kết thúc bằng **Hồi Mã Thương** chọn lại NGAY trước cú đâm: ưu tiên **tỷ lệ khiên/maxHp cao
  nhất**, hết khiên thì **giáp cao nhất**, tie-break ổn định bySlot. Không có cơ chế kết liễu
  30% của Tịch Dao; không giới hạn hàng sau.
- Mỗi hit có danh_identity `castId + targetId + hitIndex` (token), resolve đúng một lần;
  chữ ký `resolveHongThuongHit / nextHongThuongCluster / nextHongThuongFinale /
  resolveHongThuongFinale / finishHongThuongCast` xuất từ `splus-mechanics.mjs`.
- Địch chết giữa cụm: bỏ hit còn lại của cụm đó, **không cộng dấu lên xác, không đánh ô trống**,
  cụm kế tiếp chọn lại từ địch còn sống. Actor chết → chuỗi dừng sạch, không hồi mã vào
  toạ độ cũ, khoá lượt trả đúng lúc (`finishHongThuongCast`).

## 4. Bảng thông số ĐỀ XUẤT (chờ owner chốt — không tự coi là đã duyệt)

| Thông số | ĐỀ XUẤT hiện dùng | Ghi chú |
|---|---|---|
| Tên chính thức / hệ / độ hiếm | Hồng Thương (tạm) · Kim · S+ · striker | chờ tên + hệ |
| Chỉ số host (hp/atk/def/spd) | 940 / 142 / 48 / 120 | theo striker S+ |
| Hệ số nhát basic | 0.40 / 0.40 / 0.80 ×ATK | nhanh–nhanh–mạnh |
| Hệ số nhát cụm ult | 0.35 / 0.35 / 0.45 ×ATK | mỗi địch |
| Hồi Mã Thương | 1.20 ×ATK | đơn mục tiêu |
| Chi phí ultimate / nộ basic | 60 / +15 | theo engine mặc định |
| Bỏ qua giáp khi tiêu thụ dấu | 35% | |
| Bonus damage lên khiên | +50% lượng khiên vừa hấp thụ | |
| Thời hạn Sơ Hở | 3 lượt của địch | `soHoTurns` |
| Ult có cộng Sơ Hở không | CÓ (mỗi nhát trúng, cùng cap 3) | ĐỀ XUẤT |
| Hit khiên hấp thụ hoàn toàn | VẪN cộng dấu | ĐỀ XUẤT |
| Dấu chung giữa nhiều bản sao | Dùng chung (lưu trên địch) | ĐỀ XUẤT |
| "Tỷ lệ khiên cao nhất" | `shield/maxHp` | ĐỀ XUẤT |
| Thứ tự qua các địch | bySlot (front 1-3 trước) | ĐỀ XUẤT |

## 5. Lệch asset phải owner quyết (ATK 2 đâm vs kit 3 nhát)

Clip ATK đo trace từng frame: chỉ có **2 cú đâm riêng biệt** — đỉnh 1 @f018 (vừa),
đỉnh 2 @f036–f038 (mạnh, kèm sáng); f055+ là padding đóng băng đã cắt. Hiện map:
hit1 @384ms (đâm 1), hit2 @816ms (khởi đầu đâm mạnh), hit3 @864ms (đỉnh đâm mạnh).
Hai nhát sau cách nhau 48ms trên cùng một cú đâm — damage/VFX/SFX vẫn 3 hit thật
(unit test chứng minh), nhưng **trình diễn chỉ thấy 2 nhát rõ**. Đề xuất: (a) owner làm lại
clip ATK đủ 3 nhát, hoặc (b) duyệt mapping hiện tại. Không nối giật/kéo dài freeze để che.

## 6. Đăng ký đủ màn

Catalog extras + alias · roster + DATA host · **Tướng** (grid + detail canvas idle paging) ·
**Đội hình/AFK** (preparation idle pack + run + farm attack spec) · **Trận 6v6 thật** cả hai
phe (mirror 1 lần theo phe; hồi mã đứng đúng phía mũi thương) · HUD **Sơ Hở** icon
`assets/ui/status/so-ho.svg` + số tầng 1/2/3, đủ 3 tầng đổi badge đỏ **Lộ Điểm Yếu**, xoá
khi tiêu thụ/hết hạn. Installer `scripts/hong-thuong-runtime-v1.mjs` chạy **sau installTichDao**
trong `build-static.mjs`; không sửa dist thủ công. Trang test `/hong-thuong-test.html`
(không phải app demo — chỉ bề mặt ép action trên trận thật, mô hình `/tich-dao-test.html`).

## 7. Kiểm chứng

- **Unit**: `tests/hong-thuong.test.mjs` **14/14** (registry, 3 hit resolve 1 lần, nộ 1 lần,
  basic từ nộ 0, thứ tự dấu, phá giáp, khiên, ult 1/2/6 địch, hai hàng, chết giữa cụm,
  hồi mã chọn lại, hết địch sạch, actor chết, tướng khác không tiêu thụ dấu, asset/meta
  provenance + timeline). `tests/hong-thuong-audio.test.mjs` 1/1 (bus, x3 rate, mute, abort).
- **Full suite**: 1827 tests — 1812 pass / **14 fail = đúng baseline Windows có sẵn**
  (C:\C:\ path bug nhóm thay-mo/ky-van/tieu-phong/auto-cadence + EPERM lossless; Linux CI
  là nguồn sự thật cho các test này — 0 fail mới so với baseline doc Tịch Dao 16/10).
- **Browser QA PASS cả 2 viewport** (`scripts/qa-hong-thuong.mjs`, Chromium CDP,
  `evidence/hong-thuong/report.json` — `"ok": true`):
  - 390×844: basic trận thật 18 cells/38 strokes + 50 VFX impact; ultimate prep 11 + cụm
    **15 cells đúng module clock** (280 strokes) + Hồi Mã 22 cells + **917 VFX strokes**;
    SFX probe play() thật **true** (`sfxState=running/played`); trận tự nhiên nộ 0:
    basic → tích nộ → ultimate tự ra (65 nộ); video 56 frames; **0 exceptions, 0 asset errors**.
  - 1280×800: basic 17/17 + 29 VFX; ult prep 9 + cluster 15 cells + finisher 22 + 379 VFX;
    natural ultimateSeen; video 21 frames; 0 exceptions, 0 asset errors.
  - Video bàn giao: `evidence/hong-thuong/ultimate-390.mp4` (banner Kinh Hoồng Phá Trận,
    VFX 22 nổ tại 2 nạn nhân hàng sau địch), `ultimate-1280.mp4`. Ảnh: detail/afk/basic/
    basic-battle/ultimate/battle cả 2 viewport.
  - Fixture minh bạch: forced actions dùng `qaForceAuthoredAction` (hook QA sẵn có tự ép
    energy=100); cơ chế nộ 0→60 do unit test + đoạn trận tự nhiên chứng minh.
  - Tỷ lệ thân khớp chuẩn authored hiện hành (đối chiếu ảnh trận Tịch Dao cùng game).
- **KHÔNG kiểm**: physical iPhone/Safari (**NOT RUN**), production deploy (không deploy).

## 8. Câu hỏi gộp cho chủ dự án (trả lời một lần)

1. **Tên chính thức** của tướng? (đang để "Hồng Thương" tạm + fullName mô tả)
2. **Clip ATK chỉ có 2 đâm** — làm lại clip 3 nhát, hay duyệt mapping hit2+hit3 vào cú đâm mạnh?
3. Chốt **bảng §4**: hệ số sát thương, chi phí, tỷ lệ bỏ giáp/bonus khiên, thời hạn Sơ Hở,
   ult có cộng dấu không, hit khiên absorb có cộng dấu không, dấu chung/như nhau giữa bản sao,
   mẫu số "khiên cao nhất", thứ tự qua địch.
4. Hệ/phái chính thức (đang để **Kim**) và **tiếng "keng" phá giáp** — chọn asset rồi mới ghé.
