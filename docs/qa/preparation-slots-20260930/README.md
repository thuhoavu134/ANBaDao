# Preparation idle and formation targeting

Baseline: main `3450853c63df7dbf51a38b954af281fbdacb903b` (PR #243).

Owner report: Linh Đồng appears as a cropped portrait and Lục Ảnh uses the wrong pose in Bày trận; turns and ordinary targets do not follow vertical formation slots.

## Fix

- The six authored idle atlases total **85.353 MiB** decoded, exceeding the mobile campaign cache's **64 MiB** limit. The portrait fallback exposed the wrong art when an idle could not be admitted.
- `scripts/campaign-preparation-idle-v1.mjs` now generates lossless 24-frame pages plus the first full-body idle frame from the final build descriptors. The renderer leases the current page, next page and small idle fallback. The maximum active idle set is **50.992 MiB**. This is decoded idle memory, not total device RAM; the existing cache admission cap still applies.
- All **432 original frames**, native cells, alpha, fixed pivots, feet and durations are preserved. Bày trận never substitutes the bust/portrait for these authored idle packs. Normal animation resumes as its page becomes ready. Farming and the previously approved battle size/visibility owners remain intact.
- S+ battles now use the same slot-ordered queue as ordinary battles. Internal slots 0–2 are UI slots 1–3 down the front column; internal slots 3–5 are UI slots 4–6 down the back column. Team initiative and explicit extra-turn/delay effects retain their existing behavior.
- Default targeting considers living front slots first, otherwise back slots; it chooses the same vertical row, then the smallest remaining slot in that column. Example: attacker UI slot 2 targets enemy slot 5 after the front is empty; if 5 is dead, choose 4 before 6.
- Default/basic target selection agrees across Core, S+, preview and action entry; S+ damage also revalidates the target. A stale or manual basic target cannot bypass the front. Mixed-battle legacy healers retain ally targeting. Authored skill scopes (AoE, support, specialist target rules) and status effects retain their own semantics.

## Evidence

- Three initial regression tests failed on the baseline: S+ speed ordering, front/facing target selection, and mixed-party legacy target routing.
- Full real-asset build and **1,399 Node tests PASS** (zero failures/skips).
- Target matrix: both teams × all 6 actor slots × all 64 living/dead enemy patterns; Core also covers striker/ranger/mystic/healer. A damage-level test passes a stale/wrong target and verifies HP is removed from the required slot.
- Every visible RGBA pixel in every generated idle frame matches the original source cell, including the padded Thầy Mo source. Animation clocks cover all frames with unchanged pivots.
- The real campaign cache and scene image owner complete a simulated 24-second page cycle for six heroes under 64 MiB without a budget denial and release all resources on clear. This simulates successful asynchronous image loads; it is not a device performance benchmark.
- `render-evidence.mjs` runs actual generated `drawSceneContents` in offline Skia against real assets at 390×310 and 768×610 CSS pixels. Waiting-page and animated-page images were reviewed: Linh Đồng and Lục Ảnh are full-body idle poses; mirrored enemies render too. Source pixels are exact; small resampling-edge differences between a standalone idle and an atlas crop are recorded in `report.json`.
- Optional local images are reproduced by the evidence script; only source and text reports are committed. No synthetic UI screenshot is presented as live browser evidence.

Interactive browser, physical iPhone/Safari and production deployment: **NOT VERIFIED** for this patch. Prior CI billing and Vercel project-access failures are external to the passing local build/tests. The owner explicitly waived the workflow gate and authorized merge in the conversation; repository protections and billing settings are unchanged.

## Reproduce

```sh
npm test
node docs/qa/preparation-slots-20260930/render-evidence.mjs
```

The optional render script needs `@napi-rs/canvas` in the QA environment. Production build and the tests only use the existing `sharp` dependency.
