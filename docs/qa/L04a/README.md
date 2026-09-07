# L04a — return context cho hồ sơ và route

Trạng thái: **IN_PROGRESS** trong phạm vi contract thuần, build owner và Chrome
production smoke. Chưa đánh dấu DONE vì chưa chạy stress mở/đóng 20 lần,
fault/lifecycle harness đầy đủ và Safari thiết bị thật.

## Phạm vi đã làm

- Thêm contract thuần `src/domain/navigation/return-context.mjs` với schema
  `hon-viet-return-context/v1`.
- Context giữ `sourceRoute`, params, mode, encounter ID, hero ID, tab, filter,
  scroll position và draft revision; input được clone, không mutate save.
- Thêm `scripts/return-context-v1.mjs` vào đúng build owner sau settlement và
  trước opening-loop. Patch hook `navTo`, `showScreen` và `renderHeroDetail`
  trong `dist/`, không sửa trực tiếp `index.html` nguồn.
- Context chỉ nằm trong `sessionStorage`, không đưa route tạm vào player save.
  Khi source route không còn hợp lệ hoặc revision mới hơn save hiện tại, resolver
  trả fallback an toàn.
- Back từ hồ sơ tướng dùng source route đã capture và restore scroll sau khi
  render; context được clear sau lần resume để không redirect lần hai.

## Bảng route/owner L04a

| Boundary | Owner | Enter | Leave / callback |
|---|---|---|---|
| Route màn | `navTo` + `showScreen` trong shell | kiểm source route và screen hiện tại | return hook có thể redirect fallback; callback sau render |
| Hồ sơ tướng | `renderHeroDetail` | capture source screen, hero, mode/encounter, filter | header back `navTo('heroes')` được resolve về source |
| Scroll | return-context runtime | đọc scroll owner trước khi rời source | restore bằng `requestAnimationFrame`, rồi clear context |
| Save/player data | save owner hiện có | không ghi context vào `P` | sessionStorage tách khỏi receipt/save transaction |

## Test chạy thật

```text
node --check src/domain/navigation/return-context.mjs
node --check scripts/return-context-v1.mjs
node --check scripts/build-static.mjs
node --test tests/return-context.test.mjs \
  tests/catalog-validator.test.mjs \
  tests/catalog-active-source.test.mjs \
  tests/catalog-reward-proposal.test.mjs \
  tests/chapter-reward-migration.test.mjs \
  tests/transaction-command-audit.test.mjs \
  tests/transaction-level-up-integration.test.mjs \
  tests/transaction-quest-claim-integration.test.mjs \
  tests/build-owner-transaction-opening-compatibility.test.mjs
```

Kết quả: **24/24 pass, 0 fail**.

## Build và UI production

- Hai build đầu đã fail đúng tại build owner và được sửa:
  `dpl_GjqiozSZZAHzqFPGewGzPyNGa1Yy` bắt marker `navTo` sai cách; sau đó
  `dpl_H47gD5fc6M5b8tfti8f7dFGmmvk7` bắt đuôi `showScreen` chưa tương thích
  callback AFK hiện có.
- Fix tương ứng nằm ở `ee756bd7f6ad9bffa4e3069b11238dcb757e741d` và
  `67bcc39e936025f895ebea8551946de47c51412d`.
- Deployment `dpl_RSZG5giySADfczg5VL7m4wafo9Ct` từ commit `67bcc39` đạt
  **READY**; log xác nhận `R04 return context installed`, embedded battle
  `907780 bytes` và deployment hoàn tất.
- Chrome control-browser cô lập trên `https://luc-than.vercel.app/`: mở `Tướng`,
  chọn thẻ `Ông Phở`, vào hồ sơ, bấm `Quay lại danh sách tướng`; roster hiện lại
  đúng với `Sở hữu 12/12 tướng`, vàng/ngọc giữ nguyên. Đây là UI route/back smoke,
  chưa phải stress/lifecycle/device acceptance.

## Chưa chạy / bước tiếp theo

- Checkout connector chưa có đủ package để chạy `npm test` hoặc full build local;
  build production đã chạy trên Vercel.
- Chưa chạy mở/đóng hồ sơ 20 lần với đo renderer/listener, source route bị mất
  trong runtime, đổi draft revision, hay Safari iPhone/iPad thật.
- Bước kế tiếp là thêm lifecycle/return cases cần thiết rồi chuyển sang L04b
  (dispose scope nhỏ) hoặc L05a fixture combat; không trộn migration save hay
  balance vào L04a.

