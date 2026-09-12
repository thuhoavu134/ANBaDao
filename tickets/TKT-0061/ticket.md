---
id: TKT-0061
title: Ấn kỹ năng UI Lạc Yên · Cung Thủ Tre · Cô Đào
status: LIVE
phase: LIVE
priority: P2
created: 2026-09-12T05:00:00.000Z
updated: 2026-09-12T06:40:00.000Z
acceptance_ids: ['L51-T1', 'L51-T2', 'L51-T3', 'L51-T4', 'L51-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/skill-seals-a-runtime.js', 'src/ui/skill-seals-a.css', 'scripts/skill-seals-a-v1.mjs', 'scripts/lanes/tkt-0061-skill-seals-a.mjs', 'scripts/qa-skill-seals-a.mjs', 'assets/ui/skill-seals/lac_yen/basic.jpg', 'assets/ui/skill-seals/lac_yen/ultimate.jpg', 'assets/ui/skill-seals/lac_yen/passive.jpg', 'assets/ui/skill-seals/cung_thu_tre/basic.jpg', 'assets/ui/skill-seals/cung_thu_tre/ultimate.jpg', 'assets/ui/skill-seals/cung_thu_tre/passive.jpg', 'assets/ui/skill-seals/co_dao_ganh_hoi/basic.jpg', 'assets/ui/skill-seals/co_dao_ganh_hoi/ultimate.jpg', 'assets/ui/skill-seals/co_dao_ganh_hoi/passive.jpg', 'tests/skill-seals-a.test.mjs', 'docs/qa/L51-SKILL-SEALS-A/']
resource_locks: ["skill-seals-a"]
parallel_wave: G
depends_on: []
conflicts_with: []
branch_hint: work/l51-skill-seals-a-20260912
---
# TKT-0061 — Ấn kỹ năng UI Lạc Yên · Cung Thủ Tre · Cô Đào

Wave **G** seals. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Hồ sơ tướng: ấn `.hv-scene-skill-seal` + `.skillbox[data-skill-slot]:before` đang emoji ⚔★✦. **3 ID exclusive:** `lac_yen` · `cung_thu_tre` · `co_dao_ganh_hoi`. Imagegen 3 ấn/tướng (basic / ultimate / passive) vào thư mục riêng. Inject CSS + wrap `renderHeroDetail` (gọi base rồi sơn ấn **của 3 ID này**). Điền stub `scripts/lanes/tkt-0061-skill-seals-a.mjs` — **không** thêm import mới vào `build-static.mjs`.

Đây là **UI medallion**, không phải combat atlas / `skill.json` trận.

## Keep (live)

- `hero-detail-tabs.js` / `hero-detail-tabs.css` không sửa
- Kit v2 tên Basic/Ultimate/Nội tại
- `heroStats` / `teamPower` / roster 12
- Owner 12/09: 72 tướng + asset đầy đủ là wave sau, ID mới — **không** phải nhân vật hiện tại. Chỉ medallion UI.

## Non-goals

`battle.html`, `src/domain/combat/**`, `assets/characters/**`, Combat V2, 72 tướng, Hermes 27, visual Bày trận, hall overlay.
Không idle/combat/portrait sheet đầy đủ. Không sửa `index.html`. Không sửa `campaign-scene.js`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Heroes (exclusive)

- `lac_yen` — Thần Nỏ Sơn Nữ — Lạc Yên
- `cung_thu_tre` — Nữ Cung Thủ Tre
- `co_dao_ganh_hoi` — Cô Đào Gánh Hội

Không đụng `phong_tu` / `thuy_nuong_roi_nuoc` / `hong_lien_dao_nuong` / `thach_quyen` / `dinh_loi` / `to_diep` / Ông Phở / Lục Ảnh / Thầy Mo.

## Acceptance

- L51-T1: wrap `renderHeroDetail` gọi base; **không** sửa `hero-detail-tabs.js`
- L51-T2: 9 jpg riêng `assets/ui/skill-seals/{id}/{basic,ultimate,passive}.jpg` > 8KB mỗi file
- L51-T3: CSS inject scoped `[data-hero-id="lac_yen"|cung_thu_tre|co_dao_ganh_hoi]` — không đè tướng khác
- L51-T4: stub lane `tkt-0061-skill-seals-a.mjs` load runtime; không `battle.html`
- L51-P1: Chrome 390×844 + 768×1024 — mở hồ sơ 1/3 ID, ấn không còn emoji ⚔★✦, 0 app error

## Affected paths (exclusive)

- `src/ui/skill-seals-a-runtime.js`
- `src/ui/skill-seals-a.css`
- `scripts/skill-seals-a-v1.mjs`
- `scripts/lanes/tkt-0061-skill-seals-a.mjs`
- `scripts/qa-skill-seals-a.mjs`
- `assets/ui/skill-seals/lac_yen/`
- `assets/ui/skill-seals/cung_thu_tre/`
- `assets/ui/skill-seals/co_dao_ganh_hoi/`
- `tests/skill-seals-a.test.mjs`
- `docs/qa/L51-SKILL-SEALS-A/`

Shared read-only: `src/ui/hero-detail-tabs.js`, `renderHeroDetail`. Frozen: `battle.html`, `campaign-scene.js`.

Builder → REVIEW. Không tự MERGED/DONE.
