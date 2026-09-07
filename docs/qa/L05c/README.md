# L05c-a — seeded combat RNG / replay evidence

Ngày kiểm chứng: **07/09/2026**. Trạng thái lát cắt: **REVIEW**; L05b/L05 tổng thể: **IN_PROGRESS**.

## Phạm vi source

- Source owner: `src/domain/combat/seeded-rng.mjs`, `action-observation.mjs`, `combat-result.mjs`, combat core.
- Build owner: `scripts/combat-domain-3q-adapter-v1.mjs`; build injects into `dist`, không sửa dist như source. `battle.html` là gameplay source.
- Schema `hon-viet-combat-rng/v1`; rule/presentation stream độc lập; cursor/call log/value được capture. Session RNG cache bằng `WeakMap`, không đổi battle/save schema.
- Adapter patch 13 call-site runtime: damage hit/variance/crit, status chance, burst presentation và camera presentation. Còn 2 `Math.random` fallback có chủ đích trong bridge. Target selector hiện hành vẫn hash deterministic.
- Không đổi seed config live, reward, balance, save migration, roster, art, audio hoặc hotfix thoát trận.

## Commit và test

- [80a593c4](https://github.com/bktimmy247/luc-than/commit/80a593c4bd843e879eaf64725223d178f5542987): seeded RNG source/build/test.
- [147badb](https://github.com/bktimmy247/luc-than/commit/147badb07db22961f073e89b1145d22fef467c6d): forced deterministic hit/crit classification fix.
- RED ban đầu: test import fail vì thiếu `seeded-rng.mjs`; sau implementation, focused suite **32/32 pass, 0 fail**.
- Lệnh focused: `node --test tests/combat-observation.test.mjs tests/combat-domain-3q-adapter.test.mjs tests/combat-domain-advanced-modules.test.mjs tests/combat-domain-advanced-parity.test.mjs tests/combat-domain-module-parity.test.mjs tests/combat-domain-modules.test.mjs tests/combat-presentation-standard.test.mjs tests/combat-seeded-rng.test.mjs`.
- `node --check scripts/combat-domain-3q-adapter-v1.mjs` pass; adapter dry-run pass; generated `dist` compile đủ 5 inline script body; injected bundle smoke pass; fallback count còn 2 như contract.
- Full `npm test`/CI không được claim: connector checkout không chạy full suite; GitHub Actions `workflow_runs=[]`.

## Deployment

- Vercel [`dpl_5ae3g2Ff6kD8gjFDDS6iB3cMQezH`](https://vercel.com/cuong-duc-ai-s-projects/luc-than/5ae3g2Ff6kD8gjFDDS6iB3cMQezH), source commit `147badb07db22961f073e89b1145d22fef467c6d`, target production, **READY**.
- Build log: clone `main` at `147badb`, chạy `npm run build`, `Embedded battle payload synced: 936487 bytes`, build/deployment completed. Vercel commit status `success`; Vercel runtime errors gần nhất không có.
- Immutable deployment URL bị Vercel Authentication chặn trong browser; QA dùng production alias `https://luc-than.vercel.app/`.

## Chrome production evidence

- Shell `https://luc-than.vercel.app/?qaCombatFixture=l05a`: UI production vẫn hiển thị roster 12/12 và route Chinh chiến. Không bấm shell launch để tránh tiêu thể lực/save người chơi.
- Fixture cô lập: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-qa-fixed&v=3173&qaCombatFixture=l05a`. Đã bấm `Xuất chiến` trên fixture cô lập, chụp visual battle viewport: Hồn Việt branding, HP bars, damage/critical popup và bottom navigation hiện đúng.
- Run kết thúc: `actionCount=28`, `resultCount=81`, `impactCount=180`, `rngCallCount=4712`, `capturedRngCallCount=4712`, `capturedRuleRngCallCount=122`, `status=finished`. Result types: `barrier`, `buffAdd`, `damage`, `death`, `heal`, `miss`; report không còn RNG gap.
- Run cùng seed thứ hai: `actionCount=12`, `resultCount=28`, `impactCount=90`, `rngCallCount=2505`, `capturedRuleRngCallCount=75`, `status=open`. Hai action đầu có rule trace giống nhau ở cursor `0..5` và value hit/variance/crit; đây là prefix parity, chưa phải full replay parity.
- Console note: direct fixture bypass shell config nên có warning mặc định về embedded config; diagnostic lỗi metadata của browser extension bị loại khỏi app evidence. Không có app runtime error.

## Chưa đóng / bước tiếp

- Report gaps: `resolve-action-final-snapshot`, `per-impact-boundary-missing`.
- L05b/L05 vẫn IN_PROGRESS: direct status removal/DoT tick/energy-cost, heal/two-hit, round cap 15, full replay/speed parity và Safari/iPhone/iPad/device QA còn thiếu.
- Archive/source mẫu: `SOURCE_NOT_AVAILABLE`. Ticket board/scripts: `TICKET_BOARD_NOT_AVAILABLE`.
- Bước kế tiếp: L05c-b instrument direct boundaries + fixture cases; sau đó chạy round-15/full replay parity và chỉ khi có evidence riêng mới mở device QA.