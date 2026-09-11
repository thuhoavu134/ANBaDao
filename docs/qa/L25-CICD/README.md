# L25-CICD — pipeline tự động

- PR / đẩy `main` / chạy tay: job **Build and test** (`npm install` → `npm run build` → `node --test`).
- Đẩy `main`: Vercel tự deploy live; job **Live check** đợi `https://luc-than.vercel.app/` trả 200.
- Không đổi luật game. Không thay host.
- Cổng CI: full suite 537/537 PASS trên runtime đã duyệt. Sáu test cũ lệch snapshot (hash `index.html`, `postMessage` trên `dist`, SFX `impact` đã gỡ, buffer unlock iOS) được chỉnh theo code hiện tại.
