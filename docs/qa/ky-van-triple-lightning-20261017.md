# Kỷ Vân Ultimate — three staggered bolt heads with the complete SFX mix

Status: **DRAFT / REVIEW**, 2026-10-17. The owner requested merging PR #312, then increasing Ultimate to three lightning bolts above each struck enemy with full SFX. [PR #312](https://github.com/bktimmy247/luc-than/pull/312) was merged first at main `642dd78e3174dca902e4ea0deeebe009dfd6e83b`. This follow-up is [PR #313](https://github.com/bktimmy247/luc-than/pull/313), branch `fix/ky-van-triple-lightning-sfx-20261017`; its source is not yet merged or deployed. The latest owner feedback rejected the equal-height parallel arrangement. This revision offsets the three upper ends in height and horizontal spacing, following the original reference's irregular lightning silhouette.

## Visual contract and implementation

`src/runtime/ky-van.js` draws one group of three upright bolts for every active Ultimate target. The original bolt sprite uses x offsets `[-spread, 0, +0.75 × spread]`, where spread is 14% of the shared projected body height, clamped to 18–36 world units. The middle strike stays on the target anchor; unequal side gaps keep the group close to the target center without a rigid, evenly spaced silhouette.

The three whole-sprite height factors are `0.78 / 1.00 / 0.90`, applied to the existing nominal column height. Their order rotates by the snapshotted formation row (`slot % 3`), so the tallest head changes horizontal position between rows and stays stable throughout a cast. Width and height scale together around the original `(130, 540)` foot anchor; the heads differ by more than 15% of projected body height while each sprite keeps its aspect ratio. Even the shortest head remains above the character. This changes the bolt layout, not the shared hero-size contract. There is no random per-frame motion, skew, rotated fan or added timing delay.

All three bolts share the same downward reveal, contact frame and tail clock. Target deduplication happens before expanding a group: a later wave replaces the prior group at that target, never stacking six bolts. Impact remains one effect per target, outside the three-bolt loop. At the six-target middle wave, the renderer emits exactly **18 bolts and 6 impacts**. Basic still emits one bolt and keeps the 650/1050 ms release/contact markers.

The approved slot sequence from PR #312 remains front column 0→1→2, paired rows 0→3→1→4→2→5, then back column 3→4→5. Each Ultimate strike reveals for 60 ms; the last strike starts at 3010 ms and finishes at 3670 ms, before the 3900.024 ms recovery. Character size, damage/status resolution, nộ, scheduler and asset leases stay with their existing owners. Three visual bolts do not mean three damage resolutions.

No source artwork, atlas or audio file is changed. The patch adds draw calls using the already leased atlas; it adds no new runtime asset fetch or decode.

## Full SFX verification

The existing approved mix already contains the cast layer and all three lightning waves. The [original Kỷ Vân QA note](ky-van-20261009/README.md) records `kl_hff_c`, `kl_qff_h`, `kl_axxf_c` plus generated low thunder. The original stems are not present in the current repository; this verification inspects the shipped mixed files directly.

The production registry in `src/ui/audio-sfx-runtime.js` maps `ky-van-ultimate-x1/x2/x3` to the correct M4A files. The actor snapshots cast speed, prepares the corresponding mix, then plays one voice through `HonVietSfx`. The baked speed is not applied again as `playbackRate`. Three bolts and repeated target rendering do not create extra audio voices. The existing bus gain is 0.38.

All three files were checked against their main-branch Git blob hashes, probed as AAC stereo at 48 kHz, and decoded with ffmpeg. The front, middle and back wave windows all contain nonzero sound at the matching speed:

| Mix | AAC stream duration | Action duration | Front / middle / back RMS, dBFS |
| --- | ---: | ---: | --- |
| ×1 | 3.889 s | 3.900 s | −13.44 / −12.93 / −10.05 |
| ×2 | 1.941 s | 1.950 s | −14.61 / −13.65 / −10.21 |
| ×3 | 1.298 s | 1.300 s | −15.50 / −14.58 / −12.40 |

The x1 waveform windows are 1730–1940, 2180–2515 and 2860–3070 ms; they are divided by cast speed for x2/x3. Sample energy above −45 dBFS ends before recovery in all three mixes. Small container/decoded-duration differences reflect AAC framing. [Machine-readable audio evidence](ky-van-triple-lightning-20261017-audio.json) includes methods, exact hashes, windows and scope.

