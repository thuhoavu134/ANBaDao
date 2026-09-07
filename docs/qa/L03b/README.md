# L03b — atomic level-up và quest progress

Trạng thái: IN_PROGRESS — đã sửa build owner và kiểm tra focused harness; chưa
nghiệm thu full build hoặc UI runtime.

## Thay đổi đã làm

File owner là scripts/transaction-contract-v1.mjs, dùng contract có sẵn tại
src/domain/transaction/receipt-contract.mjs:

- levelUpHero đưa questProgress('level',1,false) vào mutate callback của cùng
  executeLocalTransaction;
- questProgress và weeklyProgress nhận cờ save, mặc định true để giữ hành vi
  các caller cũ, còn lát cắt transaction truyền false;
- helper vẫn chỉ gọi persist() sau khi transaction đã tạo receipt; persist
  thất bại khôi phục snapshot trước transaction;
- command ID mặc định của level-up dựa trên hero ID + level trước khi nâng,
  UI truyền cùng ID và khóa nút trong lần click hiện tại; batch level-up cũng
  truyền ID ổn định cho từng level.

Vì vậy cost vàng, level tướng, daily progress, weekly progress, receipt và
ledger nằm trong một state candidate. Không có event listener thứ hai được
thêm vào và không thay đổi rule/balance.

## Bằng chứng

tests/transaction-level-up-integration.test.mjs có 3 test:

1. build patch đặt quest progress bên trong mutation và marker UI tồn tại trên
   index.html active;
2. persist failure khôi phục vàng, hero, daily/weekly progress và history;
3. success ghi đúng một debit/progress/receipt; retry sau JSON reload trả
   duplicate receipt và không mutate lần hai.

Đã chạy:

~~~text
node --check src/domain/transaction/receipt-contract.mjs
node --check scripts/transaction-contract-v1.mjs
node --check tests/transaction-level-up-integration.test.mjs
node --test tests/catalog-validator.test.mjs tests/catalog-active-source.test.mjs tests/catalog-reward-proposal.test.mjs tests/chapter-reward-migration.test.mjs tests/transaction-command-audit.test.mjs tests/transaction-level-up-integration.test.mjs

17 passed, 0 failed
~~~

## Giới hạn chưa nghiệm thu

- Chưa chạy scripts/build-static.mjs trên checkout đầy đủ, nên chưa tuyên bố
  dist output đã được tạo và chạy đúng.
- Chưa bấm level-up thật trong Chrome, responsive, Safari thiết bị thật hoặc
  production; chưa kiểm tra audio/UI sau patch.
- Failure test hiện là contract harness + source/build marker, chưa phải lỗi
  persist được tiêm trong browser runtime.
- Chỉ migrate một command level-up. Quest claim, mail, forge, campaign và các
  mutation candidate khác vẫn nằm trong inventory chưa migrate của L03a.

L03b không đổi seed, reward, balance, save migration, asset, battle, audio
hoặc hotfix thoát trận. L02c vẫn PREPARED và không được gọi từ patch này.

## Bước tiếp theo

Chạy full build và UI smoke trên checkout đầy đủ; sau đó mở rộng cùng pattern
cho một command tiếp theo, ưu tiên claim/reward có sourceId + periodKey rõ.
