---
id: TKT-0068
title: Ấn kỹ năng UI Ông Phở · Lục Ảnh · Thầy Mo
status: LIVE
phase: LIVE
priority: P2
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T11:40:00.000Z
acceptance_ids: ['L68-T1', 'L68-T2', 'L68-T3', 'L68-T4', 'L68-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/skill-seals-d-runtime.js', 'src/ui/skill-seals-d.css', 'scripts/skill-seals-d-v1.mjs', 'scripts/lanes/tkt-0068-skill-seals-d.mjs', 'scripts/qa-skill-seals-d.mjs', 'assets/ui/skill-seals/ong_hang_pho/basic.jpg', 'assets/ui/skill-seals/ong_hang_pho/ultimate.jpg', 'assets/ui/skill-seals/ong_hang_pho/passive.jpg', 'assets/ui/skill-seals/luc_anh/basic.jpg', 'assets/ui/skill-seals/luc_anh/ultimate.jpg', 'assets/ui/skill-seals/luc_anh/passive.jpg', 'assets/ui/skill-seals/thay_mo/basic.jpg', 'assets/ui/skill-seals/thay_mo/ultimate.jpg', 'assets/ui/skill-seals/thay_mo/passive.jpg', 'tests/skill-seals-d.test.mjs', 'docs/qa/L68-SKILL-SEALS-D/']
resource_locks: ["skill-seals-d"]
parallel_wave: H
depends_on: []
conflicts_with: []
branch_hint: work/l68-skill-seals-d-20260912
---
# TKT-0068 — Ấn kỹ năng UI Ông Phở · Lục Ảnh · Thầy Mo

Wave **H** seals. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Wave G seals A/B/C đã sơn 9 tướng. **3 ID còn emoji:** `ong_hang_pho` · `luc_anh` · `thay_mo`. Imagegen 3 ấn/tướng (basic / ultimate / passive) thư mục riêng. Inject CSS + wrap `renderHeroDetail` (gọi base rồi sơn ấn **của 3 ID này**). Điền stub `scripts/lanes/tkt-0068-skill-seals-d.mjs` — **không** thêm import mới vào `build-static.mjs`.

Đây là **UI medallion**, không phải combat atlas / `skill.json` trận.

## Keep (live)

- `hero-detail-tabs.js` / `hero-detail-tabs.css` không sửa
- Kit v2 tên Basic/Ultimate/Nội tại
- `heroStats` / `teamPower` / roster 12
- Seals A/B/C 9 tướng — **không** đè CSS `[data-hero-id]` của họ
- Owner 12/09: 72 tướng + asset đầy đủ là wave sau, ID mới — **không** phải nhân vật hiện tại. Chỉ medallion UI.

## Non-goals

`battle.html`, `src/domain/combat/**`, `assets/characters/**`, Combat V2, 72 tướng, Hermes 27, visual Bày trận, hall overlay.
Không idle/combat/portrait sheet đầy đủ. Không sửa `index.html`. Không sửa `campaign-scene.js`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Heroes (exclusive)

- `ong_hang_pho` — Ông Hàng Phở
- `luc_anh` — Lục Ảnh
- `thay_mo` — Thầy Mo

Không đụng 9 ID Wave G: `lac_yen` `cung_thu_tre` `co_dao_ganh_hoi` `phong_tu` `thuy_nuong_roi_nuoc` `hong_lien_dao_nuong` `thach_quyen` `dinh_loi` `to_diep`.

## Acceptance

- L68-T1: wrap `renderHeroDetail` gọi base; **không** sửa `hero-detail-tabs.js`
- L68-T2: 9 jpg riêng `assets/ui/skill-seals/{id}/{basic,ultimate,passive}.jpg` > 8KB mỗi file
- L68-T3: CSS inject scoped `[data-hero-id="ong_hang_pho"|luc_anh|thay_mo]` — không đè tướng khác
- L68-T4: stub lane `tkt-0068-skill-seals-d.mjs` load runtime; không `battle.html`
- L68-P1: Chrome 390×844 + 768×1024 — mở hồ sơ 1/3 ID, ấn không còn emoji ⚔★✦, 0 app error

## Affected paths (exclusive)

- `src/ui/skill-seals-d-runtime.js`
- `src/ui/skill-seals-d.css`
- `scripts/skill-seals-d-v1.mjs`
- `scripts/lanes/tkt-0068-skill-seals-d.mjs`
- `scripts/qa-skill-seals-d.mjs`
- `assets/ui/skill-seals/ong_hang_pho/`
- `assets/ui/skill-seals/luc_anh/`
- `assets/ui/skill-seals/thay_mo/`
- `tests/skill-seals-d.test.mjs`
- `docs/qa/L68-SKILL-SEALS-D/`

Shared read-only: `src/ui/hero-detail-tabs.js`, `renderHeroDetail`. Frozen: `battle.html`, `campaign-scene.js`.

## Pattern copy

`src/ui/skill-seals-a-runtime.js` + CSS A. Imagegen medallion; metadata `docs/qa/L68-SKILL-SEALS-D/`.

Builder → LIVE. Owner gõ live nốt. Squash [#61](https://github.com/bktimmy247/luc-than/pull/61) → main `fa71369`.
