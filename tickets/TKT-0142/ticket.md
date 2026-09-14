---
id: TKT-0142
title: Gắn tỷ lệ trận + VFX/SFX Linh Đồng
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-14T06:05:00.000Z
updated: 2026-09-14T06:30:00.000Z
acceptance_ids: ['L142-T1', 'L142-T2', 'L142-T3', 'L142-T4', 'L142-T5', 'L142-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - battle.html
  - src/domain/character/linh-dong.mjs
  - src/runtime/splus-battle-bridge.js
  - src/ui/audio-sfx-runtime.js
  - scripts/runtime-mobile-render-sfx-v1.mjs
  - tests/linh-dong-battle-scale.test.mjs
  - docs/qa/L142-LINH-DONG-BATTLE/
resource_locks: ["linh-dong-battle-scale"]
branch_hint: work/l142-linh-dong-scale-20260914
---
# TKT-0142

Owner 14/09: lỗi không gắn đúng tỷ lệ hình ảnh trong trận, VFX, SFX.

## Non-goals

Không đổi BETS 2/10/50, loot, công thức combat. Không per-frame crop, không key đen. Không mở 42 S+ còn lại. Không Hồng Trầu. Không thay art tướng.

## Acceptance

- L142-T1: vẽ tướng dùng cell 328×320 × hệ số 330/240 (Lục Ảnh idle), baseline chân; không kéo 340×332
- L142-T2: VFX lấy size từ frames.json; blend source-over (RGBA authored), không screen
- L142-T3: SFX đi bus HonVietSfx, file wav iOS; không `new Audio(.ogg)`
- L142-T4: hurt/fall ms 42 khớp pack; token S+ cùng identityScale với drawUnit
- L142-T5: dist bỏ idle-bob / lean authored như Lục Ảnh
- L142-P1: Chrome 390×844 trận vẽ atlas đúng tỷ lệ, VFX source-over, SFX wav

## Result

LIVE #136 `2dba572`. Cell 328×320 × 330/240 → 451×440. VFX source-over. SFX wav HonVietSfx. Hurt/fall 42ms. S+ cùng identityScale. BETS 2/10/50 đóng. Không Hồng Trầu. Không per-frame crop.
L142-T1…T5 PASS. npm test 958. L142-P1 Chrome 390×844 PASS. Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
