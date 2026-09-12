---
id: TKT-0063
title: Ấn kỹ năng UI Thạch Quyền · Đình Lôi · Tố Điệp
status: READY
phase: REFACTOR
priority: P2
created: 2026-09-12T05:00:00.000Z
updated: 2026-09-12T05:00:00.000Z
acceptance_ids: ['L53-T1', 'L53-T2', 'L53-T3', 'L53-T4', 'L53-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/skill-seals-c-runtime.js', 'src/ui/skill-seals-c.css', 'scripts/skill-seals-c-v1.mjs', 'scripts/lanes/tkt-0063-skill-seals-c.mjs', 'scripts/qa-skill-seals-c.mjs', 'assets/ui/skill-seals/thach_quyen/basic.jpg', 'assets/ui/skill-seals/thach_quyen/ultimate.jpg', 'assets/ui/skill-seals/thach_quyen/passive.jpg', 'assets/ui/skill-seals/dinh_loi/basic.jpg', 'assets/ui/skill-seals/dinh_loi/ultimate.jpg', 'assets/ui/skill-seals/dinh_loi/passive.jpg', 'assets/ui/skill-seals/to_diep/basic.jpg', 'assets/ui/skill-seals/to_diep/ultimate.jpg', 'assets/ui/skill-seals/to_diep/passive.jpg', 'tests/skill-seals-c.test.mjs', 'docs/qa/L53-SKILL-SEALS-C/']
resource_locks: ["skill-seals-c"]
parallel_wave: G
depends_on: []
conflicts_with: []
branch_hint: work/l53-skill-seals-c-20260912
---
# TKT-0063 — Ấn kỹ năng UI Thạch Quyền · Đình Lôi · Tố Điệp

Wave **G** seals. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Hồ sơ tướng: ấn `.hv-scene-skill-seal` + `.skillbox[data-skill-slot]:before` đang emoji ⚔★✦. **3 ID exclusive:** `thach_quyen` · `dinh_loi` · `to_diep`. Imagegen 3 ấn/tướng (basic / ultimate / passive) vào thư mục riêng. Inject CSS + wrap `renderHeroDetail` (gọi base rồi sơn ấn **của 3 ID này**). Điền stub `scripts/lanes/tkt-0063-skill-seals-c.mjs` — **không** thêm import mới vào `build-static.mjs`.

Đây là **UI medallion**, không phải combat atlas. `assets/characters/dinh-loi/**` (sheet trận) **đóng băng** — không copy, không sửa.

## Keep (live)

- `hero-detail-tabs.js` / `hero-detail-tabs.css` không sửa
- Kit v2 tên Basic/Ultimate/Nội tại
- `heroStats` / `teamPower` / roster 12
- Combat atlas Đình Lôi sẵn có

## Non-goals

`battle.html`, `src/domain/combat/**`, `assets/characters/**`, Combat V2, Hermes 27, visual Bày trận, hall overlay.
Không sửa `index.html`. Không sửa `campaign-scene.js`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Heroes (exclusive)

- `thach_quyen` — Thạch Quyền
- `dinh_loi` — Đình Lôi — Vệ Binh Trống Đồng
- `to_diep` — Tố Điệp — Mộc Bản Nương

Không đụng `lac_yen` / `cung_thu_tre` / `co_dao_ganh_hoi` / `phong_tu` / `thuy_nuong_roi_nuoc` / `hong_lien_dao_nuong` / Ông Phở / Lục Ảnh / Thầy Mo.

## Acceptance

- L53-T1: wrap `renderHeroDetail` gọi base; **không** sửa `hero-detail-tabs.js`
- L53-T2: 9 jpg riêng `assets/ui/skill-seals/{id}/{basic,ultimate,passive}.jpg` > 8KB mỗi file
- L53-T3: CSS inject scoped `[data-hero-id="thach_quyen"|dinh_loi|to_diep]` — không đè tướng khác
- L53-T4: stub lane `tkt-0063-skill-seals-c.mjs` load runtime; không `battle.html`; không đụng `assets/characters/dinh-loi/`
- L53-P1: Chrome 390×844 + 768×1024 — mở hồ sơ 1/3 ID, ấn không còn emoji ⚔★✦, 0 app error

## Affected paths (exclusive)

- `src/ui/skill-seals-c-runtime.js`
- `src/ui/skill-seals-c.css`
- `scripts/skill-seals-c-v1.mjs`
- `scripts/lanes/tkt-0063-skill-seals-c.mjs`
- `scripts/qa-skill-seals-c.mjs`
- `assets/ui/skill-seals/thach_quyen/`
- `assets/ui/skill-seals/dinh_loi/`
- `assets/ui/skill-seals/to_diep/`
- `tests/skill-seals-c.test.mjs`
- `docs/qa/L53-SKILL-SEALS-C/`

Shared read-only: `src/ui/hero-detail-tabs.js`, `renderHeroDetail`. Frozen: `battle.html`, `campaign-scene.js`, `assets/characters/dinh-loi/`.

Builder → REVIEW. Không tự MERGED/DONE.
