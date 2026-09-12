---
id: TKT-0075
title: Nan Lịch Luyện không nướng khóa + dòng điều khoản một hàng
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-12T10:05:00.000Z
updated: 2026-09-12T10:05:00.000Z
acceptance_ids: ['L76-T1', 'L76-T2', 'L76-T3']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/login-gate-runtime.js', 'src/ui/login-gate.css', 'src/ui/daily-runtime.js', 'src/ui/daily-screen.css', 'assets/daily/spokes/hold.jpg', 'assets/daily/spokes/abyss.jpg', 'assets/daily/spokes/palace.jpg', 'assets/daily/ASSET.md', 'tests/login-gate.test.mjs', 'tests/daily-run.test.mjs']
resource_locks: ["login-gate","daily-lich"]
parallel_wave: —
depends_on: ['TKT-0074', 'TKT-0032']
conflicts_with: []
branch_hint: work/l76-lich-lock-terms-20260912
---
# TKT-0075 — Khóa nan overlay + điều khoản một dòng

Owner 12/09, ảnh thật:

1. Nan Lịch Luyện **không nướng ổ khóa vào JPG**. Sau khi mở ải, icon phải là đúng biểu tượng ải. Khóa chỉ là overlay CSS `.hv-lich-lock` khi `is-locked`.
2. Dòng đồng ý điều khoản đăng nhập là **một câu nối liền**, không bọc ngoặc kép, không xếp hai hàng «Thỏa thuận / người dùng».

## Keep

- 11 nan, `LICH_LUYEN_SPOKES`, công thức daily, `heroStats`, hall `#hvLichRoot`
- Overlay đăng nhập `#hvLoginRoot`, video, OAuth, Du khách
- Không sửa `index.html` / `battle.html`

## Non-goals

Không điền Wave H. Không 72 tướng. Không Combat V2. Không merge tới khi owner gõ `live`.

## Acceptance

- L76-T1: câu đồng ý không có `"` quanh link; `.hv-login-agree` + link `nowrap`
- L76-T2: khóa nan là overlay, không nằm trong `img`; 3 JPG hold/abyss/palace không nướng khóa
- L76-T3: không sửa `index.html` / `battle.html` / `campaign-scene.js`

## Result

Builder → REVIEW. L76-T1/T2/T3 GREEN. Chrome 390×844 PASS (`docs/qa/L76-LOCK-TERMS/`). Safari NOT_RUN. Owner `cứ làm đi` squash [#57](https://github.com/bktimmy247/luc-than/pull/57) → main `ce1a0e1`. LIVE. Vercel Hobby cũ hết hạn deploy tới 13/09 17:15 +07.

