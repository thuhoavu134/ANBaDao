# L25-CICD — pipeline tự động

- PR / đẩy `main` / chạy tay: job **Build and test** (`npm install` → `npm run build` → `node --test`).
- Đẩy `main`: Vercel tự deploy live; job **Live check** đợi `https://luc-than.vercel.app/` trả 200.
- Không đổi luật game. Không thay host.
