# Loading optimization — 2026-10-07

Baseline main cc6bbfe36ab5578de6eb918bf9a3e46e019f4ea7 (owner-approved PR #285 merged). New branch perf/loading-20261007; Draft PR #286, REVIEW only. Runtime revision 29ecbd04c787bdc93413cb7025d5635fca3a1fa1.

## Measured bottleneck and scope
Real cold Chromium login/hub/preparation/battle profile (run 37636058665) showed 8.49 MB citadel, 2.65 MB foreground, shared menu PNGs up to 0.99 MB each, and a 2.56 MB battle background. These assets were downloaded on the normal guest path.
Build-time lossless WebP companions now replace 23 menu icons and 3 measured backgrounds in the final host and battle documents, including existing dynamic menu templates. Source PNGs remain unchanged. No resizing, palette reduction, new runtime cache, combat timing/math, save, reward or animation changes.
Legacy friends.png is truncated (327680 bytes; libpng/libspng read error). The shipped hub already switches to friends-v2.png; the build now selects that same canonical visible icon from first paint and excludes the obsolete broken file.

## Evidence
- RED: identity build did not replace literal/template references or emit the derivative (2 failed focused cases).
- GREEN: 2 focused tests pass: reference mapping/idempotency, preservation of source bytes, dimensions, alpha and every visible RGB value.
- Real build checks every visible pixel of all 26 assets against its decoded original; mismatch fails the build.
- Encoded total: 25,055,307 -> 18,625,472 bytes, saving 6,429,835 bytes (25.66%). This is selected asset transfer size, not total RAM or overall frame-rate improvement.
- Clean build and 1673/1673 full tests PASS.
- Loading profile run 37638060432 PASS: real guest login/hub/preparation/battle at 390x844 and 1280x844, runtime exceptions 0, asset HTTP errors 0. Browser requests the new companions.
- Host entry/re-entry and all-screen interaction audit PASS in that same run. Mobile/desktop hub screenshots and mobile battle screenshot inspected; canonical icon shapes, alpha and backgrounds retained.
- CI/CD artifact quota is a separate existing infrastructure limitation; dedicated profile/audit logs are available without artifact uploads.
- Baseline first-two-actions time: 5098/5132 ms (mobile/desktop); candidate 4932/5517 ms. These include authored animations, are single local runs and do NOT demonstrate a consistent timing speedup. Candidate adds a hub screenshot, so downstream host timestamps are not directly comparable. The proven gain is transfer-byte reduction.
- Physical iPhone/Safari and real mobile-network timing NOT_RUN. Decoded memory is unchanged.

## Handoff
No merge or production promotion. Owner reviews PR #286 and the new preview. Keep the accepted gameplay from PR #285.
Next bounded performance work: isolate login video, first-use audio and character atlas waiting on an actual slow network/device; do not shorten authored actions or preload all atlases to mask waits.
VibeLab run 20261007-211930-2gxg6l2; existing unavailable Ticket Board waiver persists, no fabricated claim or ticket transition.

Preview verified READY, host/report HTTP 200: https://luc-than-cghu76a5i-nyto1.vercel.app/ . Deployed report matches 18,625,472 bytes and host uses lossless companion paths.