Commit code: `70790e0fb64833e2d1923d99a7d413c2916d491c`.
Build marker fix: `ee756bd7f6ad9bffa4e3069b11238dcb757e741d`.
Build callback compatibility: `67bcc39e936025f895ebea8551946de47c51412d`.

## L04-A2 — stale draft revision runtime propagation (2026-09-07)

Trạng thái: **REVIEW / IN_PROGRESS**. Lát cắt này nối acceptance stale draft
revision vào build owner; chưa đóng các gate device, modal/deep-link và Ticket
Board của L04a.

- `scripts/return-context-v1.mjs` đọc `P.revision` qua `readRevision()`, ghi
  revision hiện tại khi rời màn nguồn vào hồ sơ tướng, rồi truyền revision đó
  vào cả `beforeNavigate` và `afterScreenChange` trước khi restore scroll.
- Revision âm/không hợp lệ được quy về `0`, giữ cùng semantics với pure
  `src/domain/navigation/return-context.mjs`; không ghi context vào save và
  không đổi transaction/gameplay.
- RED: build-owner assertion mới fail thật vì runtime chưa có `readRevision`.
- GREEN/REFACTOR: return-context + scene-lifetime + campaign suite đạt
  `19/19 PASS`; syntax checks và `git diff --check` pass.

Machine evidence: `docs/qa/L04a/l04a-stale-draft-revision.json`.

Production follow-up:

- Code commit `6e1bb9c28538ee65355f59f8bf6601b9934807d2`; Vercel deployment
  `dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` is **READY**, build source is the same
  commit, embedded battle payload is `952325` bytes, and the selected 1-hour
  runtime-error query is empty.
- Chrome alias smoke reached Chinh chiến and Tướng through visible UI:
  `#hvCampaignScene` count/visible `1/true`, then `#hvHeroRosterV4`
  count/visible `1/true` with `12` cards; app-origin console errors `0`.
- A visible Ông Phở card click did not produce a stable hero-detail screen in
  this run; it returned to the hub with no app console error. This remains a
  browser-route blocker, not a PASS claim for detail/back restoration.
- Device capabilities returned `[]`; responsive Chrome and Safari/iPhone/iPad
  are **not tested**. Status remains **REVIEW / IN_PROGRESS**.

## L04-A2 — hero detail route/back viewport surface (2026-09-07)

Trạng thái: **REVIEW / IN_PROGRESS**. Lát cắt này xử lý đúng blocker route
production còn mở; không đóng toàn bộ L04a và không đánh dấu DONE/MERGED.

- Baseline contract: `0706198b82a69535ebcf1d503e55e2a6802913f9`.
- Source/build owner: `scripts/hero-roster-phase-a-v4.mjs`; test owner:
  `tests/hero-roster-route.test.mjs`.
- Fix: portal `#hvHeroRosterV4` khai báo explicit `100vh`/`100dvh`, giữ lưới
  là scroll owner duy nhất và không thêm document-level click/pointer owner.
  Không đổi seed, reward, balance, save migration, roster, art, audio hay
  gameplay rule.
- RED: route contract fail thật vì source chưa reserve viewport height.
- GREEN: focused route contract `1/1 PASS`.
- REFACTOR: focused route/roster/return-context/roster-plan suite `23/23 PASS`;
  changed scripts `node --check` pass; `git diff --check` pass.

Machine evidence: `docs/qa/L04a/l04a-hero-detail-route-back.json`.

Production follow-up:

- Code commit `935a472c111b3d4096307cc5a95c434ee7bc9b1f`; Vercel deployment
  `dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is **READY**, source SHA matches, build
  ran `npm run build` → `node scripts/build-static.mjs`, embedded battle is
  `952325` bytes, and the selected 1-hour runtime-error query is empty.
- Chrome alias `https://luc-than.vercel.app/`: viewport `1363×936`, roster root
  `680×936`, grid `680×716`, 12 visible cards. Clicking visible Ông Phở opens
  `heroDetail` with `#hdName=Ông Phở`; the accessible back button returns to one
  visible roster root, retains 12 cards and keeps Ông Phở active.
- App-origin browser console errors: `0`; extension diagnostics are excluded.

Remaining blockers: `DEVICE_BACKEND_NOT_AVAILABLE` (capabilities `[]`, so no
responsive Chrome or Safari/iPhone/iPad), `TICKET_BOARD_NOT_AVAILABLE`,
`SOURCE_NOT_AVAILABLE` archive, missing `game-dev` CLI, missing local binary
asset checkout, and absent `doctor`/`smoke` scripts. Keep **REVIEW / IN_PROGRESS**.
