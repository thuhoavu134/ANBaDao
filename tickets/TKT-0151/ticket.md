---
id: TKT-0151
title: Canvas Sprite Runtime — catalog, lazy loader, decoded LRU, renderer
status: LIVE
phase: LIVE
priority: P0
acceptance_ids: [L151-T1, L151-T2, L151-T3, L151-T4, L151-T5, L151-T6, L151-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/assets/asset-catalog.mjs
  - src/assets/asset-loader.mjs
  - src/assets/decoded-atlas-cache.mjs
  - src/assets/frame-clock.mjs
  - src/render/canvas-sprite-renderer.mjs
  - assets/characters/linh-dong/runtime-meta.json
  - assets/characters/luc-anh/canvas-sprite-runtime.json
  - assets/characters/dinh-loi/canvas-sprite-runtime.json
  - scripts/linh-dong-timing-main-v1.mjs
  - tests/asset-catalog.test.mjs
  - tests/asset-loader.test.mjs
  - tests/decoded-atlas-cache.test.mjs
  - tests/canvas-sprite-renderer.test.mjs
  - tests/battle-vfx-sfx.test.mjs
  - tickets/TKT-0151/
resource_locks: [canvas-sprite-runtime]
branch_hint: work/l151-canvas-sprite-runtime-20260915
---

# TKT-0151

Owner 15/09: đọc `docs/LINH-DONG-CANVAS-SPRITE-RUNTIME-IMPLEMENTATION.md` rồi làm Canvas Sprite Runtime. Không Spine. Không rewrite gameplay. Catalog + lazy loader + decoded LRU + metadata renderer. Migrate Linh Đồng trước.

## Goal

Một lớp asset/runtime dùng chung: manifest-driven, lazy, ngân sách RAM theo RGBA decoded, renderer `drawImage` nhận cell/pivot từ catalog. Linh Đồng native 480×440 / VFX 440×248. Chân đứng ổn, không upscale cell nhỏ. Boot trận chỉ idle tướng đang hiện; ATK/Ult/VFX khi ra chiêu.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage math / initiative / AI / turn clock. Không per-frame crop, không key đen. Không đổi footprint trận 477×440. Không dùng Spine. Không đổi `createSplusFixture.timingScale = 0.35`.

## Acceptance

- L151-T1: catalog normalize alias, validate schema, resolve Linh Đồng + Lục Ảnh + Đình Lôi, không tạo `Image`
- L151-T2: decoded LRU 128 MiB, tối đa 2 loading, không evict đang tải, fail không retry mỗi frame, stale callback vô hại
- L151-T3: loader dedupe URL, không eager ATK/VFX lúc boot, ATK+VFX khi bắt đầu chiêu
- L151-T4: renderer source rect từ metadata, flip, baseline, `source-over`; không hard-code 347/320/694/640; không `naturalWidth/4`
- L151-T5: FrameClock loop/clamp/replay cùng `elapsedMs`
- L151-T6: runtime trận bỏ `forEach(linhDongImage)` TKT-0150; destination 477×440; VFX combined source-over
- L151-P1: Chrome desktop + 390×844 idle → ATK → Ultimate. Safari/iPhone NOT_RUN

## Result

LIVE #147 `e8cd581`. Catalog + lazy loader + LRU 128 MiB + renderer metadata. Linh Đồng boot idle-only; ATK/VFX khi ra chiêu. Không Spine. Không đổi BETS/loot/công thức.
RED 22 fail → GREEN 25/25 L151 + npm test 1014/1014. CI Build and test PASS. Chrome desktop + 390×844 PASS. Safari/iPhone NOT_RUN.
Owner tự `git pull && vercel --prod`.

