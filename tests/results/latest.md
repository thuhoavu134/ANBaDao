## 17/09 — Fix Bạch Diện Ultra v5 Bày trận flicker

- Root cause: `src/ui/campaign-scene.js` still read the old 94-frame/8-column contract after the Ultra v5 atlas replacement. This sent Canvas source rectangles outside the 32-frame idle and 45-frame run atlases, making Bạch Diện appear/disappear.
- Fix: Bày trận metadata now uses idle `32 frames / 6 cols` and run `45 frames / 6 cols`; pivot/foot/body remain unchanged.
- Evidence: all Ultra v5 atlas frames have non-empty alpha; focused runtime suite and full `npm test` pass.
- Main commit pending this verification: direct-main fix after `a68701b`; no combat numbers changed.

## 17/09 — Direct main rollback to Bạch Diện Ultra v5

- Extreme v6 was rejected in the actual game visual review because aggressive frame thinning caused visibly poor motion. Replaced the 8 Bạch Diện runtime atlases on `main` with the preserved Ultra v5 sampling: **269 frames**, native 480×440 character / 440×248 VFX cells.
- Canonical Canvas Sprite Runtime and hero/roster contracts remain unchanged; only asset atlas content, runtime metadata version, and matching regression expectations changed.
- Focused Bạch Diện runtime tests: 10/10 PASS. Full `npm test`: EXIT 0.
- Rollback checkpoint before this direct-main change: `226e99b` (`backup/main-pre-ultra-v5-20260917` local).
- Production deploy: not run.

# TKT-0155 — Baseline build/test cleanup

Date: 2026-09-16T17:08:25.913342+00:00

- Root causes fixed: CRLF-sensitive stale patch boundaries in `luc-anh-runtime-patch.mjs`, `player-progress-v1.mjs`, `linh-dong-timing-main-v1.mjs`, and `splus-runtime-v1.mjs`; already-integrated replacement handling added where needed.
- Restored repo-local dependencies with `npm ci`; `sharp@0.34.3` now resolves from the lockfile.
- Corrected Windows `file:///C:/...` path handling in `mobile-render-sfx.test.mjs` using `fileURLToPath`.
- Refreshed the captured source hash assertion and normalized transaction integration test fixtures to compare LF text.
- Added build-owner injection for Bạch Diện v6 after legacy patch owners so the generated `dist/battle.html` retains the v6 renderer.
- Focused regression: **34/34 PASS**. Full `npm test`: **EXIT 0**. Static build: **PASS**, embedded battle synced and Bạch Diện definitions/assets present in `dist`.
- Browser visual gate remains NOT_RUN/BLOCKED because the local AICoworker browser profile is attach-only and not running.

# TKT-0154 — Bạch Diện Extreme v6 verification

Date: 2026-09-16T16:24:25.341048+00:00
Revision under test: a297c6c + working-tree v6 metadata/test updates

## RED → GREEN

- RED: `node --test tests/bach-dien-v6.test.mjs` — 2 contract failures (metadata schema/encoding missing; fallback path assertion) after test path resolution was corrected.
- GREEN: `node --test tests/bach-dien-v6.test.mjs` — **3/3 PASS**.

## Runtime evidence

- UTF-8 HTTP smoke: `battle.html` served and contains `drawBachDienHero`.
- Asset HTTP smoke: all 8 Bạch Diện v6 atlas URLs returned HTTP 200.
- Local browser tool: **BLOCKED** because the AICoworker browser profile is attach-only and not running; no visual claim made.

## Broader pipeline

- `npm run build`: **BLOCKED by pre-existing baseline** `scripts/luc-anh-runtime-patch.mjs` missing faster Luc Anh FPS marker in `battle.html`.
- Full `node --test --test-concurrency=1 tests/*.test.mjs`: **not green** due pre-existing unrelated failures (missing `sharp`, stale embedded parity/transaction tests, and other baseline regressions); the focused Bạch Diện suite is green.

## Scope

- Extreme v6: 178 frames / 8.09 MB atlas package.
- Ultra v5 fallback remains outside the repo and was not deleted or overwritten.

---

# 2026-09-14 — TKT-0144 / EVIDENCE

Baseline `3accc0ed82261cba2c8adeb34a6dc9771abbb37e`. Linh Đồng lazy atlas cache and full-body scene binding.

- RED: 8 fail. GREEN: 8/8 pass. Related regression: 46/46 pass.
- Build and embedded battle byte parity PASS (1,458,341 bytes).
- Full local suite: 897 pass / 73 fail; checkout lacks upstream assets and supporting files. Not a full-suite PASS. GitHub CI PASS: build + 970/970 tests on runtime f3f071490c072278a9c5e4b52c5b79acd6de69fb, run 34820015965, PR #138. Owner explicitly approved uploading task source/docs/test logs to private bktimmy247/luc-than and creating a PR on 2026-09-14.
- Candidate browser BLOCKED (`net::ERR_BLOCKED_BY_CLIENT`); Safari/iPhone NOT_RUN; production NOT_DEPLOYED.
- Evidence: [L144 evidence](../../docs/qa/L144-LINH-DONG-MEMORY/evidence.json). [Handoff](../../docs/HANDOFF-LINH-DONG-CRASH-2026-09-14.md).

