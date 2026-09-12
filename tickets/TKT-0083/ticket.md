---
id: TKT-0083
title: Hồ sơ avatar — mã quà, đổi tên, cài đặt
status: REVIEW
phase: REVIEW
priority: P1
created: 2026-09-12T15:40:00.000Z
updated: 2026-09-12T15:40:00.000Z
acceptance_ids: ['L83-T1', 'L83-T2', 'L83-T3', 'L83-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/domain/profile/gift-codes.mjs', 'src/ui/profile-runtime.js', 'src/ui/profile-screen.css', 'scripts/profile-v1.mjs', 'scripts/lanes/tkt-0083-profile.mjs', 'scripts/build-static.mjs', 'tests/gift-codes.test.mjs', 'tests/profile-screen.test.mjs', 'docs/qa/L83-PROFILE/']
resource_locks: ["profile-overlay"]
parallel_wave: K
depends_on: []
conflicts_with: []
branch_hint: work/l83-profile-settings-20260912
---
# TKT-0083 — Bấm avatar Thành Chính → hồ sơ / mã quà / cài đặt

Owner 12/09: ấn hình avatar ra màn hồ sơ (đổi tên, mã đổi, liên hệ, thiết lập, liên kết, hình tượng). Giftcode phải chạy.

## Goal

`#hvProfileRoot` overlay `inset:0` z-index 110. Capture `#hubScreen .art-avatar`. Gọi `redeemCode` sẵn + mã thêm LUCTHAN / THANHCHINH. Không sửa `index.html` / `battle.html` / `campaign-scene.js`.

## Non-goals

72 tướng. Combat V2. CSKH bên ngoài (rhinosunion). Không imagegen tướng live.

Builder → REVIEW. Không tự MERGED/DONE.
