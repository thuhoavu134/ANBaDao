# Test Results

Loop: L04b-scene-lifetime-diagnostics
Status: PASS_WITH_BLOCKER / REVIEW
Date: 2026-09-08
Baseline: `f4ebe7dbe98dbcaabfca1554719562e7b0be454d`
Code revision: `4f8511bd52e2bd52eb79d44406b2b9153531f14c`

[PASS] red-evidence — `node --test tests/qa-scene-lifetime.test.mjs` on the
baseline had 2 real failures because the opt-in QA marker and diagnostics
schema were absent
[PASS] green-focused — the new QA contract is `2/2 PASS`
[PASS] refactor-focused — focused scene/route/return/roster suite is `32/32
PASS`; changed source/build-owner syntax checks and `git diff --check` pass
[BLOCKED] full-direct-tests — TAP run is `185 PASS / 37 FAIL` out of 222;
the connector checkout lacks `dist/`, binary assets and complete-source
fixtures, producing asset/ENOENT availability failures rather than a new
focused L04b failure
[BLOCKED] local-build — `node scripts/build-static.mjs` is blocked by
`assets/characters/luc-anh/idle-rgba-v1-atlas.webp.json` not being available
[PASS] vercel-build — `dpl_C4J7JGkqBB5PHjy4BZ6L8aZDiDXM` is READY from the
final code SHA; complete-source build embedded `952395` battle bytes
[PASS] production-runtime — selected Vercel runtime-error query is 0
[PASS] production-browser — normal route had no QA snapshot; active route had
one visible campaign root, 8 pending resources, timer/RAF/ResizeObserver 1 and
image cache 5; exit route disposed to 0; 12 re-entry loops kept one root and
stable active/exit resources; app-origin console errors were 0
[BLOCKED] device-matrix — browser capabilities `[]`; responsive Chrome and
Safari/iPhone/iPad backend unavailable
[BLOCKED] doctor-smoke — scripts absent (`SOURCE_NOT_AVAILABLE`)
[BLOCKED] ticket-board — `TICKET_BOARD_NOT_AVAILABLE` and
`BOOT_PROTOCOL_NOT_FOUND`
[BLOCKED] archive — `SOURCE_NOT_AVAILABLE`
[BLOCKED] agent-browser/game-dev — commands unavailable; no install or
credential change attempted

Machine evidence: `docs/qa/L04b/l04b-scene-lifetime-diagnostics.json`.
Ticket state remains `REVIEW / IN_PROGRESS`; do not mark `DONE` or `MERGED`.
