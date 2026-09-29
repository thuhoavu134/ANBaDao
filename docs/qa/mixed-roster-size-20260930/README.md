# Mixed-roster stature correction

The user’s mobile screenshot showed Linh Đồng and Bạch Diện still much smaller than their allies after PR #241. That change registered each hero’s clips against its own idle pose but retained cross-roster shrink factors of 0.57 and 0.61. The earlier test used silhouette diagonal, which counted particles and wide accessories as character stature.

This correction measures opaque standing-body height at the production draw size. Ông Phở is 310 world pixels and Đình Lôi is approximately 300. Linh Đồng’s registered idle is 335 and Bạch Diện’s is 395, so the two identity scales are now 310/335 and 310/395. The runtime table is generated from the same exported values. Existing per-clip registration, movement, mirroring, mobile framing and depth scale remain in place.

## Visual evidence

These are offline Skia Canvas2D renders of the generated production `drawUnit`, `drawSplusToken`, authored hero draw functions and actual RGBA atlases. They are **not live browser screenshots or proof of deployment**. The harness substitutes a plain background and simple team bars; game HUD, combat interactions and network loading are outside its scope.

Each side contains Bạch Diện, Linh Đồng, Lục Ảnh, Thầy Mo, Đình Lôi and Ông Phở. The same formation is rendered before and after with production viewport/depth transforms. The camera intentionally preserves the existing compact framing. All poses in these comparison images are idle; attack and ultimate size continuity are checked by the asset regression test and existing registration tests.

| Viewport | Before | After |
| --- | --- | --- |
| Mobile 390×739, DPR 2 | `before-mobile.webp` | `after-mobile.webp` |
| Desktop 1280×800 | `before-desktop.webp` | `after-desktop.webp` |

The comparison images were reviewed locally and are not checked into this PR. Running the reproduction script below creates them.

[Measured renderer bounds](report.json) contain both teams. Before the viewport camera transform, the mobile middle-row body heights change from 97 to 159 pixels for Linh Đồng; Đình Lôi at the same depth is 154. Top-row Bạch Diện changes from 108 to 139; Thầy Mo with his tall hat is 151. Small one-pixel differences between mirrored sides come from rasterization.

## Verification

- The new real-asset regression fails against the old scales: Linh Đồng idle measures only 0.616 of Ông Phở at equal depth.
- It passes after the correction for both heroes, idle/basic/ultimate, both teams, three formation depths, and four viewports (390×739, 393×747, 430×827, 1280×800). Each measured standing pose must be 95–108% of both reference peers at equal depth.
- Focused checks: **15 passed**.
- `npm test` (real-asset build plus full suite): **1,377 passed**, zero failures/skips.
- [Recorded test results](test-results.txt).

To reproduce the optional visual evidence, build the project, make `@napi-rs/canvas` available alongside the existing `sharp` dependency, then run `node docs/qa/mixed-roster-size-20260930/render-evidence.mjs`. The before render substitutes only the scale table from main `76d17e4`. The optional renderer is not a game dependency or part of `npm test`.
