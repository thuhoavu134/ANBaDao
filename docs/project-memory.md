## 2026-10-26 — SFX tướng: 2 lỗi làm owner nghe sai tiếng (đã sửa, PR #376/#377 merged)

Đổi tiếng đòn thường Lăng Vân theo lựa chọn của owner (nhịp 1–2 `cy_bzwy_c`, nhịp 3 `tm_dcg_c` = số 23 trong 181 tiếng kho Kiếm Thế). Hai lỗi thật, đều không nằm ở deploy:

1. **Tiếng va chạm cũ đè tiếng mới.** Mỗi nhịp còn phát kèm `lang-van-basic-hit` (`basic-hit.wav` bộ cũ) cùng lúc: RMS **−8,4 dB** so với −15,9 / −21,6 dB của tiếng owner chọn → tai chỉ nghe ra tiếng cũ. Đã bỏ cue này khỏi đòn thường.
2. **Engine tua tiếng theo tốc độ trận.** Trận nhúng bị ép x3 (`battle.html`: `if (!EMBEDDED) return; state.speed = 3;`) và `audio-sfx-runtime.js` gán `source.playbackRate = speed` → tiếng nhanh 3×, cao hơn ~19 nửa cung, owner nghe "không đúng âm thanh gốc". Nay **mọi tiếng `playbackRate = 1`** (cả 10 tướng authored lẫn 6 tướng cũ); nhịp phát vẫn theo trận.

Ngoài ra: file tiếng owner chọn giữ **nguyên byte** (`atk-bang-efd892d4.wav` = `cy_bzwy_c`, `atk-gai-90bd2748.wav` = `tm_dcg_c`), tên mang md5 vì `/assets/(.*)` bị `immutable` 1 năm.

Bài học chi tiết + checklist: [SFX-INTEGRATION-LESSONS.md](SFX-INTEGRATION-LESSONS.md). Test khoá hành vi: `tests/authored-sfx-pitch.test.mjs` (x1/x2/x3 đều rate 1, md5 file gốc, không còn cue va chạm cũ). Toàn bộ: 2241 đạt / 88 lỗi cũ / 0 lỗi mới.

---

## 2026-10-17 — Điểm tiếp tục: Ultimate Kỷ Vân ba tia (DRAFT / REVIEW)

Owner đã cho merge PR #312; main hiện `642dd78e3174dca902e4ea0deeebe009dfd6e83b`. Source mới trên `fix/ky-van-triple-lightning-sfx-20261017`, PR #313: `kyVanUltimateLightning` vẽ ba tia sau latest-strike dedupe. Owner đã phản hồi ba tia song song/equal-height trông giả; revision hiện dùng height factors [.78,1,.90] xoay theo slot%3 và offsets [-spread,0,.75spread], với spread clamp(height×0.14,18,36). Scale cả width/height quanh anchor gốc giúp ba đầu tia cao thấp khác nhau, còn contact vẫn đúng foot. Một group/target, một impact, không thêm damage. Basic giữ heightFactor=1, offset0/một cột. Last visual tail vẫn 3670 < recovery3900.024.

Audio owner vẫn `src/ui/audio-sfx-runtime.js`; các approved `ultimate-x1/x2/x3.m4a` đã có đủ cast và ba waves, nên giữ nguyên bytes/gain0.38 và một voice/cast. Speed chụp đầu chiêu, không thêm playbackRate; abort/mute/skip giữ owner cũ. Sáu audio test mới dùng bus/actor/registry/bytes thật, mock Web Audio device; ffmpeg waveform audit riêng. Prepare vẫn budget2s, không khẳng định cải thiện timeout hoặc nghe trên iPhone.

[QA note](qa/ky-van-triple-lightning-20261017.md) có **34/34 PASS**, hashes/audio metrics, ảnh cận đủ ba đầu tia và MP4 đã render lại với full SFX. Revision đầu lệch có RED1fail/6pass, GREEN7/7 layout. Canvas fixture thật không phải full-game/browser/device certification. Cập nhật cùng PR #313, chưa merge/deploy; review PR/preview rồi owner duyệt tiếp. Waiver Ticket Board giữ nguyên. Các mục bên dưới là lịch sử của các lát trước.

---

## 2026-10-17 — Kỷ Vân / Thầy Mo: điểm tiếp tục (DRAFT / REVIEW)

PR #311 đã merge theo yêu cầu owner; main `6fa926747059757de9a9d5072ec643bbcf1d1bd8`. Quy chuẩn thân hiện hành vẫn là Bạch Diện 310 theo [HERO-BATTLE-SIZE-CONTRACT.md](HERO-BATTLE-SIZE-CONTRACT.md). Lát mới ở `fix/ky-van-lightning-thay-mo-damage-20261017`, chưa merge/phát hành.

Owner sét: `src/runtime/ky-van.js` + `runtime-meta.json` của Kỷ Vân. Atlas cũ frame 0–4 co/rút nên dùng crop tăng dần cùng frame 5 trước hit, anchor 130/540; source density giữ nguyên. Basic từ trời xuống mục tiêu; Ultimate cột trước → quét cặp hàng → cột sau, không chồng nhiều cột tại một target, không tạo thêm damage Ultimate. Demo là iframe dùng battle thật.

Owner Thầy Mo: `scripts/thay-mo-authored-production-v1.mjs`, sửa resolver production đã đổi tên `__hvResolveAction3qAdapter`, không chỉ wrapper ghi kết quả. Snapshot VFX cho đúng ba damage target; primary trước, nộ/record một lần. Free talent Skill/fear thêm hai hit sau primary status; canonical AoE và Ultimate không thêm hit. Final versioned Basic dispatcher vẫn sửa chữ ký late đúng thứ tự build.

[QA note](qa/ky-van-thay-mo-20261017.md): 40/40 focused PASS, fixture dùng adapter/settlement thật với raw formula kiểm soát; ảnh/video Canvas offline từ asset thật đã đọc. Bốn test rage-rotation cũ bị subprocess EPERM, không tính pass. Checkout thưa chưa có full build/browser/device; không gọi ảnh offline là game preview. Waiver Ticket Board cũ giữ nguyên. Bước sau là review PR/normal preview khi hạ tầng cho phép và owner chốt hình ảnh; không suy approval merge mới từ PR #311. Các mục dưới giữ lịch sử.

---

## 2026-10-17 — Shared battle hero size: điểm tiếp tục (DRAFT / REVIEW)

Owner yêu cầu một chuẩn vóc dáng cho mọi tướng qua idle/ATK/Ultimate, tránh sửa runtime scale từng lần tích hợp. Bạch Diện là tham chiếu **310 world units trước viewport và home-slot depth**. Baseline `de5d425e11719cd275112953d539339e2eb4b77a` đã chứa PR #310 được merge; thay đổi mới trên `fix/shared-hero-scale-contract-20261017` vẫn **DRAFT / REVIEW**, chưa có merge/live claim.

Điểm vào: [HERO-BATTLE-SIZE-CONTRACT.md](HERO-BATTLE-SIZE-CONTRACT.md). Shared math/painter/projection ở `src/render/hero-presentation.mjs`; build-discovered metadata ở `assets/characters/*/presentation.json`, hiện 10 profile. Loader gate trước build output và formation owner chèn helpers trước fallback/direct runtimes. Không thêm bảng scale theo hero ID hoặc chiều cao HUD riêng; source-body đo body/feet cố định theo camera/clip, pre-registered giữ owner cũ, VFX tách riêng. Generic/procedural fallback đã nằm trong cùng chuẩn.

Giới hạn cần giữ khi bàn giao: manifest vẫn cần calibration thân thực, không suy ra từ alpha chứa vũ khí; Linh Đồng/Lục Ảnh/Thầy Mo có foot packing/cell proxy được ghi rõ. Ông Phở/Đình Lôi/Thầy Mo chưa có `runtime-meta.json` để cross-check toàn bộ clip inventory. Không gọi schema validation là đã kiểm landmark pixel hoặc mọi clip legacy tương lai.

Ngoại lệ có chủ đích: thẻ UI `splus-pending-art` khi chưa có profile giữ projection 126/foot -4/scale 1 theo rectangle thật; profile authored luôn thắng cờ pending-art cũ. Lượt kiểm cuối **67 đạt/0 lỗi** (50 focused +17 targeted runtime); registry 10 family. [QA note](qa/shared-hero-scale-20261017.md) ghi phạm vi; [ảnh Canvas offline từ sprite thật](qa/shared-hero-scale-20261017.png) hỗ trợ review hình ảnh. Không suy ra full build, browser gameplay hay physical Safari/iPhone/iPad từ bằng chứng này. Checkout thưa thiếu assets cho full build. Waiver Ticket Board/workflow đã có vẫn áp dụng; không giả claim/DONE/merge. Các mục dưới là lịch sử, không phải trạng thái phát hành mới của lát này.

