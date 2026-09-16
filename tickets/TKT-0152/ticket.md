---
id: TKT-0152
title: Bạch Diện — khóa bible, mechanics extra, ảnh tham chiếu
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-15T10:00:00.000Z
updated: 2026-09-16T02:10:00.000Z
acceptance_ids: ['L152-T1', 'L152-T2', 'L152-T3', 'L152-T4', 'L152-T5', 'L152-T6', 'L152-T7', 'L152-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/domain/character/bach-dien.mjs
  - src/domain/hero/splus-extras.mjs
  - src/domain/hero/splus-catalog.mjs
  - src/domain/combat/splus-mechanics.mjs
  - src/domain/hero/splus-status.mjs
  - src/domain/hero/splus-skill-art.mjs
  - assets/characters/bach-dien/
  - tests/bach-dien.test.mjs
  - docs/HUONG-DAN-ANIMATION-VFX-SFX.md
  - tickets/TKT-0152/
resource_locks: ["splus-catalog-42", "splus-mechanics"]
branch_hint: work/l152-bach-dien-20260915
---
# TKT-0152

Owner 15/09: khóa bible **Bạch Diện Thần Quân** (`hero_splus_bach_dien`) để làm asset + game mechanics. Pack atlas gửi sau. Không mở roster 12, không giả atlas.

## Goal

Tướng extra S+ hệ Âm Hồn, **không** phải hàng 43 của lưới 42. `getSplusHero` nhận alias. Combat đọc extra. Ảnh tham chiếu (chân dung / thẻ / HUD) + 8 prompt chroma. Đợi pack rồi mới atlas / Canvas Sprite / Tướng 12.

## Review đã chốt

- 0.5 hiệp biến mất → **1 hiệp `stealth`** (lịch hiệp, không nửa lượt).
- Không có % né authored → đổi mặt nạ khi **kỹ năng / tuyệt kỹ** hoặc **bị miss**.
- Một mặt active Hỷ ↔ Nộ; Thế Thân Chi Diện **tiêu hết** mặt nạ còn lại.
- Khóa hành động + cấm hồi máu/buff → `stun` + `antiHeal` + `buffBan` 1 hiệp.
- Ult **100 Nộ** theo bible, không 60 mặc định.
- Lưới 42 / 7 Âm Hồn giữ nguyên. Không thay tướng 42.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+ còn lại, Combat V2, 72 tướng. Không đổi damage math / initiative / AI / turn clock của 42 tướng. Không per-frame crop, không key đen. Không Spine. Không thêm `bach_dien` vào `OFFICIAL_ROSTER_12_IDS` / `DATA.heroes`. Không giả idle/run/hit/fall/ATK/ULT atlas.

## Acceptance

- L152-T1: alias `hero_splus_bach_dien` / `bach_dien` / `bach-dien`; `validateSplusCatalog` vẫn 42 và 7 Âm Hồn; extra không nằm trong `SPLUS_HEROES`
- L152-T2: đổi mặt — skill đầu Mặt Hỷ +25% crit 2 hiệp; skill sau Mặt Nộ +30% crit damage + 15% hút máu; miss vào Bạch Diện cũng đổi mặt
- L152-T3: crit vào Bạch Diện khi còn mặt nạ → Thế Thân Chi Diện: 0 sát thương, stealth 1 hiệp, masks=0; crit sau đó trúng
- L152-T4: S1 Huyễn Diện Trảm nhắm máu thấp nhất, 240% phép; dưới 40% HP chắc bạo + Mê Loạn giáp phép −50% 2 hiệp; CD 2
- L152-T5: Ult Ly Hồn Đoạt Phách 100 Nộ, nhắm Công cao nhất, 420% phép, cắp 25% Công 2 hiệp, stun+antiHeal+buffBan 1 hiệp
- L152-T6: folder `assets/characters/bach-dien/` có avatar/card/hud-icon + ASSET.md + PROMPTS.md + skill.json chờ pack; **không** có atlas giả
- L152-T7: `index.html` roster 12 không chứa `bach_dien`; encyclopedia 42/126 không đổi
- L152-P1: Chrome xem chân dung tham chiếu. Safari/iPhone NOT_RUN

## Result

LIVE #150 `aedd4cb` (gộp TKT-0154). Extra `hero_splus_bach_dien` ngoài lưới 42. #148 closed. Owner tự `git pull && vercel --prod`.
