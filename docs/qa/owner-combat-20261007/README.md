# Formation cells and opening Basic — 2026-10-07

Review-only change for owner reports: gray empty formation cells, opening attack losing no HP, and perceived turn-order reversal. Runtime revision a92df74f13ba4d3d4c989aa96ce7f8594bf79774; Draft PR #285. Main remains 0cf636aca931265ac236f9f4eb8548c214c312d8. No merge or production promotion.

## Changes and diagnosis
- Empty preparation buttons no longer paint their full hit area. A small oval plus marker retains discoverability, selection, keyboard focus and the original add/remove/drag event owner.
- Fixed omitted action arguments at versioned Basic dispatch sites. The predicate required `action === "basic"`, but callers supplied only the actor. This skipped Ông Phở's authored two-contact Basic branch, second-hit plan and +15 rage, and ignored other versioned Basic multipliers. A bounded idempotent late build patch fixes callers after authored runtime owners.
- The opening first contact in the reproduced guest fight was an actual MISS (combat log confirms it). Do not force a hit or bypass evasion/shields. After restoring the second contact, full roster target HP goes 605→400 and Ông Phở gains 51→66 rage. Partial 3-hero roster target shield goes 109→0 and HP 605→574; rage 43→58.
- Turn order is not changed. Source and actual browser trace agree: higher total living-team rage starts each round (ties player), then alternating same-numbered slots 0..5; empty/dead slots are skipped. Removing heroes preserves slots 0,1,3. Full and partial first-round actual actor sequences exactly match their queued order. The leading side can change between rounds. If the owner expects fixed initiative or a different alternation rule, that product choice still needs clarification; do not claim an ordering bug was fixed.

## Verification
- RED: baseline gray CSS assertion fails; generated resolver regression fails with multiplier 1 instead of 0.868 / 1.7, missing authored Basic plan/rage. Baseline actual-browser diagnostics: runs 37620985183 and 37621766165.
- GREEN: 6/6 focused generated-runtime/formation tests; actual guest mobile 390×844 full/partial roster browser run 37622337541 passes with no runtime exceptions. Gỡ→empty slot→add→remove verified by actual clicks. Preparation screenshot inspected: no gray rectangles, three small plus markers.
- Full test suite: 1667/1667 passed. CI/CD run 37622344596 build, tests and VFX browser QA pass; job fails at artifact upload because GitHub storage quota is exhausted, so downstream jobs there are skipped. This is not a green CI job.
- Separate full-game audit run 37622337544: PASS: full build/tests, instant skip real victory/defeat and host reentry, owner roster/result flow, actual AFK canvas, formation/AFK geometry, real host entry/return and every-screen inspection.
- Vercel preview READY and HTTP 200: https://luc-than-eg1b57pgu-nyto1.vercel.app . Deployed host contains transparent slot rule; battle contains corrected Basic dispatch with no omitted-action calls.
- Physical iPhone/Safari not tested. No new assets, economy/save migrations, initiative changes or reward changes.
- Ticket Board waiver carried from the existing session; no ticket claim or board transition fabricated. VibeLab run 20261007-192310-2r3cw30, REVIEW handoff after verification. Rollback this slice by reverting a92df74; retain prior instant-skip fix.
