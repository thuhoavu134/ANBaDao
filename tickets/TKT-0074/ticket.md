---
id: TKT-0074
title: Màn đăng ký/đăng nhập video rồi vào Thành Chính
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-12T07:40:00.000Z
updated: 2026-09-12T08:30:00.000Z
acceptance_ids: ['L74-T1', 'L74-T2', 'L74-T3', 'L74-T4', 'L74-T5', 'L74-T6', 'L74-T7', 'L75-T1', 'L75-T2', 'L75-T3']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/server/app.mjs', 'src/server/store.mjs', 'src/server/crypto.mjs', 'src/server/http.mjs', 'src/ui/net-auth-runtime.js', 'src/ui/net-auth.css', 'src/ui/login-gate-runtime.js', 'src/ui/login-gate.css', 'scripts/net-auth-v1.mjs', 'scripts/login-gate-v1.mjs', 'scripts/lanes/tkt-0074-auth.mjs', 'scripts/preview-with-api.mjs', 'assets/ui/auth/login-bg.mp4', 'assets/ui/auth/login-bg.jpg', 'tests/auth-api.test.mjs', 'tests/net-auth-client.test.mjs', 'tests/login-gate.test.mjs', 'docs/qa/L74-AUTH-API/', 'docs/AUTH-VERCEL.md']
resource_locks: ["auth-api"]
parallel_wave: I
depends_on: []
conflicts_with: ['TKT-0059']
branch_hint: work/l74-auth-api-20260912
---
# TKT-0074 — Tài khoản Lục Thần trên một project Vercel

Wave **I**. Owner 12/09 (làm lại): **mở game = màn đăng ký/đăng nhập + video nền đẹp**, xong mới vào Thành Chính. Không bắt anh cấu hình Neon/Google.

## Goal

- Overlay `#hvLoginRoot` z-index 200, video `assets/ui/auth/login-bg.mp4` loop muted + poster jpg
- Form sống: tên + mật khẩu, **Đăng nhập** / **Tạo tài khoản**
- Wrap `navTo`: chưa có token thì không vào hub
- Sau login/register: `navTo('hub')`
- API cùng origin như cũ (`/api/login` `/api/register`)
- Google chỉ hiện khi `/api/health` oauth=true — không bắt anh làm Google Cloud

Điền stub `scripts/lanes/tkt-0074-auth.mjs` (auth wrap rồi login gate). Import **sau** Safari.

## Keep (live)

- Hall Trực Tuyến `#hvNetRoot` / `net-3d-runtime.js` / `net-3d.css`
- `netOnline` / `api` / `NET` token·user·server / cloud save / chat poll trong `index.html` — **không đổi nguồn**
- Save local sau khi đã vào Thành Chính
- `hvRunCommittedTransaction` client

## Non-goals

Không sửa `index.html`. Không sửa `battle.html`. Không sửa `campaign-scene.js`. Không PvP người thật giả lập server. Không IAP. Không mở Combat V2. Không 72 tướng. Không Hermes 27. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Env production (Vercel → Settings → Environment Variables)

- `AUTH_SECRET` — bắt buộc production
- `DATABASE_URL` — Neon/Postgres; không có thì preview dùng file `data/hon-viet-store.json`
- `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` — OAuth email
- `PUBLIC_BASE_URL` — `https://luc-than.vercel.app`

Google redirect URI: `https://luc-than.vercel.app/api/auth/oauth/google/callback`

## Acceptance

- L74-T1: wrap `renderNet` + `netAuth`, ẩn `#netServer`, nút Google, không `document` click
- L74-T2: register/login JWT; trùng user 409; mật khẩu sai 401
- L74-T3: save round-trip bearer
- L74-T4: Google start 302 + callback + exchange
- L74-T5: profile/rivals/chat/leaderboard/arena khớp client
- L74-T6: không sửa `index.html` / `battle.html` / `campaign-scene.js`
- L74-T7: một project Vercel, stub sau safari
- L75-T1: wrap `navTo`, overlay `#hvLoginRoot`, video loop, không `document` click
- L75-T2: `login-bg.mp4` + poster jpg + CSS full viewport
- L75-T3: không sửa `index.html` / `battle.html` / `campaign-scene.js`; stub load login-gate

Builder → REVIEW. Không tự MERGED/DONE.
