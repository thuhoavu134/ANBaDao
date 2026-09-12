# Tài khoản Lục Thần — một project Vercel

Owner 12/09: bật tài khoản, microservice theo **bounded context trong process**, deploy **một** project.

Live game vẫn là `dist/` tĩnh. API cùng origin:

| Context | Path | Việc |
|---|---|---|
| Auth | `/api/register` `/api/login` `/api/auth/*` | email/mật khẩu + Google/Facebook/Apple |
| Player | `/api/save` `/api/profile` | cloud save, lực chiến |
| Social | `/api/chat` `/api/rivals` `/api/arena/result` `/api/leaderboard` | chat / rank |

Trận 6v6 **không** lên server. Iframe `battle.html` giữ nguyên.

## Env trên Vercel

Project **luc-than** → Settings → Environment Variables (Production + Preview):

| Key | Bắt buộc | |
|---|---|---|
| `AUTH_SECRET` | Có | chuỗi ngẫu nhiên dài, ký JWT |
| `DATABASE_URL` | Có (prod) | Neon Postgres. Không có: process nhớ tạm, mất khi cold start |
| `GOOGLE_CLIENT_ID` | OAuth | Google Cloud OAuth web client |
| `GOOGLE_CLIENT_SECRET` | OAuth | |
| `FACEBOOK_APP_ID` | OAuth | Facebook Login app |
| `FACEBOOK_APP_SECRET` | OAuth | |
| `APPLE_CLIENT_ID` | OAuth | Sign in with Apple Services ID |
| `PUBLIC_BASE_URL` | Nên | `https://luc-than.vercel.app` |

Redirect URI (Authorized):

- Google: `https://luc-than.vercel.app/api/auth/oauth/google/callback`
- Facebook: `https://luc-than.vercel.app/api/auth/oauth/facebook/callback`
- Apple: `https://luc-than.vercel.app/api/auth/oauth/apple/callback`

Không có App ID thì nút MXH mở form email dự phòng. Email + Du khách chạy trên mọi máy không cần env OAuth.

Không tạo project Vercel thứ hai.

Ticket kế: [TKT-0076](../tickets/TKT-0076/ticket.md) gắn Neon · [TKT-0077](../tickets/TKT-0077/ticket.md) OAuth chờ App ID · [TKT-0078](../tickets/TKT-0078/ticket.md) retrigger alias sau 13/09 17:15 +07.

## Preview sandbox

`node scripts/preview-with-api.mjs` — static `dist/` + `/api` cổng 8080. Store file `data/hon-viet-store.json`.
