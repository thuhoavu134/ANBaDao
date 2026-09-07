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

## 2026-09-07 — L04-A2 stale draft revision

The return-context build owner now carries the live player revision into
hero-detail capture and checks it before route/scroll restoration. Focused L04
verification is `19/19 PASS`; the slice remains `REVIEW` / `IN_PROGRESS` until
production smoke, device and Ticket Board gates are available.

Code commit `6e1bb9c28538ee65355f59f8bf6601b9934807d2`; Vercel deployment
`dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` is READY and the selected runtime-error
query is empty. Chrome smoke reached campaign and roster with one visible root
each and 12 cards, with zero app-origin errors; hero-card → detail was unstable
and remains an explicit blocker. Device capabilities are `[]`; keep REVIEW /
IN_PROGRESS.

## 2026-09-07 — L04-A2 hero-detail route/back surface

The state-backed hero roster now reserves the full viewport in its source-owned
CSS, so visible cards stay inside the route hit surface. Production Chrome
proves Ông Phở → hero detail → accessible back → the same 12-card roster with
the card still active. The slice is `REVIEW / IN_PROGRESS`; no player-data,
combat/economy, roster, asset or dist-only contract changed.

Code commit `935a472c111b3d4096307cc5a95c434ee7bc9b1f`; Vercel deployment
`dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is READY and runtime errors are `0`. Device
capabilities are still `[]`, so responsive/Safari/iPhone/iPad evidence remains
open.