---

## 2026-10-15 — Tích Đạo authored S+ integration (REVIEW)

Branch `feat/tich-dao-integration-20261015` from main `0aa0c86`. Draft PR; no merge, no production promotion. Owner-approved six-state pack (SHA `3a4c6a…eab`): battle cells 480×440 match the Kỷ Vân action grid; the 77-frame idle is repaginated losslessly into nine 3×3 pages (≤7.3 MB decoded/page). Ultimate keeps the authored 4.0s nine-phase timeline; phases 03/05 hide the entire body (no frame, no standing fallback, visibility cache untouched) while the HUD stays anchored; strikes land at 1083/1750/2917 ms (phase-04/06/08 starts). Basic retimed 900 ms, hit 350 ms, run 750 ms (Tiêu Phong precedent); fall stays 4000 ms in meta and compresses to 900 ms/speed at runtime. Kit review defaults: assassin Basic (weakest back-line), 3-strike ultimate 0.7/0.9/1.0× with 35%/×1.8 final crit and one recipient-turn stealth on any kill, passive Ảnh Bộ once-per-battle stealth below 40% HP; no Skill 1 (canUse gate + performAction rewrite, #307 lesson).

RED: 6/8 domain tests failed before implementation (red.txt). GREEN: 8/8 plus 5 runtime vm tests (phase cells, hidden gaps with zero pixels, authored markers, real-text battle patch idempotency, host composition); extended new-hero-result/visibility, account-stars (17 ids), legacy-skill-map. Full suite 1793 tests: 1779 pass / 14 fail — all 14 reproduce on a clean `0aa0c86` worktree (Windows-local pathname/spawn bugs + stale idle-registration expectations), so zero regressions; Linux CI decides those. Browser QA (Chromium CDP, scripts/qa-tich-dao.mjs): 390×844 and 1280×800 PASS — detail idle canvas, AFK campaign pages, /tich-dao-test.html full trace, 17 authored ultimate cells with both vanish gaps proven by the draw log, 0 exceptions, 0 asset errors; 18 screenshots inspected (vanish phase leaves only the HP bar). Evidence: docs/qa/tich-dao-integration-20261015.md + evidence/tich-dao-fixes/. Pending: temporary avatar (idle frame 53), no authored SFX, kit numbers review defaults, physical Safari NOT_RUN, no real-time capture.


## 2026-10-15 — Thầy Mo auto Basic rage (REVIEW)
PR306 merged with owner approval at main 47f1455; this new branch fixes auto selecting a 25-rage legacy Skill behind Thay Mo's Basic animation. Existing identity owner excludes him only from the paid auto-Skill branch. Actual Basic stays free/+15; Ultimate and free talent unchanged. RED 3 identity cases reproduced; GREEN 10/10 focused tests (both teams, 30→45→60→75→Ultimate→15). Full build/browser/device/deployment not certified. docs/qa/thay-mo-auto-basic-rage-20261015.md. No merge authorization inferred for this new fix; existing Ticket Board exception retained.

## 2026-10-15 — PR306 idle/action scale follow-up (REVIEW)
Owner authorized updating PR306. Both authored idle loops now use one fixed registration matching the existing 413px action body and y=-12 ground. RED reproduced; GREEN 22/22 focused tests. Real-asset comparison inspected offline. Full build/browser CI pending; physical Safari and deployment NOT_RUN. See docs/qa/idle-action-scale-20261015.md. Existing Ticket Board exception retained; no merge authorization inferred.

# Result identity correction — 2026-10-14

PR306 follow-up at f8c8816e45f42fa2195361050f7f3f510ce9be43. User screenshot: Tiêu Phong MVP was painted with the generic female mystic. Cause: both new heroes were absent from the authored result manifest and fell through to archetype art. Existing result motion owner now uses each hero's actual Run, all six Idle pages with original fractional durations, and Fall; sourceHeroId is also recognized. No reward/settlement/combat/UI layout change.

RED: two generated-manifest identity tests fail before implementation. GREEN: four focused tests pass, including mapping every frame in 83/87-frame Idle loops to its correct page/cell. New hero result identity review run 38550768527 / job115807886587 SUCCESS: full normal build and1753/1753 Node tests; four Chromium cases (390x844/1280x800, both heroes) verify only correct hero source images were drawn, all six idle pages, authored Run, one Fall to final frame, and Confirm returning from Victory/Defeat. Zero runtime exceptions and asset HTTP errors. Four Victory screenshots inspected: correct chibi fan wielder and silver-haired Ky Van in wing focus; desktop uses centered portrait result layout. Result snapshots are controlled QA inputs with empty rewards; no full campaign/economy certification claimed.

No merge or production deployment. Existing nyto1 preview cannot be updated via this session: Vercel scope query returns403, no local CLI available, Git integrations report blocked deployment. Do not tell owner their old preview already contains this commit. Physical Safari NOT_RUN. Previous flicker repair retained.

---

# Kỷ Vân / Tiêu Phong battle flicker — 2026-10-14

PR306, branch fix/ky-van-tieu-phong-flicker-20261014. REVIEW only; no merge or production promotion. Runtime 94f044e76dea6268eda896eae7de09465b5ffdb1 based on current main 0c5603d9e4d95fce320a03c2f45903c0f902a309. Carries PR301's missing-body fix plus current-page-before-prefetch ordering. Keeps PR305 formation work. Full normal build and 1749 tests PASS; desktop/mobile real battle renderer image-loss/recovery/Ultimate/Reset+Basic PASS, zero runtime/asset errors. Four screenshots reviewed; physical Safari not run. Evidence: docs/qa/new-hero-flicker-20261014.md; Actions run 38547610199. No blanket campaign or layout certification; no ticket board transition claimed.

---

# Current UI trial — 2026-10-08

PR290 REVIEW only; baseline main fef053e includes previous entry/media merges. Runtime 5f677ad3670b6870d779873c043907f88a53c6a4. Full game preview: https://luc-than-lsqtxhayh-nyto1.vercel.app. Four-screen polish preserves original assets and all gameplay owners. Build,1684 tests and dedicated browser workflow37665868908 passed; owner aesthetics and physical Safari still pending. Details: docs/qa/ui-polish-20261008/README.md. DO NOT merge until owner approves this UI trial.

---

# First AFK VFX and early battle SFX — 2026-10-07

Status: REVIEW after validation; Draft PR288, no merge approved. Baseline main32cbbf1; runtime25df23ba69374fb46c575646d6fc5e829b8ebc45. Branch fix/first-action-vfx-sfx-20261007. PR287 remains separate and unmerged.

## Root causes and repair
- AFK requested VFX pages only during their short release window, but advanced farmTime on missing pages. Warm the first small VFX page during casting, and hold only the existing visual farm clock while the active attack/VFX page is unready. Preserve actual AFK accrual/rewards and existing memory/renderer ownership.
- Both readiness owners stopped waiting for audio after2s even when the cold decode was still pending. The action could finish and cancel the unheard sound. Use the existing15s resource budget (remaining time for legacy) before the cast clock; retain bounded failure/mute/cancellation behavior.
- Zero/stale WebAudio output timestamps could map a500ms cue9s into the future. Use fresh output timestamps when available, otherwise the existing currentTime mapping. No new audio owner or replay.

## RED → GREEN
Focused tests: two AFK failures (missing page failed to stop visual time), two cold-clock failures (source start10.5/8.6 rather than1.5), two cold-decode failures (cast gate released at2s). Seven focused tests pass after the patch, including a valid-device-clock control.
Browser normal baseline79741a2: both teams' sounds already work with fast local downloads; this alone did not reproduce the mobile symptom.
Browser cold baseline4c11181, run37649127556: desktop real VFX responses delayed900ms -> first Đình Lôi/Thầy Mo VFX only at15082/16266 visual ms (second attacks, release8580/9760). Direct iPhone code path with real SFX responses delayed6.5s -> first Ông Phở sound returned false on a running AudioContext. This is controlled latency, not simulated audio/gameplay.

## Limitations
Chromium mobile routing emulation is not physical Safari/WebKit. Actual device listening remains NOT_RUN. No blanket latency/memory claim. Existing Ticket Board unavailable waiver applies; no ticket status fabricated. Asset art, target rules, damage, formation, reward, and AFK wall-clock accrual are unchanged.

## Final evidence
- Actions37649454732 SUCCESS at runtime25df23ba: clean build and1680/1680 Node tests; all three browser cases PASS.
- Under900ms real VFX response delay, first effects now paint at8583/9783 visual ms versus release8580/9760 (previously only second casts15082/16266).
- Desktop, direct iPhone routing and6.5s cold SFX download cases each progressed10 actions, with9 first actor SFX requests successful across both teams. Real nonzero PCM buffers started on running contexts; scheduled combat audio was not cancelled before audible onset. No runtime exceptions or asset HTTP errors.
- Screenshots inspected: desktop and390px AFK keep the original map/UI/party;390px battle shows the running fight and intact dock. These end-of-sample screenshots do not independently prove transient first VFX; timestamped drawImage evidence does.
- General CI37649655545: build,1680 tests and Battle VFX browser QA passed; Upload battle VFX evidence failed because existing GitHub artifact storage quota is full. Not claimed green CI. Dedicated media workflow holds its reports/screenshots directly in logs and passed.
- Preview READY: https://luc-than-5mn2alu0a-nyto1.vercel.app. Host and battle fetched HTTP200; verified exact farm gate, clock validation and bounded readiness in deployed source.
- Review PR: https://github.com/bktimmy247/luc-than/pull/288. Owner device review next; no merge.

---

# Loading optimization — 2026-10-07

Baseline main cc6bbfe36ab5578de6eb918bf9a3e46e019f4ea7 (owner-approved PR #285 merged). New branch perf/loading-20261007; Draft PR #286, REVIEW only. Runtime revision 29ecbd04c787bdc93413cb7025d5635fca3a1fa1.

## Measured bottleneck and scope
Real cold Chromium login/hub/preparation/battle profile (run 37636058665) showed 8.49 MB citadel, 2.65 MB foreground, shared menu PNGs up to 0.99 MB each, and a 2.56 MB battle background. These assets were downloaded on the normal guest path.
Build-time lossless WebP companions now replace 23 menu icons and 3 measured backgrounds in the final host and battle documents, including existing dynamic menu templates. Source PNGs remain unchanged. No resizing, palette reduction, new runtime cache, combat timing/math, save, reward or animation changes.
Legacy friends.png is truncated (327680 bytes; libpng/libspng read error). The shipped hub already switches to friends-v2.png; the build now selects that same canonical visible icon from first paint and excludes the obsolete broken file.

## Evidence
- RED: identity build did not replace literal/template references or emit the derivative (2 failed focused cases).
- GREEN: 2 focused tests pass: reference mapping/idempotency, preservation of source bytes, dimensions, alpha and every visible RGB value.
- Real build checks every visible pixel of all 26 assets against its decoded original; mismatch fails the build.
- Encoded total: 25,055,307 -> 18,625,472 bytes, saving 6,429,835 bytes (25.66%). This is selected asset transfer size, not total RAM or overall frame-rate improvement.
- Clean build and 1673/1673 full tests PASS.
- Loading profile run 37638060432 PASS: real guest login/hub/preparation/battle at 390x844 and 1280x844, runtime exceptions 0, asset HTTP errors 0. Browser requests the new companions.
- Host entry/re-entry and all-screen interaction audit PASS in that same run. Mobile/desktop hub screenshots and mobile battle screenshot inspected; canonical icon shapes, alpha and backgrounds retained.
- CI/CD artifact quota is a separate existing infrastructure limitation; dedicated profile/audit logs are available without artifact uploads.
- Baseline first-two-actions time: 5098/5132 ms (mobile/desktop); candidate 4932/5517 ms. These include authored animations, are single local runs and do NOT demonstrate a consistent timing speedup. Candidate adds a hub screenshot, so downstream host timestamps are not directly comparable. The proven gain is transfer-byte reduction.
- Physical iPhone/Safari and real mobile-network timing NOT_RUN. Decoded memory is unchanged.

## Handoff
No merge or production promotion. Owner reviews PR #286 and the new preview. Keep the accepted gameplay from PR #285.
Next bounded performance work: isolate login video, first-use audio and character atlas waiting on an actual slow network/device; do not shorten authored actions or preload all atlases to mask waits.
VibeLab run 20261007-211930-2gxg6l2; existing unavailable Ticket Board waiver persists, no fabricated claim or ticket transition.

Preview verified READY, host/report HTTP 200: https://luc-than-cghu76a5i-nyto1.vercel.app/ . Deployed report matches 18,625,472 bytes and host uses lossless companion paths.

---
# Facing-target correction — 2026-10-07

Owner clarified that attacks choose the wrong opposing hero, not that initiative is wrong. Review only: PR #285, branch review/full-game-ui-20261006. Runtime revision 4a5185d07e2e7a2a494e5da53040ea57280737e3; QA revision 82ce2085e4e58453d8f78981ece19d5affeb3419.

## Fix
- Existing targeting owner now resolves generic single-target Basic/Skill/Ultimate to the opposing living formation lane. Existing taunt, legal-frontline and deterministic casualty fallback remain in force.
- Bạch Diện/Linh Đồng aliases normalize Skill to Basic before resolving the animation target. Previously presentation could approach a stale Skill target while the S+ mechanics owner damaged the opposing Basic target.
- Ông Phở's chain fallback uses the same formation selector.
- Initiative, damage formulas, AoE/support targeting, native S+ special skill rules, saves and rewards remain unchanged.

## RED and GREEN
- Focused RED: generic skill chose enemy0 instead of opposite enemy1; authored alias kept player0 instead of player2.
- Actual-browser RED: run 37626363166 showed Bạch Diện slot2 choosing player0 rather than player2.
- Build anchor collision caught in run 37627223246: the same normalization line exists in the legacy adapter. Insertion is now scoped to the unique performAction signature.
- Clean build and 8 focused tests passed in run 37627980949.
- Full audit run 37627980726 passed: 1671/1671 tests, instant skip win/loss, actual host/reentry/result, AFK canvas, formation geometry and all-screen checks.
- Runtime trace at 4a5185d: full mobile roster checked 9 actions; partial mobile and desktop checked 6 each. All 21 action targets and impact targets matched. Screenshot inspected: mobile offensive skill hit the correct opposing lane.
- Initial browser harness required a non-basic offensive cast in EACH two-round scenario, including a partial support roster. That coverage assertion failed despite all target equalities passing. QA-only revision requires non-basic offensive impact coverage across the suite while retaining every per-action equality and per-scenario Basic check.

## Preview and limitations
- Verified READY preview for runtime 4a5185d: https://luc-than-4g31dw60a-nyto1.vercel.app/
- Host and battle HTTP 200; deployed source confirms target resolution after authored alias normalization.
- Responsive Chromium is not physical iPhone/Safari; physical device acceptance remains owner review.
- CI/CD build, tests and VFX QA passed, but artifact upload failed because GitHub artifact storage quota is exhausted. Separate full audit completed successfully; no quota bypass or deletion.
- Ticket Board remains unavailable under the previously recorded owner waiver; no ticket transition is claimed. VibeLab run 20261007-200308-2upkipg.
- No merge or production promotion. Owner approval required on GitHub.

## Final facing-target browser gate
PASS: run 37630872610 on 82ce2085e4e58453d8f78981ece19d5affeb3419. All three real-host scenarios passed (390px full roster, 390px partial roster, 1280px persisted partial roster): 21/21 matching action/impact targets, no runtime exceptions, queue order unchanged. Full mobile includes offensive Skill and Ultimate impacts. Partial formation screenshot inspected: gray cells absent, add/remove controls retained.

---

# Formation cells and opening Basic — 2026-10-07

Review-only change for owner reports: gray empty formation cells, opening attack losing no HP, and perceived turn-order reversal. Runtime revision a92df74f13ba4d3d4c989aa96ce7f8594bf79774; Draft PR #285. Main remains 0cf636aca931265ac236f9f4eb8548c214c312d8. No merge or production promotion.

## Changes and diagnosis
- Empty preparation buttons no longer paint their full hit area. A small oval plus marker retains discoverability, selection, keyboard focus and the original add/remove/drag event owner.
- Fixed omitted action arguments at versioned Basic dispatch sites. The predicate required `action === "basic"`, but callers supplied only the actor. This skipped Ông Phở's authored two-contact Basic branch, second-hit plan and +15 rage, and ignored other versioned Basic multipliers. A bounded idempotent late build patch fixes callers after authored runtime owners.
- The opening first contact in the reproduced guest fight was an actual MISS (combat log confirms it). Do not force a hit or bypass evasion/shields. After restoring the second contact, full roster target HP goes 605→400 and Ông Phở gains 51→66 rage. Partial 3-hero roster target shield goes 109→0 and HP 605→574; rage 43→58.
- Turn order is not changed. Source and actual browser trace agree: higher total living-team rage starts each round (ties player), then alternating same-numbered slots 0..5; empty/dead slots are skipped. Removing heroes preserves slots 0,1,3. Full and partial first-round actual actor sequences exactly match their queued order. The leading side can change between rounds. If the owner expects fixed initiative or a different alternation rule, that product choice still needs clarification; do not claim an ordering bug was fixed.

## Verification
- RED: baseline gray CSS assertion fails; generated resolver regression fails with multiplier 1 instead of 0.868 / 1.7, missing authored Basic plan/rage. Baseline actual-browser diagnostics: runs 37620985183 and 37621766165.
- GREEN: 6/6 focused generated-runtime/formation tests; actual guest mobile 390×844 full/partial roster browser run 37622337541 passes with no runtime exceptions. Gỡ→empty slot→add→remove verified by actual clicks. Preparation screenshot inspected: no gray rectangles, three small plus markers.
- Full test suite: 1667/1667 passed. CI/CD run 37622344596 build, tests and VFX browser QA pass; job fails at artifact upload because GitHub storage quota is exhausted, so downstream jobs there are skipped. This is not a green CI job.
- Separate full-game audit run 37622337544: PASS: full build/tests, instant skip real victory/defeat and host reentry, owner roster/result flow, actual AFK canvas, formation/AFK geometry, real host entry/return and every-screen inspection.
- Vercel preview READY and HTTP 200: https://luc-than-eg1b57pgu-nyto1.vercel.app . Deployed host contains transparent slot rule; battle contains corrected Basic dispatch with no omitted-action calls.
- Physical iPhone/Safari not tested. No new assets, economy/save migrations, initiative changes or reward changes.
- Ticket Board waiver carried from the existing session; no ticket claim or board transition fabricated. VibeLab run 20261007-192310-2r3cw30, REVIEW handoff after verification. Rollback this slice by reverting a92df74; retain prior instant-skip fix.

---

# Instant battle skip — 2026-10-07

Owner contract: bottom-right ›| beside Chinh chiến skips all remaining battle animation and opens the authentic win/loss result. Review branch / Draft PR285 only; no merge or production promotion.

Baseline a230300; final runtime e89634c; final browser/test revision 2dd707f (later changes only QA). One existing button handler now wakes presentation waits, skips authored marker/tween/image waits and continues the existing AI/action scheduler. The same damage, status, round cap, result snapshot and settlement owners run. Repeated clicks are idempotent; sound and skip state reset at result/new battle. Skipped action leases retain a unique stable task ID across S+ impact, so Linh Đồng/Bạch Diện return ownership cannot stall the scheduler.

RED: deployed handler only toggled animations; real button failed finish assertion. Browser RED at 023a6a4 exposed S+ action ownership stalling after action 4. Fixed stable lease identity; generated-runtime movement regression passes. Asset-readiness VM fixtures now load the real added runtime; original assertions remain. Browser cleanup now uses graceful Browser.close before removing profiles, fixing observed ENOTEMPTY cleanup races.

GREEN: 5 focused skip tests; existing legacy and S+ asset readiness cases pass; 15 generated inline scripts parse. Full clean build and 1665/1665 tests passed at e89634c; final 2dd707f full build/test steps also passed.
- Focused browser audit SUCCESS: https://github.com/bktimmy247/luc-than/actions/runs/37619196832
- Four authentic 15-round victory/defeat cases at speeds 1/2/3: correct winner/rewards/round cap, confirm/next/back, one settlement publication, repeated click safe, 913–1048 ms.
- Actual guest → Chinh chiến → prepare → battle → skip → result → confirm → reenter: two cycles each on 390×844 iframe, 1280×800 iframe, and iPhone-user-agent full-page transport. All 6 cycles passed, 462–1234 ms; sound restored, new battle unskipped, zero runtime/asset errors. Real result hero Idle frames and screenshots checked.
- Broader final audit https://github.com/bktimmy247/luc-than/actions/runs/37619197266: build/full tests/skip fixtures/actual host/roster-result steps passed; other screens still running at this checkpoint. No blanket all-audit-green claim.
- Preview candidate: https://luc-than-1s404ig60-nyto1.vercel.app READY, revision 2dd707f; deployed battle HTTP200 with skip handler and stable action lease verified.
- Physical iPhone/Safari NOT_RUN. Emulated iPhone transport is Chromium, not WebKit. Existing Thầy Mo missing authored Run limitation is unchanged.
- Main remains 0cf636a. Owner approval required before merge. Ticket Board unavailable under prior documented owner waiver; no ticket claim/lease or DONE state asserted.

# AFK VFX sizing — 2026-10-07
Runtime8b5c9b1, parent7c20dd7, owner clarified AFK ONLY.
Changed only campaign drawCampaignBasicVfx: uniform scale bounded by 0.8×hero body height, width1.6×body height and22% viewport. Long shallow Thay Mo projectile no longer gets giant width from height-only scaling. Preserves aspect, authored frames/timing, direction, pivots, Run/ATK behavior. Battle VFX unchanged.
RED: actual draw width exceeded cap. GREEN18/18 focused (sparse local test import uses existing HV_SKIP_BATTLE_FORMATION_SCALE_PATCH=1); full clean CI build and1660/1660 tests passed.
Actual guest AFK390×844,430×932,1280×800 passed, ATK/VFX and next-pack Run present,0runtime/asset errors; screenshots reviewed including reduced Dinh Loi effect. Browser report attached.
Audit37612639112: AFK/geometry/host/all-screen steps passed; owner result step failed on browser cleanup ENOTEMPTY in /tmp Chrome profile after screenshots, not a game assertion. Overall audit is NOT green; no blanket gate claim. Source scope deliberately remains AFK only.
Preview https://luc-than-ote3e2vis-nyto1.vercel.app READY; HTTP200 and deployed scale verified. Physical Safari NOT_RUN. PR285 review only, no merge/promotion. Owner size approval pending.

# AFK travel Run — 2026-10-07

Runtime b3980fadceaa45851a7acd7601d8d31d162b64d2, baseline0875c1b, PR285 review only.
- Added canonical paged Run descriptors for Luc Anh, Dinh Loi and Ong Pho. Existing Linh Dong/Bach Dien clips retained. Ong Pho uses only authored source frames28–36 (9-frame loop); page builder honors source startFrame.
- Canonicalized external Run aliases; parked fallback uses Idle. March/approach/regroup use Run; ATK and hold-until-pack-clear unchanged. No save, reward or combat changes.
- Thay Mo has no authored Run; retained honest Idle fallback. No invented/replacement character animation.
- RED2/2, GREEN10/10, syntax3/3; full build +1659 tests pass. Full UI audit37609416517 success; normal guest AFK on390×844,430×932,1280×800 observed Ong Pho and Dinh Loi Run drawing after24.5s, with ATK/VFX retained and0runtime/asset errors. Screenshots reviewed: characters visible and contained during next-pack movement.
- Preview https://luc-than-7p35pp3nj-nyto1.vercel.app READY; deployed Run pages verified: Luc Anh61, Dinh Loi64, Ong Pho9, Linh Dong96, Bach Dien45 frames.
- General CI37609421064 failed solely at artifact upload: GitHub storage quota exhausted; later CI jobs skipped. Audit uses inline logs and completed. Physical Safari NOT_RUN, owner approval pending. No merge/promotion.

# Oct7 verified review checkpoint — runtime 5a2baf3
Preview: https://luc-than-jgkwuhr8t-nyto1.vercel.app — Vercel READY, deployed host HTTP200 with assist route guard.
Audit: https://github.com/bktimmy247/luc-than/actions/runs/37600017304 — SUCCESS.
1657/1657 full tests, full build, actual roster→assist hit-test, authored result Run→Idle (Linh Đồng explicit QA snapshot), real guest AFK, formation geometry, host entry/return and all-screen inventory passed.
Responsive Chrome: 390×844, 430×932 and desktop where applicable. Runtime/asset errors empty in owner flows. Physical Safari NOT_RUN.
Reviewed screenshots: assist is visibly on top; Linh Đồng visible at left during Run and centered at Idle; actual AFK actors stay next to the pack between casts.

A first runtime 3296f50 browser route-state check was insufficient: screenshot showed Trận Hình above assist. Fixed team-3d owner to honor ST.hvAssistOpen, cleared on normal navigation/formation, strengthened browser checks with formationHidden and actual elementFromPoint hit-testing.
Delayed-idle regression now waits past 1.77s entrance before loading the held atlas; 3/3 motion harness tests passed.
Q1/Q3/Q4 implemented. Q2 PARTIAL: Thầy Mo still has no authored Run; existing idle-translation explicitly retained. Need original approved Run clip/atlas. No replacement character or claim of true Run for Thầy Mo.
General CI/CD 37600022507 still running broader browser jobs at handoff; full UI audit above is green. Owner visual acceptance pending. Draft PR285 only; no merge or production promotion.

# Owner corrections — 2026-10-07 (PR285 only)
Baseline 748b549; current main remains 0cf636a. User screenshots IMG_7704/7705/7706/7703.

Q1: A=anhDan (Ảnh Đạn), MH=joyMask (Mặt Hỷ), CB=buffBan (Cấm buff). Added semantic SVGs for these plus rageMask, generic non-letter status glyph. Removed initials drawing entirely, including cold image-loading fallback. Existing statuses/mechanics unchanged.
Q2 PARTIAL: result entry starts fully beyond left viewport edge, travels to center over 1.6s, then Idle; Run/Idle waits for decoded assets. Actual authored Run remains used for supported heroes. Thầy Mo has NO Run asset in repository: retained explicitly identified idle-translation, never another hero or fabricated Run. Need owner-supplied/approved Thầy Mo Run clip to complete this criterion. QA now exposes entryMotion.
Q3: accountGearNavTo invokes existing showScreen('team') before opening wheel/board; roster wrapper closes the heroes overlay. Normal formation bypass remains intact. No new global input listener.
Q4: cosmetic AFK actor holds engagement point between casts. Regroup begins only after ALL mobs die AND final cast finishes. Same event/damage/loot/reward clocks and squad identities; no game economy change.

RED: four focused failures on prior owners. GREEN: 22 focused tests, including movement/return bounds, current AFK regression, status registration/fallback, roster route owner and result entrance; generated result script parse passes. Local checkout sparse, no full build claim.
Added actual browser script: real login → Tướng → Trợ trận click, real result renderer + authored Linh Đồng snapshot on390/430/desktop. Explicit QA snapshot only in test, not player preview.
Previous full audit GitHub job111957306150 cancelled before any steps; not passed. New CI and Vercel preview results pending commit. Physical Safari NOT_RUN. Broader every-screen UI audit still unfinished.
Existing documented board waiver retained, no claim/lease fabricated. Draft review only, no main merge/production promotion. New status SVGs original code-authored presentation assets, not owner aesthetic approval.

# 2026-10-06 — owner correction IMG_7695
PR285 only, parent ac1492b. User rejects cramped allied columns / overly wide center and raw S badge. S is spiritMark (Linh Dong mark), missing localized label/art; stealth displayed TH.
S1 front offset70/back160: allied column gap90 vs previous50; opposing gap140 vs220. Preserve .34 portrait scale and desktop.
S2 add transparent vector bell-seal spiritMark and concealed-eye stealth HUD symbols plus Hồn Ấn label; original bespoke UI SVG, not claimed as owner-approved final art. No status mechanics changes.
S3 existing drawUnitHud owner: 16/18px compact icons/gap, 72px HP bar retained, vertical anchor follows scaled body. Four-icon lane70px fits 90px column.
RED3/3; GREEN22/22 focused tests including existing AFK/VFX regressions. Full build/browser and physical Safari pending; not aesthetic approved. No main merge or production promotion. Existing Ticket Board waiver retained. No routes removed.

# Review checkpoint — 2026-10-06
Runtime commit 1a2f0842ee1c6d9c3863e3bdb6995186f596dfda, PR285. Integrated selected PR282 source/tests into full game; main unchanged.

Owner's screenshot used old unchanged checkpoint 4c6297b. New code enables canonical AFK approach/ATK/VFX and smaller mobile battle geometry. Source blob hashes compared to focused local test files and match.

RED: six user-contract failures against checkpoint source (9 tests, 3 pass/6 fail); initial harness side-effect failure corrected using existing HV_SKIP_BATTLE_FORMATION_SCALE_PATCH flag, not production edits.
GREEN: 16/16 focused behavior/geometry tests. Expanded local attempt 27 pass/4 fail because checkout lacks full dist/preparation assets and two unchanged source dependencies; this is NOT full suite acceptance.
Full build, full suite, normal guest live AFK, host entry/return and screen audit queued on GitHub run37366721220. Physical Safari NOT_RUN. Do not claim verified rendering or aesthetic acceptance from local tests.

Preview branch alias: https://luc-than-git-review-full-game-ui-20261006-nyto1.vercel.app
New deployment: https://luc-than-q0g0m1tf1-nyto1.vercel.app ; Vercel BUILDING at record time, not ready acceptance.
Main0cf636a; no merge/promotion. Existing board waiver retained. Broad UI consistency audit remains pending, no screen functions removed.


## 2026-10-05 — Reaction status interoperability

Continuation of PR #281 from `79f98af`; main `2ab4c9b`, REVIEW. Native reaction consumption now uses selected status removal accounting and remaining DOT tick damage. Native extension updates round expiry/tick budget through its owner, preserves provenance, respects buff bans and never shortens longer effects. Preview and resolution share eligibility/type aliases; legacy follow-ups cannot overwrite managed marks. Existing legacy amounts and reaction coefficients remain.

Validation: RED evidence followed by 97/97 focused tests, including 13 new generated-runtime cases; regenerated sparse inline scripts parse and diff checks pass. Local fixture is not a full build. Fresh full-suite/build/browser CI pending this commit; physical Safari and deployment NOT_RUN. Evidence: `docs/qa/reaction-status-20261005/`. Next: remaining tactical status/trace routes, canonical mixed campaign progression and activity receipt gates, final visual regression. Existing owner workflow waiver applies; no board claim asserted.

## 2026-10-05 — Primer removal / recovery ownership

Baseline main `2ab4c9b` (PR #280). Branch `fix/primer-recovery-ownership-20261005`; source-only REVIEW. Supplied vibe-builder/vibe-lab read; the handoff's existing owner workflow waiver retained, no Ticket Board claim invented.

- RED generated rebuild/force crashed on an unexported `upsertReactionStatus` global; unweave removed managed primers without native accounting.
- Existing mixed settlement build owner now delegates selected removal to native accounting and restoration to the legacy adapter / S+ `restoreStatus` owner. Original managed deadlines, applied round and remaining tick budget remain; expired/banned grants return before costs, newer same-source statuses remain unchanged. Force retains the existing power expression and limits native lifetime/ticks to one round. Legacy merge, resource costs, windows and single-use receipt remain.
- Validation: 84 focused tests PASS (13 ownership cases + prior recovery/shield/status/reaction/S+ combat/V2); serialized browser factory, idempotency/drift, document prefix and five sparse generated inline scripts checked. Initial 79/80 harness result is preserved; an omitted existing dead-recipient guard was restored without changing production for it.
- Local checkout/fixture is sparse, not a full clean build or served-browser acceptance. Fresh full build/suite run on PR CI. Screenshot review, physical Safari and production deployment NOT_RUN.
- Next: reaction extension/consumption, tactical status ownership and trace equivalence; canonical mixed campaign progression/affordability simulation and activity receipt/gate coverage; final visual regression. Preserve Ông Phở ultimate chase, no new art integration.

## 26/09/2026 — Khôi phục authored combat, REVIEW / chưa merge

Branch `fix/restore-mixed-roster-vfx-sfx-voice-20260926`, PR #231. Xem [audit đầy đủ từng tướng/action](COMBAT-AUTHORED-AUDIT-2026-09-26.md). Runtime checkpoint `5c009474ae8be7b36c1cd308cae61623df6ff16b`; QA viewport `1c10ecf258f942b48dde8601520c79d373077a25`.

- Xác minh 718/718 asset blob; 113 commit lịch sử assets. Có 6 owner authored; 15 manifest thuộc 5 owner; Ông Phở dùng embedded legacy. Tám tướng chính thức còn lại và 41 S+ lab dùng generic; design IDs không phải file.
- Sửa build anchor Thầy Mo, chờ decode/giữ atlas legacy qua recovery, RAF pending VFX, mixed S+ idle-pin deadlock. Khôi phục checksum gốc hai PNG Ông Phở trong output build; nguồn asset giữ nguyên. Không đổi math/targeting/formation/scale/save/reward.
- 18 nút action của 6 owner đã có draw/audio/trace/return evidence desktop; gồm 2 Skill alias ATK. Voice Ultimate Lục Ảnh đã có HTMLAudio playing. 31/31 focused restore +32/32 QA controller PASS; full suite 1300 PASS /15 FAIL /1315, chưa đủ merge gate.
- iPhone/iPad/Safari thật NOT_RUN; mobile Chromium iframe phải ghi riêng. Không gọi toàn bộ VFX/SFX/voice đã hoàn tất. Không merge main. Ticket board không khả dụng; không giả claim/DONE.

## 17/09 — TKT-0158: battle enter audio

Một chủ quản audio: host. Xuất chiến unlock SFX + BGM combat trước iframe. Không `location.assign` 1.8s. Hunt overlay không pause loa vừa mở. iframe chỉ `new Audio` khi không có parent.playBgm. LIVE #157 `343fe39`. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 17/09 — TKT-0157: iOS atlas budget

Hai idle S+ không đứng cùng 128 MiB trên iPhone Chrome (video Hiệp 01 jetsam). Downsample atlas >32 MiB (Linh Đồng 77→20), overlay trận `purge` campaign-lite ngay, ATK/VFX nhả hết chiêu. Ultra v5 / campaign-lite / Dinh-Luc lazy giữ. LIVE #156 `ef2af5e`. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

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

`DATA.heroes.bach_dien` + `OFFICIAL_ROSTER_12_IDS` + kit v2 + hồ sơ idle. Linh Đồng giữ. TKT-0155 extras SUPERSEDED. LIVE #152 `85a35d5`. Owner tự `git pull && vercel --prod`.

## 16/09 — TKT-0155: thẻ Bạch Diện Tướng/Đồ Giám

Extra `bach_dien` trên roster, portrait card.webp, chạm `qaSplus42=hero_splus_bach_dien`. Roster 12 đóng. LIVE #151 `7a700e9`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0154: Bạch Diện Canvas Sprite Runtime

Pack animated WebP 94@30fps đóng atlas 8×12 (480×440) / 10×10 (440×248), không 4×2. Catalog + lazy idle + LRU 128 MiB dùng chung. Extra S+ giữ mechanics TKT-0152. Roster 12 đóng. LIVE #150 `aedd4cb`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0153: Chinh chiến Linh Đồng Run

March dùng `run-atlas.webp`. Idle giữ cho Bày trận. Cell/pivot L144 không đổi. LIVE #149 `7c70c69`. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0152: Bạch Diện extra S+ (cơ chế)

`hero_splus_bach_dien` aliases bach_dien / bach-dien. Không phải hàng 43. Passive Diện Khúc Luân Hồi, S1 Huyễn Diện Trảm, Ult Ly Hồn Đoạt Phách 100 Nộ. Roster 12 đóng. LIVE cùng #150.


## 15/09 — TKT-0151: Canvas Sprite Runtime


LIVE #147 `e8cd581`. Catalog resolve Linh Đồng + Lục Ảnh + Đình Lôi, không Image. Loader lazy, decoded LRU 128 MiB / maxLoading 2. Renderer metadata, trận 477×440. Timing-main bỏ eager forEach TKT-0150. L150-T2 đổi thành load VFX lúc ra chiêu. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0150: VFX/SFX trận

LIVE #146 `7baca81`. motionDuration không min 80. Eager Linh Đồng atlas. SFX decode chậm vẫn phát. skipAnimations=false lúc vào trận. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0149: nhịp trận tuần tự

LIVE #145 `506a7f8`. timingScale live 1, speed 1, turnRest 480, await performAction. S+ 0.35. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0148: địch Bày trận + cuộn Tướng

LIVE #144 `5de296f`. Foe prep luôn mirror. `.v4-grid` overflow auto. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 15/09 — TKT-0147: Ải 1-2 khóa sau thắng ải trước

LIVE #143 `4e61e58`. Con trỏ campaignStages sau thắng mở ải kế. Settlement ghi mốc theo ải đang đánh. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 14/09 — TKT-0146: S+ Linh Đồng clock ATK/Ultimate

LIVE #142 `c517cd8`. `performSplusAction` dùng `waitLinhDongMarker` wall clock, không `sleep(linhDur)`. Chrome 390×844 ATK 1506ms. Safari NOT_RUN. Owner tự `git pull && vercel --prod`.

## 13/09 — Gộp bản owner đã duyệt live: #111 + #112

#112 cấp người chơi đã merge tại147325b. Ghép #111 huy hiệu hai kiếm vào cùng cây nguồn, giữ đề xuất cấp đã chốt/implementation TKT-0118. Không quay lại trạng thái chờ chốt level. Kiểm tra bản kết hợp trước cập nhật main; Chrome390×844 BLOCKED (preview đăng nhập bị auto-review từ chối), Safari NOT_RUN. Owner tự deploy.

## 14/09 — TKT-0144: Linh Đồng crash / ảnh bust trên sân

Baseline 3accc0e. LIVE #138 `645902f`. Cache lazy/dedup 112 MiB, 2 loads; cleanup route/iframe; spriteSpecs idle toàn thân; renderer fallback; hồ sơ không ép vuông. CI 970/970. Chrome candidate BLOCKED, iPhone NOT_RUN. Owner tự `git pull && vercel --prod`. Không báo hết crash iPhone trước xác minh.

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

## 12/09/2026 tối — bàn giao hết quota

Wave J tickets 0076–0078. Agent tiếp TKT-0065. Vercel alias vẫn 282df9d tới 13/09 17:15 +07. Neon chưa gắn — nhiều người chưa bền. Prompt `docs/AGENT-PROMPT.md`.

## 12/09/2026 — TKT-0075 LIVE

Main `ce1a0e1` [#57](https://github.com/bktimmy247/luc-than/pull/57). Nan Lịch Luyện: icon = ải, khóa = overlay CSS. Điều khoản một câu. Vercel Hobby cũ hết hạn tới 13/09 17:15 +07.

## 12/09/2026 — TKT-0075 REVIEW

Nan Lịch Luyện: icon = ải, khóa = overlay CSS (biến mất khi mở). Đăng nhập: điều khoản một câu nối liền. Wave H vẫn READY. Không merge tới `live`.

## 12/09/2026 — Wave F + Wave H LIVE


Main `b4915a9`. PR #51 Hành trình/Kết quả overlay body. PR #55 stub 0065…0073. Overlay Wave H chưa điền. Việc kế: TKT-0065 trận Tháp NPC, TKT-0066 Thành Chính.

## 12/09/2026 — TKT-0074 màn đăng nhập LIVE

Owner merge [#56](https://github.com/bktimmy247/luc-than/pull/56) → `282df9d`. Mở game = login video rồi Thành Chính. Email + Du khách chạy mọi máy. Google/Facebook/Apple native cần App ID Vercel. Agent tiếp: Tháp có trận NPC, nút về Thành Chính, Wave F #51.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals REVIEW

Wrap `renderHeroDetail` sau tabs. 9 tướng × 3 ấn jpg `assets/ui/skill-seals/{id}/`. CSS `#hdBody[data-hero-id]`. Ông Phở / Lục Ảnh / Thầy Mo giữ emoji. 72 tướng vẫn wave sau. Không merge tới `live`.

## 12/09/2026 — TKT-0061…0063 ấn UI skill seals LIVE

Owner `live` [#54](https://github.com/bktimmy247/luc-than/pull/54) → `d94f8a3`. 27 medallion UI 9 tướng. Wave F #51 không trộn. 72 tướng vẫn wave sau.

## 12/09/2026 — Wave G halls + Safari pin LIVE

Owner `live` [#53](https://github.com/bktimmy247/luc-than/pull/53) → `b0d6d9d`. Cốt truyện / Trực Tuyến / Trận Hình overlay body. Pin Safari `visualViewport`. 72 tướng vẫn wave sau.

## 12/09/2026 — Safari overlay = night filter containing-block

Owner iOS: overlay WebKit co vì `body.night{filter}` + `html overflow-x:hidden`. Pin `visualViewport`, `hv-overlay-open{filter:none}`. Safari device vẫn NOT_RUN (sandbox không WebKit).

## 12/09/2026 — Wave G halls TKT-0058…0060 REVIEW

Cốt truyện / Trực Tuyến / Trận Hình overlay `#hv{Story,Net,Team}Root` body, 100vh + `filter:none`. Không merge tới `live`. 72 tướng vẫn wave sau.

## 12/09/2026 — 72 tướng full-asset = wave sau

Owner `live` Wave G coordinator: «sau này mới bổ sung 72 tướng với asset đầy đủ chứ ko phải mấy nhân vật hiện tại». Roster playable **12**. Không nới 12 → 72. Không idle/combat/portrait sheet đầy đủ cho ID live. 42 S+ lab vẫn không vào production.

## 12/09/2026 — TKT-0036 Rèn hall REVIEW

`#hvForgeRoot` body overlay + hall 3D tươi. Giữ `forgeCommand`. Không merge tới khi owner gõ `live`.

## 12/09/2026 — TKT-0035 LIVE

PR [#36](https://github.com/bktimmy247/luc-than/pull/36) squash `f52e5fc`. Vercel `dpl_7N9JqoJDRJQGEX4XNKc1NYqzyAeP`. Roster overlay body. Việc kế: Rèn hall giả 3D, giữ `forgeCommand`.

## 12/09/2026 — TKT-0035 Màn Tướng hiện lại REVIEW

Roster `#hvHeroRosterV4` gắn `document.body` như `#hvGearRoot`. overflow auto + min-height thẻ/lưới — không mount trong `.wrap > #heroesScreen` (iOS/Grok clip lưới về 0). 12 ID / `heroStats` / nan không đổi. Không merge tới khi owner nói `live`.



## 12/09/2026 — TKT-0033 + TKT-0034 LIVE

Main `b5a91f6`, PR #35 squash-merge. Owner gõ `live`. Trợ trận + Lịch Luyện icon/nền giả 3D tươi trên production. Không đổi `heroStats` / daily formulas. Ticket kế: chờ `tiếp` (Rèn hall hoặc shell Túi/Mail/Bang).

## 12/09/2026 — TKT-0034 Lịch Luyện giả 3D tươi REVIEW

Owner chốt: icon + nền **tươi, giả 3D, nhiều lớp**. Lịch Luyện 11 nan + hall đổi theo Trợ trận. Không reuse `menu-v3233`. Không overlay Thành Chính. Công thức daily đóng băng. Không merge tới khi owner nói `live`.

## 12/09/2026 — TKT-0033 Icon sơn Trợ trận REVIEW

Dock Trợ trận `#hvGearRoot`. Owner chốt: icon + nền **tươi, giả 3D, nhiều lớp** (art sẵn có), không sơn dầu tối. 11 nan `assets/ui/account-gear/spokes/{key}.jpg` từ token account/item. Hall `assist-hall-day.jpg`. WHEEL / `heroStats` không đổi. Không thêm `data-art-go`. Không merge tới khi owner nói `live`.


## 12/09/2026 — TKT-0032 Lịch Luyện LIVE + bàn giao agent sau

Main `a1f936a`, PR #33 squash-merge. Vercel production READY `dpl_G49Q6XjU29UzEYczLLRfvvq7VSpk`. Dock Lịch Luyện mở `#hvLichRoot` hall riêng 11 nan sơn; Nhiệm vụ giữ Nhật Ký Mơ. Snapshot [HANDOFF-2026-09-12.md](HANDOFF-2026-09-12.md). Ticket kế TKT-0033 (gợi ý icon sơn Trợ trận). Không đổi runtime trong commit docs bàn giao.

## 12/09/2026 — TKT-0032 Lịch Luyện REVIEW

Dock Lịch Luyện mở **màn hall riêng** `#hvLichRoot` (inset 0, z-index 80, nền `lich-hall.jpg`, nút X, chip tài nguyên) — không overlay lên Thành Chính. 11 nan mỗi ải một icon sơn `assets/daily/spokes/{key}.jpg`, không dùng icon hub. Nan sống: Qua Ải Mộng, Giáo Trường Luyện, Tháp (ch.1), Mộng Lộ (ch.2), Đấu Trường + Săn Boss (ch.3). 5 nan sắp mở. Side Nhiệm vụ giữ Nhật Ký Mơ. Domain daily không đổi công thức. Không thêm `data-art-go`. Không merge cho tới khi owner nói `live`. Trợ trận icon sơn: chưa làm (ticket khác).




## 12/09/2026 — TKT-0031 Lễ Hội LIVE

Main `3baffa8`, PR #32 squash-merge. Vercel production READY `dpl_CQjwBHTMpwKjPW7zu83pMeRovupz`. Domain festival + lacquer trên production. Inject sau hunt. Mở từ đêm đầu. Formulas frozen.

## 12/09/2026 — TKT-0031 Lễ Hội REVIEW

Domain `src/domain/festival/festival-run.mjs` owns hoa đăng / Tam Nguyện / Lễ Ấn / Bách Bảo / rương. Runtime wraps `renderFestival` / `releaseLantern` / `spinBachBaoCore` / `openBachBaoChest`, không thêm `data-art-go="festival"`. Transaction `hvRunCommittedTransaction`. Build: `scripts/festival-runtime-v1.mjs` sau hunt. Không đổi 5 đèn / 🪙100 / 20 ô / bảng rương. Không merge cho tới khi owner nói `live`.

## 12/09/2026 — TKT-0030 Săn Boss LIVE

Main `f96e53d`, PR #31 squash-merge. Vercel production READY `dpl_26SmNBM8BZarjCyP4U1ew3Cd9sDx`. Domain hunt + lacquer + painted boss art trên production. Inject sau arena. Boss 1 con to (`huntForm`) + 2 Mộng Tinh tinh thể. Mở sau 3 chương. Formulas frozen.

## 11/09/2026 — TKT-0030 Săn Boss REVIEW

Domain `src/domain/hunt/hunt-run.mjs` owns day/contract/start/settle. Runtime wraps `renderHunt` / `selectHuntContract` / `startHunt` / `huntSettle`, không thêm `data-art-go="hunt"`. Settle qua `hvRunCommittedTransaction`. Build: `scripts/hunt-runtime-v1.mjs` sau arena. Không đổi 6⚡/2 lượt/HP. Không merge cho tới khi owner nói `live`.

## 11/09/2026 — TKT-0029 Đấu Trường LIVE

Main `9bd266a`, PR #30 squash-merge. Domain arena + lacquer đã trên production. Inject sau summon.

## 11/09/2026 — TKT-0028 Gọi Mộng LIVE

Main `4deed0e`, PR #29 squash-merge. Domain summon + lacquer đã trên production.

## 11/09/2026 — TKT-0028 Gọi Mộng REVIEW

Domain `src/domain/summon/summon-pull.mjs` owns pull/pity/spark. Runtime wraps `doSummon` / `renderSummon` / `sparkSelectHero`, không thêm `data-art-go="summon"`. Pull qua `hvRunCommittedTransaction`. Build: `scripts/summon-runtime-v1.mjs` sau shop. Không đổi tỉ lệ/pity.

## 11/09/2026 — TKT-0027 Chợ Mộng LIVE

Main `febfd5ec`, PR #28 squash-merge. Domain shop + lacquer đã trên production.

## 11/09/2026 — TKT-0027 Chợ Mộng REVIEW

Domain `src/domain/shop/shop-day.mjs` owns open/buy/day. Runtime wraps `ensureShop` / `buyShop` / `renderShop`, không thêm `data-art-go="shop"`. Mua qua `hvRunCommittedTransaction`. Build: `scripts/shop-runtime-v1.mjs` sau expedition.

## 11/09/2026 — TKT-0026 Mộng Lộ LIVE

Main `571dd264`, PR #27 squash-merge. Domain expedition + lacquer đã trên production.

## 11/09/2026 — TKT-0026 Mộng Lộ REVIEW

Domain `src/domain/expedition/expedition-run.mjs` owns start/route/bless/reroll/win/lose. Runtime wraps `renderExpedition` / `startRogueBattle`, không thêm `data-art-go="expedition"`. Build: `scripts/expedition-runtime-v1.mjs` sau tower.

## 11/09/2026 — Bàn giao agent sau

Điểm vào: `docs/HANDOFF-2026-09-11.md`. Live đủ vòng chơi + Trợ trận + Tháp + Mộng Lộ + Chợ + Gọi Mộng + Đấu Trường + Săn Boss. Owner `tiếp` = Lễ Hội (TKT-0031). Không làm lại Bày trận visual 09/09, không merge S+ V2 vào roster.

## 11/09/2026 — CI/CD tự động (TKT-0025)

`.github/workflows/ci.yml`: job `ci` (build+test) trên PR/main; job `production` chỉ trên main, curl live 200. Vercel Git vẫn là CD.

## 11/09/2026 — Tối ưu deploy (TKT-0024)

`build-static` chỉ copy game (index/battle/qa/splus/assets). `sharp` là devDependency. Vercel install `--omit=dev`.

## 11/09/2026 — Tháp khóa lực chiến + bù ngày (TKT-0023)

`prepareTowerAttempt` auto-resolve theo `teamPower`. `stuckFloor`/`stuckSince` ghi lần fail đầu. Campaign không đụng. Công thức vàng/ấn/5⚡ giữ nguyên.

## 11/09/2026 — Tháp Trắng Đêm sơn mài (TKT-0022)

Domain `tower-progress` + màn leo tầng sơn mài. Hub landmark Tháp. Giữ công thức vàng/ấn/5⚡. Không đổi campaign/seed.

## 11/09/2026 — HUD trận sơn mài gọn (TKT-0011)

Trận nhúng ẩn topbar; ribbon 48px đêm/đồng; tốc độ và tua chip tròn 44px trên dock.


## 2026-10-18 — Cổ Nương source repair, PR314 draft

Continuation at 340c6eb on verified main fac1d5f. Replaced independent Cổ Nương Audio with shared prepare/play at release, speed snapshot and cancellation; separated authored action from generic projectile fallback; matches VFX to real damage recipients with screen blend/enemy mirror. Combat rules/asset bytes unchanged. Repaired existing migration test harness without weakening assertions. 20 focused tests pass, including real domain targets and actual bus with WAV bytes; late installers compose. Full build blocked by sparse source, browser/device/listening NOT_RUN. See docs/qa/co-nuong-repair-20261018/. Existing board waiver retained; no merge, production or complete VibeLab gate claim. Next: remote CI/full normal-game browser QA before owner merge review.

Delivery correction: automatic approval review rejected GitHub create_tree for insufficient explicit authorization to upload the source/docs payload. No remote commit/ref update succeeded, no CI triggered. Local patch only; ask owner for explicit push authorization to PR314, not merge permission.
Owner subsequently explicitly approved pushing the prepared patch to PR314 (2026-10-18). Merge remains out of scope; remote CI and browser validation remain separate gates.

## 2026-10-18 — Owner corrected Cổ Nương sword/smoke/Ultimate choreography

Prior patch misunderstood Basic VFX as a stationary impact. Implemented three staggered harp-origin swords with two full out/back passes each, right-facing atlas shimmer group rotated to path; no additional damage or parasite stacks. Replaced star-like parasite art with Cổ Mộ purple cloud zgm_110_hqps_b, loops while actual own parasite status exists. Ultimate scales to target body using fixed luminous source bounds. Cổ Nương renderer shares body scale with launch projection. 24 focused tests pass, including real domain stack/HP-damage/Ultimate removal. Offline motion study and provenance: docs/qa/co-nuong-choreography-20261018/. Actual instrument attachment/full-game/device validation still pending; keep PR314 draft. Owner authorized push, no merge.

- 2026-10-18 owner refinement (PR314 only): ATK 720ms, release600ms at frame16/18, impact991ms/recovery2000ms. Ultimate 2x per-frame upscale, body-height display, 3 visual/audio waves1380/2280/3180ms, one domain action, recovery4200ms. Parasite now dark falling Cổ Mộ zgm_125_hmrx_a with source-over blend. Evidence docs/qa/co-nuong-refinement-20261018 (28 focused tests + audio study). Actual hand pose/harp anchor and full-game execution remain unverified; original character archive unavailable through current retrieval. Existing owner Ticket Board waiver retained; do not merge main.

- 2026-10-18 PR314 owner regressions: register Co Nuong single-atlas run/idle/fall with result-screen motion (no generic Victory substitute); mirror Hong Thuong only during ult-finisher so rear thrust faces into victim for both teams. 31 focused tests pass, full-game visual confirmation pending. Details docs/qa/co-nuong-victory-hong-thuong-facing-20261018.md. Review only, no merge.


## 2026-10-18 — Owner ZIP refresh (review only)

Baseline main 1b271d4 (PR314 merged). Branch feat/owner-asset-refresh-20261018: Cổ Nương adds 12 shared-bus piercing cues and 300ms Ultimate echoes (one settlement, recovery4500ms); replaces Victory/Defeat title assets; full supplied Đình Đồng pack maps to canonical dinh_loi; gold Thiên Vương shield tw_70_jzz_b; Thầy Mo idle/Ultimate VFX/SFX replaced. Build adapter expands compact source into existing atlas layouts before all derivative/cache builders, preserves IDs/save/domain. New portrait and both detail idles are wired.

39 focused tests pass; 16 replacement atlases built and cells inspected; raw production-owner fragment patches parse. npm test blocked by sparse checkout missing scripts/luc-anh-idle-asset.mjs. Full normal-game browser/audio/device verification and remote CI remain separate. Existing Ticket Board unavailable waiver retained; VibeLab full evidence gate incomplete. Details, exceptions and per-screen matrix: docs/qa/owner-refresh-20261018.md. No merge or production promotion authorized for this new PR.


## Owner visual review — 18/10/2026, PR315 follow-up

Recipient-relative Đình Lôi shield; ultimate content bounded by formation row midpoints; default legacy VFX mirror with explicit facing override; separate outlined Victory/Defeat words over existing animated wings; Cổ Nương character cast 2s, existing three waves and echo300ms preserved. 46 focused tests PASS; source seam parse and 2x SVG inspection done. Full local build/browser unavailable (sparse baseline and no browser executable); physical iPhone pending. See docs/qa/owner-refresh-20261018/visual-review.md. No merge or full-game PASS claimed.

## 2026-10-22 - Hero-detail idle anchoring (PR #329, cho owner merge)

**Van de (owner report):** idle trong tran muot nhung o man chi tiet tuong bi rung/giat, khong neo co dinh.

**4 nguyen nhan do duoc tren atlas that (detail 3840x1760, 30 frame):**
1. Duong chan (alpha bottom) dao dong 13-14px voi khaos / nguyet_diep / bach_y_van_phong; bach_dien va tinh_mac chi 1px. Packager "uniform framing" canh theo mot duong chan chung, nhung source idle nhac chan giua cac frame.
2. `startAuthoredDetailIdle` chia deu `frames/durationMs` (125 hoac 83ms) trong khi `frameDurationsMs` that la 41.7-166.7ms (lech toi 67%) -> nhip khong deu, khung o diem loop.
3. CSS `#authoredDetailIdle{aspect-ratio:480/440}` cung, trong khi tinh_mac co cell 512x440 -> bop ngang 6.7%.
4. Guard chong restart idle chi ap cho 5 tuong legacy (lucAnh/linhDong/bachDien/kyVan/tieuPhong); tuong authored moi bi restart loop moi lan `renderHeroDetail`.

**Da sua (PR #329, branch feat/hero-detail-idle-anchor):**
- `scripts/hero-idle-anchor.mjs` (moi): do alpha foot line tung frame -> `footOffsets[]` ghi vao `runtime-meta.json` (ca `detail` va `clips.idle`), export `footOffsetsFor()`/`anchorHero()`.
- `scripts/import-sixstate-pack.mjs`: neo idle la buoc cua importer -> tuong import moi tu dong co offset.
- `scripts/hero-doctor.mjs`: luat moi — thieu `footOffsets`, sai do dai, hoac ap offset xong chan con nhieu > 2px -> HERO DOCTOR FAIL (da kiem am).
- `scripts/authored-hero-install.mjs`: timeline cong don `frameDurationsMs`; bu `footOffsets`; guard `__AUTHORED_DETAIL_IDLE_STATE`; ve o `devicePixelRatio` (truoc do 1x roi CSS thu 0.63); payload detail co them `pivot`/`foot`.
- `src/ui/hero-detail-tabs.css`: `aspect-ratio: var(--authored-idle-ar, 480/440)` set tu cellW/cellH tung tuong.
- QA moi: `scripts/qa-idle-motion.mjs` (do canvas that: bbox, jumps, canvas swaps), `scripts/qa-idle-frames.mjs` (dump frame -> GIF).

**Ket qua do (canvas that, 60 mau/tuong):** tinh_mac foot 2px / khaos 0px / nguyet_diep 2px; bigJumps 0; canvasSwaps 0. Truoc do 13-14px.
**Test:** npm test 2078 pass / 89 fail = baseline main; build EXIT=0; HERO DOCTOR PASS 5/5.
**Evidence:** docs/qa/idle-anchor/ (strip truoc/sau, GIF canvas that, anh man hinh).

**Blocker deploy (khong phai code):** Vercel tra `"Git author bktimmy247 must have access to the project on Vercel to create deployments"` cho ca commit PR va commit head cua `main` (bed18cde) -> preview/production dung o ban cu. Can owner merge bang tai khoan `cuonggmn`, hoac moi `bktimmy247` vao team Vercel.

**Chua lam:** do net/DPR tren iPhone that (headless dpr=1); battle renderer khong doi (van dung clip 0.5x, chan nhieu ~7px nhu cu — co y giu nguyen scope).

## Quy tắc nguồn trang bị (owner chốt, nhắc lại 2026-11-01 20:21)
- Trang bị CHỈ nhận từ **Săn Boss** hoặc **Rèn (chế đồ)**. KHÔNG từ Bách Bảo Rương / Chợ.
- Đồ **Săn Boss** có thêm **dòng hiếm/đặc biệt** (code: 3 dòng = 2 thường + 1 đặc biệt). Đồ **chế (Rèn)** KHÔNG có dòng hiếm (2 dòng thường).
- Mọi UI ghi "Cách nhận" của trang bị phải theo quy tắc này (Túi đồ, chi tiết đồ, Chợ...).
- Nguồn code: src/domain/equipment/item-affixes.mjs (AFFIX_SOURCES craft/stage/boss).
- Owner 2026-11-01 21:04: GIU nguon do roi Chinh chien (1 dong thuong), khong bo.
