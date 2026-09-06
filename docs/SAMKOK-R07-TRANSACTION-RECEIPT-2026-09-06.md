# Samkok v2 — R07 transaction receipts

Ngày: 2026-09-06  
Phạm vi: local/offline transaction contract, không đổi giá nâng tướng, reward, banner, seed hay account.

## Đã làm

- Thêm `hon-viet-transaction-contract/v1`.
- Mỗi mutation có `commandId`, `transactionId`, `status`, `source`, `reason`, `revision`, `result`.
- Retry cùng `commandId` trả lại receipt cũ và không chạy mutation lần hai.
- Kiểm tra stale revision, thiếu command ID, cost không hợp lệ và insufficient funds trước mutation.
- Mutation bị reject/throw sẽ rollback toàn bộ in-memory state.
- Ghi local ledger với `delta`, `rulesVersion`, `configVersion`; giới hạn 100 receipt và 200 ledger entry.
- Dùng settlement chung cho reward claim của quest/mail, ghi delta reward theo currency/shard.
- Tích hợp receipt commit cho nâng tướng và nhận quà thư; giữ nguyên các đường economy/banner còn lại.

## Gate đã chạy

- Success + debit/credit cùng commit.
- Duplicate command không nhân đôi mutation.
- Stale revision và thiếu tài nguyên bị chặn trước mutation.
- Reject/throw rollback.
- Reward settlement ghi delta dương.
- Static patch syntax và marker simulation trên bundle production hiện tại.
- Preview Vercel sẽ là gate build trước khi merge.

## Không thuộc R07

Các quyết định về account/seed, economy values, banner và battle settlement qua server vẫn để sau phê duyệt/phase tiếp theo.
