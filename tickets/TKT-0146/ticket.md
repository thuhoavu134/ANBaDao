---
id: TKT-0146
title: S+ Linh Đồng dùng cùng clock ATK/Ultimate
status: LIVE
phase: LIVE
priority: P0
acceptance_ids: [L146-T1, L146-T2, L146-T3, L146-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - src/runtime/splus-battle-bridge.js
  - scripts/qa-linh-dong-static-v1.mjs
  - tests/linh-dong-splus-clock.test.mjs
  - tests/linh-dong-atlas.test.mjs
  - tickets/TKT-0146/
  - docs/qa/L146-LINH-DONG-SPLUS-CLOCK/
resource_locks: [linh-dong-atlas-runtime]
branch_hint: work/l146-linh-dong-splus-clock-20260914
---

# TKT-0146

Owner 14/09: trận thử S+ Linh Đồng (`qaSplus42=hero_splus_linh_dong`) phải dùng cùng clock ATK/Ultimate với trận thường (TKT-0145). Không Skill 1 runtime.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage math / initiative / AI / turn clock. Không per-frame crop, black-key, cell 347×320 / trận 477×440. Không normalize HEROES campaign thành `hero_splus_linh_dong`. Không đổi `createSplusFixture.timingScale = 0.35` của 41 tướng S+ kia.

## Acceptance

- L146-T1: `performSplusAction` đi begin → wait release → emit → wait impact → `e.act` một lần → wait recovery. ATK 420/1320/1496, Ultimate 400/1600/1980. Không `sleep(linhDur)`.
- L146-T2: thanh S+ Linh Đồng chỉ `passive` + `ultimate`; hurt reset idle; alias skill/basic → ATK
- L146-T3: `timingScale` fixture vẫn 0.35; `waitLinhDongMarker` elapsed = `performance.now()` wall
- L146-P1: Chrome 390×844 trận thử S+ Linh Đồng — ATK không còn ~524ms. Safari/iPhone NOT_RUN

## Result

LIVE #142 `c517cd8`. S+ Linh Đồng dùng clock ATK/Ultimate chung với trận thường. Thanh nội tại + tuyệt kỹ. Hurt reset idle. `timingScale` 0.35 của 41 tướng S+ kia không đổi.
Local npm test 979/979. CI Build and test PASS. Chrome 390×844 ATK wall 1506ms. Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
