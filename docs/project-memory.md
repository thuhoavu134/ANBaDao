## 10/09/2026 — tiếng trận iPhone (TKT-0006c)

Full-page battle mở loa bằng early AudioContext, BGM combat và nút Bật tiếng.

## 10/09/2026 — màn tối preview iPhone (TKT-0006b)

Nested Grok iframe mở battle.html full-page; không tắt veil khi load. Chrome nested canvas PASS. Safari NOT_RUN.

## 10/09/2026 — vào trận sau Bày trận (TKT-0006)

Nhánh `work/l12-battle-enter-20260910` từ `eab9af7`. Lớp che Xuất chiến không còn copy engine; tắt khi iframe load; autostart=1. Chrome 390×844 vào trận 6v4. Safari/device NOT_RUN. Main không đổi.

## 10/09/2026 — chạm tướng trên sân để gỡ (TKT-0005)

Nhánh `work/l12-field-tap-remove-20260910` từ `0a9db3e`. Một lần chạm tướng trên sân Bày trận gỡ khỏi đội, giữ lỗ; ô trống vẫn chọn; kéo vẫn đổi chỗ. 26 focused PASS. Chrome 390×844 xác nhận gỡ Ông Phở ô 0. Visual pass `74b3976` không khôi phục. Main/production không đổi. Safari/device NOT_RUN.

## 10/09/2026 — kéo thả không nuốt lần chạm ô trống (TKT-0004)

Nhánh `work/l12-drag-tap-20260910` từ `ec5297f`. Sau kéo tướng, lần chạm đầu vào ô trống không còn bị nuốt; drop xóa ô đang chọn. 44 focused PASS; build PASS. Chrome 390×844 xác nhận kéo 5→3 rồi chạm ô trống lần đầu. Visual pass `74b3976` không khôi phục. Main/production không đổi. Safari/device NOT_RUN.

## 10/09/2026 — ô trống cố định trên Bày trận (TKT-0003)

Nhánh `work/l12-fixed-slots-20260910` từ `9a81e00`. Bảng 6 ô cố định: gỡ tướng để lỗ, kéo vào ô trống không dồn hàng, save giữ `slot` duy nhất, save cũ không slot vẫn pack theo hàng. 67 focused campaign/loadout/save/lifetime PASS; build PASS. Chrome QA sandbox xác nhận lỗ 0/3/4 và kéo 5→3. Visual pass `74b3976` không khôi phục. Main/production không đổi. Safari/device NOT_RUN.

## 10/09/2026 — sửa âm rèn trong trận (TKT-0002)

Code `235c66699a0340f36300b1d3c54d4039217ede8f`, nhánh `work/l12-pointer-lifecycle-20260909`. Tách `forge-reveal` riêng cho rèn; bỏ shared impact sound khỏi combat và chặn sự kiện rèn trong battle channel. Âm ra chiêu giữ nguyên; không thêm âm thay thế, không sửa asset/VFX/damage timing/UI/balance.

RED 0/5 → GREEN 5/5. Focused 13 PASS / 1 thiếu dist; full local 386/418 PASS, 32 lỗi thiếu assets/dist/sharp; không full-green. Preview exact SHA READY: https://luc-than-9a271tpx7-cuong-duc-ai-s-projects.vercel.app/.

Chrome QA đã rèn thành công (`forge-reveal`) → trận 6v4 (`basic`, `ultimate`) → Victory (`victory`, active0) → Xác nhận về ải1-2 (battleActive false). MVP Cô Đào 737 damage/3 kills;16 actions/2 rounds. Có quan sát VFX/số sát thương. Chưa thu/nghe audio, chưa Safari/mobile; telemetry không thay nghiệm thu âm sắc. [Evidence](qa/L12-SFX/evidence.json). Vibe gate còn OPEN vì full local verification; chưa DONE/MERGED.

Main/production không đổi. Visual pass Bày trận `74b3976` vẫn bị từ chối/revert; không khôi phục. Next: owner nghe preview xác nhận tiếng rèn đã hết; bổ sung device/full checkout verification. Không mở rộng mapping âm riêng từng tướng trong lát cắt này.

