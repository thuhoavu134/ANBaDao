# Battle entry lifecycle audit — 2026-09-24

Baseline: `310418ed751982e600820c9f89c25f133e8a0c2e`.
Branch: `fix/battle-entry-lifecycle-20260924`.
Tracking: battle-entry-lifecycle-20260924, REVIEW pending CI.
VibeLab run: `20260924-173724-expvx0d`.

## Change brief / contract

Goal: stop loading and retaining unused host battle art while the real battle runs in an iframe.
Scope: host image lifetime, old host draw loop, close ordering, generated-output tests, host browser QA.
Keep authored atlas sources/resolution, combat math, save/rewards, BGM/SFX ownership.
Acceptance:
- A1: no 19 eager host atlas requests on boot; visible art loads lazily at original resolution.
- A2: suspend releases detached Images and prevents reacquisition/hidden legacy draw while iframe battle is open.
- A3: close blanks iframe before resuming host; repeated entry works with existing audio.
- A4: full build/test plus real browser entry/exit/reentry and existing combat/results regressions.

## Verified findings

Production HTML fetched from luc-than-amber.vercel.app matched the baseline host source:
- LUC_ANH_IMAGES eagerly creates 11 Images; source metadata totals 247,193,600 decoded RGBA bytes (~235.74 MiB) if all are decoded. This is an estimate of these atlases, not observed total process RAM.
- Two identity atlases and six pose atlases also load eagerly.
- These Images are not DOM nodes. The previous querySelectorAll('img') cleanup cannot release them.
- renderLoop still calls drawVnStars and drawBattle behind the integrated iframe.
- closeOverlay restored host images before setting the child to about:blank.

## RED / GREEN

Behavior tests against fetched production output: 0/4 pass, 4 fail:
19 initial image requests (expected 0); missing host lifetime owner; 2 hidden draws (expected 0); premature restore.
After patch: 4/4 pass. All 69 inline classic scripts in transformed production output parse.
This targeted run is NOT the full build; GitHub Actions will build from full repository sources and run the entire suite.

## Implementation

One host atlas owner with native Image objects and lazy property getters.
Suspend clears all owned src attributes and rejects new host admissions while battle runs.
The single legacy RAF loop remains scheduled but skips draw work while suspended; resume creates no new loop and reloads no images until requested.
Close restores host after iframe navigation. Existing BGM player/audio bus is unchanged.

## Verification pending

CI full source build, all Node tests, host entry QA desktop + iPhone UA/DPR path, existing VFX/authored/result suites.
Physical iPhone/WebKit, total device RAM and frame-rate: NOT_RUN.
Ticket Board CLI/connector unavailable; previous owner permission to continue source/test without board is recorded in docs/vibe-brief.md. No lease or board transition is fabricated.
Rollback: revert the task commit/PR; no save migration.
