# Test Results

Loop: L04b-preparation-timer-scope
Status: PASS_WITH_BLOCKER / REVIEW
Date: 2026-09-07
Baseline: `f2ff2ef14df703a1ad6cc31bf884d95ce94764d8`
Code revision: `5bea38657178c70b39ddce55f3d1866242940dbb`

[PASS] red-evidence — `node --test tests/scene-lifetime.test.mjs` failed on
the baseline with 5 pass / 1 fail because the preparation timer had no
`trackSceneTimer` scope contract
[PASS] green-focused — `tests/scene-lifetime.test.mjs` `6/6 PASS`
[PASS] refactor-focused — scene lifetime, return-context and roster route
checks `11/11 PASS`; changed-source syntax and `git diff --check` pass
[BLOCKED] full-direct-tests — `181 PASS / 37 FAIL`; connector checkout lacks
`dist/`, binary assets and some complete-source fixtures, so failures are
ENOENT/asset availability blockers rather than a feature-pass claim
[BLOCKED] local-build — `npm run build` stops because
`assets/characters/luc-anh/idle-rgba-v1-atlas.webp.json` is unavailable
[PASS] vercel-build — `dpl_A4rM7BwWDW6xzqzM6iHyjCvuf5VB` READY from the code
SHA; complete-source build embedded `952395` bytes
[PASS] production-runtime — selected Vercel 1-hour runtime-error query is 0
[PASS] production-browser — 10 independent Chrome CDP cycles opened
`Chuẩn bị đội hình` and returned to campaign home through semantic UI actions;
one campaign root, `120/120` stamina preserved, app-origin errors 0
[BLOCKED] device-matrix — browser capabilities `[]`; responsive Chrome and
Safari/iPhone/iPad backend unavailable
[BLOCKED] doctor-smoke — scripts absent
[BLOCKED] ticket-board — `scripts/ticketctl.mjs` and Ticket Board unavailable
[BLOCKED] archive — `SOURCE_NOT_AVAILABLE`
[BLOCKED] game-dev — CLI unavailable; no install or credential change attempted

Machine evidence: `docs/qa/L04b/l04b-preparation-timer-scope.json`.
Ticket state remains `REVIEW / IN_PROGRESS`; do not mark `DONE` or `MERGED`.