## Tiếp tục 10/09/2026 — pointer lifecycle, chờ kiểm chứng bổ sung

Code trên nhánh `work/l12-pointer-lifecycle-20260909`, commit `9518581aee5b1406bcba94616be92a7cf9aaf504`. Chỉ sửa ownership và cleanup của pointer trong `src/ui/campaign-scene.js`: bỏ qua pointer khác, giải phóng capture khi hủy/rời màn, redraw khi reduced motion. Không đổi CSS, bố cục, art hoặc combat owner. Visual pass `74b3976` vẫn bị từ chối, revert `0bac75d` vẫn là quyết định áp dụng.

- RED 0/9 PASS; GREEN 9/9; focused với scene lifetime 15/15. [Evidence và giới hạn](qa/L12-POINTER-LIFECYCLE/evidence.json).
- Preview code chính xác SHA trên: https://luc-than-6fmr7sf4u-cuong-duc-ai-s-projects.vercel.app/ — Vercel READY, build hoàn tất. Đây không phải deployment production.
- Chrome desktop 1363×936, QA sandbox: kéo đổi ô có tướng, thả ngoài, hủy/quay lại, tích xanh thêm/bỏ, đội trống bị chặn, một tướng vào trận đều đã kiểm. Đã thấy Defeat và MVP động; chưa kiểm Xác nhận sau thua/restart do phiên browser reset.
- Full local direct: 413 tests, 381 PASS / 32 FAIL vì thiếu dist/assets/sharp trong snapshot. Local build thiếu atlas metadata. Không full-green; mobile/touch/Safari và reduced-motion browser chưa chạy.
- Đã đọc vibe-builder/vibe-lab/ticket-board từ zip owner cung cấp; blocker thiếu skill ban đầu đã được giải quyết trong phiên triển khai. TKT-0001 và gate evidence-review chưa đóng. Sau reset, runner/trace trong /tmp không còn; không bịa trạng thái gate hoặc lease.
- Main được đọc lại ngày 10/09: `a6b5de61ebb4d1b136b5595766aa86b3a11fff29`. Không cập nhật main/production. Owner approval còn PENDING.

Bước tiếp: khôi phục runner từ zip, tiếp tục ticket/gate; kiểm lại đầy đủ thua → Xác nhận → Chinh chiến → trận mới trong host, rồi thiết bị mobile/Safari. Chưa mở rộng sang slot trống cố định, enemy preview, redesign hoặc balance.

## 2026-09-09 — Owner-approved promotion to main

Owner reviewed candidate `2f8049cf6a0882503e4d45ab5275f8ad48aff8ff` and explicitly requested promotion to main. This supersedes the earlier no-production instruction. PR: https://github.com/bktimmy247/luc-than/pull/17. Preview `dpl_Ewq2LZDGiBJUrR9GDY13tAsEN6pV` is READY for that exact candidate. Main auto-deploys production; deployment completion must be checked against the resulting merge SHA.

Approved scope includes hero-detail UI, campaign preparation/green-tick reserve selection/result routing, and the S+ V2 continuation. Build PASS; latest local suite: 409 tests, 407 PASS and 2 failures due to missing sharp. Earlier 411/414 counts are historical checkpoints. Mobile/Safari and full visual acceptance remain open; fractional-duration mechanics remain REVIEW and must not be rounded. Owner release approval does not close those technical review gates or mark a Ticket Board item DONE.

The promotion merge changes documentation only relative to the approved candidate; runtime/assets retain the approved blob SHAs. Earlier status and no-production statements below are historical.

## L11 latest checkpoint — 4a79095

Final source build/tests411/411; Vercel preview READY; Chrome battle15 rounds/139 actions/1649 events. Fixed browser-only pointer input bug. Crop/timing/target-picker/restart/device acceptance remains open; main unchanged. See [continuation](L11-CONTINUATION-2026-09-08.md).


## 2026-09-08 — L11 continuation · REVIEW / IN_PROGRESS

