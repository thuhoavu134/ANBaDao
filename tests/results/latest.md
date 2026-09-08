# Latest verified revision: 4a79095

Full build/tests411/411 PASS; Chrome preview battle15 rounds139 actions1649 events. [Final source log](../../docs/qa/L11-SPLUS-PROFILES/continuation-final-full-green.log); [actual browser JSON](../../docs/qa/L11-SPLUS-PROFILES/continuation-browser-battle.json). Art/timing/restart/device gates OPEN.

# L11 continuation — current source verification

`npm test`: build PASS, **411/411 tests PASS**. Baseline b6a2ae2 + continuation source in the handoff branch. [Scope/remaining gates](../../docs/L11-CONTINUATION-2026-09-08.md), [full log](../../docs/qa/L11-SPLUS-PROFILES/continuation-full-green.log). Browser/device/release tracked separately.

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