Earlier results below are historical and do not establish acceptance for this revision.

## 2026-09-09 — Owner-approved promotion to main

Owner reviewed candidate `2f8049cf6a0882503e4d45ab5275f8ad48aff8ff` and explicitly requested promotion to main. This supersedes the earlier no-production instruction. PR: https://github.com/bktimmy247/luc-than/pull/17. Preview `dpl_Ewq2LZDGiBJUrR9GDY13tAsEN6pV` is READY for that exact candidate. Main auto-deploys production; deployment completion must be checked against the resulting merge SHA.

Approved scope includes hero-detail UI, campaign preparation/green-tick reserve selection/result routing, and the S+ V2 continuation. Build PASS; latest local suite: 409 tests, 407 PASS and 2 failures due to missing sharp. Earlier 411/414 counts are historical checkpoints. Mobile/Safari and full visual acceptance remain open; fractional-duration mechanics remain REVIEW and must not be rounded. Owner release approval does not close those technical review gates or mark a Ticket Board item DONE.

The promotion merge changes documentation only relative to the approved candidate; runtime/assets retain the approved blob SHAs. Earlier status and no-production statements below are historical.

# Latest verified revision: 9decbaae

Crop follow-up uses a 12×12 source gutter after local review of all 126 cropped regions. S+ focused suite is **192/192 PASS**; the prior full-green checkpoint remains 414/414, while the current local rerun is blocked by missing `sharp` in two pre-existing image tests. The latest branch preview rendered the fire P/S1/Ult sample with the 12×12 viewBoxes, narrowed Nung S1 to one target, and cleared dialogs/targets after resolve and clean reload. [Scope/crop/restart evidence](../../docs/qa/L11-SPLUS-PROFILES/continuation-scope-crop-restart-20260908.json); prior 15-round battle evidence remains [here](../../docs/qa/L11-SPLUS-PROFILES/continuation-browser-battle.json). Art runtime, timing and mobile-device gates remain REVIEW/OPEN.

# L11 continuation — current source verification

`npm test`: build PASS, **414/414 tests PASS**. Baseline b6a2ae2 + continuation source in the handoff branch. [Scope/remaining gates](../../docs/L11-CONTINUATION-2026-09-08.md), [full log](../../docs/qa/L11-SPLUS-PROFILES/continuation-full-green.log). Browser/device/release tracked separately.

# Test Results

Loop: L10-SPLUS42 · Status: REVIEW / IN_PROGRESS · Date: 2026-09-08

Baseline: d3ee56cd1391208ae262652b383e5b7d443308c7

Code: 2314c2ef522e5ad1b5a88ee7cc058a0a36b87d89 → 889426acac6d3d860b3f945131969d93d8ce3107

## RED / GREEN / REFACTOR

- RED: `docs/qa/L10-SPLUS42/red.tap`, `kits-red.tap`, `browser-followup-red.tap`. Actual missing resolver and behavior failures.
- GREEN: `node --test tests/splus-combat.test.mjs tests/splus-kits.test.mjs tests/splus-runtime.test.mjs` — **133 PASS / 0 FAIL**, `green.tap`.
- Regression: `node --test tests/combat-domain-modules.test.mjs tests/combat-domain-module-parity.test.mjs tests/combat-domain-advanced-parity.test.mjs tests/scene-lifetime.test.mjs tests/splus*.test.mjs` — **151 PASS / 0 FAIL**, `regression.tap`.
- Covers all 84 skill effect cases plus passive/control/heal/DoT/target/seed/charge/expiry interactions, source/browser factory parity, unique fixture slots and existing scheduler reuse.
- REFACTOR: source factory is bundled directly; no second combat clock. Browser follow-up aggregates multi-hit floaters, preserves front tank slots and corrects action keys/controls.
- Syntax and `git diff --check` pass. No lint/typecheck script is configured separately.

## Build and production

- Local `npm test` and `npm run build` actually ran, blocked by missing authored `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`; logs `npm-test.log`, `local-build.log`.
- Partial compile blocked at missing Dinh Loi atlas. Targeted combat adapter compile passes; it is not a full build.
- Local Chrome URL is blocked by client. Real QA used production Chrome via control-browser.
- Vercel code deployment `dpl_32S8AqbZtK3mtQ1nBacTKsj5Wpgz`: READY, full `npm run build` completes in 5s; embedded payload synced **1,077,714 bytes**. Alias `https://luc-than.vercel.app/` assigned. Selected 1h runtime errors: **0**.
- Source fixture page: `https://luc-than.vercel.app/splus-lab.html` — 42 choices; six element filters each 7 heroes; healer filter 6 heroes.

