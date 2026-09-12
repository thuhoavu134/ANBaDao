---
id: TKT-0077
title: OAuth Google / Facebook — nút MXH chạy thật
status: LIVE
phase: LIVE
priority: P1
created: 2026-09-12T17:20:00.000Z
updated: 2026-09-12T17:20:00.000Z
acceptance_ids: ['L77-T1', 'L77-T2', 'L77-T3', 'L77-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/server/app.mjs', 'src/ui/login-gate-runtime.js', 'docs/AUTH-VERCEL.md', 'docs/qa/L77-OAUTH/']
resource_locks: ["auth-api"]
parallel_wave: J
depends_on: ['TKT-0076']
conflicts_with: ['TKT-0074', 'TKT-0076']
branch_hint: work/l77-oauth-apps-YYYYMMDD
---
# TKT-0077 — OAuth MXH (chờ App ID owner)

Owner 12/09 21:27: **bỏ Apple**. Chỉ Google + Facebook.

Wave **J**. **Không làm** tới khi owner dán App ID/Secret vào chat hoặc Vercel env.

Hiện tại không có `GOOGLE_CLIENT_ID` / `FACEBOOK_APP_ID` / `APPLE_CLIENT_ID` thì nút MXH **mở form email dự phòng** (đúng TKT-0074).

## Goal

Khi owner gửi key:

1. Gắn env Production + Preview trên **một** project `luc-than`.
2. Redirect URI đúng `docs/AUTH-VERCEL.md`.
3. `/api/health` `oauth: true` cho provider đã có.
4. Nút Google/Facebook trên `#hvLoginRoot` mở OAuth, không fallback email. Apple giữ fallback email.

## Non-goals

Không tự tạo Google Cloud / Facebook App. **Không Apple.** Không Neon (0076). Không sửa hall. Không 72 tướng. Không merge tới `live`.

## Acceptance

- L77-T1: thiếu env → nút vẫn fallback email (giữ hành vi live)
- L77-T2: có `GOOGLE_CLIENT_ID`+secret → health.oauth.google true; click không mở panel email
- L77-T3: callback cùng origin tạo/find user `provider=google|facebook|apple`
- L77-P1: Chrome 390×844 — một provider owner chọn, về Thành Chính. Safari NOT_RUN ghi rõ

Builder → REVIEW khi có key. Không tự MERGED/DONE.

Owner 12/09 22:11 gõ **live**. Health thuhoavu `"oauth":true` google+facebook, apple false. Evidence `docs/qa/L77-OAUTH/`.
