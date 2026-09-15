---
id: TKT-0149
title: Trận một tướng xong mới đến tướng kia
status: LIVE
phase: LIVE
priority: P0
acceptance_ids: [L149-T1, L149-T2, L149-T3, L149-T4, L149-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - index.html
  - battle.html
  - scripts/luc-anh-runtime-patch.mjs
  - tests/battle-turn-pace.test.mjs
  - tickets/TKT-0149/
resource_locks: [battle-timing]
branch_hint: work/l149-battle-turn-pace-20260915
---

# TKT-0149

Owner 15/09: trận ra đòn liên tiếp, tướng này chưa xong tướng kia đã đánh, diễn hoạt quá nhanh. Muốn một tướng ra chiêu xong mới đến tướng kia.

## Goal

Giữ thứ tự lượt theo tốc. Mặc định 1×. Trận thường không nén 0.45. Nghỉ giữa lượt đủ để nhìn hết chiêu. Auto `await` hành động, không chồng lượt.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage math / initiative / AI chọn mục tiêu. Không đụng atlas Linh Đồng. Không đổi `createSplusFixture.timingScale = 0.35`. QA vẫn 0.035.

## Acceptance

- L149-T1: trận thường `timingScale` 1; `qaMode` vẫn 0.035; S+ fixture vẫn 0.35
- L149-T2: mặc định `state.speed = 1`, không `EMBEDDED ? 3`
- L149-T3: `turnRest >= 400`; auto `await performAction`
- L149-T4: `Core.buildTurnOrder` vẫn là chủ quản hàng đợi
- L149-P1: Chrome 390×844 một tướng xong mới đến tướng kia. Safari/iPhone NOT_RUN

## Result

LIVE #145 `506a7f8`. Trận thường 1×, không nén 0.45. Nghỉ giữa lượt 480ms. Auto await hành động. Thứ tự lượt theo tốc không đổi.
Local npm test 988/988. CI Build and test PASS. Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
