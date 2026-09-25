# Handoff: battle entry lifecycle — 2026-09-24

## Current shipped state

- PR [#209](https://github.com/bktimmy247/luc-than/pull/209) merged to `main`.
- Merge commit: `9102b874f08966a3873c1cf3718c3c98aa586a2d`.
- Vercel production deployment: `dpl_3dRP7nNQiM6oxNCWFcMNGCCwU8Rh`, READY.
- Production aliases include `luc-than-amber.vercel.app`; the live root returned HTTP 200 and includes the new host atlas owner/suspend path.
- Scope: host battle atlas lifecycle and hidden rendering while integrated battle is open.

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

