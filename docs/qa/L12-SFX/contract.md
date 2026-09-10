# L12 SFX isolation v1 — TKT-0002

Goal: remove the forging impact sound from battle. Web/Canvas, regression quality tier, preview only.
SFX-1: combat basic/skill/ultimate/result remain playable; legacy impact and forge-reveal cannot play the forging file from any battle channel, including a caller overriding group.
SFX-2: forge reveal retains the same audio file, once per reveal UID, exclusively as forge-reveal in the shell UI. No new substitute sound is invented.
SFX-3: generated battle damage dispatch does not request shared impact; VFX, damage timing, mute and session cleanup remain unchanged.
Scope: audio-sfx-runtime, forge-item-assets-runtime, runtime-mobile-render-sfx build owner, focused tests. No asset bytes, art/layout, balance, save, scheduler or result redesign.
RED: run behavioral bus/forge and build-owner integration tests before runtime edits. GREEN: same tests plus existing lifecycle regression. Verify preview exact SHA and real battle UI; sound-quality listening and Safari remain separately reported.
Rollback: revert this slice's commit on the work branch; do not change main.
