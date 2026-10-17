# Cổ Nương VFX/SFX repair — source review, 2026-10-18

Base: PR #314 `340c6ebaef4ba82fda1aedbde721001b6ce2d400`; current main verified `fac1d5ff722099f57f261a48a5b73c7d94ab76d3`. No merge or production promotion.

Acceptance: CN1 one captured x1/x2/x3 clock; CN2 shared cancellable/muted SFX; CN3 target-side VFX matches actual damage recipients. Existing Ticket Board waiver in project-memory retained; no ticket claim/transition invented. VibeLab run `20261017-150455-cy1owlh`; runtime/browser acceptance remains incomplete.

## Reproduced and changed

- Old Cổ Nương code created independent HTML Audio, ignoring shared mute, unlock, battle cancellation and speed. Uses existing HonVietSfx.prepare/play now; cue at authored release (Basic/Skill 520 ms, Ultimate 1420 ms), captured playback rate and abort signal. Existing WAVs unchanged.
- Old waits mixed raw elapsed with speed-scaled sleep, while sprite playback stayed at x1. New authored path uses the existing sleepVisualMilliseconds waiter with a cast-speed snapshot. Damage remains at 980/1780 authored ms; recovery at 4000 ms. No independent scheduler or combat rules.
- Generic charge/projectile/impact no longer overlays Cổ Nương's authored action. Damage is still settled by the same combat engine exactly once. One VFX per aggregated enemy damage recipient: real domain test confirms Basic single target, Skill front row, Ultimate all living enemies. Heals do not create enemy hit VFX.
- Screen blend and enemy mirror applied once; impact/parasite lifetime uses captured speed. Reset/exit abort pending SFX; skip suppresses visual/audio work and still settles once.
- Fixed pre-existing registration tests: VM return value was mistaken for sandbox global and literal backslash-n strings prevented migration fixture parsing. Assertions preserved.
- Preserved unique installer settlement anchor. Actual Kỷ Vân → Tiêu Phong → Tịch Dao patch functions compose with this bridge using a synthetic shell containing remaining build anchors. This is not a full game build.

## Evidence

`node --test tests/co-nuong*.test.mjs`: **20/20 PASS**. Initial timeline suite **0/5**, failures recorded in red.txt; registration baseline **1/4**, corrected fixture **4/4**. Syntax and git diff whitespace checks pass.

Tests execute the actual bridge in VM; the domain case uses actual S+ factory/catalog. Audio tests execute the actual shared bus with committed WAV bytes and a controlled AudioContext decoder; they prove mapping/cache/rate/cancellation, not physical device decoding/listening. Image readiness and Canvas calls are controlled fixtures, not screenshots.

Archive `KIEMTHE-VFX-SFX-FULL-20261017.zip` was inspected. Both existing WAVs are byte-identical to archive Tangmen files and PR assets (Git blob SHA):
- tm_shyy_c.wav: a345d92a29809e795103acdd2cb71b0bfcdc9fbb
- tm_bylh_f.wav: 2bcec18458a06efdddb511c2adcb568136c4d5eb
No replacement VFX/SFX selected or imported. The pack is a source reference, not a reason to change approved art.

## Remaining gates / limitations

Full `npm test` attempted; sparse checkout fails before build at missing scripts/luc-anh-idle-asset.mjs (full-build-blocked.txt). Git clone authentication unavailable; source reads/patch delivery use the connected GitHub API. Old unrelated workspace is dirty and was left untouched. No full-game browser, screenshots, physical Safari/iPhone/iPad or listening certification. CI workflow now includes all Cổ Nương tests; remote build status must be checked independently.

Do not claim all integration defects resolved: first-entry/roster/AFK visual loading, body scale and authored clip appearance still require full normal game QA. Keep PR draft until build and live review are complete.

## Delivery blocked

Automatic approval review rejected GitHub create_tree before remote commit/ref update: it considered uploading the source and project-memory/QA payload to the repository insufficiently authorized. No retry, alternate Git transport or remote mutation was attempted after rejection. All changes remain local pending explicit owner approval to push these 12 files to PR314. CI was not triggered for this revision. This is a partial source repair, not a completed release.

Owner explicitly authorized pushing this prepared source/docs patch to PR314 on 2026-10-18. This lifts the delivery authorization blocker above; merge remains unauthorized and build/browser gates remain outstanding.
