---
id: TKT-0150
title: Trận hiện VFX và SFX
status: REVIEW
phase: REVIEW
priority: P0
acceptance_ids: [L150-T1, L150-T2, L150-T3, L150-T4, L150-P1]
required_gates: [vibelab, tdd]
affected_paths:
  - battle.html
  - src/ui/audio-sfx-runtime.js
  - scripts/linh-dong-timing-main-v1.mjs
  - tests/battle-vfx-sfx.test.mjs
  - tests/mobile-render-sfx.test.mjs
  - tickets/TKT-0150/
resource_locks: [battle-vfx-sfx]
branch_hint: work/l150-battle-vfx-sfx-20260915
---

# TKT-0150

Owner 15/09: vào trận không thấy VFX, không nghe SFX.

## Goal

Chiêu có hiệu ứng nhìn được và tiếng đánh. Không nén diễn hoạt còn 80ms. Atlas Linh Đồng load sẵn. SFX lần đầu không bị bỏ vì tải chậm. Mỗi trận không bỏ qua diễn hoạt mặc định.

## Non-goals

Không đổi BETS 2/10/50, loot, Bách Bảo, Hồng Trầu. Không mở 42 S+, Combat V2, 72 tướng. Không đổi damage math / initiative / AI. Không đụng cell 347×320. Không đổi `createSplusFixture.timingScale = 0.35`. QA 0.035 giữ.

## Acceptance

- L150-T1: `motionDuration` không `Math.min(80` — camera vẫn tắt giật khi giảm chuyển động
- L150-T2: runtime Linh Đồng gọi `linhDongImage` cho atkVfx + ultimateVfx lúc khởi tạo
- L150-T3: SFX decode chậm vẫn phát nếu trận còn chạy; không cắt 1200ms
- L150-T4: `beginBattle` gán `skipAnimations=false`
- L150-P1: Chrome 390×844 thấy vòng va chạm + nghe SFX sau cử chỉ. Safari/iPhone NOT_RUN

## Result

REVIEW. VFX không còn nén 80ms. Atlas Linh Đồng load sẵn. SFX lần đầu không bị cắt vì tải chậm. Trận mới không bỏ diễn hoạt.
GREEN 992/992. Safari/iPhone NOT_RUN.
Chỉ squash-merge khi owner gõ `live`. Owner tự `git pull && vercel --prod`.
