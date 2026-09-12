---
id: TKT-0076
title: Neon Postgres — tài khoản và cloud save sống qua cold start
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-12T17:20:00.000Z
updated: 2026-09-12T13:02:00.000Z
acceptance_ids: ['L76A-T1', 'L76A-T2', 'L76A-T3', 'L76A-T4', 'L76A-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/server/store.mjs', 'src/server/app.mjs', 'api/index.mjs', 'tests/auth-api.test.mjs', 'tests/store-postgres.test.mjs', 'docs/AUTH-VERCEL.md', 'docs/qa/L76A-NEON/']
resource_locks: ["auth-api"]
parallel_wave: J
depends_on: ['TKT-0074']
conflicts_with: ['TKT-0074']
branch_hint: work/l76-neon-persist-20260913
---
# TKT-0076 — Neon Postgres cho nhiều người chơi

Wave **J** P0. Một agent. Đọc [HANDOFF-2026-09-12](../../docs/HANDOFF-2026-09-12.md) rồi [AUTH-VERCEL](../../docs/AUTH-VERCEL.md).

Owner 12/09: nhiều người login **chưa chơi được bền** — serverless không `DATABASE_URL` thì `createMemoryStore()`, user/save **mất khi cold start**.

## Goal

`createPostgresStore` **đã có** trong `src/server/store.mjs` (bảng `hv_users` `hv_saves` `hv_profiles` `hv_chat` `hv_oauth_*`). Việc agent:

1. Owner (hoặc agent nếu có quyền Neon) tạo DB Neon, gắn **`DATABASE_URL`** + **`AUTH_SECRET`** lên project Vercel **luc-than** (Production + Preview). **Không tạo project Vercel thứ hai.**
2. `/api/health` báo `store: "postgres"` khi có URL.
3. Register → cold-ish second request → login cùng user **còn**. Cloud save `/api/save` roundtrip JSON.
4. Test không phụ thuộc Neon thật: mock/`@neondatabase/serverless` hoặc skip khi không có URL; có URL thì L76A-P1 GREEN.
5. Vá schema nếu thiếu (oauth_state payload JSON, username trên profile…). Không rewrite store.

## Keep (live)

- `#hvLoginRoot` email + Du khách TKT-0074/0075
- File store preview sandbox `data/hon-viet-store.json`
- Một origin `/api/*`

## Non-goals

Không PvP người-thật. Không IAP. Không Combat V2. Không 72 tướng. Không Google/Facebook/Apple (TKT-0077). Không sửa `index.html` / `battle.html` / `campaign-scene.js`. Không commit `dist/`. Không merge tới khi owner gõ `live`.

## Acceptance

- L76A-T1: `createStoreFromEnv({ DATABASE_URL })` → `kind === 'postgres'`
- L76A-T2: không `DATABASE_URL` + `VERCEL=1` → memory; local không Vercel → file
- L76A-T3: createUser + findUserByName roundtrip (mock hoặc Neon)
- L76A-T4: putSave / getSave JSONB không mất field
- L76A-P1: production/preview có `DATABASE_URL` — tạo tk máy A, login máy B còn. Không có URL thì ghi evidence **BLOCKED_ENV**, ticket không LIVE

## Affected paths (exclusive)

- `src/server/store.mjs` (vá schema, không xóa API)
- `src/server/app.mjs` health.store
- `api/index.mjs` nếu thiếu env pass-through
- `tests/store-postgres.test.mjs` (tạo)
- `tests/auth-api.test.mjs` (thêm case store kind)
- `docs/AUTH-VERCEL.md` bước Neon 4 dòng
- `docs/qa/L76A-NEON/`

Frozen: login-gate UI, net-3d, battle.html.

Owner gõ live. Squash [#66](https://github.com/bktimmy247/luc-than/pull/66) `0895079`. L76A-P1 vẫn **BLOCKED_ENV** — health memory tới khi gắn `DATABASE_URL`. Safari NOT_RUN.
