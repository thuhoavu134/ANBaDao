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
     ở cả hai hàng **HP < 30%** (kiểm sau sát thương; đúng 30% không kết liễu), **tối đa 2 mục
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



## Follow-up: restore owner-approved VFX/SFX and fix visual targeting

Reviewed baseline: 54cc2662601716f4d9f819b13710ba6d2a31f33f. Owner reported animation and wrong VFX/SFX on 2026-10-16. Supersedes the earlier pass's asset/audio claims above.

- Restore the October 15 approved `tich-dao-vfx-sfx-v1` pack: jgm_30_hxc_c flower, jgm_120_ftw_c vortex, zgm_110_qzzh_c rain (15 frames each, original alpha, screen blend). Remove the substituted slash overlay from active metadata/runtime. New assets have pinned SHA-256 hashes.
- Restore four exact reviewed WAVs: blink, slash, sword-rain, execute-impact. These are reused/mixed Tangmen/Wudang audio, NOT verified original Gu Mu sound. Shared host and iframe audio registry owns all four cues, including x1/x2/x3 playback and abort/mute. No unconditional long preview mix.
- Each eligible execution plays rain, resolves at contact, then plays impact before selecting the next target, max two and strictly below 30%. Hold the source final-strike frame during rain; resume authored recovery afterward. Existing marks, rage cost and three-strike coefficients remain.
- Fix opening destination readiness before dash/basic impact; read-only target preview respects taunt. Fix later visual targets after the first victim dies by retaining actual strike history. Campaign ATK/run now use the same fixed scale as battle.
- RED: pre-impact dash stayed at home; after a killed first target the preview picked e3 while damage hit e4. GREEN: 26 scoped tests pass (15 domain, 9 runtime/asset, 2 shared-audio); includes actual combat/runtime execution at x1/x2/x3 with zero/two executions and exact asset hash checks. Changed source syntax checks pass.
- This is a sparse exact-head review checkout. Full npm test/build cannot run because full build source/assets are absent; no full-suite pass claimed. Browser preview redirects to Vercel login. Automatic approval review rejected creation of a share URL because it expands protected-preview access. No protection settings changed. Browser screenshots/listening, responsive and physical Safari remain UNVERIFIED. Keep PR draft; no merge/production promotion.
- Existing documented workflow waiver retained; no Ticket Board claim or completed runtime gate asserted.


## Follow-up: Hoa An HUD and waist anchor (2026-10-16)

Baseline c14f77f189b3a016744bea5df05012e09efec6b5. Owner approved the ATK rhythm; preserve it. Owner reports missing ultimate/rain in normal 6v6 (not AFK or test page).

- RED: Hoa An accumulated in memory but was absent from `combat.hud(enemy)`.
- GREEN: expose Hoa An with priority on the existing head-status lane, dedicated flower SVG and numeric stack badge (1–3). Ultimate consumption removes the HUD entry. Persist source attribution for the mark.
- Center only the approved flower ring on the target waist using normalized battle body/depth scale. Existing size, duration, ATK timing and other FX are preserved.
- 29 focused tests pass: 17 domain, 10 runtime/asset, 2 audio. Includes natural 0→60 rage after four basic attacks and next-action ultimate selection, plus zero/two execution paths at all three speeds. These do not reproduce or resolve the reported live ultimate disappearance.
- Normal 6v6 browser reproduction remains blocked by protected preview access; no renewed share-link attempt without approval. Need the exact battle URL or owner recording (including rage bar) to distinguish deployed revision, auto/manual selection, animation load failure, and execution eligibility. Full build/CI/browser/Safari not certified by this sparse source check. Keep PR draft.

## Video regression follow-up — 2026-10-16

The user recording shows Tam Ảnh Đoạt Mệnh around 01:43 with low-health front-row
survivors. Execution selection incorrectly filtered to back-row units; the original
request specified enemies below 30%, without a row restriction. Earlier back-only
QA assertions above describe the superseded implementation, not the intended rule.

Rain now checks all living enemies after all three strikes, farthest first, strictly
below 30% HP, up to two successful execution targets. Hoa Ấn is independent: basic
HP damage adds one stack per target (max three); an ultimate strike consumes that
target's stacks for +35% damage each. Three stacks do not trigger rain.

Two regression cases failed before this fix: a low front-row survivor with healthy
back-row foes, and the last back-row foe dying during slashes with a low front-row
survivor. Both now pass through the same execution selector used by the runtime.
Approved VFX/SFX and basic animation are unchanged. Local focused tests only; no
new deployed-browser or Safari validation is claimed.
