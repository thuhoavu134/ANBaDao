---
id: TKT-0153
title: Chinh chiến đi đường dùng Linh Đồng Run
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-15T11:00:00.000Z
updated: 2026-09-15T11:32:00.000Z
acceptance_ids: [L153-T1, L153-T2, L153-T3, L153-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/ui/campaign-scene.js
  - tests/linh-dong-campaign-run.test.mjs
  - tickets/TKT-0153/
  - docs/qa/L153-LINH-DONG-CAMPAIGN-RUN/
resource_locks: [campaign-linh-dong-run]
branch_hint: work/l153-linh-dong-campaign-run-20260915
---
# TKT-0153

Owner 15/09: màn Chinh chiến đang đi đường là clip **Run** của Linh Đồng. Đang phát Idle nên tướng đứng phập phồng trên đường.

## Goal

Khi đội thám hiểm (phase `march`), Linh Đồng dùng `run-atlas.webp` cùng cell/pivot đã khóa. Bày trận / đứng đánh quái vẫn Idle. Không bịa FPS.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage / initiative / AI / turn clock. Không per-frame crop, không key đen, không đổi cell 480×440 / trận 477×440. Không mở roster tướng khác. Không bind Bạch Diện. Không đổi `createSplusFixture.timingScale = 0.35`.

## Review

- `spriteSpecs.linh_dong` giữ Idle (L144-T5).
- `specForAfk` nối Run theo ID; thiếu thì Idle.
- Chỉ `linh_dong` vì pack Run đã có. Tướng khác vẫn Idle nếu chưa có spec.

## Acceptance

- L153-T1: march `specForAfk({id:'linh_dong'})` → `run-atlas.webp`; draft/Bày trận → idle-atlas
- L153-T2: Run cùng frames/cell/pivot với Idle (96 / 480×440 / pivot 240 / foot 440 / body 330)
- L153-T3: file `assets/characters/linh-dong/run-atlas.webp` có thật; L144 idle không đổi
- L153-P1: Chrome Chinh chiến đi đường. Safari/iPhone NOT_RUN

## Result

LIVE #149 `7c70c69`. March `run-atlas.webp`. Bày trận Idle. L153-T1…T3 PASS. npm test 1017/1017. Chrome/Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
