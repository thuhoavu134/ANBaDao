# L03c — atomic quest claim

Trạng thái: **IN_PROGRESS** trong phạm vi source/build owner, focused test và
production build. Chưa đánh dấu DONE vì chưa có UI click smoke/browser thật.

## Phạm vi đã làm

- Sửa đúng build owner `scripts/transaction-contract-v1.mjs`; không sửa trực tiếp
  `dist/` và không sửa `index.html` nguồn.
- `claimQuest` dùng command ID ổn định theo `sourceId + daily dayIndex`:
  `quest.claim:<questId>:<dayIndex>`. Retry sau reload trong cùng ngày không tạo
  claim mới.
- Reward, trạng thái `claimed`, daily activity points và +5 XP Gia Tộc nằm trong
  cùng `hvRunCommittedTransaction` candidate. Receipt/ledger chỉ được giữ sau
  khi persist thành công.
- `hvApplyClanXp` chỉ mutate state và thu thập level-up notification; toast được
  phát qua `afterCommit` sau persist. Vì vậy lỗi ghi save không để lại XP/level
  hoặc thông báo thành công của transaction.
- Không đổi seed, reward definition, balance, save migration, asset, battle,
  audio hoặc hotfix thoát trận.

## Test chạy thật

Syntax check:

```text
node --check scripts/transaction-contract-v1.mjs
node --check tests/transaction-quest-claim-integration.test.mjs
```

Focused/combined suite:

```text
node --test tests/catalog-validator.test.mjs \
  tests/catalog-active-source.test.mjs \
  tests/catalog-reward-proposal.test.mjs \
  tests/chapter-reward-migration.test.mjs \
  tests/transaction-command-audit.test.mjs \
  tests/transaction-level-up-integration.test.mjs \
  tests/transaction-quest-claim-integration.test.mjs \
  tests/build-owner-transaction-opening-compatibility.test.mjs
```

Kết quả: **20/20 pass, 0 fail**. Ba test mới kiểm tra build-owner marker,
rollback khi persist fail, reward/quest/activity/clan XP commit một lần và retry
duplicate sau reload.

Sau khi Vercel build lộ xung đột marker cũ của opening loop, đã sửa build owner
`scripts/opening-loop-v1.mjs` để nhận atomic hero-upgrade hook, và thêm một test
tương thích build owner. Suite cập nhật: **21/21 pass, 0 fail**.

## Build và production smoke

- Commit sửa tương thích build: `8774812051e60ecca055d73e67b91c6183fb15fe`.
- Vercel deployment `dpl_5V1u4BTmZ991AseBnGhzAgj1KULv` ở `main` đạt **READY**;
  `scripts/build-static.mjs` chạy qua và embedded battle được sync.
- HTTP smoke production `https://luc-than.vercel.app/` trả **200**. HTML đã build
  có `quest.claim`, `hvApplyClanXp` và opening atomic hook; không còn post-commit
  marker `if(!tx.duplicate) questProgress('level',1);`.
- Chưa có `agent-browser` CLI trong checkout/runtime, nên chưa thực hiện click UI,
  Chrome interaction hoặc Safari thiết bị thật. HTTP/static smoke không được gọi
  là UI pass.

## Chưa chạy / bước tiếp theo

- Checkout connector hiện không có đầy đủ package để chạy local `npm test`; build
  production đã chạy thành công trên Vercel nhưng chưa có checkout `dist/` local để
  kiểm trực tiếp.
- Bước còn lại là kiểm UI: claim quest, reload, đổi
  ngày, retry sau lỗi save và thông báo lên cấp Gia Tộc. Sau đó mới mở rộng receipt
  pattern sang nhóm command sao/skill hoặc daily milestone/weekly.

Commit source: `ee9503f8e80b10e0cde57076a38cfa8f038c402d`.
Build compatibility follow-up: `8774812051e60ecca055d73e67b91c6183fb15fe`.
