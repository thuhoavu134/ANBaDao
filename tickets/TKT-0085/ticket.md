---
id: TKT-0085
title: Mã quà mảnh tướng + tinh/hoạt/sò/essence
status: LIVE
phase: REVIEW
priority: P1
created: 2026-09-12T16:20:00.000Z
updated: 2026-09-12T16:20:00.000Z
acceptance_ids: ['L85-T1', 'L85-T2']
affected_paths: ['src/domain/profile/gift-codes.mjs', 'src/server/app.mjs', 'src/ui/profile-runtime.js', 'tests/gift-codes.test.mjs', 'tests/gift-api.test.mjs', 'docs/GIFT-CODES.md']
---
# TKT-0085 — Catalog thưởng không chỉ vàng/ngọc

Owner event: mảnh tướng, tinh, item, pet. Index `GET /api/gift` tự lấy DATA.heroes + equipment registry — tướng/vật phẩm mới không cần sửa module mã.
