# 3Q resource lifecycle → Lục Thần campaign adaptation

Date: 2026-09-17
Status: implementation note for TKT-0160; clean-room/static-analysis only.

## Facts verified in the 3Q bundle

Source: `tmp/game-3q-static-run/3Q/home/web/game/source/js/bundle.js`.

- `watchBattle` calls `cleanAll`, parses the server-authored replay, sets battle info, calculates the starting time and preloads resources (`107849–108143`).
- `KE.getModelArr` deduplicates model/skin IDs across both teams before loading (`95848–95870`).
- `KE.getEffectArr` deduplicates effects found in active/chaos actions (`95872–95902`).
- `kL.loadPlayRes` queues UI/model/effect packs and loads them one at a time (`107369–107405`).
- `S_.getPack` shares one `Templet` per skin with caller ownership; `delRes` removes a caller and `clearRes` clears unowned packs after a delay (`29215–29333`).

3Q does **not** provide evidence for a separate `campaign-lite` atlas tier. That tier is a Lục Thần browser-memory adaptation.

## What this change applies to Lục Thần

- `src/assets/campaign-resource-pack-cache.mjs` implements the 3Q-derived lifecycle: stable pack key, shared entry, owner ref-count, bounded loading queue, decoded-byte budget, LRU eviction only for unowned ready entries, and delayed clear.
- `src/ui/campaign-scene.js` no longer creates direct gameplay `Image` objects for managed character atlases. It uses a `campaign` owner scope and `campaign-lite` pack tier.
- Six campaign-lite atlases are generated from the existing authored atlases at lower cell sizes for the preview surface only. Battle-native Ultra v5 atlases are unchanged.
- `scripts/afk-chest-runtime-v1.mjs` injects the cache module before the campaign runtime so the generated static bundle uses the same owner/cache contract.

## Memory accounting

Campaign-lite generated assets total **88,704,000 decoded bytes (~84.6 MiB)** for the six managed idle/run assets, under the explicit 96 MiB campaign budget. The compressed package is about 6.7 MB. This is measured decoded RGBA memory, not transfer size.

## Non-goals

- Do not copy 3Q proprietary code, skeletons, textures, timing curves or palette.
- Do not change combat outcome authority, roster numbers or reward formulas.
- Do not call campaign-lite a 3Q-native feature; it is an adaptation needed by the Canvas/browser memory profile.
