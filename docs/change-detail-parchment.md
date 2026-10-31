# Chi tiết tướng — bản chờ duyệt
Scope: popup mở bằng nút Chi tiết, các tab hiện hữu; nền giấy ngà, chữ nâu, khung vàng cùng bộ Kỹ năng/Thăng sao. Không đổi chỉ số, handler, art hay save.
Checkpoint: nhánh ui/hero-details-parchment-20261031 từ origin/main; working tree sạch trước sửa.
Acceptance: chỉ số thật không đổi; mobile không tràn ngang; đóng/quay lại/chuyển tab hoạt động; QA đầy đủ tài nguyên. Verified: build passed; mobile 375/430 no horizontal overflow; six live stat rows; four tabs clickable, close/next hero/back successful; stats unchanged within each test profile, no page exceptions. Full QA gold/shards 999999999 and 12 equipped slots. Locked-layout tests 2/2. Final text-shadow cleanup synchronized into built QA CSS and browser test rerun; no full-suite rerun. Evidence C:/lt/tmp/detail-parchment-evidence.json and workspace tmp/proof/detail-parchment-{375,430}.png. Chưa merge.
Rollback: revert commit UI này; không cần migration.
