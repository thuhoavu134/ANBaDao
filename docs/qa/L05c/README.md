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

## L05c-b — direct boundary evidence

Ngày kiểm chứng: **07/09/2026**. Trạng thái lát cắt: **REVIEW**; L05b/L05 tổng thể: **IN_PROGRESS**.

### Source / tests

- Commit [005dc3a](https://github.com/bktimmy247/luc-than/commit/005dc3a09661589ff7b96b6b7402212b1a26581e): `src/domain/combat/action-observation.mjs`, `scripts/combat-domain-3q-adapter-v1.mjs`, `tests/combat-l05c-boundary.test.mjs`.
- RED ban đầu fail 2/2; GREEN focused suite **34/34 pass, 0 fail**. `node --check`, adapter dry-run, 5 inline script compile pass; 2 fallback `Math.random` remain as intentional bridge fallback.
- Report contract bổ sung direct boundary coverage và multi-hit counts; không xóa hai gap cũ. Không đổi seed config live, reward, balance, save migration, roster, art, audio hoặc hotfix thoát trận.

### Deployment / Chrome production

- Vercel deployment [dpl_8JxKw4my7swxv4Yn6Not7w6bmRod](https://vercel.com/cuong-duc-ai-s-projects/luc-than/8JxKw4my7swxv4Yn6Not7w6bmRod), source `005dc3a`, target production, **READY**; `npm run build` completed, embedded payload **940941 bytes**, runtime error scan 1 giờ sạch.
- UI thật: bấm `Xuất chiến`, bật `Tự động chiến đấu`; fixture kết thúc `finished`: **28 action / 81 result / 219 impact**, 4.712 RNG call, 122 captured rule call.
- `impactBoundaryCoverage`: `addStatus 20`, `applyDamage 43`, `applyHeal 6`, `gainEnergy 105`, `markDefeated 6`, `performAction.action-cost 28`, `tickStatuses 11`. Đã thấy DoT `burn`, regen heal, direct heal amount dương và 5 action có ít nhất hai hit.
- Same-seed run thứ hai có hai action đầu `prefixEqual=true`, nhưng còn `open`; đây là prefix parity, chưa phải full replay parity. Round cap 15/full replay/speed parity/Safari device chưa chạy.

### Gaps / next

- Report còn `resolve-action-final-snapshot`, `per-impact-boundary-missing`; status **REVIEW**, không tự chuyển DONE.
- Archive/source mẫu: `SOURCE_NOT_AVAILABLE`. Ticket Board: `TICKET_BOARD_NOT_AVAILABLE`.
- Bước kế tiếp: round-15 fixture + full replay/speed parity, rồi mới device QA.


## L05c-c production QA record (2026-09-07)

Deployment: `dpl_CHELjrknWnR353JPiVLK9Zs8SPn8` (`READY`), commit `369f545`, alias `https://luc-than.vercel.app/`.

### Round cap

URL: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-c-cap&v=3173&qaCombatFixture=l05c-round-cap`

Run `Xuất chiến` → auto-battle → speed control `3×`.

- Visible result: `KHẢI HOÀN`, `Lượt 15`.
- Fixture report: `finished`, 93 actions, 228 results, 644 impacts, `roundMax=15`, `maxObservedRound=15`, `roundsBeyondCap=0`, `roundCapReached=true`.
- Completion: `winner=player`, `reason=round-limit-hp`, `round=15`, `roundMax=15`, `speed=3`; fingerprint `a1458659`.

### Full replay/speed parity

- 1×: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-c-speed1&v=3173&qaCombatFixture=l05a` → finished, 28 actions, 81 results, 219 impacts, fingerprint `0757b35e`.
- 2×: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05c-c-speed2b&v=3173&qaCombatFixture=l05a` → finished, 28 actions, 81 results, 219 impacts, fingerprint `0757b35e`.
- Both used the same fixture seed and yielded the same full replay rule outcome. The valid 2× action was performed after battle start and verified with `Tốc độ trận đấu 2 lần`.

### Local gates

- Focused combat suite: `37/37 PASS`.
- Source syntax, inline script compile and adapter markers: PASS.
- Full `npm test`/CI, Safari/iPhone/iPad: open.
- Existing observer gaps remain open; status stays `REVIEW`.

## L05c-d production QA record — explicit final action snapshot (2026-09-07)

Deployment: `dpl_DZtRfRZGyWeDUnhxtQcVjn2GZAnZ` (`READY`), commit `eab4a45`, alias `https://luc-than.vercel.app/`.

### Observer contract

- Source owner records `finalSnapshot` as a normalized immutable unit snapshot and labels it `resolveAction.complete`.
- `finalSnapshotCoverage` reports captured and expected action counts; `complete=true` only when all actions have explicit captures.
- The report no longer lists `resolve-action-final-snapshot` for complete fixture runs. `per-impact-boundary-missing` remains intentionally visible.

### Production fixture

- 1× URL: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05d-final-speed1&v=3174&qaCombatFixture=l05a` → finished, 28 actions, 81 results, 219 impacts, final snapshots 28/28, `speed=1`, fingerprint `282374be`.
- 2× URL: `https://luc-than.vercel.app/battle.html?embedded=1&session=l05d-final-speed2&v=3174&qaCombatFixture=l05a` → finished, 28 actions, 81 results, 219 impacts, final snapshots 28/28, `speed=2`, fingerprint `282374be`.
- Both runs used the existing fixture seed and real UI actions. Same full-replay rule outcome is verified; no gameplay data was changed.

### Gate result

- RED: 3 failures against the unimplemented baseline; GREEN: 3/3; REFACTOR: 39/39 focused combat tests.
- Vercel build: PASS; runtime errors: none.
- Local npm test/build: BLOCKED because the connector-only source harness has no `package.json`; full CI remains open.
- Chrome desktop: PASS for production interaction and observer evidence. Safari/iPhone/iPad and real responsive device matrix: NOT RUN.
- Ticket Board: `TICKET_BOARD_NOT_AVAILABLE`; archive: `SOURCE_NOT_AVAILABLE`; `game-dev` CLI: unavailable.
- Status: `REVIEW`; do not mark DONE. Next: device QA, then per-impact boundary.

## L05c-e — per-impact boundary evidence (2026-09-07)

- Feature commit: `efab46434a36c805e6f0c5fe284c0827132d7ea2`; checkpoint: `523ff30c341ba5663924e83812d5f8adedad2083`.
- RED: 3 focused failures; GREEN: 10/10; full combat regression: 39/39; syntax: PASS.
- Production: `dpl_5AaCe8jwx53Xh7caas3UJQ5xMHca` READY, embedded battle 951694 bytes, runtime errors none.
- Production Chrome fixture: `finished`, 28 actions / 81 results / 219 impacts; impact snapshots 219/219, actions with boundary 28/28, final snapshots 28/28, fingerprint 282374be, `gaps=[]`.
- This is evidence for the current fixture path only. Device QA, connector-only npm/CI, Ticket Board, archive and `game-dev` remain blocked. Status stays REVIEW / IN_PROGRESS.

## L05c-f — semantic impact-case coverage (2026-09-07)

- Source commit: `4df4ff500d10e559ffff16ba5b265491fd8f896a`; checkpoint: `4ff19225cff5c243651c22caacdf791a4d816bd4`.
- RED: 3 focused failures; GREEN: 10/10; full combat regression: 39/39; syntax: PASS.
- Production deployment: `dpl_6Zu9TgEAKBcgwAxWcLz9KQRSxZXy` READY, embedded battle 952325 bytes, runtime errors none.
- Production fixture: 28 actions / 81 results / 219 impacts; type counts damage 38, death 6, dot 4, energy 133, heal 13, miss 5, status 20; semantic cases damage/heal/dot/status/multiHit all true; impact snapshots 219/219; final snapshots 28/28; gaps empty.
- Device QA, local npm/CI, Ticket Board, archive and game-dev remain blocked. Keep REVIEW / IN_PROGRESS.

## L05c-g — round-cap and full replay parity (2026-09-07)

Status: `REVIEW / IN_PROGRESS`; code commit `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`.

- The source-only evidence change publishes the fixture seed in
  `replayParity` beside the existing full-replay-rule-outcome fingerprint.
  No seed config, reward, balance, save migration, roster, art, audio or
  gameplay rule changed.
- RED: missing `replayParity.seed` assertion. GREEN: focused L05c parity
  test `4/4 PASS`. REFACTOR: full combat suite `39/39 PASS`, source/adapter
  syntax checks and `git diff --check` pass.
- Vercel code deployment `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is READY;
  complete-source build embedded `952395` bytes and selected runtime errors
  are `0`.
- Chrome production 1× and 2× both observed seed `l05a-production-seed`,
  fingerprint `86267582`, `93` actions, `644` impacts, authored round
  `15/15`, `roundsBeyondCap=0`, `roundCapReached=true` and `gaps=[]`.
  Completion speed is `1` vs `2`; visible result is `Khải hoàn` at
  `HIỆP 15/15`. Final 2× app-origin errors: `0`.
- Machine evidence: `docs/qa/L05c/l05c-round-cap-replay-parity.json`.

Device capabilities remain `[]`; Ticket Board is
`TICKET_BOARD_NOT_AVAILABLE`, archive is `SOURCE_NOT_AVAILABLE`, the
Game Development Studio CLI is absent, the local binary-asset checkout is
incomplete, and doctor/smoke scripts are absent. Keep `REVIEW / IN_PROGRESS`
and hand off device matrix plus Ticket Board claim/lock/evidence next.

