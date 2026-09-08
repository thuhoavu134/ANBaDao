# Test Results

Loop: L10-SPLUS42
Status: REVIEW / IN_PROGRESS
Date: 2026-09-08
Baseline: d3ee56cd1391208ae262652b383e5b7d443308c7

- RED: docs/qa/L10-SPLUS42/red.tap and kits-red.tap (real failures).
- GREEN/REFACTOR: regression.tap — 150 PASS / 0 FAIL, includes 84 skill effects and source/browser factory parity.
- Local npm test/build: BLOCKED by missing authored atlas part; logs retained.
- Local partial compile: BLOCKED at missing Dinh Loi binary. Targeted combat adapter compile PASS, not full build.
- Local Chrome server: BLOCKED_BY_CLIENT. Production baseline UI accessible; new deployment QA pending.
- Device: capabilities []. Board/claim/lock and doctor/smoke/agent-browser/game-dev unavailable.
- Art42 and missing numeric balance decisions remain REVIEW. No DONE/MERGED.
