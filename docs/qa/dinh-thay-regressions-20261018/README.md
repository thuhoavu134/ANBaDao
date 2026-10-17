# Đình Lôi / Thầy Mo follow-up — 18 October 2026

Baseline: main e1db5aa4bcec7e2707ed22c694a7aa32ed284b3d (PR315).
Branch: fix/dinh-loi-thay-mo-runtime-20261018. Draft review; no merge/deployment.

## Findings and changes

1. Hồi Văn's old recipient selection allowed the caster to be the weakest ally. Deduplication then left only the caster. Prefer a living other teammate (explicit valid teammate first, otherwise lowest HP); fall back to self only when alone. Preserve 20% shield, guard duration, counter rules and Ultimate's existing 28% whole-team shield. Basic damage/rage behavior is unchanged. This does not claim every reported missing bell was caused by selection; normal-game verification remains needed.
2. The new landscape Ultimate was reduced to 262x147 inside a 270x480 compatibility cell, then drawn at 320x180. Build landscape 480x270 compatibility cells instead; update the final native-cache descriptors/readiness geometry. Draw at authored 480x270 world size with uniform scaling and one team mirror. This supersedes the earlier requested row-midpoint restriction. Pixel density improves without increasing decoded atlas dimensions/bytes.
3. The supplied ATK already moves within its frames. Previously its first segment also moved actor-to-target, then its continuation restarted at the target with another size/anchor. Both segments now share a fixed stage and the generic contact ring is suppressed for Đình Lôi. This addresses the observed trajectory discontinuity; a simultaneous double-projectile in a live game has not been independently reproduced.
4. Thầy Mo's new VFX was built over the old `ultimate-vfx-v3212-atlas.png` URL. Vercel serves assets with one-year immutable caching. Hash refreshed atlas/audio filenames and rewrite final host/battle consumers, including Đình's base+filename lazy descriptor and the shared parent audio registry. Generated persistent/preparation pages already have content hashes. Preserve old URLs for compatibility; do not change global caching.
5. Share cue selection between preparation and scheduling. Include all three Thầy Mo identities accepted by its production renderer. Existing cancellation, mute, release markers and audio bus remain in charge. No replacement sound or second audio controller.

## Evidence

- Initial focused regressions: 4 failed (missing selector/continuous-render/cache helper, portrait atlas geometry).
- Final focused run: **16/16 PASS** (`node --test tests/owner-refresh*.test.mjs tests/owner-visual-review.test.mjs`). Includes actual legacy resolver body for both teams, skill and Ultimate; helper geometry, stage continuity, content URL changes, cue aliases and installer seams. The resolver fixture uses controlled settlement dependencies; it is not the full mixed combat engine.
- Syntax checks: changed installer and runtime parse.
- `buildOwnerRefreshAssets` built all **16** real compatibility atlases. Actual image inspection: `render.png`. Offline Canvas render from new helper and real rebuilt assets; not a normal-game screenshot. Original compact source atlas hashes are unchanged.
- ffmpeg decoded both actual AAC files: Đình Ultimate mean -15.3 dB / peak -1.6 dB; Thầy Ultimate mean -16.6 dB / peak -3.4 dB. Neither file is silent. This is file verification, not physical listening or proof of browser playback.
- Full build remains NOT RUN successfully: the sparse checkout lacks `src/domain/character/luc-anh-idle.mjs`; dependency resolution stops before the normal build. No full-suite, browser, physical Safari/iPhone, live double-projectile reproduction, or live audio success claimed.
- The immutable URL mismatch and alias gap are verified source defects. The user's exact missing-SFX cause remains unconfirmed until a normal battle is exercised. Keep the PR draft; inspect all four reported behaviors in a current full-game preview before calling the repair complete.

Existing Ticket Board/workflow waiver retained; no ticket/claim state invented. No merge authorization inferred for this new PR.

## Additional result layering and audio mix fixes

- Result word SVG is z-index 2, below the animated wing/title layer at 3.
- Combat route supplies a 0.25 mix multiplier to the shared music bus. Profile volume remains the base preference; slider updates keep the combat multiplier, repeated calls do not compound attenuation, and lobby routes restore multiplier 1.
- HTML music fallback retains its base preference across route changes. Standalone battle fallback gain changes from 0.42 to 0.105.
- Result playback fades/stops combat music in 120ms before requesting the victory/defeat sound; pauses the compatibility HTML music player. Result gain stays 0.9.
- Validation: 32 owner-refresh/visual/audio-unlock tests pass, plus 4 selected self-contained battle-audio-transition tests. Changed audio script syntax checks pass.
- Broader integration test attempt remains blocked: missing dist/index.html and dist/battle.html, and a missing profile/hunt source dependency in this sparse checkout. Full build and in-game listening/animation QA are not claimed. No deployment or merge performed.
