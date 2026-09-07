# L02c — Contract migration reward theo receipt

Trạng thái: **PREPARED / CHƯA NỐI RUNTIME**. Đây là lát cắt chuẩn bị an toàn sau L02b; chưa áp dụng mapping đề xuất vào DATA, UI, persist hay save người chơi.

## Đã triển khai

- src/domain/save/chapter-reward-migration.mjs là module thuần, không DOM, storage, network hoặc side effect.
- previewChapterRewardMigration phân biệt chương đã có trong clearedChapters/receipt với chương chưa claim.
- backfillClaimedChapterRewardReceipts chỉ tạo receipt claimed cho chương đã clear; không cấp, thu hồi hoặc đổi vàng, ngọc, mảnh, ownership hay progress.
- commitChapterRewardClaim chỉ tạo save candidate cho một claim explicit, kiểm tra ALREADY_CLAIMED, giữ nguyên legacy data và ghi receipt có mappingVersion/commandId.
- tests/chapter-reward-migration.test.mjs kiểm tra preview, backfill, claim một lần, duplicate và cleared không receipt.

## Chính sách save đã khóa cho L02c

- Save đã clear hoặc đã có receipt claimed: giữ nguyên reward/ownership/shard; không regrant.
- Save có legacy shard/ownership: không xóa, không đổi ID, không thu hồi.
- Không có receipt nhưng đã có clearedChapters: coi là đã claim để tránh double grant; chỉ backfill receipt audit.
- Chương chưa clear: không tự cấp reward trong migration; chỉ dùng proposal khi có claim explicit sau khi mapping được duyệt.
- Candidate phải được persist bằng transaction/save owner hiện có ở bước tích hợp sau; module này chưa gọi persist.

## Giới hạn và bước tiếp

- Sáu đích trong proposal vẫn là DECISION_PENDING: co_dao_ganh_hoi, phong_tu, thuy_nuong_roi_nuoc, luc_anh, to_diep, dinh_loi.
- Chưa sửa DATA.chapters, endBattle, defaultPlayer, migrateSave hoặc build patch; vì vậy game runtime hiện vẫn giữ nguyên hành vi cũ.
- Chưa giải quyết 5 first scene thiếu và các scene unlockHero legacy.
- Test riêng L02a + L02b + L02c hiện có 10/10 pass trong workspace connector-only; full npm test, build, browser, Safari và production chưa chạy lại.
- Sau khi duyệt mapping: nối candidate vào transaction/claim owner, chạy migration fixture save đã clear/chưa clear, rồi mới cân nhắc thay reward runtime.
