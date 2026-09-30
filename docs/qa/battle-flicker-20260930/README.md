# Battle idle/VFX flicker and AI progress

Baseline: `13aa7c47087bafb33e1fe4b0f4c8d897314eb0e6` (PR #244).
Scope: owner's iPhone recording of a stalled turn, repeated shield/body flicker,
and stray red pieces around the enemy archer. Approved formation sizes, action
durations, source pixels, pivots, slot order and targeting rules are preserved.

## Findings and changes

- Lục Ảnh idle (21.094 MiB), Đình Lôi idle (31.641 MiB), and persistent shield
  (31.641 MiB) total 84.375 MiB in the 64 MiB iPhone native cache. The LRU evicts
  another still-visible loop as each renderer asks for its sheet. The previous
  body backup prevented disappearance but could show an old idle pose again.
- `battle-persistent-pages-v1.mjs` reads the final build's clip descriptors and
  reuses the lossless page builder with eight frames per page. Its separate
  current/next window is 19.336 MiB. This reserve is deducted from the native
  cache's normal budget: their combined normal cap remains 64 MiB on iOS and
  128 MiB on desktop. Action leases cannot evict these looping pages. Late
  decode holds the last painted pose, and failed pages retry with backoff.
  All 224 looping frames retain their pixels, source registration and clocks.
  No downsampling, re-centering, extra RAF loop, VFX removal or size change.
- Native action leases still temporarily accommodate full authored cast/VFX
  sets. The largest existing Đình Lôi action is 94.922 MiB; with this isolated
  loop reserve the combined native/persistent peak is bounded by 114.258 MiB.
  These are decoded-atlas budgets, not total browser/device RAM.
- The legacy AI checked rage but omitted `canUseAction` in its Ultimate branch.
  At full rage while silenced/cooling down it could select a rejected action
  and leave the current turn parked. `battle-ai-progress-v1.mjs` checks this
  branch and validates AI proposals at both existing dispatch sites. Fallback
  actions use the existing legal/preferred target owners; no legal move yields
  the turn through `advanceTurn`, respecting cancellation and battle identity.
  No watchdog, second scheduler, damage retry or combat balance change.
- The enemy sheet's upper-middle 512×512 cell includes pieces from its left
  and bottom neighbours. `battle-enemy-cell-cleanup-v1.mjs` clears only two
  inspected empty-body regions, keeping the grid, body size and pivot fixed.
  The original source stays intact; battle/preparation use a lossless build
  derivative. A source Git-blob hash check prevents applying the mask to a
  different sheet without review.

## Verification

- RED reproduced against the unpatched served runtime: silenced full-rage AI
  chose `ultimate` although the action entry would reject it.
- 73 focused Node tests PASS: 15 test files covering AI progress, real S+
  silence/cooldowns, all formation casualty combinations, targeting/healing,
  native/cache visibility, readiness/cancellation, mobile presentation, page
  continuity and enemy cell isolation.
- Additional existing `mobile-render-sfx` built-runtime test PASS after
  updating its normal-budget assertion for the explicit partition; inline JS
  in battle, index and QA documents parses.
- Exact visible-RGBA comparison for all 224 source/page frames PASS. Enemy
  derivative keeps every painted pixel outside the two removal regions.
- Simulated 40 seconds of three simultaneous loops crosses page and loop
  boundaries without resetting to a backup pose; at most six page pins and
  the 19.336 MiB budget are retained. Delayed/failed decode, retry and teardown
  are exercised. This is a deterministic cache test, not a measured FPS claim.
- Offline Skia rendered 120 frames with the production page drawing module.
  The boundary contact sheet and before/after enemy crop were visually read:
  full bodies remain aligned; both stray red fragments disappear.

## Evidence boundaries

To keep this recovery task focused, the workspace restores the relevant pinned
source and verified assets, not the entire repository. The late production
patch installers were run on the served compiled baseline (Git blob
`0d45af5a853077941955e0ab3a25e516a980e16d`), which includes PR #244's formation and
visibility hooks. The source build installs them after the final formation
owner and before iframe payload synchronization. Source clip metadata was
cross-checked with the current build owners, including the 240 px battle idle
selected by `m0-p0-runtime-repair-v1.mjs`.

Lục Ảnh's recovered RGBA atlas matches the repository report SHA-256
`9fc7ba71a302b232068b3ac54c2c9c0e72e5cd183cd1c04fcfeae42e12a0fa8a`;
Đình Lôi PNGs and enemy sheet match their pinned repository Git blob hashes.
The current Lục Ảnh assembler was also run from the verified source parts:
its 240 px derivative is byte-identical after RGBA decoding to the tested
served derivative (the WebP compressed bytes differ by encoder output only).

Full `npm test`/clean repository build: NOT RUN in this sparse recovery.
Interactive browser and physical iPhone/Safari: NOT RUN. Offline rendering is
not device certification. Production deployment must be checked separately.
The owner's existing workflow-gate waiver and merge authorization apply.
