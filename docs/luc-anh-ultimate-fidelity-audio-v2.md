# Lục Ảnh Ultimate — fidelity and voice hotfix

## Root cause

The production build was applying the late QA VFX renderer after the authored Ultimate renderer. That renderer stretched each 320×220 source cell into a row-sized box with a different aspect ratio and added a procedural dark overlay. The result looked soft and unlike the supplied atlas.

The Ultimate voice was routed through the parent audio bus. On iOS/iPadOS, a tap inside the battle surface does not reliably unlock a parent iframe audio context, so the Promise-based decode path could finish without audible playback.

## Fix

- runtime-qa-polish-v5.mjs now leaves the authored Ultimate VFX at one aspect-correct 3× source-cell draw: 320×220 → 960×660.
- The final draw uses SOURCE-OVER with full alpha so the authored black smoke stays dark, anchors to enemy slot 2 (runtime slot index 1), removes the procedural gradient/pulse, and lets all 64 frames play.
- runtime-qa-polish-v2.mjs now preloads a local Ultimate voice element, performs a muted unlock on the first real battle gesture, and falls back to the shared bus only when local playback is rejected.
- Existing action timing remains the manifest contract: 260 ms voice lead, 760 ms VFX delay, 3,200 ms full VFX duration, and 1,850 ms impact hold.

## Evidence

- Static regression test: tests/luc-anh-ultimate-runtime-v2.test.mjs (2/2 PASS locally).
- Node syntax checks passed for both changed patch scripts.
- A browser/iPhone/iPad playback capture was not available in this environment, so visual/audio runtime acceptance remains pending actual-device QA.
- The atlas source cells are still 320×220; this hotfix removes unsafe runtime distortion, but only a regenerated higher-resolution source atlas can add missing source detail.
