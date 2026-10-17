# Cổ Nương: faster ATK, three Ultimate waves, dark falling mist

Owner-requested refinement on draft PR #314. Do not merge to main.

- ATK character clip: 18 frames / 720 ms (previously 4000 ms); release 600 ms, frame index 15 (16/18), domain impact 991 ms, recovery 2000 ms. Three staggered swords and two round trips per sword unchanged.
- Ultimate: one domain action at 1380 ms; three presentation waves at 1380 / 2280 / 3180 ms, each 900 ms, shared bus cue at each onset. Recovery 4200 ms allows final wave and sound to finish. No repeated damage, parasite detonation, healing or rage consumption. Captured x1/x2/x3 speed, skip, mute and cancellation retained.
- Ultimate atlas: 2x per-frame Lanczos with mild RGB-only sharpening and unchanged resized alpha, WebP quality95 (alpha retained). Cell 400x420; fixed visible height 324 maps to projected target body height. Upsampling improves interpolation/edge presentation; it does not create new source detail.
- Parasite: replaced bright `zgm_110_hqps_b` bubbles with inspected Cổ Mộ `zgm_125_hmrx_a` dark gray-purple falling streak/mist. Original RGBA, source-over compositing, body-height sizing, status-owned lifetime.

## Evidence

`red.txt`: failing updated expectations before implementation. `green.txt`: 28 focused tests pass, including three cue times at each speed, one domain settlement, cancellation after first wave, and skip without stuck turn.

`vfx-audio-study.mp4`: 8-second offline Canvas study of actual production VFX rendering with authored WAV audio, body guides, both facings, normal speed. Basic begins at 0; Ultimate demonstration begins at 3 seconds (waves at 4.38/5.28/6.18). Audio is mixed at those same markers. This is NOT a full-game capture and does not show the character's hand/harp animation.

`render-study.cjs` writes 240 frames at 30fps; FFmpeg adds the original ATK WAV at .600 and Ultimate WAV at 4.380/5.280/6.180 seconds. Frames can be regenerated locally with the study script. The MP4 was rendered before the final quality95 encoding; atlas dimensions and timing are identical.

Reproduce assets: `python scripts/co-nuong-smoke-from-pack.py /path/to/KIEMTHE-VFX-SFX-FULL-20261017.zip`.

## Remaining verification

Character action binary could not be retrieved through the connected GitHub text API; searches for the original animation archive returned no match. ATK release is verified against the final-frame timing contract, but actual hand-pull pose and precise harp emission anchor remain unverified visually. Full game/browser/device execution remains unavailable in this sparse checkout. Prior remote CI jobs failed before runner allocation; no full-build pass is claimed. Owner Ticket Board-unavailable waiver remains unchanged.
