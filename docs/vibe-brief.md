# Hồn Việt v3.23.0 — Player Journey Core

## 2026-09-08 — L10-SPLUS42 · REVIEW / IN_PROGRESS

Chủ dự án gửi hồ sơ mới 42 S+ và 42 icon. Contract: [SPLUS42-COMBAT-CONTRACT.md](SPLUS42-COMBAT-CONTRACT.md). Source mới có catalog 6×7, 42 nội tại, 42 Skill 1, 42 Ultimate, status owner và bridge vào scheduler trận hiện có. Trang `/splus-lab.html` cho chọn đủ 42 tướng; trận thử `/battle.html?qaSplus42=<hero_id>`. Art mới chưa có; dùng thẻ số/tên tạm và manifest icon chờ asset, không thay art hoặc save roster cũ.

- Baseline main xác minh `d3ee56cd1391208ae262652b383e5b7d443308c7`; không làm lại L04b.
- RED: 9 test đầu thiếu resolver; RED mở rộng bắt miễn tử Cửu Triều, giáp Kén và splash khi kết liễu. GREEN/REFACTOR: 150/150 focused+legacy regression; source và bundle factory có parity; không thêm scheduler.
- `npm test`/`npm run build` đã chạy thật và bị chặn tại atlas part `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`. Partial compile còn gặp atlas Đinh Lôi thiếu; không gọi đó là full build PASS.
- Chrome local `127.0.0.1:4173` bị `net::ERR_BLOCKED_BY_CLIENT`. Production Chrome truy cập được; build/deployment/QA bản mới đang chờ sau code push.
- Device capabilities `[]`; Ticket Board/claim/lease/lock, doctor/smoke, agent-browser/game-dev CLI không khả dụng. Có chỉ thị chủ dự án tiếp tục source/test khi thiếu board; không giả claim.
- Các hệ số/duration thiếu trong hồ sơ được ghi ở contract là review defaults; chưa coi balance hoàn tất. Tổng ticket giữ REVIEW / IN_PROGRESS.

Bàn giao tiếp: xác minh complete-source Vercel build, production battle/HUD và cập nhật evidence; sau đó duyệt các default, nhập art mới và kiểm device/replay sâu.


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
