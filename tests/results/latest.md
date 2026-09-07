# Test Results

Loop: L05c-round-cap-replay-parity
Status: PASS_WITH_BLOCKER / REVIEW
Date: 2026-09-07
Baseline: `5ca7c3caee449a5705a6ffd0df9b693f5ace1cb6`
Code revision: `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`

[PASS] red-evidence — focused parity contract failed because
`report.replayParity.seed` was undefined on the baseline
[PASS] green-focused — `tests/combat-l05c-parity.test.mjs` `4/4 PASS`
[PASS] refactor-combat — `node --test --test-concurrency=1 tests/combat-*.test.mjs`
`39/39 PASS`
[PASS] syntax-diff — changed source/adapter syntax checks and `git diff --check`
[PASS] vercel-build — `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` READY from the code
SHA; complete-source embedded battle payload `952395` bytes
[PASS] production-browser-1x — round `15/15`, no round `16`, seed
`l05a-production-seed`, fingerprint `86267582`, `93` actions, `644` impacts,
`roundsBeyondCap=0`, `gaps=[]`, visible `Khải hoàn`
[PASS] production-browser-2x — same seed/fingerprint/counts and cap report,
completion speed `2`, visible `Khải hoàn`; final app-origin errors `0`
[PASS] replay-parity — same seed, fingerprint, action count and impact count at
1× and 2×; only completion speed differs as intended
[PASS] runtime-errors — selected Vercel 1-hour query reports no runtime errors
[BLOCKED] local-build — connector checkout lacks complete binary assets; local
build is not representative of the complete source
[BLOCKED] doctor-smoke — `scripts/doctor.mjs` and `scripts/smoke.mjs` absent
[BLOCKED] device-matrix — capabilities `[]`; responsive Chrome and
Safari/iPhone/iPad backend unavailable
[BLOCKED] ticket-board — `scripts/ticketctl.mjs` and Ticket Board connector
unavailable
[BLOCKED] archive — `SOURCE_NOT_AVAILABLE`
[BLOCKED] game-dev — CLI not installed; no install or credential change attempted

Machine evidence: `docs/qa/L05c/l05c-round-cap-replay-parity.json`.
Ticket state remains `REVIEW / IN_PROGRESS`; do not mark `DONE` or `MERGED`.
