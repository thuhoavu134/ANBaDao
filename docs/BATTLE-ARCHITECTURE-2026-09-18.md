# Hồn Việt battle architecture checkpoint — 2026-09-18

## What this slice fixes

The missing-actor/crash path was treated as a lifecycle problem, not an asset-quality problem:

- Campaign cache now reserves decoded bytes before loading and settles purge/cancel promises exactly once.
- Campaign does not return a permanent empty image merely because a stale battle overlay class is present.
- Failed campaign atlas admission removes the dead handle and falls back to the authored portrait instead of skipping the actor forever.
- Battle presentation has a bounded action controller/trace: action start, release, impact, recovery, complete and duplicate protection.
- Legacy Thầy Mo/Ông Phở image owners no longer construct their full Image set at script boot; they load lazily on first use and clear on pagehide.
- Dinh Lôi/Lục Ảnh remain on the shared native lazy atlas path.

## Verification

- Focused cache/fallback/trace tests pass.
- `npm run build`: PASS.
- `npm test`: EXIT 0.
- Browser/Android/LDPlayer visual validation: NOT RUN; current browser is attach-only and no device trace has been collected.

## Important limitation

The lazy legacy wrapper for Thầy Mo/Ông Phở removes boot-time eager allocation, but the next resource-budget slice should give those legacy clips exact decoded-byte metadata and owner release through the same native cache. Do not claim the mobile crash is eliminated until a 6v6 device run with `?qaPhase01=1` confirms it.
