# Hồn Việt v3.23.0 — Player Journey Core

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
