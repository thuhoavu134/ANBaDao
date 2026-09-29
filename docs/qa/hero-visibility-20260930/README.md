# Intermittent hero-body disappearance

Baseline: main `3089882cdd7d2e0e6323be637e51e6d64a6e260c` (PR #242). The user approved character size and supplied two iPhone images in which living Linh Đồng/Lục Ảnh slots retained their HUD/shadow but lost their bodies.

## Reproduced causes

1. The shared decoded-atlas cache sorted eviction candidates by historical request priority. Released casts kept their critical priority and displaced recently painted idle art instead of yielding in LRU order.
2. The native cache dropped unpinned visible images before discovering that a pinned action still made admission impossible. The failed admission could therefore leave less usable art than before the request.
3. Native Lục Ảnh/Đình Lôi hero renderers returned success even when their actual atlas blitter returned false. All four atlas-managed heroes could have no drawable body while a sheet was being decoded/reloaded.

The new regression ran against the old generated main: all 10 cases failed. These cases exercise both real cache owners and the generated hero renderers, including both teams.

## Correction

- Evict unleased decoded sheets by actual LRU; keep critical priority for pending decodes and action pins for live actions.
- Preflight native-cache reclaimable bytes before dropping any usable image. Existing cache/action budgets are unchanged.
- Preserve one independent rendered body frame for each of Linh Đồng, Bạch Diện, Lục Ảnh and Đình Lôi. Share the canonical pose between teams and mirror at the existing renderer owner. A ready animation always takes precedence; a first idle pose replaces an initial action backup once.
- Backups cover a temporary body-paint failure only. They never count as action/VFX asset readiness, never supply a standing pose for a defeated unit, and never change state, clocks, movement, formation, scale, combat math or audio.
- Four 640×512 canvases retain at most **5 MiB** of RGBA backing stores (a replacement capture can temporarily require another 1.25 MiB). This is not a device-RAM measurement. Backing stores are explicitly released on teardown. The normal hot path does not recapture every frame.
- Authored slots do not fall through to another hero’s generic art during a cold load.

The final build owner is `scripts/battle-character-visibility-v1.mjs`; the reusable visibility cache is `src/render/hero-visibility-cache.mjs`. Both are connected through `scripts/build-static.mjs`, not edited only in `dist`.

## Validation

- Original regression: **0/10 passed**; all failures reproduced expected missing-body or wrong-eviction behavior.
- Focused cache/readiness/visibility suite after fix: **23 passed**.
- Full `npm test` including a real-asset build: **1,391 passed**, zero failures/skips.
- `git diff --check`: clean.
- Optional pixel harness: `node docs/qa/hero-visibility-20260930/render-evidence.mjs` (requires QA-only `@napi-rs/canvas` plus existing `sharp`). Uses actual generated drawUnit/hero functions and real production RGBA atlases. The before render disables the small-frame fallback; both renders use the same corrected character sizes. After an initial successful paint, it removes Linh Đồng/Lục Ảnh atlas handles, then restores them.
- [Pixel report](report.json): before fallback, both bodies have zero pixels above their shadows; after fallback, both remain visible in both teams at mobile 390×739 and desktop 1280×800. Restoring images restores the normal animation renderer. All 12 bodies are visible on recovery.
- Local `before/after-mobile.webp` and `before/after-desktop.webp` were rendered and the mobile pair was visually inspected. Generated images are not uploaded in this PR. Run the harness to reproduce them.

These pixel comparisons are offline Skia renders, with a flat QA background and simplified HUD. They are not live-browser screenshots. No physical iPhone/Safari run or production deployment is claimed. User authorization to merge without the external workflow gate remains in effect; no protection or billing settings are changed.
