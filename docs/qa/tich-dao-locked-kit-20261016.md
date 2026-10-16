# QA — Tịch Dao: kit locked (Ảnh Bộ + Hoa Ấn + Tam Ảnh Đoạt Mệnh) — 2026-10-16

PR #308 · nhánh `feat/tich-dao-integration-20261015` · base mới `0aa0c86` (#307).

## Phạm vi đổi

1. **Đổi kit tạm → kit chốt** (bỏ stealth-on-kill + vanish <40% HP của kit tạm):
   - Basic **Ảnh Bộ**: chém **hàng sau xa nhất** (cột cách xa nhất, tie-break slot), đặt
     **1 dấu Hoa Ấn** (tối đa 3), miễn phí.
   - Passive **Hoa Ấn**: dấu cộng sát thương chiêu thức; ultimate tiêu thụ.
   - Ultimate **Tam Ảnh Đoạt Mệnh** (60 khí): 3 nhịp chém **3 mục tiêu hàng sau khác nhau**
     (xa nhất trước; hàng sau vắng thì rơi vào tướng còn sống, không chém ô trống), mỗi dấu
     **+35% sát thương nhịp đó rồi bị xoá** → sau nhịp 3, **mưa kiếm kết liễu** mục tiêu
     hàng sau **HP < 30%** (kiểm sau sát thương; đúng 30% không kết liễu), **tối đa 2 mục
     tiêu**, xa nhất trước.
2. **Khớp 9 phase**: nhịp 1/2/3 tại phase-04/06/08 (1083/1750/2917 ms); mưa kiếm kết liễu
   tại 3150 ms — ngay sau nhịp 3, trước phase-09 recovery (3292 ms).
3. **Port 4 VFX Cổ Mộ** (Kiếm Thế, `gumupai` trong `update03.pak`) vào `assets/vfx/tich-dao/`:
   `vanish-xoay` (phase-03/05), `appear-hoa-tran` (phase-04/06), `atk.webp` → kiếm quang
   Ảnh Bộ, `ultimate.webp` → mưa kiếm kết liễu. Nguồn ghi trong
   `assets/characters/tich-dao/runtime-meta.json → vfx.provenance`
   (script port: `scripts/tich-dao-vfx-v1.mjs`).
4. **Hợp đồng kit**: giữ slot `actions.skill` như **alias hiển thị của Ảnh Bộ** (cost 0) —
   `splusHeroConfig` đọc bắt buộc; combat chặn slot skill cho Tịch Dao như Kỷ Vân/Tiêu Phong.
   Không có Skill 1 tiêu khí riêng.

## RED→GREEN (tests/tich-dao.test.mjs — viết lại theo kit chốt)

- **RED trước khi sửa: 9 fail / 2 pass** (registry, hàng sau xa nhất, dấu Hoa Ấn, 3 nhịp
  3 mục tiêu, kết liễu <30%, đúng 30% loại, chỉ hàng sau, bỏ stealth, VFX provenance).
- **GREEN sau khi sửa: 11/11 pass.**
- Full suite: **1796 tests — 1782 pass / 14 fail = đúng 14 fail có sẵn ở head `ed5502e`**
  (chạy baseline đối chiếu bằng git stash; **0 fail mới**). 14 fail có sẵn gồm nhóm
  thay-mo/ky-van/tieu-phong asset + auto-rotation — không thuộc phạm vi PR này.

## Browser QA (Chromium headless CDP — `scripts/qa-tich-dao.mjs`, evidence `evidence/tich-dao-fixes/`)

| Kích thước | 9 phase (02/04/06/08 + 2 vanish gap) | Ảnh Bộ (slash draws) | Mưa kiếm (rain draws) | Exceptions | OK |
|---|---|---|---|---|---|
| 390×844  | ✓ (17 cells, 147 strokes) | 19 draws | 42 draws | 0 | **PASS** |
| 1280×800 | ✓ (17 cells, 53 strokes)  | 10 draws | 30 draws | 0 | **PASS** |

