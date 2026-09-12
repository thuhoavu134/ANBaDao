---
id: TKT-0084
title: Owner tự thêm mã quà — JSON + env Vercel
status: LIVE
phase: REVIEW
priority: P1
created: 2026-09-12T16:12:00.000Z
updated: 2026-09-12T16:12:00.000Z
acceptance_ids: ['L84-T1', 'L84-T2', 'L84-T3']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/domain/profile/gift-codes.mjs', 'src/domain/profile/gift-catalog.json', 'src/server/app.mjs', 'src/server/http.mjs', 'src/ui/profile-runtime.js', 'tests/gift-codes.test.mjs', 'tests/gift-api.test.mjs', 'docs/GIFT-CODES.md']
resource_locks: ["gift-catalog","api-gift"]
---
# TKT-0084 — Owner tự thêm redeem code

Anh thêm mã không cần sửa game mỗi lần: file JSON trong repo **hoặc** biến Vercel `GIFT_CODES`. POST `/api/gift` (một đoạn path). Hồ sơ → Mã đổi gọi API nếu mã không có sẵn client.

Không sửa `index.html` / `battle.html` / `campaign-scene.js`.

Builder → REVIEW. Không tự MERGED/DONE.
