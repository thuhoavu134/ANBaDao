---
id: TKT-0143
title: Thay pack Linh Đồng Blender rekey
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-14T06:40:00.000Z
updated: 2026-09-14T06:55:00.000Z
acceptance_ids: ['L143-T1', 'L143-T2', 'L143-T3', 'L143-T4', 'L143-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - assets/characters/linh-dong/
  - assets/audio/sfx/linh-dong/
  - src/domain/character/linh-dong.mjs
  - scripts/pack-linh-dong-rgba.mjs
  - battle.html
  - index.html
  - tests/linh-dong-rekey.test.mjs
  - docs/qa/L143-LINH-DONG-REKEY/
resource_locks: ["linh-dong-atlas"]
branch_hint: work/l143-linh-dong-rekey-20260914
---
# TKT-0143

Owner 14/09: dùng pack Drive mới thay asset Linh Đồng.

Pack Blender Compositor Keying (hết viền xanh ffmpeg colorkey). Cùng số frame, clip rộng hơn. Cell 347×320 (max 694×640 × 0.5). Vẽ trận 477×440. Không crop từng frame, không key đen.

## Non-goals

Không đổi BETS 2/10/50, loot, công thức combat. Không mở 42 S+ còn lại. Không Hồng Trầu. Không thay art tướng bằng hình sinh mới. Không per-frame crop.

## Acceptance

- L143-T1: clip source khớp webp rekey (idle 406×480, atk 646×640, ult 694×640, vfx 854×480); cell 347×320 scale 0.5
- L143-T2: atlas + portrait + SFX wav pack lại; runtime-meta blender keying; idle sha khác pack ffmpeg cũ
- L143-T3: trận vẽ 477×440; VFX source-over; SFX wav HonVietSfx; identityScale giữ
- L143-T4: hồ sơ idle `LINH_DONG_ANIMS` cell 347×320
- L143-P1: Chrome 390×844 trận vẽ atlas pack mới, không viền xanh

## Result

LIVE #137 `a39b587`. Cell 347×320 × 330/240 → 477×440. Blender Compositor Keying, hết viền xanh ffmpeg. VFX source-over. SFX wav HonVietSfx. BETS 2/10/50 đóng. Không Hồng Trầu. Không per-frame crop.
L143-T1…T4 PASS. npm test 962. L143-P1 Chrome 390×844 PASS. Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