Ảnh: `detail-*` (hero detail), `afk-*` (campaign squad có Tịch Dao), `ultimate-*`/`u-phase0*`
(từng phase, gồm 2 khoảnh khắc thân ẩn), `basic-*` (kiếm quang Ảnh Bộ), `rain-*` (mưa kiếm
rơi hàng sau — banner "Tam Ảnh Đoạt Mệnh" hiện trên trận), `battle-*`, `report.json`.

## Ghi chú minh bạch

- **Mưa kiếm ở QA bị force ngưỡng**: harness `tich-dao-test.html` dùng dummy challenge tự
  hồi phục máu nên không giữ được HP<30% — lúc 2.6s QA nới `executeHp=1.01` trong runtime
  QA để mưa kiếm quét dummy. Cơ chế ngưỡng (dưới 30%, đúng 30% loại, tối đa 2, chỉ hàng sau)
  do **unit test** chứng minh, không phải screenshot.
- **CI đỏ trên PR #308 KHÔNG phải lỗi code**: job không chạy (0 step) — GitHub báo lỗi
  thanh toán/spending limit. Không sửa gì cho CI.
- Vẫn **Draft** — chưa merge, chưa deploy.


## Vòng 2 (2026-10-16 chiều) — 3 lỗi owner report, đã fix

1. **Kích thước atk/ultimate bé hơn idle**: đo alpha-bbox từng frame (idle 423px,
   basic 350px, ultimate 328px, phase-02 chỉ 241px) → `scripts/tich-dao-content-v1.mjs`
   ghi `clips[k].content.scale` (basic 1.21×, ultimate 1.29×, run 1.03×, fall 1.19×;
   hit sẵn 424px) → runtime paint cell theo scale, anchor bottom-center. Unit test
   chặn hồi quy: scale×content ≈ idle (90-125%).
2. **Dịch chuyển sát thủ**: thân biến mất tại nhà → hiện TRƯỚC MẶT địch hàng sau
   (x ± 70px về phía Tịch Dao, y +8) → chém → lerp về vị trí cũ. Ultimate: dash
   phase-02 hướng nạn nhân 1, đứng tại nạn nhân 1/2/3 ở phase-04/06/08 (giữ phase-07),
   glide về nhà trong phase-09; Basic: ra đòn tại mục tiêu từ release-60ms, lerp về
   nhà trong 220ms cuối. Nạn nhân từng nhịp lấy bằng **engine preview
   `tichDaoStrikeTarget`** (cùng selection với resolveTichDaoImpact — unit test chứng
   minh preview khớp strike thật).
3. **VFX Cổ Mộ to + trên đầu địch + SFX**: 4 clip phóng theo `vfx.clips[k].display`
   (vanish 340px, appear 400px, slash 430px, rain 540px; neo đáy 78% chiều cao → phủ
   thân + đầu mục tiêu); thêm slash cho từng nhịp ultimate + appear cho Basic.
   SFX 3 cue (`assets/audio/sfx/tich-dao/{basic,strike,rain}.wav`, nguồn JX1 đúng bảng
   missile Cổ Mộ mượn tiếng: cy_bxxl_c / cy_mylx_c / sl_dmdj_c) map vào bus HonVietSfx,
   play: basic lúc ra đòn, strike mỗi nhịp, rain lúc kết liễu.

RED→GREEN vòng 2: **+5 test mới (2 domain + 3 runtime), 21/21 pass**; full suite
1801/1787/14 = baseline có sẵn. Browser QA PASS 390+1280 (phases ✓, basic 251/96
draws, rain 46/22 draws, 0 exceptions). Evidence ảnh mới: `basic-*`, `rain-*`,
`u-phase0*` (thân đứng cạnh địch + hiệu ứng phủ đầu).

Ghi chú đo verifies: `__HON_VIET__.getUnits()` trả bản hiển thị khác refs unit engine
 internal — probe dịch chuyển phải đọc `window.__TDACTOR`-style marker hoặc canvas
 trong đúng iframe context.


