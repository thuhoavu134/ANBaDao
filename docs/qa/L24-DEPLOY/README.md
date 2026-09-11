# L24-DEPLOY — artifact gọn

- `dist` không còn `docs/` (QA evidence 23MB).
- `index.html`, `battle.html`, `assets/` giữ nguyên. BATTLE_HTML_BASE64 khớp battle.
- `sharp` chỉ còn `devDependencies`. Vercel `npm install --omit=dev`.
- HTML `Cache-Control: max-age=0, must-revalidate` để bản live nhận deploy mới.

Evidence: `evidence.json`.
