# Handoff: battle entry lifecycle — 2026-09-24

## Current shipped state

- PR [#209](https://github.com/bktimmy247/luc-than/pull/209) merged to `main`.
- Merge commit: `9102b874f08966a3873c1cf3718c3c98aa586a2d`.
- Vercel production deployment: `dpl_3dRP7nNQiM6oxNCWFcMNGCCwU8Rh`, READY.
- Production aliases include `luc-than-amber.vercel.app`; the live root returned HTTP 200 and includes the new host atlas owner/suspend path.
- Scope: host battle atlas lifecycle and hidden rendering while integrated battle is open.

## Follow-up: iOS entry recovery (PR #213)

- Merged as `ff4b9af90adec7b2e19b1aed400fda5d912b86e0`; Vercel production deployment `dpl_CMBKbTdvU1ANCgXDdf9i3bNQtDTq` reached READY.
- The generated production host now changes the iPhone loading message at 1.8s and performs a same-session full-page battle handoff after 6s if `battle-ready` has not arrived. Desktop keeps the iframe flow.
- PR preview `dpl_9fZY5Gy5CGHmza1VJFrXkWSQu66d` reached READY. Focused fallback test passed 1/1; `node --check` passed for the build owner and test.
- CI run `36006806522` failed before any job step (no runner/steps; log endpoint returned BlobNotFound). This matches the earlier runner issue. Physical iPhone Safari entry/return remains to be verified.

## What changed

- `scripts/host-battle-resources-v1.mjs`: lazy host atlas owner, release/suspend/resume, render loop pause, iframe-first close ordering.
- `scripts/ios-battle-direct-enter-v1.mjs`: invokes lifecycle patch as part of static build.
- `tests/host-battle-entry-lifecycle.test.mjs`: checks 19 eager allocations, suspension/release, hidden render, restore ordering.
- `scripts/qa-host-battle-entry.mjs`: desktop + iPhone UA/DPR path, real host campaign challenge controls, two entry/exit cycles.
- `.github/workflows/ci.yml`: runs the host-entry browser QA and uploads evidence.
- Detailed audit: [battle-entry-lifecycle-20260924.md](qa/battle-entry-lifecycle-20260924.md).

## Evidence and remaining limits

- Vercel production build is READY for merge commit `9102b87`. Live root responds 200 with the lifecycle patch present.
- Lifecycle/cache targeted tests: 10/10 against the exact preview HTML.
- Expanded local sample: 31/35. Four failures reproduced on the baseline: BGM source-expectation mismatch, close BGM assertion, legacy hunt pause assertion, constrained idle atlas pinning. See audit document for detail. Do not report the entire suite as green.
- GitHub Actions run `35977367339` failed before steps began; a rerun did the same. Logs/annotations could not be retrieved through the connected GitHub surface, so the precise infrastructure cause is unknown.
- Preview skill-test initialized a real 6v6 and progressed; later reset was blocked by Vercel authentication in the embedded frame.
- Physical iPhone/WebKit, complete host battle exit/re-entry, audio continuity, total device RAM and frame rate remain unverified. No claim of crash-free iPhone behavior.

## Next agent: do this next

1. Start from the current `main`, confirm HEAD is `9102b874` or later, and read this handoff plus the audit.
2. Diagnose why GitHub Actions exits before any workflow step. Retrieve the runner annotation/log or trigger a clean run; do not weaken CI or hide the four baseline failures.
3. Run the corrected `qa-host-battle-entry.mjs` against a deploy that does not gate its battle iframe behind Vercel auth. Verify actual campaign → battle → close → re-entry on desktop and iOS Safari/WebKit if available.
4. Reconcile the four existing failures with their source owners. In particular, inspect the constrained-mobile idle pin: preserve authored image resolution and ensure idle visibility doesn't starve active action leases.
5. Check battle and result audio through the actual interaction path after close/re-entry.
6. Update this handoff with new commit/deploy/test evidence. Do not claim the user’s iPhone crash is resolved until tested on-device.
## Follow-up: iPhone intro held by synchronous BGM setup (PR #215)

- Merged to `main` as `0e552bde43120ef9a7038f4bbe9b8a49ceb900e6`; Vercel production deployment `dpl_2vLifVEq78JoS5kP9y7Af3bK2HyS` reached READY.
- Production alias `luc-than-amber.vercel.app`: root and `/battle.html` returned HTTP 200; live battle HTML was modified at 2026-09-24 14:47 UTC and contains the fail-open BGM guard.
- Root cause: on the iOS direct-battle page, a synchronous media setup exception occurred before `resetBattleState("battle")`. The auto-start retries caught the exception, leaving the intro visible.
- `scripts/battle-enter-audio-v1.mjs` now contains the full BGM setup in a fail-open guard; `tests/battle-entry-autostart-audio.test.mjs` covers the synchronous failure.
- Focused runtime harness against the actual deployed battle HTML forced AudioContext and `Audio` construction failures; battle reset still ran. Result: PASS. Vercel preview for `4ade11538ac86a4f5aeb2e213ac42f85256f28cc` was READY.
- GitHub Actions run `36012473643` and its retry ended before any job step (`steps: null`); log retrieval returned Azure `BlobNotFound`. Full CI suite is not verified.
- Physical iPhone Safari/WebKit interaction and full battle progression remain UNVERIFIED. The focused harness is not device QA.


## Follow-up: iPhone WebKit Canvas bootstrap (PR #216)

- Merged to `main` as `1a444642fc5b96ac2119f94108d91d133d403b29`.
- Production deployment `dpl_Dd3nG5KkCNNZLXmywrQ3syBCLn7F` reached READY. The live `luc-than-amber.vercel.app/battle.html` now contains the WebKit-safe Canvas owner and immediate embedded autostart; a fresh direct production run reached `HIỆP 01/15` with the intro absent.
- Device evidence showed the page had read the 6v6 configuration but stopped before the render loop and handlers: black arena, `HIỆP —/15`, intro still visible. The matching synchronous stop point was the single Canvas request using `{alpha:false, desynchronized:true}`, followed by a throw when no context was returned.
- `scripts/battle-entry-fail-open-v1.mjs` now avoids `desynchronized` on low-memory/iOS profiles, retries safer Canvas configurations, and invokes `beginBattle()` immediately after intro state preparation while retaining the existing timer retries.
- `scripts/ios-battle-direct-enter-v1.mjs` bumps the direct document token to `20260924-canvas1`.
- Focused TDD: baseline 0/3, candidate 3/3; both changed patch modules pass `node --check`. Vercel preview `dpl_3TUZFoMAPysP4X1MREVBPZLu1JmS` reached READY.
- GitHub Actions run `36018124099` failed before any step began (`steps: []`), so no Actions assertion ran. Physical iPhone/WebKit progression remains owner verification; responsive Chromium is not device evidence.
