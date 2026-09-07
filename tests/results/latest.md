# Test Results
Loop: L04a-stale-draft-revision
Status: PASS_WITH_BLOCKER
Date: 2026-09-07
Revision: 6e1bb9c28538ee65355f59f8bf6601b9934807d2

[PASS] red-evidence — new build-owner assertion failed because live draft revision propagation was absent
[PASS] green-focused — return-context + scene-lifetime + campaign tests 19/19 PASS
[PASS] refactor-syntax — return-context/domain syntax and git diff checks pass
[PASS] vercel-build — dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb READY; source 6e1bb9c; embedded battle 952325 bytes
[PASS_WITH_BLOCKER] production-browser — campaign root 1/visible and roster root 1/visible with 12 cards; app-origin errors 0; hero-card → detail route was not stable and is not claimed PASS
[PASS] runtime-errors — Vercel selected 1h window reports no runtime errors
[BLOCKED] local-full-suite — connector checkout all-test run has missing dist/full assets; failures preserved
[BLOCKED] local-build — missing assets/characters/luc-anh/idle-rgba-v1-atlas.webp.json in connector checkout
[BLOCKED] doctor-smoke — scripts/doctor.mjs and scripts/smoke.mjs are absent
[BLOCKED] device-matrix — Safari/iPhone/iPad and responsive device backend unavailable
[BLOCKED] ticket-board — scripts/ticketctl.mjs and Ticket Board connector unavailable
[BLOCKED] archive — SOURCE_NOT_AVAILABLE
[BLOCKED] game-dev — CLI not installed in environment
- `game-dev` CLI của Game Development Studio không tồn tại trong môi trường (`command not found`), không tự cài/thay credential.
- Ticket Board: `TICKET_BOARD_NOT_AVAILABLE`; archive mẫu: `SOURCE_NOT_AVAILABLE`.
- Browser device backend: `[]`; chưa có Chrome responsive hoặc Safari/iPhone/iPad backend.
- Hero detail browser path cần được retest/fix trong lát cắt L04a tiếp theo; không dùng route failure này để claim stale-revision UI acceptance.
