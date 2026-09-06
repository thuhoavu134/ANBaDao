# Samkok v2 — R08 settlement/navigation

Ngày: 2026-09-06  
Phạm vi: bridge battle hiện có, settlement một lần và navigation một chủ quản.

## Đã làm

- Gắn `hon-viet-battle/v1`, `schemaVersion: 1`, `origin` và sequence tăng dần cho message iframe → parent.
- Controller capture-phase kiểm tra source/frame/origin/schema/version/session/sequence; message stale hoặc duplicate bị chặn trước bridge cũ.
- Giữ một state machine `running → settling → settled` cho mỗi session; kết quả chỉ được settle một lần.
- Battle win dùng receipt commit chung của R07 trước khi cộng reward và chạy progress/navigation.
- Command key của battle gồm session + battle ID; reward amount vẫn lấy từ payload cũ với fallback cũ.
- Khi save commit thất bại, không phát reward và không tiếp tục progress.
- Battle iframe được patch trước bước embed lại vào index để preview/production dùng cùng payload.

## Gate đã chạy

- Static patch syntax.
- Tất cả message call-site trong battle bridge được annotate protocol.
- Battle scripts sau protocol patch parse được.
- Hook settlement không còn cộng gold trực tiếp ngoài transaction commit.
- Build order: save → transaction → settlement/navigation.

## Chưa thuộc R08

Thay luật combat, thay balance, server-side anti-cheat, banner và quyết định account/seed.