| Selected hero | Final round | Actions | Events | Alive / unique slots | App errors |
|---|---:|---:|---:|---:|---:|
| Thiềm Ngân | 15 | 162 | 1803 | 12 / 12 | 0 |
| Mục Chiêu | 15 | 176 | 1589 | 12 / 12 | 0 |
| Dạ Xoa | 15 | 155 | 1341 | 8 / 8 | 0 |
| Hỏa Dực | 15 | 163 | 1813 | 12 / 12 | 0 |
| Mãng Xà | 13 | 139 | 1715 | 4 / 4 | 0 |
| Tố Linh | 15 | 156 | 1457 | 12 / 12 | 0 |

Totals: **951 actions, 9,718 events, 42 distinct hero actors**, six completed matches; finite HP and no duplicated slots among living units. These totals are from the latest code. The earlier Cửu Triều run (156 actions) is historical evidence only, excluded from these totals.

Normal Chinh chiến: 12 owned roster heroes, S+ panel absent, first battle victory at round 2 / 16 actions. Xác nhận advanced to the next BOSS; direct home return not verified separately. No app-origin console errors observed; extension metadata errors are excluded by recorded origin. Normal UI QA spent stamina/advanced the isolated browser save; no save schema or reward source changes were made.

Machine evidence: `docs/qa/L10-SPLUS42/evidence.json`, `production-six-elements.json`, `production-legacy-and-catalog.json`, `vercel-code-deployment.json`. Screenshots: `production-to-linh.jpg` (latest), `production-first-battle.jpg` (historical first code).

## Open gates

- Device capabilities `[]`; Safari/iPhone/iPad/device QA unavailable.
- Ticket Board/claim/lease/lock, doctor/smoke, agent-browser and game-dev CLI unavailable; no fabricated claims or locks.
- Full local test/build requires the authored binary package. Vercel build success does not turn local `npm test` into PASS.
- Authored 42 hero atlases and 42 HUD images have not been supplied. Current tokens are clearly marked temporary; icon manifest is metadata only.
- Missing numeric values, stacking caps and duration defaults remain review decisions in `docs/SPLUS42-COMBAT-CONTRACT.md`.
- Browser coverage does not assert every skill was cast, speed/replay matrix, device parity, Tower balance, or complete L04 return-navigation acceptance.
- Remain REVIEW / IN_PROGRESS. Next handoff: review defaults and supply art; then approved roster unlock integration, device/replay QA and real board handoff.


## Historical main handoff additions (03d4fdf)

# Test Results

## 2026-09-08 — L11 handoff, REVIEW / IN_PROGRESS

Source được kiểm tra: [b6a2ae20a9b1b3071a8f5263740312e9d1465b04](https://github.com/bktimmy247/luc-than/commit/b6a2ae20a9b1b3071a8f5263740312e9d1465b04), nhánh `handoff/l11-splus-profiles-v2-20260908`. Main chỉ cập nhật docs/evidence. **L11 chưa GREEN và chưa deploy production.**

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| `node --test --test-reporter=tap tests/splus-profiles.test.mjs tests/splus-v2.test.mjs` | **23 test:17 PASS,6 FAIL** (profiles3/3; combat14/20) |
| `node --test --test-reporter=tap tests/splus-combat.test.mjs tests/splus-kits.test.mjs tests/splus-runtime.test.mjs` | **133 test:117 PASS,16 FAIL**; phân loại kỳ vọng V1 và regression thật |
| `node --check` JS/MJS thay đổi | **17/17 PASS** |
| `git diff --check` | **PASS** tại checkpoint source |
| `npm test` / build | **EXIT1**, thiếu asset local `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`; chưa tới full suite. File gốc có trên GitHub |
| Browser V2 / crop126 icon / production V2 | **NOT_RUN / NOT_DEPLOYED** |
| Device/Safari V2 | **NOT_RUN**, backend unavailable; capability lịch sử `[]` |
| Workflow | RED ghi nhận, GREEN một phần, REFACTOR chưa xong; active `red-green-refactor` |

Sáu test mới fail: Cơ Trọng khiên casterHP; Tiêu Hồn rageBan; Trầm Châu bubble shield; Tuệ Y most-recent resurrection; Khaos shield bypass; Hồi Ảnh forced friendly attack. Nhiều S1/Ult khác vẫn handler V1, còn audit đủ84handler và shared mechanics.

[Bàn giao Luna](../../docs/LUNA-HANDOFF-SPLUS-PROFILES-2026-09-08.md) · [Machine checkpoint](../../docs/qa/L11-SPLUS-PROFILES/handoff-checkpoint.json) · [Targeted TAP](../../docs/qa/L11-SPLUS-PROFILES/handoff-targeted.tap) · [Existing S+ TAP](../../docs/qa/L11-SPLUS-PROFILES/handoff-existing-splus.tap) · [Build log](../../docs/qa/L11-SPLUS-PROFILES/handoff-npm-test.log) · [Syntax](../../docs/qa/L11-SPLUS-PROFILES/handoff-syntax.json).

## Lịch sử trước checkpoint L11

Các con số PASS và production QA bên dưới thuộc L10 hoặc lát cắt trước; không được dùng để đánh dấu L11 hoàn thành.