This is waveform and source-wiring verification, not a claim of physical-device listening. Normal readiness is covered; the shared `prepare()` owner retains its existing two-second budget, so this task does not claim a new guarantee under network timeout.

## RED → GREEN and final tests

The initial three-bolt patch produced **5 failures / 9 passes** before implementation: one target rendered one bolt instead of three, the front wave rendered 3 instead of 9, and the middle wave rendered 6 instead of 18. After that patch the same group passed 14/14.

For the latest uneven-head revision, the updated layout suite first produced **1 failure / 6 passes** against PR #313's parallel source: its equal gaps failed the asymmetric-cluster contract. After implementation the same suite passed **7/7**, including distinct head heights, unequal x gaps, common foot contact and aspect ratio. Refactor retains the shared single-column painter with a default height factor of 1; only the Ultimate group supplies the three height factors.

Final focused run: **34 passed, 0 failed**, across six files:

```bash
node --test --test-isolation=none \
  tests/ky-van-runtime.test.mjs \
  tests/ky-van-lightning-layout.test.mjs \
  tests/ky-van-audio.test.mjs \
  tests/hero-runtime-stature.test.mjs \
  tests/new-hero-idle-scale.test.mjs \
  tests/ky-van.test.mjs
```

Visual assertions cover both teams, compact/desktop projection, three visibly different upper heights and unequal x gaps per target, one strike on the target center, fixed per-bolt pixel scale, no premature ground contact, occupied-slot order, wave replacement, bounded tail, unchanged Basic, captured ×1/×2/×3 clocks, skip/cancel and body-scale/late-installer regressions. Domain tests preserve one Ultimate status roll per living enemy and existing recipient-turn behavior.

The six new audio tests execute the full production audio bus and actor runtime in the same VM. They fetch the actual committed M4A bytes through the real event registry and parse their AAC track/container duration. They check one fetch/decode/voice, normal readiness, no double-speed playback, speed changes during a cast, all three render waves, mute, skip and one abort/stop. Web Audio hardware and decoding are controlled doubles in this test; actual waveform decoding is the separate ffmpeg check above. Syntax and whitespace checks also pass.

## Inspected evidence

- [Three-wave contact sheet](ky-van-triple-lightning-20261017.png): 1950, 2520 and 3090 ms, replaced with the uneven-head layout. Intersections lower in a formation column come from distinct targets occupying the same x coordinate, not duplicate old/new groups.
- [Full-head detail](ky-van-triple-lightning-20261017-detail.png): the same runtime with one occupied target at slot 1, captured at 2250 ms just after contact. All three upper ends are inside the frame, exposing the different heights and gaps without neighboring groups covering them. This is an isolated target fixture, not a changed game camera or a battle screenshot.
- [MP4 with full SFX](ky-van-triple-lightning-20261017.mp4): 1280×768, 30 fps, x1. The audio packets are copied directly from the approved x1 M4A; both packet streams have SHA-256 `019fbd683139b2123a1d17e87331150b46aec043d1a8eec37af313ccb1aa8652`. The video presents the source mix at its original level; it is not a device loopback recording of the bus gain or BGM.

The captures execute the actual `drawKyVanHero` / `drawKyVanFx`, original sprites and shared body math on a neutral Canvas stage with Bạch Diện target fixtures. The video and sheet contain six repeated targets; the detail isolates one occupied row. Loader/audio/visibility surroundings are controlled. The sheet, full 2520 ms frame and isolated detail were inspected. These artifacts demonstrate this source presentation and its complete sound asset, not a substitute game preview or a full-game browser run.

## Limits and handoff

The sparse checkout and existing CI/deployment access limitations remain. Full normal build, campaign interaction, browser playback, physical iPhone/iPad/Safari and production deployment are not certified for this revision. PR checks are reported separately from the 34 focused local tests. The existing Ticket Board/workflow waiver is retained; no ticket claim or DONE state is invented.

Review the updated PR #313 and its audio preview, then use a full normal-game preview when available. Merge approval supplied for PR #312 has been fulfilled; it does not mark this subsequent source change merged.