## Vòng 3 (2026-10-16 tối) — Audit tái tạo VFX kèm SFX từ kho Kiếm Thế

Đối chiếu wiring với **bảng missile gốc của Cổ Mộ** (`1fightskill/missile.txt` server 17 phái):

| Bảng JX1 | Cặp gốc | Dùng vào Tịch Dao |
|---|---|---|
| missile 518 | `jgm_110_znwz_c` + `cy_mylx_f` (phóng) + `cy_mylx_c` (trúng) | nhịp chém 1 phát biến thể **launch** (`strike-launch.wav`), nhịp 2-3 phát `strike.wav` (mylx_c) |
| missile 522/456 | `zgm_105_lgss_c` + `zgm_110_qzzh_c` + `sl_dmdj_c` | mưa kiếm kết liễu dùng `dmdj`; qzzh_c dự phòng mưa kiếm mục tiêu 2 (chờ duyệt) |
| missile 547 | `jgm_120_ftw_c` + `cy_bxxl_c` | Ảnh Bộ basic dùng `bxxl` (cùng họ ftw) |
| missile 548/574 | `jgm_50_byhw_c` — không kèm tiếng | đúng bảng: byhw không dùng làm cue có tiếng |

Đã vá: thêm `assets/audio/sfx/tich-dao/strike-launch.wav` (cy_mylx_f) + `meta.sfx.strikeLaunch`
+ `pairTable` provenance (4 dòng missile gốc) + runtime phát launch-variant ở nhịp 1 +
battle SFX map cue thứ 4.

**Chứng minh SFX phát thật** (QA, `run.sfxProbe` + `dataset.sfxState`): gọi `HonVietSfx.play()`
trực tiếp với 4 cue trên bus thật → **4/4 true** (fetch + decode + AudioContext running +
node start) ở cả 390 lẫn 1280; telemetry chính thức của bus ghi `sfxState=running`,
`sfxLastResult=played`, `sfxActive=4-5 voices`. Delta đếm `__qaAudio` không ổn định trong
headless (thời điểm resume AudioContext) nên chỉ ghi số liệu phụ, không làm gate.

Kết quả vòng 3: tests 23/23 (thêm assert launch-variant) · full suite **1801/1787/14 =
baseline** · Browser QA **PASS 390 + 1280** (`sfxProbe` 4/4).


## Vòng 4 (2026-10-16 đêm) — sync nhánh + audit SFX

- Rebase lên `784c8cd` (bản approved của session kia: 3 VFX clip ftw/hxc/qzzh + SFX mix
  blink/slash/sword-rain/execute-impact). Xử lý xung đột: GIỮ nguyên bản approved làm
  chuẩn, đóng góp của vòng audit nhập vào dạng **provenance**:
  `meta.sfx.provenance.jx1PairTable` = bảng cặp VFX↔SFX gốc từ bảng missile Cổ Mộ
  (518 znwz+mylx_f/mylx_c; 522 lgss+qzzh+dmdj; 547 ftw+bxxl; 548/574 byhw im lặng) —
  trả lời mốc "NOT verified as original Cổ Mộ audio" của bản approved; nguồn file gốc
  decode sẵn trong `SKILLPACK/sfx/{cuiyan,shaolin}` nếu owner duyệt swap 100% audio gốc.
- **QA chứng minh SFX phát thật**: gọi trực tiếp `HonVietSfx.play()` với 4 cue approved
  → **4/4 true** (fetch+decode+AudioContext running+node start) trên cả 390 lẫn 1280;
  telemetry bus `sfxState=running / sfxLastResult=played / sfxActive=2-3 voices`.
  Đếm node `__qaAudio` để làm số liệu phụ (delta flaky trong headless — thời điểm resume
  AudioContext); **gotcha realm**: `__qaAudio` của Parent không thấy node tạo trong iframe
  realm khác — battle top-level thì thấy.
- Full suite **1811/1797/14 = baseline** · QA **PASS 390+1280** (phases ✓, flower 48/20,
  rain 21/14 draws, sfxProbe 4/4).
