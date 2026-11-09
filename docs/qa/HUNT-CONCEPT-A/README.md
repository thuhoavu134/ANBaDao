# Săn Boss — concept A "Sổ Săn Đêm" (QA evidence)

Ngày: 2026-11-08 · Nhánh: `feat/hunt-concept-a-20261108` · Owner chốt concept A.

## Thay đổi
- `src/ui/hunt-screen.css` — viết lại toàn bộ theo concept A (nền `assets/ui/hunt/concept/hunt-concept-a.webp`).
- `src/ui/hunt-runtime.js` — markup mới: bỏ hết emoji, icon lấy từ `menu-v3233/icons`, khế + mốc ấn đưa vào sheet `Sổ`, giữ nguyên toàn bộ hook `data-hunt-*`.
- `assets/ui/hunt/concept/` — ảnh concept A/B (png + webp) + prompt + `concept.json`.
- `scripts/hero/concept-to-webp.mjs` — helper convert png → webp (dùng `sharp`).

## Toạ độ đặt UI (đo trên chính ảnh concept, lưới 8×12 ô)
| Vùng ảnh | Dùng cho | Lý do |
|---|---|---|
| y 0–14% | bảng tên + chip vàng | tối (lum 17–43), chi tiết thấp |
| y 13–23% | tên màn + tên boss | tối, trơn |
| x 62–96%, y 24–50% | 3 ô số liệu | tối, chi tiết thấp (detail 0,3–4) |
| y 58–66% | **để trống** | sáng nhất (lum 155–190) = trang sổ có đèn |
| y 74–100% | khế + nút Vào săn + nút về | tối (lum 17–27), chi tiết 0,3–0,8 |

## Số đo thật ở 390×844 (Playwright, `tmp/hunt-qa/audit.json`)
| Phần tử | x | y | w | h |
|---|---|---|---|---|
| bảng tên đầu màn | 0 | 20 | 390 | 44 |
| tên màn + boss | 20 | 114 | 207 | 76 |
| cụm 3 ô số liệu | 257 | 211 | 117 | 197 |
| khối đáy | 0 | 716 | 390 | 128 |
| nút Vào săn | 16 | 778 | 293 | 56 |
| nút quay về | 16 | 708 | 48 | 48 |

- Cuộn: `scrollHeight 844 = clientHeight 844` → **không phải cuộn**.
- Chữ < 12px: **0**. Nút < 44px: **0**. Emoji trong màn: **0**.
- Sheet "Sổ" mở được (390×844), có 3 mốc ấn + 3 khế.
- Chọn khế → `P.hunt.contract = break_core`, nút đổi thành "Vào săn 6", chip sáng.

## Ảnh
- `hunt-a-main-390x844.png` — màn chính
- `hunt-a-sheet-390x844.png` — sheet Sổ
- `hunt-a-after-khe-390x844.png` — sau khi chọn khế

## Chưa làm
- Chưa merge, chưa đẩy lên main.
- Còn 404 phía server tĩnh (`/api/health`, `assets/characters/*/runtime-meta.json`) — có từ trước, không do màn này.
- Chưa đo trên Vercel.
