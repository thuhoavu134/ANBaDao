# Tài khoản Lục Thần — một project Vercel

Owner 12/09: bật tài khoản, microservice theo **bounded context trong process**, deploy **một** project.

Live game vẫn là `dist/` tĩnh. API cùng origin:

| Context | Path | Việc |
|---|---|---|
| Auth | `/api/register` `/api/login` `/api/auth/*` | user/mật khẩu + Google email |
| Player | `/api/save` `/api/profile` | cloud save, lực chiến |
| Social | `/api/chat` `/api/rivals` `/api/arena/result` `/api/leaderboard` | chat / rank |

Trận 6v6 **không** lên server. Iframe `battle.html` giữ nguyên.

## Env trên Vercel

Project **luc-than** → Settings → Environment Variables (Production + Preview):

| Key | Bắt buộc | |
|---|---|---|
| `AUTH_SECRET` | Có | chuỗi ngẫu nhiên dài, ký JWT |
| `DATABASE_URL` | Có (prod) | Neon Postgres. Không có: process nhớ tạm, mất khi cold start |
| `GOOGLE_CLIENT_ID` | OAuth | Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | OAuth | |
| `PUBLIC_BASE_URL` | Nên | `https://luc-than.vercel.app` |

Google → Authorized redirect URI:

`https://luc-than.vercel.app/api/auth/oauth/google/callback`

Không tạo project Vercel thứ hai.

## Preview sandbox

`node scripts/preview-with-api.mjs` — static `dist/` + `/api` cổng 8080. Store file `data/hon-viet-store.json`.
