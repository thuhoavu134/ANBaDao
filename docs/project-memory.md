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
