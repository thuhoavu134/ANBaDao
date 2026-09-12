---
id: TKT-0062
title: Ấn kỹ năng UI Phong Tử · Thủy Nương · Hồng Liên
status: LIVE
phase: LIVE
priority: P2
created: 2026-09-12T05:00:00.000Z
updated: 2026-09-12T06:40:00.000Z
acceptance_ids: ['L52-T1', 'L52-T2', 'L52-T3', 'L52-T4', 'L52-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/skill-seals-b-runtime.js', 'src/ui/skill-seals-b.css', 'scripts/skill-seals-b-v1.mjs', 'scripts/lanes/tkt-0062-skill-seals-b.mjs', 'scripts/qa-skill-seals-b.mjs', 'assets/ui/skill-seals/phong_tu/basic.jpg', 'assets/ui/skill-seals/phong_tu/ultimate.jpg', 'assets/ui/skill-seals/phong_tu/passive.jpg', 'assets/ui/skill-seals/thuy_nuong_roi_nuoc/basic.jpg', 'assets/ui/skill-seals/thuy_nuong_roi_nuoc/ultimate.jpg', 'assets/ui/skill-seals/thuy_nuong_roi_nuoc/passive.jpg', 'assets/ui/skill-seals/hong_lien_dao_nuong/basic.jpg', 'assets/ui/skill-seals/hong_lien_dao_nuong/ultimate.jpg', 'assets/ui/skill-seals/hong_lien_dao_nuong/passive.jpg', 'tests/skill-seals-b.test.mjs', 'docs/qa/L52-SKILL-SEALS-B/']
resource_locks: ["skill-seals-b"]
parallel_wave: G
depends_on: []
conflicts_with: []
branch_hint: work/l52-skill-seals-b-20260912
---
# TKT-0062 — Ấn kỹ năng UI Phong Tử · Thủy Nương · Hồng Liên

Wave **G** seals. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Hồ sơ tướng: ấn `.hv-scene-skill-seal` + `.skillbox[data-skill-slot]:before` đang emoji ⚔★✦. **3 ID exclusive:** `phong_tu` · `thuy_nuong_roi_nuoc` · `hong_lien_dao_nuong`. Imagegen 3 ấn/tướng (basic / ultimate / passive) vào thư mục riêng. Inject CSS + wrap `renderHeroDetail` (gọi base rồi sơn ấn **của 3 ID này**). Điền stub `scripts/lanes/tkt-0062-skill-seals-b.mjs` — **không** thêm import mới vào `build-static.mjs`.

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

- `phong_tu` — Phong Tử
- `thuy_nuong_roi_nuoc` — Thủy Nương Rối Nước
- `hong_lien_dao_nuong` — Hồng Liên Đao Nương

Không đụng `lac_yen` / `cung_thu_tre` / `co_dao_ganh_hoi` / `thach_quyen` / `dinh_loi` / `to_diep` / Ông Phở / Lục Ảnh / Thầy Mo.

## Acceptance

- L52-T1: wrap `renderHeroDetail` gọi base; **không** sửa `hero-detail-tabs.js`
- L52-T2: 9 jpg riêng `assets/ui/skill-seals/{id}/{basic,ultimate,passive}.jpg` > 8KB mỗi file
- L52-T3: CSS inject scoped `[data-hero-id="phong_tu"|thuy_nuong_roi_nuoc|hong_lien_dao_nuong]` — không đè tướng khác
- L52-T4: stub lane `tkt-0062-skill-seals-b.mjs` load runtime; không `battle.html`
- L52-P1: Chrome 390×844 + 768×1024 — mở hồ sơ 1/3 ID, ấn không còn emoji ⚔★✦, 0 app error

## Affected paths (exclusive)

- `src/ui/skill-seals-b-runtime.js`
- `src/ui/skill-seals-b.css`
- `scripts/skill-seals-b-v1.mjs`
- `scripts/lanes/tkt-0062-skill-seals-b.mjs`
- `scripts/qa-skill-seals-b.mjs`
- `assets/ui/skill-seals/phong_tu/`
- `assets/ui/skill-seals/thuy_nuong_roi_nuoc/`
- `assets/ui/skill-seals/hong_lien_dao_nuong/`
- `tests/skill-seals-b.test.mjs`
- `docs/qa/L52-SKILL-SEALS-B/`

Shared read-only: `src/ui/hero-detail-tabs.js`, `renderHeroDetail`. Frozen: `battle.html`, `campaign-scene.js`.

Builder → REVIEW. Không tự MERGED/DONE.
