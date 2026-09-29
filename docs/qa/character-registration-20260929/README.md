# Character clip registration — 2026-09-29

Baseline: `52153e0147313feadc874f9dd0f5122cad1433e3` (PR #240).

The previous patch stabilized formation depth and the regular/S+ render paths but did not fix differences already baked into the atlas cells. The complete repository archive was retrieved from GitHub; no replacement art was requested or generated. Original atlas bytes are unchanged (see `source-sha256.json`).

## Root cause and fix

Linh Đồng's six character atlases all have 480×440 cells, but each clip was fitted from a different source crop. The real alpha unions confirm 448 px content width with 16 px side/bottom padding; their heights match the manifest crops fitted with one uniform scale per clip. Idle's 1296 px source crop and Ultimate's 1696 px crop therefore give different character sizes when drawn into the same destination rectangle.

`registrationFromCrop` reverses that packing transform into Idle's source-camera coordinates. It restores both scale and crop translation, including the foot anchor, for Idle/Run/Hit/Fall/ATK/Ultimate. The same transform is used for every frame; authored movement is preserved.

Bạch Diện's initial Basic pose is similarly smaller. Its manifest records measured first-pose body height and foot anchors for all six character clips. One uniform transform per clip aligns those poses with Idle. Subsequent lunges, crouches and falls remain authored motion; their bounds are not normalized each frame.

The shared Canvas renderer applies registration inside the existing enemy flip. Offsets are fractions of the cell, so readiness's half-size atlas variants and decoded-image downsampling keep the same destination geometry. The asset catalog and both build adapters retain this metadata. VFX and clips without registration retain their old geometry. No combat timing, movement scheduler, formation constants, auth or asset bytes were changed.

## Evidence

The RED test reproduces Linh Đồng Ultimate at 253 px vs Idle 335 px, and Bạch Diện Basic at 346 px vs Idle 395 px (alpha > 100, first source frame). These are actual body bounds, not atlas dimensions.

After correction, the generated adapters and production `drawCanvasSprite` were rendered with real atlases using Skia Canvas2D:

| Hero | Idle | Basic | Ultimate |
|---|---:|---:|---:|
| Linh Đồng, native output | 335 px | 336 px | 331 px |
| Bạch Diện, native output | 396 px | 395 px | 395 px |

- Full `npm test`: build PASS, **1376/1376 tests PASS**, no skips.
- Pixel check: **36/36** cases (two heroes × three clips × native/desktop/mobile variants × both teams); initial body-height difference <3%, foot-height difference <=2 px.
- Registration tests also cover Run/Hit/Fall, first/last frame transform stability, one enemy flip, uniform aspect, half-size cells and decoded downsampling. Alias/formation regressions remain green.
- Inspected before/after sheets at frames 0, quarter, half, three-quarter and last. Ultimate no longer shrinks Linh Đồng; Bạch Diện Basic keeps Idle's body scale while lunging. Transparency, face, costume and authored poses remain intact. `comparison.webp` shows the initial poses side by side.
- `pixel-report.json`, `red.tap`, `targeted.tap`, `test-summary.txt` and `source-sha256.json` contain the evidence. `render-evidence.mjs` reproduces offline pixel QA from a built tree; it additionally needs `@napi-rs/canvas` in the QA environment (not a game/runtime dependency).

## Limits and handoff

This is offline render evidence, **not interactive browser QA**. Cloud Browser rejected the local preview with `ERR_BLOCKED_BY_CLIENT`; local Chromium was not installed. Responsive battle interaction and physical iPhone/Safari are **NOT RUN**, and production is **NOT DEPLOYED**. Full-scene spacing across every hero/pose remains unverified; this report does not certify the entire roster's visual parity.

The repository owner explicitly authorized skipping the workflow gate and merging in chat. No protection setting is changed. After deployment, check the actual arena transition from Idle into Basic/Ultimate and back for both teams; preserve this registration instead of adding state-specific renderer multipliers.
