# Concept B — "Bãi Săn Đêm" (night hunting ground)

Model: gpt_image (OpenAI) · quality high · 1024x1536 (2:3 dọc)
Ngày: 2026-11-08 · Màn: Săn Boss (nhánh A — Chiến đấu)

Hướng: **toàn cảnh sân chùa/cổng thành đêm**, boss khổng lồ sau cổng đá, sương + đuốc.
Ưu: không gian rộng, boss to rõ dáng, hợp không khí "đi săn"; dễ mở rộng thêm boss mới sau này.
Nhược: nhiều chi tiết nền nên chữ phải có bóng/panel; dễ chìm số liệu nếu không làm tối dải dưới.

## Prompt (dùng lại nguyên văn)

Vertical mobile game screen background, portrait 2:3, Vietnamese wuxia-xianxia art direction: deep black lacquer with gold filigree trim and monochrome ink-wash painting. Concept B — "night hunting ground": wide atmospheric view of an abandoned Vietnamese temple courtyard at night, weathered stone gate and mossy pillars half lost in blue mist, paper lanterns and iron torches casting warm amber pools of light, wet stone paving reflecting the flame. Far behind the stone gate, a colossal demon-beast boss looms as a dark silhouette with glowing amber eyes, its mass dissolving into ink-wash mountain peaks and drifting fog. Foreground left is a dark empty ledge, foreground right a low stone plinth. Layered depth with three planes: near dark foreground, mid lit courtyard, far silhouetted boss and mountains. A thin ornate gold-and-lacquer decorative border frame runs around the whole screen with corner ornaments, and a small empty gold-trimmed name plaque sits at the top centre. Reserve clean empty areas for interface: clear band across the top 12% for a title, clean low-contrast zone on the lower third, and the bottom 20% kept dark and simple for interface panels and a large button, with the lower-left corner plain for a small round back button. Highly detailed painted illustration, rich material rendering, atmospheric, cinematic, no people, absolutely no text, no letters, no numbers, no watermark, no logo, no signature, no UI buttons, no icons.

## Vùng dự kiến đặt UI (đo lại trên ảnh thật khi build)

| Vùng | Nội dung | Ghi chú |
|---|---|---|
| top 0–12% | tiêu đề "Săn Boss" + kicker "2 lượt/ngày" | dải trống, có bảng tên vàng giữa |
| giữa 25–50% | boss trong ngày (silhouette sau cổng) + tên boss | chữ đè lên sương, cần bóng |
| 50–78% | panel: Kỷ lục ST, Săn Ấn, hợp đồng | dải dưới tương phản thấp |
| 78–100% | nút Khiêu chiến lớn + back góc dưới trái | nền tối, đơn giản |

Nút/khung: lấy từ `assets/ui/kit/`. Viền vàng trong tranh cắt ra thành `kit` riêng nếu owner chốt B.
