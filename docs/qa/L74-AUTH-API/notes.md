# L74 Auth API — evidence

- RED: `tests/auth-api.test.mjs` + `tests/net-auth-client.test.mjs` fail ENOENT trước khi có `src/server` / `api/[...path].js`.
- GREEN: node --test auth + net-auth-client + login-gate + parallel-lanes wave I.
- Owner 12/09: mở game = màn đăng ký/đăng nhập + video nền, rồi Thành Chính. `tests/login-gate.test.mjs` L75-T1..T3 GREEN. Video `assets/ui/auth/login-bg.mp4` ~3.4MB + poster jpg.
- Chrome responsive / Safari device: NOT_RUN (gate overlay + API contract).
- Không merge tới `live`.
