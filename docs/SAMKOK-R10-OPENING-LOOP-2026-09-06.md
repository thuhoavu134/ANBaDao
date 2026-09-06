# Samkok v2 R10 — Opening Loop Contract

Ngày: 2026-09-06

## Phạm vi

R10 nối contract opening loop vào vòng hiện tại:

- thắng ải Chương 1, giữ auto-chain của campaign;
- lưu đội hình 6 tướng;
- nâng một tướng;
- mặc một trang bị;
- mỗi route có screen/anchor ID để Journey mở đúng màn;
- event có eventId, periodKey, sourceId và chỉ được ghi sau khi lệnh/lưu thành công.

Contract không phát hành reward amount, không đổi economy, không đổi seed tài khoản và không triển khai banner. Reward nếu cần ở QuestDefinition chỉ tham chiếu bằng rewardId.

## Quy tắc an toàn

- event trùng trả receipt dạng duplicate, không tăng tiến độ lần hai;
- giao dịch không thành công không ghi event;
- cursor chỉ nhận event của bước hiện tại;
- prerequisite phải nằm trên đường mở từ entry, next không được tạo cycle;
- state cũ không có openingLoop sẽ được khởi tạo lười khi mở Journey;
- route CTA chỉ cho phép screen đã có trong client.

## Files

- src/domain/quest/opening-loop-contract.mjs
- scripts/opening-loop-v1.mjs
- tests/opening-loop-contract.test.mjs

R09 banner/collection vẫn chờ D02; R10 không tự quyết định nội dung đó.
