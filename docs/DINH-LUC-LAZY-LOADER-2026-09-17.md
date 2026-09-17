# Dinh Lôi / Lục Ảnh lazy atlas lifecycle

Date: 2026-09-17
Ticket: Dinh/Luc lazy loader
Scope: branch-only PR; main is unchanged.

## Root cause

The legacy Battle runtime created `DINH_LOI_IMAGES` and `LUC_ANH_IMAGES` with `Object.fromEntries(...new Image())` at script boot. This bypassed the decoded atlas budget and allocated every idle/action/VFX atlas before the battle needed it.

Measured native decoded footprints:

- Dinh Lôi: 14 PNG atlases, ~442.97 MiB RGBA decoded.
- Lục Ảnh: 11 atlases, ~235.74 MiB RGBA decoded.

## Fix

`battle.html` now has one bounded `BATTLE_NATIVE_ATLAS_CACHE` used by both legacy owners:

- lazy `new Image()` on first clip request;
- maximum two concurrent loads;
- 128 MiB decoded budget;
- oldest inactive ready atlas eviction;
- failed/oversized requests return no image instead of crashing;
- pagehide clears all native atlas entries.

The existing frame/layout/timing contracts remain unchanged. This PR does not repack or resize these native battle assets; it fixes the eager allocation/lifecycle bug first.

## Verification

- Focused lazy-loader regression: PASS.
- Generated `dist/battle.html`: no eager Dinh/Luc image maps; shared cache marker present.
- `npm run build`: PASS.
- `npm test`: EXIT 0.
- Browser visual/memory capture: not run locally because the AICoworker browser profile is attach-only/not running.

## 3Q relationship

This applies the source-verified 3Q patterns: resource identity/dedupe, bounded preload, owner lifecycle and delayed cleanup. It does not copy 3Q code, skeletons or assets.
