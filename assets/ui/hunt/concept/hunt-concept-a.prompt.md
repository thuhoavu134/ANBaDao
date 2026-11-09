# Concept A — "Sổ Săn Đêm" (night hunt ledger)

Model: gpt_image (OpenAI) · quality high · 1024x1536 (2:3 dọc)
Ngày: 2026-11-08 · Màn: Săn Boss (nhánh A — Chiến đấu)

Hướng: **cận cảnh bàn sơn mài + sổ săn mở**, boss hiện lên như mực loang phía trên trang giấy.
Ưu: tập trung vào "Sổ Săn Đêm" (đúng tên màn trong code), cảm giác ghi chép/đi săn, dễ đặt panel số liệu.
Nhược: ít không gian cho boss to, khó khoe dáng boss.

## Prompt (dùng lại nguyên văn)

Vertical mobile game screen background, portrait 2:3, Vietnamese wuxia-xianxia art direction: deep black lacquer with gold filigree trim and monochrome ink-wash painting. Concept A — "night hunt ledger": close view of a low black-lacquer desk at night, an old open hunting ledger with aged parchment pages filling the lower third, a brush, an inkstone, a red seal stamp, scattered gold-leaf flecks. Above the open book, a spectral demon-beast boss rises out of the ink and mist as a semi-transparent ink-wash apparition, glowing amber eyes, horns, fur dissolving into brush strokes, faint gold accents on its edges. Warm oil-lamp glow from the left, cold blue mist from the right, deep shadows, layered depth. A thin ornate gold-and-lacquer decorative border frame runs around the whole screen with corner ornaments, and a small empty gold-trimmed name plaque sits at the top centre. Reserve clean empty areas for interface: a clear horizontal band across the top 12% for a title, a clean empty zone on the right side of the middle third, and the bottom 22% kept dark and simple for interface panels and a large button. Highly detailed painted illustration, rich material rendering, crisp edges, no people, absolutely no text, no letters, no numbers, no watermark, no logo, no signature, no UI buttons, no icons.

## Vùng dự kiến đặt UI (đo lại trên ảnh thật khi build)

| Vùng | Nội dung | Ghi chú |
|---|---|---|
| top 0–12% | tiêu đề "Săn Boss" + kicker "2 lượt/ngày" | dải trống, có bảng tên vàng giữa |
| giữa 30–55% | chân dung boss trong ngày + tên boss | boss mờ bằng mực, chữ sẽ đè lên |
| 55–78% | panel: Kỷ lục ST, Săn Ấn, hợp đồng | khối tối bên phải |
| 78–100% | nút Khiêu chiến lớn + back góc dưới trái | nền tối, đơn giản |

Nút/khung: lấy từ `assets/ui/kit/` (không vẽ bằng CSS). Viền vàng trong tranh có thể cắt ra thành `kit` riêng nếu owner chốt A.
