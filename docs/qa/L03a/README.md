# L03a — kiểm kê command transaction

Trạng thái: DONE trong phạm vi audit source và report; L03 tổng thể chưa DONE.

## Phạm vi

L03a lập inventory cho các boundary command hiện hành có liên quan trực tiếp tới
tiền, vật phẩm, phần thưởng hoặc tiến trình:

- hero: level-up, star-up, unlock;
- reward: apply reward, redeem code;
- campaign: start chapter, clear chapter;
- daily/weekly/idle: sign-in, idle claim, quest progress/claim, weekly progress/claim/milestone và activity milestone;
- forge: mold, dual forge start/choose, craft, enhance và salvage;
- mail: claim một thư và claim toàn bộ thư.

Inventory có 23 row ở
src/domain/transaction/command-audit.mjs. Mỗi row ghi entrypoint, cost,
credit, persist, event, receipt, transaction, atomicity, finding và marker đã
đối chiếu trong source. Report máy sinh nằm tại
docs/qa/L03a/transaction-command-inventory.json.

Static scan cũng ghi nhận 509 function declaration và 163 mutation/persist
candidate. Candidate scan bao gồm helper, reset, render và các hệ phụ; chúng
được liệt kê để mở rộng inventory ở lát cắt kế tiếp, không bị đánh tráo thành
23 command đã được migrate transaction.

## Kết quả lát cắt sâu

Source hash của runtime được audit:

~~~text
index.html
sha256: e4f79d41e3bf7bb225ff878729d71e72be9ad94bac962f5e41cffc98148680b9
chars: 1890471
~~~

Trình tự hiện hành:

~~~text
levelUpHero
  ├─ trừ P.gold theo levelCost(id)
  ├─ tăng P.heroes[id].level
  ├─ questProgress('level', 1)
  │   └─ weeklyProgress('level', 1)
  │       └─ có thể persist() riêng
  └─ persist()
~~~

Audit xác nhận:

- 23/23 row có entrypoint và source marker;
- questProgress có thể ghi save trước lần persist() ngoài của levelUpHero;
- weeklyProgress cũng có persist() nội bộ;
- active runtime không gọi HonVietTransaction,
  executeLocalTransaction hoặc settleRewardTransaction;
- vì vậy opening slice được đánh dấu not-atomic, receipt là none, không
  được coi persist() trực tiếp là transaction.

## Kiểm thử đã chạy

~~~text
node --test \
  tests/catalog-validator.test.mjs \
  tests/catalog-active-source.test.mjs \
  tests/catalog-reward-proposal.test.mjs \
  tests/chapter-reward-migration.test.mjs \
  tests/transaction-command-audit.test.mjs

14 passed, 0 failed
~~~

Report có thể tái tạo bằng:

~~~text
node scripts/audit-transaction-commands-v1.mjs \
  --write docs/qa/L03a/transaction-command-inventory.json
~~~

Test hiện kiểm tra thứ tự và sự tồn tại của các boundary. Bài failure harness
được ghi trong report nhưng chưa được tiêm vào runtime thật, nên chưa tuyên bố
đã chứng minh rollback/atomicity.

## Không thay đổi

L03a không import module transaction vào index.html, không đổi seed, reward,
balance, catalog, save migration, asset, battle, audio hoặc hotfix thoát trận.
Không sửa dist/; source of truth vẫn là index.html và các module/script
được audit.

Hermes archive vẫn SOURCE_NOT_AVAILABLE; ticket này chỉ audit owner Lục Thần,
không port thân code mẫu.

## Bước tiếp theo

L03b chọn một command hẹp, ưu tiên levelUpHero → questProgress, tạo state
candidate và một lần persist qua transaction owner hiện có. Sau đó phải có
failure sau quest progress, double-click/retry cùng command ID, reload giữa
commit và render, cùng expected state/quest/receipt đều cũ hoặc đều mới.

L02c vẫn ở trạng thái PREPARED và chờ duyệt sáu reward mapping; L03a không tự
áp dụng migration hay regrant phần thưởng chương.
