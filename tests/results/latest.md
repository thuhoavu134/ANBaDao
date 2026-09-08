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
