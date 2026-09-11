# Hồn Việt v3.23.0 — Player Journey Core

## 2026-09-11 — Điểm vào hiện tại

Đọc [HANDOFF-2026-09-11.md](HANDOFF-2026-09-11.md). Live đã có vòng chơi, Trợ trận 11 nan, Tháp khóa lực. Lát L11 S+ V2 bên dưới là lịch sử lab, không phải việc production.

## 2026-09-08 — Bàn giao L11 cho Luna: REVIEW / IN_PROGRESS


Chủ dự án yêu cầu chốt tiến độ trong lúc triển khai hồ sơ V2 và 126 nút chiêu. Source đang làm được lưu ở [handoff/l11-splus-profiles-v2-20260908](https://github.com/bktimmy247/luc-than/tree/handoff/l11-splus-profiles-v2-20260908), commit [`b6a2ae2`](https://github.com/bktimmy247/luc-than/commit/b6a2ae20a9b1b3071a8f5263740312e9d1465b04). Main nhận tài liệu/evidence; combat V2 chưa phát hành production.

[Bàn giao L11 đầy đủ](LUNA-HANDOFF-SPLUS-PROFILES-2026-09-08.md) là điểm bắt đầu mới nhất. Đã nhập 42 hồ sơ/126 chiêu, tạo 6 atlas ×21 vùng nút và viết UI giới thiệu/popup/bridge; resolver mới đồng bộ một phần. **23 test mới: 17 đạt, 6 fail; bộ S+ cũ trên WIP: 117/133 đạt, 16 fail; syntax: 17/17 đạt.** `npm test` dừng ở build do checkout local thiếu part01 atlas Lục Ảnh; GitHub đã xác nhận file gốc còn đủ. Browser/device V2 chưa chạy, REFACTOR chưa xong.

Tiếp tục sáu handler Cơ Trọng, Tiêu Hồn, Trầm Châu, Tuệ Y, Khaos, Hồi Ảnh; sau đó audit đủ84 S1/Ult và các passive theo hồ sơ mới. Không hiểu 6 fail là toàn bộ việc còn thiếu. [Machine checkpoint](qa/L11-SPLUS-PROFILES/handoff-checkpoint.json) và [log test](qa/L11-SPLUS-PROFILES/handoff-targeted.tap) ghi trạng thái thực. Ticket Board/claim-lock, doctor/smoke/boot và device backend vẫn thiếu; không giả claim, PASS, DONE hoặc MERGED.

Mục tiêu hiện tại: người chơi chạm P/S1/Ult ở danh sách, giới thiệu hoặc trận S+ để xem mô tả tiếng Việt đúng cơ chế; live Nộ/cooldown theo runtime. 42 status HUD icons và126 skill buttons tách ID; giữ giá25/60, trần100. Câu thoại chỉ là text, art tướng/audio/save/reward không đổi ngoài phạm vi đã được owner chỉ định.

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

Học nhịp trình bày rõ ràng từ video tham chiếu nhưng giữ bản sắc Hồn Việt và không sao chép lớp thương mại hóa dày đặc.

Vertical slice này khóa bốn nguyên tắc: một encounter là một trận riêng, trận thường tối đa 15 hiệp, chuyển chương phải có nghi thức hình ảnh đủ mạnh, và hành trình Sảnh → Mộng Giới → Trận → Kết quả → Đi tiếp phải liền mạch.

Sảnh ưu tiên địa danh thuộc thế giới Hồn Việt thay cho danh sách nút dàn đều. Combat đưa tổng sát thương/trị liệu của cả chuỗi đòn lên sân khấu để người chơi hiểu ngay giá trị của một hành động.

## Trạng thái kỹ thuật hiện tại — 2026-09-07

Observer combat đã có evidence coverage cho từng impact và semantic case trong fixture production; parity projection vẫn giữ nguyên. Lát cắt hiện tại ở REVIEW/IN_PROGRESS cho tới khi có device QA, full local/CI harness và Ticket Board.

## 2026-09-07 — L04 lifecycle slice

Campaign scene lifetime now releases one-shot timer registrations after their
callbacks complete. This is a source-owned lifecycle fix only; player data,
combat/economy rules and visual assets are unchanged. Focused L04 verification
is `18/18 PASS`, production build is READY, and the production Chrome re-entry
smoke passed 20 rounds. The project remains `REVIEW` / `IN_PROGRESS` until
device, Ticket Board and complete local harness gates are available.

## 2026-09-07 — L04-A2 stale draft revision

The return-context build owner now carries the live player revision into
hero-detail capture and checks it before route/scroll restoration. Focused L04
verification is `19/19 PASS`; the slice remains `REVIEW` / `IN_PROGRESS` until
production smoke, device and Ticket Board gates are available.

Code commit `6e1bb9c28538ee65355f59f8bf6601b9934807d2`; Vercel deployment
`dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` is READY and the selected runtime-error
query is empty. Chrome smoke reached campaign and roster with one visible root
each and 12 cards, with zero app-origin errors; hero-card → detail was unstable
and remains an explicit blocker. Device capabilities are `[]`; keep REVIEW /
IN_PROGRESS.

## 2026-09-07 — L04-A2 hero-detail route/back surface

The state-backed hero roster now reserves the full viewport in its source-owned
CSS, so visible cards stay inside the route hit surface. Production Chrome
proves Ông Phở → hero detail → accessible back → the same 12-card roster with
the card still active. The slice is `REVIEW / IN_PROGRESS`; no player-data,
combat/economy, roster, asset or dist-only contract changed.

Code commit `935a472c111b3d4096307cc5a95c434ee7bc9b1f`; Vercel deployment
`dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is READY and runtime errors are `0`. Device
capabilities are still `[]`, so responsive/Safari/iPhone/iPad evidence remains
open.

## 2026-09-07 — L05c round-cap and full replay parity

The combat observation projection now publishes the fixture seed beside its
full-replay-rule-outcome fingerprint. RED exposed the missing seed field;
GREEN is the focused parity contract at `4/4 PASS`, and REFACTOR is the full
combat suite at `39/39 PASS` with syntax and diff checks clean. This is an
evidence-surface change only: no seed config, reward, balance, save migration,
roster, art, audio or gameplay rule changed.

Code commit `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`; Vercel deployment
`dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is READY, with a `952395`-byte embedded
battle payload and no selected runtime errors. Production Chrome at 1× and 2×
reached `HIỆP 15/15` and produced identical seed
`l05a-production-seed`, fingerprint `86267582`, `93` actions and `644`
impacts; both had no round beyond cap and empty gaps. Final 2× app-origin
errors were `0`.

The project remains `REVIEW / IN_PROGRESS`; device capabilities are still `[]`,
so responsive Chrome and Safari/iPhone/iPad evidence is open.

## 2026-09-07 — L03c save-failure fault injection

The source/build owner `scripts/qa-full-access-v1.mjs` now exposes a QA-only,
one-shot `persist()` failure after `qa=unlock-all`. It is armed by the visible
QA control or `qaPersistFail=once|1|true`; ordinary production URLs are
unchanged. The transaction contract keeps the existing `SAVE_WRITE_FAILED`
rollback path. RED was `1 failure / 1 pass`; GREEN was `9/9` focused QA and
transaction checks; syntax and diff checks are clean.

Code commit `f99165d77d88be9f31c76569e7e9b01acdc943e0`; Vercel deployment
`dpl_9vxdxR6mwe5TXfhwF13epAZ489hP` is READY with a `952395`-byte complete-source
build and zero selected runtime errors. Chrome production observed the first
quest claim fail with progress `1/1`, button `Nhận` still enabled and gems
`820`, then the retry succeed with the `HOÀN THÀNH VIỆC VẶT` ceremony, gems
`840` and disabled `✓`. Reloading the QA sandbox restored `820` and `0/1`.
Normal production had no QA controls and app-origin browser errors were `0`.

The project remains `REVIEW / IN_PROGRESS`; device capabilities are `[]`, and
Ticket Board, complete local assets, doctor/smoke, archive and `game-dev`
remain unavailable.

## 2026-09-08 — L04b campaign lifecycle diagnostics

The source-owned campaign scene now has an opt-in `?qaL04b=scene-lifetime`
diagnostic snapshot and a DOM evidence mirror. Normal production routes do not
expose the mirror. The four-commit code chain ends at `4f8511bd`; RED had two
real baseline failures, GREEN was `2/2`, and REFACTOR was `32/32` focused PASS
with syntax/diff checks clean.

Vercel `dpl_C4J7JGkqBB5PHjy4BZ6L8aZDiDXM` is READY with a `952395`-byte
embedded battle build and zero selected runtime errors. Chrome production
proved one root/one visible root, stable active resources (`pending=8`,
timer/RAF/observer `1`, image cache `5`), and a clean exit (`pending=0`,
timer/RAF/observer/image cache `0`) across 12 re-entry loops. Normal route and
all app-origin console errors are clean. Evidence is
`docs/qa/L04b/l04b-scene-lifetime-diagnostics.json`.

The project remains `REVIEW / IN_PROGRESS`; device capabilities are `[]`, and
Ticket Board/boot, archive, doctor/smoke, `agent-browser`, `game-dev` and the
complete local asset checkout remain unavailable. Full direct local tests are
`185/222` pass with 37 connector asset/dist failures.

## 2026-09-07 — L04b preparation timer scope

The source-owned campaign scene now registers the existing preparation balance
timer through the campaign activation lifetime. RED was a real `5 pass / 1
fail` focused contract; GREEN is `6/6`; REFACTOR is `11/11` focused scene and
route checks with syntax/diff clean. This preserves player data, gameplay,
economy, save, roster, art and audio behavior.

Code commit `5bea38657178c70b39ddce55f3d1866242940dbb`; Vercel deployment
`dpl_A4rM7BwWDW6xzqzM6iHyjCvuf5VB` is READY with a `952395`-byte complete-source
build and zero selected runtime errors. Chrome production verified 10 semantic
open/cancel/re-entry cycles, one campaign root, stamina `120/120` and zero
app-origin errors. Machine evidence is
`docs/qa/L04b/l04b-preparation-timer-scope.json`.

The project remains `REVIEW / IN_PROGRESS`; device capabilities are `[]`, so
responsive/Safari/iPhone/iPad, Ticket Board and complete local asset harness
gates remain open.
