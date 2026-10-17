# Owner follow-up: tight lettering, poison rhythm, Thầy Mo Run/Fall

Baseline main e1db5aa; extends PR316 b2f622c. No merge or production promotion.

## Result layers

Replaced the broad polygon cutout and enlarged SVG words with the original raster glyph silhouette on a lower layer (z2), and 18-frame authored wings on z3. No CSS clipping. Every alpha pixel outside the tightly extracted glyph silhouette is unchanged across all 36 Victory/Defeat frames; see glyph-validation.json and result-layer-contact.png. Content crops use the supplied metadata union (Victory y153, Defeat y187), retaining wing tips. APNG preserves RGBA; rebuild with `node scripts/build-result-letter-layers.mjs` (sharp and ffmpeg).

## Cổ Nương

Basic/Skill still resolve 12 authored blade contacts, one parasite stack per actual HP-damaged victim per cast, one rage grant. Ultimate now resolves three audible waves at 1560/2460/3360 authored ms, with two visual echoes per wave. Each wave aggregates elemental direct damage and one third of stored true poison damage into one floating HP number per victim. No extra end-of-cast damage tick. Ultimate team healing uses actual HP damage and runs once. Existing passive remains 2% target max HP per stack, capped at 50% caster ATK per stack, three stacks/three rounds, 50% actual drain self-heal on round ticks. Round tick behavior is unchanged. Cancel, mute, skip and speed retain their existing owners.

## Thầy Mo supplied motion inventory

`run falldie mo.zip`: both RGBA clips are 18 frames, 480x440 cells, 6x3 atlas, 4000 ms, bottom-center pivot. Source metadata/SHA retained in owner-refresh manifest. Runtime WebP q94 preserves supplied cell/offset geometry; no frame-by-frame refitting or synthetic rotation.

| Surface | Source integration | Verification |
| --- | --- | --- |
| Battle moving body | authored Run | painter clock test |
| Battle death | authored Fall, 4000 ms scaled by existing defeat clock | frame17 painter test; generic rotate disabled |
| Victory | Run -> existing Idle, native run clock | result registry inspected |
| Defeat | Fall once -> frame17 hold | result registry/painter test |
| Campaign march | authored Run at native speed | campaign registry inspected |
| Heroes, Codex, formation, summon | existing approved Idle | unchanged |
| Both teams | shared existing team mirror, no added mirror | source inspection only |

## Evidence boundaries

64 focused tests pass, including real combat poison total (450 stored true damage -> three 150 shares) and no final damage tick. Syntax checks pass. Offline 18-frame result montage inspected. Full build and live browser acceptance are NOT_RUN: local snapshot lacks full build dependencies/assets; preview is protected by Vercel sign-in, and prior automatic approval review denied creating an auth share URL. Physical iPhone/Safari NOT_RUN. This is source/offline evidence, not live acceptance.
