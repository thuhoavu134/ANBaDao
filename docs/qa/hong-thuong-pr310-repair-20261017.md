# PR310 runtime review — 2026-10-17

Reviewed head: `2bfc5de10e38bc09d72a6639f60a88a34c297188`.
Owner reports a stationary heroine; screenshot also shows left-side clipping and green coloration.

## Confirmed defects and repair

- Standing aliases idle page zero but declared one atlas row; actual downloaded WebP is 1968 × 948 (two rows). The shared loader can reject this cold descriptor and abort the action. All aliases now use the actual page dimensions.
- Idle page five contains four frames, not eight. Resolve page-specific frame counts/rows.
- Idle descriptors lost content registration and scale. Drawing also subtracted half a cell before subtracting bodyCx again. Restore metadata and anchor once at the unit's feet/body centre. Align the converter's standing metadata with this contract.
- The installer waited until impact before entering the resolver that prepares movement. Enter the resolver at release; its existing per-hit waits own damage timing.
- Ultimate travel overlapped prep/cluster segments and was shadowed by first-match lookup. Use contiguous run/cluster segments and derive hit times from those starts. Acquire the run atlas with the ultimate lease. Select the finale target after cluster damage and interpolate the return to home.

No damage coefficients, approved VFX/SFX identity, or rage rules changed.

## Verification

`node --test tests/hong-thuong-runtime-regression.test.mjs`: 6/6 pass.
The original first five tests produced four failures before the loader/anchor repairs and five passes afterward. Tests use the real shared loader and decoded-atlas cache with a deterministic image adapter. Actual page-zero dimensions were separately verified against the repository WebP. The additional ultimate test checks contiguous segments, per-hit times, late living-target selection and return interpolation.

Both modified installer/converter scripts pass `node --check`.

These are source-level regression results, not full normal-game/browser acceptance. Full build/npm test, normal 6v6 desktop/mobile capture and physical iPhone/Safari have NOT been rerun for this patch. Existing workflow waiver applies to unavailable workflow tooling; no ticket claim or VibeLab pass is asserted. Do not merge based on these unit results alone.

## Remaining asset limitations

The downloaded idle WebP already contains yellow-green skin/hair and damaged transparency. Rendering changes cannot restore the original colors. Original six source MP4 files are not available in this working environment; re-key from originals and inspect before replacing binaries. No speculative recoloring applied.

The original PR also reports only two distinct thrust motions in the Basic source, with hit markers two and three 48 ms apart. This patch does not invent an extra authored motion. Confirm/re-author the clip if three clearly separated visual thrusts remain required.