Continued from b6a2ae2 on the handoff branch; V2 handlers, live popup lifetime and source bridge corrected. Full build + 411/411 tests pass. Browser/126 crops, fractional timing and device gates remain open; no production V2 promotion. Details and actual evidence: [L11-CONTINUATION-2026-09-08.md](L11-CONTINUATION-2026-09-08.md).

# Project memory — Hồn Việt / Lục Thần

## 2026-09-08 — L10-SPLUS42 · REVIEW / IN_PROGRESS

Hồ sơ 42 tướng S+ và 42 icon của chủ dự án đã được chuyển thành catalog 6×7, 42 nội tại, 42 Kỹ năng 1, 42 Ultimate, status owner và bridge vào scheduler trận hiện có. Contract: [SPLUS42-COMBAT-CONTRACT.md](SPLUS42-COMBAT-CONTRACT.md). Trang production: [chọn 42 tướng để thử cơ chế](https://luc-than.vercel.app/splus-lab.html); mỗi tướng mở trận 6v6 thật tại `/battle.html?qaSplus42=<hero_id>`.

- Baseline upstream: `d3ee56cd1391208ae262652b383e5b7d443308c7`. Code chính: `2314c2ef522e5ad1b5a88ee7cc058a0a36b87d89`; code cuối sau browser QA: `889426acac6d3d860b3f945131969d93d8ce3107`. Đã push fast-forward lên main. Không làm lại L04b; không đổi seed/reward/save migration/roster sở hữu/art/audio cũ.
- Source/build owner: `src/domain/hero/splus-*.mjs`, `src/domain/combat/splus-mechanics.mjs`, `src/runtime/splus-battle-bridge.js`, `scripts/splus-runtime-v1.mjs`, `scripts/build-static.mjs`, `splus-lab.html`. HUD theo mục tiêu có nguồn, tên ấn, tầng, charge và thời hạn. Art mới chưa có: thẻ số/tên tạm, 42 icon manifest chưa có file ảnh; không coi art integrated.
- RED thật: 9 test đầu thiếu resolver; kit regression bắt miễn tử Cửu Triều, giáp Kén và splash khi kết liễu; browser follow-up bắt fixture chiếm chỗ tanker. GREEN cuối: **133 test S+**, combined focused+legacy **151 PASS / 0 FAIL**. 84 skill effects được kiểm bằng hành vi; source/bundle factory parity và không thêm scheduler. REFACTOR dùng chung factory, gom floater nhiều hit và ưu tiên vị trí tanker khi xếp fixture.
- `npm test` và `npm run build` local đã chạy, BLOCKED tại `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`; partial compile còn thiếu atlas Đinh Lôi. Targeted adapter compile PASS, không gọi là full build. Local Chrome `127.0.0.1:4173` bị `net::ERR_BLOCKED_BY_CLIENT`.
- Vercel full-source build **READY**, deployment `dpl_32S8AqbZtK3mtQ1nBacTKsj5Wpgz`, alias production đã gán. Embedded battle sync **1,077,714 bytes**; build hoàn tất 5 giây. Truy vấn runtime errors 1 giờ: **0**. [Machine deployment evidence](qa/L10-SPLUS42/vercel-code-deployment.json).
- Chrome production trên code cuối: **6/6 trận kết thúc, 951 hành động, 9,718 event, đủ 42 hero actor**, HP hữu hạn, slot tướng sống duy nhất, app-origin errors **0**. Mãng Xà kết thúc hiệp 13, năm trận còn lại đúng giới hạn hiệp 15. Lọc catalog đủ 7/hệ và 6 healer. Không khẳng định browser đã cast đủ 84 skill hoặc full speed/replay parity. [Machine battle evidence](qa/L10-SPLUS42/production-six-elements.json).
- Luồng thường: roster chuẩn bị 12 tướng, không có HUD S+, trận đầu thắng hiệp 2 / 16 hành động; Xác nhận xử lý kết quả và chuyển tới BOSS kế tiếp. Về Thành Chính chưa được xác minh riêng; không kết luận lỗi từ snapshot ngay sau click. [Legacy/catalog evidence](qa/L10-SPLUS42/production-legacy-and-catalog.json).
- Device capabilities `[]`; Ticket Board/claim/lease/lock, doctor/smoke, agent-browser/game-dev CLI không khả dụng. Chủ dự án đã cho phép tiếp tục source/test khi thiếu board; không giả claim. Workflow vibe-lab run `20260907-205925-epmcgpc`; trace và RED/GREEN log ở `docs/qa/L10-SPLUS42/`.
- Các hệ số/duration thiếu trong hồ sơ là **review defaults**, được liệt kê trong contract; chưa chốt balance hoặc khả năng vượt Tháp Nguyên Tố. Tổng ticket giữ **REVIEW / IN_PROGRESS**, không DONE/MERGED.

Bàn giao tiếp: review các mặc định còn thiếu, nhập atlas 42 tướng và 42 icon alpha do chủ dự án cung cấp, rồi nối chính sách mở/sở hữu tướng được duyệt. Khi backend có, chạy device + browser speed/replay matrix, kiểm riêng return navigation L04a và cập nhật Ticket Board. `tests/results/latest.md` và `docs/qa/L10-SPLUS42/evidence.json` là điểm vào evidence; phần dưới giữ lịch sử các lát cắt trước.

## Historical checkpoints

## Current goal

Implement the owner-supplied 42 S+ hero mechanics and passive HUD identities in a source-owned review route. Preserve the old roster/save/art and keep L04/L05 historical gates open.

## Active slice

- Ticket label: `L04-A2-runtime-stale-draft-revision` (Ticket Board unavailable;
  keep the state `REVIEW` / `IN_PROGRESS`).
- Contract baseline: `0299d4b5e1c3c3010392652f964321645ec820c3`.
- Previous code baseline: `e37c6df342e912a3c8ef15ac2ad5ed152547db21`.
- Current code commit: `6e1bb9c28538ee65355f59f8bf6601b9934807d2`.
- Scope: `scripts/return-context-v1.mjs` now reads the live `P.revision` when
  capturing hero-detail return context and checks the same revision before
  navigation/scroll restoration.

## Decisions and non-goals

- Main agent codes directly; `vibe-builder` owns source/build/docs and
  `vibe-lab` owns the gate/evidence handoff.
- Keep the reusable campaign DOM root separate from activation resources.
- No changes to seed, reward, balance, save migration, roster, art, audio,
  combat rule or dist-only output.

## Validation

- RED: new runtime assertion failed because the build owner had no live
  `readRevision` propagation.
- GREEN/REFACTOR: focused return-context/lifecycle/campaign suite `19/19 PASS`;
  syntax and diff checks pass.
- Production Chrome smoke on `https://luc-than.vercel.app/`: Chinh chiến root
  `count=1/visible`, then roster root `count=1/visible` with 12 cards; filtered
  app-origin errors `0`. The Ông Phở card did not produce a stable detail route
  in this run, so detail/back is not claimed PASS.

## Limitations and next action

- `TICKET_BOARD_NOT_AVAILABLE`: repository has no `scripts/ticketctl.mjs`.
- `DEVICE_BACKEND_NOT_AVAILABLE`: only Chrome CDP is exposed; no Safari,
  iPhone/iPad or responsive-device backend.
- `game-dev` CLI is not installed; do not install or change credentials.
- Local connector checkout lacks the full binary asset package, so local
  `npm run build` and the all-test command cannot be treated as full-pass;
  Vercel built the complete repository successfully.
- Vercel deployment `dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` is READY and selected
  runtime errors are `0`; browser device capabilities are `[]`.
- Next: retest hero-detail route/back, then run the device matrix and Ticket
  Board claim/lock/evidence when available. Keep the ticket at `REVIEW`;
  do not mark it `DONE` or `MERGED`.

## Latest route checkpoint — 2026-09-07

- Contract baseline: `0706198b82a69535ebcf1d503e55e2a6802913f9`.
- Current source/build commit: `935a472c111b3d4096307cc5a95c434ee7bc9b1f`.
- Source owner `scripts/hero-roster-phase-a-v4.mjs` now gives
  `#hvHeroRosterV4` explicit `100vh`/`100dvh` height. The route owns one grid
  scroll surface; no extra document-level click/pointer listener was added.
- RED: viewport-height route assertion failed on baseline. GREEN: `1/1` focused
  route test. REFACTOR: focused route/roster/return-context/roster-plan `23/23`
  pass, syntax and diff clean.
- Production `dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is READY; build embedded
  `952325` bytes and runtime errors are `0`. Chrome evidence is root `680×936`,
  grid `680×716`, 12 cards, Ông Phở detail/back with selected card retained,
  and 0 app-origin errors.
- Ticket state remains `REVIEW / IN_PROGRESS`. Device capabilities `[]`, Ticket
  Board, archive, game-dev, local binary assets and doctor/smoke remain blocked.

## Latest L05c checkpoint — 2026-09-07

- Contract baseline: `5ca7c3caee449a5705a6ffd0df9b693f5ace1cb6`.
- Current source/build commit: `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`.
- `src/domain/combat/action-observation.mjs` now exposes
  `replayParity.seed` in the `hon-viet-combat-replay-parity/v1` projection.
  This is evidence-only and preserves seed setup, reward/balance, save
  migration, roster, art, audio and gameplay rules.
- RED was the missing seed assertion. GREEN focused L05c is `4/4 PASS`;
  REFACTOR full combat is `39/39 PASS`, with syntax and diff checks clean.
- Production deployment `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is READY from the
  code SHA; embedded battle is `952395` bytes and selected runtime errors are
  `0`.
- Chrome production 1× and 2× both report seed `l05a-production-seed`,
  fingerprint `86267582`, `93` actions, `644` impacts, authored round `15`,
  `maxObservedRound=15`, `roundsBeyondCap=0`, `roundCapReached=true`, and
  `gaps=[]`. Final 2× app-origin errors are `0`; visible result is `Khải hoàn`.
- Ticket remains `REVIEW / IN_PROGRESS`. Device capabilities `[]`, Ticket
  Board, archive, game-dev, local binary assets and doctor/smoke remain blocked.
- Machine evidence: `docs/qa/L05c/l05c-round-cap-replay-parity.json`.

## Latest L04b checkpoint — preparation timer scope (2026-09-07)

- Active slice: `L04b-preparation-timer-scope`; status remains `REVIEW /
  IN_PROGRESS`.
- Baseline main: `f2ff2ef14df703a1ad6cc31bf884d95ce94764d8`; current source/test
  commit: `5bea38657178c70b39ddce55f3d1866242940dbb`.
- `src/ui/campaign-scene.js` now has one `trackSceneTimer()` owner for the
  already-existing `updateSceneNumbers` interval. It is attached to the
  campaign activation lifetime from the home, preparation and visibility
  resume paths. No player-data, gameplay, economy, save, roster, art or audio
  rule changed.
- RED: `5 pass / 1 fail` on missing timer-scope contract. GREEN: `6/6`.
  REFACTOR: focused scene/return/roster route checks `11/11`, syntax and diff
  clean.
- Vercel `dpl_A4rM7BwWDW6xzqzM6iHyjCvuf5VB` READY, source SHA matches, embedded
  battle `952395` bytes, selected runtime errors `0`; alias
  `https://luc-than.vercel.app/`.
- Chrome production `?qaL04b=preparation-timer`: 10 independent semantic
  preparation open/cancel/re-entry cycles passed; one campaign root, final
  home visible, preparation hidden, stamina `120/120`, app-origin errors 0.
- Machine evidence: `docs/qa/L04b/l04b-preparation-timer-scope.json`.
- Blockers unchanged: `TICKET_BOARD_NOT_AVAILABLE`, `SOURCE_NOT_AVAILABLE`,
  `DEVICE_BACKEND_NOT_AVAILABLE`/browser capabilities `[]`, missing game-dev,
  doctor/smoke, and incomplete local binary assets/dist. Next: device matrix
  plus Ticket Board claim/lock/evidence; keep REVIEW and never mark DONE/MERGED.

## Latest L04b checkpoint — campaign lifecycle diagnostics (2026-09-08)

- Active slice: `L04b-scene-lifetime-fault-diagnostics/v1`; status remains
  `REVIEW / IN_PROGRESS`.
- Final source/build commit: `4f8511bd52e2bd52eb79d44406b2b9153531f14c`,
  following the diagnostic contract, `window.location` flag fix, DOM evidence
  bridge and exit snapshot commits. Owners remain `src/ui/campaign-scene.js`
  and `src/ui/scene-lifetime.js`; build embeds source and does not treat `dist`
  as the source owner.
- RED had two real baseline failures; GREEN `2/2`; REFACTOR `32/32`. Full
  direct suite is `185/222` pass with 37 failures caused by missing connector
  `dist`/binary assets/fixtures; local build is blocked by missing
  `assets/characters/luc-anh/idle-rgba-v1-atlas.webp.json`.
- Vercel `dpl_C4J7JGkqBB5PHjy4BZ6L8aZDiDXM` is READY, embedded battle is
  `952395` bytes, selected runtime errors are `0`. Chrome normal route has no
  snapshot; active/exit/12-loop evidence is recorded in
  `docs/qa/L04b/l04b-scene-lifetime-diagnostics.json` with app-origin errors 0.
- Device capabilities `[]`; Ticket Board/boot, archive, doctor/smoke,
  `agent-browser`, `game-dev` and complete local assets remain blocked. Next
  handoff is device matrix and Ticket Board claim/lock/evidence; never mark
  this ticket DONE/MERGED.


## Historical main handoff additions (03d4fdf)

# Project memory — Hồn Việt / Lục Thần

## 2026-09-08 — Bàn giao L11 cho Luna: REVIEW / IN_PROGRESS

Chủ dự án yêu cầu chốt tiến độ trong lúc triển khai hồ sơ V2 và 126 nút chiêu. Source đang làm được lưu ở [handoff/l11-splus-profiles-v2-20260908](https://github.com/bktimmy247/luc-than/tree/handoff/l11-splus-profiles-v2-20260908), commit [`b6a2ae2`](https://github.com/bktimmy247/luc-than/commit/b6a2ae20a9b1b3071a8f5263740312e9d1465b04). Main nhận tài liệu/evidence; combat V2 chưa phát hành production.

[Bàn giao L11 đầy đủ](LUNA-HANDOFF-SPLUS-PROFILES-2026-09-08.md) là điểm bắt đầu mới nhất. Đã nhập 42 hồ sơ/126 chiêu, tạo 6 atlas ×21 vùng nút và viết UI giới thiệu/popup/bridge; resolver mới đồng bộ một phần. **23 test mới: 17 đạt, 6 fail; bộ S+ cũ trên WIP: 117/133 đạt, 16 fail; syntax: 17/17 đạt.** `npm test` dừng ở build do checkout local thiếu part01 atlas Lục Ảnh; GitHub đã xác nhận file gốc còn đủ. Browser/device V2 chưa chạy, REFACTOR chưa xong.

Tiếp tục sáu handler Cơ Trọng, Tiêu Hồn, Trầm Châu, Tuệ Y, Khaos, Hồi Ảnh; sau đó audit đủ84 S1/Ult và các passive theo hồ sơ mới. Không hiểu 6 fail là toàn bộ việc còn thiếu. [Machine checkpoint](qa/L11-SPLUS-PROFILES/handoff-checkpoint.json) và [log test](qa/L11-SPLUS-PROFILES/handoff-targeted.tap) ghi trạng thái thực. Ticket Board/claim-lock, doctor/smoke/boot và device backend vẫn thiếu; không giả claim, PASS, DONE hoặc MERGED.

Ưu tiên bàn giao hiện tại là L11, thay các đoạn “active slice/next L02a/L04” mang tính lịch sử bên dưới. Hồ sơ gameplay đầy đủ mới nhất quyết định số liệu; prompt icon chỉ quyết định hình nút. Main runtime vẫn L10 trong lần cập nhật docs này.

