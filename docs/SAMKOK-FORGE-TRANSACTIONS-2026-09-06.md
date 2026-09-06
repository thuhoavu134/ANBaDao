# Samkok v2 — Rèn Mộng và bảo vệ trang bị

Baseline: `c8da1f724d820502728ee407a41213a961a47a64` (PR #11).
Phạm vi: E11-04/05, phần lock của E11-01 và E03/E04; giữ owner giao dịch R07.
Đối chiếu đủ 923 dòng master plan cập nhật 06/09/2026 lúc 09:26 UTC. Định hướng hai đòn/nội tại, VFX dễ sản xuất và roster 72 được ghi ở đầu `AI-HANDOFF.md`; ticket này không chuyển kit combat.

## Vấn đề và thay đổi

Rèn, Song Rèn, chọn phôi, cường hóa và phân giải từng sửa player rồi bỏ qua kết quả persist. Tiến độ craft gọi questProgress/weeklyProgress có thể ghi xen giữa giao dịch. Phân giải chưa có xác nhận hoặc bảo vệ đồ khóa.

- `src/domain/equipment/forge-commands.mjs`: validate loại/món/phôi, UID không trùng, cap +15, trạng thái khóa/đang mặc và quote phân giải. Chuẩn bị command không sửa state.
- `src/ui/forge-command-runtime.js`: mọi thay đổi của Rèn Mộng dùng cùng commit R07; cost, itemSeq, item, pity, phôi chờ, tiến độ nhiệm vụ và receipt cùng được lưu. Lỗi ghi phục hồi state, giữ UI để thử lại; retry cùng command trả receipt cũ.
- Song Rèn lưu hai kết quả trước khi hiển thị, có pending ID; chọn một món tiêu thụ pending một lần. Save cũ thiếu pending ID vẫn chọn được, không roll hoặc trả phí lại.
- Khóa/Mở khóa lưu trên instance, tương thích cờ legacy `lock`; đồ đang mặc hoặc khóa không phân giải được. Khóa không chặn cường hóa.
- Hộp xác nhận native dialog ghi tên, rarity, cấp và Tinh Lực sẽ nhận. Giữ lại/Escape không sửa player. Xác nhận kiểm lại quote và trạng thái món; lỗi lưu giữ dialog mở với thông báo, không tiêu hủy đồ.
- `scripts/transaction-contract-v1.mjs` thay đúng các hàm và một bộ handler Rèn. questProgress/weeklyProgress thêm tham số cho phép tham gia giao dịch bên ngoài; caller cũ giữ mặc định tự lưu. Không thêm router/combat/audio owner.

Giữ nguyên chi phí thường 20 Tinh Lực + 200 vàng, Song Rèn 42 + 420; hệ số nâng, trần +15, tỷ lệ/phẩm chất trang bị, bảo hiểm và vật liệu phân giải hiện hữu. Không thêm batch/ghép/reroll hoặc công bố toàn E11 đã xong. Không đổi asset, hero rarity, seed/banner hay luật combat.

## Kiểm chứng

`npm test`: **136/136 đạt**, gồm build, kiểm script/embedded battle, asset hiện hữu và 13 test forge mới.

Test forge dùng command, questProgress, persist và transaction helper của build; lỗi QUOTA được gây tại storage. Các ca gồm insufficient/invalid/locked/cap trước RNG, rollback mọi command, UID cũ bị lệch, pity 10/30, dual reload/chọn trùng/chọn stale/save legacy, stat món đang mặc, lock, quote stale, cancel, lỗi dialog/retry và handler click trùng.

Browser production và mốc deploy được bổ sung trong PR sau khi phát hành. Chrome responsive là bằng chứng bố cục/tương tác, không thay iPhone Safari, loa hoặc thiết bị Android thật. Lưu QA riêng do agent tạo, không thay save của anh. Receipt/ledger local không phải server authority hoặc giải pháp xung đột nhiều thiết bị.

## Luồng thử UI

1. Mở Rèn sau Chương 1; rèn một món, cường hóa rồi reload: số dư/cấp/chỉ số giữ đúng.
2. Khóa đồ → Phân giải bị vô hiệu; reload → Mở khóa.
3. Phân giải → kiểm tên/cấp/vật liệu → Giữ lại: món vẫn còn. Mở lại → Xác nhận: trừ đúng một món, cộng đúng vật liệu; reload không nhận lần nữa.
4. Song Rèn → reload khi hai phôi chờ → chọn một: chỉ một UID mới và không trừ thêm nguyên liệu.
5. Mặc → nâng → chuyển → tháo: UID không đổi, stat theo cấp mới, inventory không tăng bản sao.

Rollback: revert toàn bộ slice source/patch này; giữ nguyên save và schema. Trường locked/pending.id mới là dữ liệu cộng thêm, không xóa tài sản hay viết lại source asset khi rollback.
