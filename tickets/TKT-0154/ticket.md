---
id: TKT-0154
title: Bạch Diện Canvas Sprite Runtime — bind pack q90-480
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-15T18:50:00.000Z
updated: 2026-09-15T18:50:00.000Z
acceptance_ids: [L154-T1, L154-T2, L154-T3, L154-T4, L154-T5, L154-T6, L154-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/assets/asset-catalog.mjs
  - src/combat-domain/bach-dien-presentation.mjs
  - src/domain/character/bach-dien.mjs
  - src/domain/hero/splus-extras.mjs
  - src/runtime/splus-battle-bridge.js
  - src/ui/campaign-scene.js
  - src/ui/audio-sfx-runtime.js
  - scripts/bach-dien-canvas-runtime-v1.mjs
  - scripts/build-static.mjs
  - assets/characters/bach-dien/
  - assets/audio/sfx/bach-dien/
  - tests/bach-dien-canvas-runtime.test.mjs
  - tests/bach-dien.test.mjs
  - tickets/TKT-0154/
resource_locks: [canvas-sprite-runtime, splus-catalog-42]
branch_hint: work/l154-bach-dien-canvas-runtime-20260915
---
# TKT-0154

Owner 15/09: đọc `docs/LINH-DONG-CANVAS-SPRITE-RUNTIME-IMPLEMENTATION.md` rồi bind pack Bạch Diện bằng Canvas Sprite Runtime dùng chung. Không Spine. Không rewrite gameplay.

Pack: `artifacts/bach-dien/bach-dien-agent-assets-q90-480.zip`. Animated WebP 94 frame @ 30fps, character 480×440, VFX 440×248. Không coi là atlas 4×2.

## Goal

Catalog + lazy loader + decoded LRU 128 MiB + metadata renderer. Extra S+ `hero_splus_bach_dien` giữ mechanics TKT-0152. Boot chỉ idle; ATK/Ult/VFX khi ra chiêu; rời trận release scope.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage / initiative / AI / turn clock. Không per-frame crop, không key đen. Không đổi footprint trận 477×440. Không Spine. Không thêm `bach_dien` vào `OFFICIAL_ROSTER_12_IDS`. Không đổi `createSplusFixture.timingScale = 0.35`.

## Acceptance

- L154-T1: catalog alias `hero_splus_bach_dien` / `bach_dien` / `bach-dien`, không Image, không Spine
- L154-T2: 94 frame, cell 480×440 / VFX 440×248, cols 8/10 không 4×2, pivot đáy giữa, decodedBytes đúng công thức, sha256 khớp file
- L154-T3: FrameClock replay; source rect từ metadata
- L154-T4: boot idle-only; ATK+VFX khi ra chiêu; cache dùng chung 128 MiB
- L154-T5: SFX wav HonVietSfx; lưới 42/7 Âm Hồn; roster 12 đóng; Chinh chiến có Idle/Run spec
- L154-T6: battle/S+ dùng renderer metadata, destination 477×440, `e.act` một lần
- L154-P1: Chrome `bachDienQa` / `qaSplus42=hero_splus_bach_dien`. Safari/iPhone NOT_RUN

## Review

Đợi `live` rồi squash-merge. Owner tự `git pull && vercel --prod`.
