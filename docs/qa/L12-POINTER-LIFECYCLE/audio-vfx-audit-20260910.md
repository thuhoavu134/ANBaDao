# SFX/VFX audit — 2026-09-10

User report: metallic forging sound during battle. Investigation only; no runtime or asset change.

Baseline: main a6b5de61ebb4d1b136b5595766aa86b3a11fff29, working branch d47151a64a4a8f08e4d06a61d3cff9aae2e57aef. Main re-read and unchanged.

## Confirmed source findings
- src/ui/audio-sfx-runtime.js maps impact to 400500_se_s1_beaten.wav.
- src/ui/forge-item-assets-runtime.js hvForgeReveal calls the same impact event with group ui after craft/dual/enhance succeeds. The audio bus uses event to select the buffer; group affects lifecycle/volume, not sound selection. Thus forge reveal and battle damage use identical audio bytes.
- scripts/runtime-mobile-render-sfx-v1.mjs replaces applyDamage's tone with impact. It replaces playActionSound(actor, action) with basic/skill/ultimate selection only, ignoring actor identity, weapon and kit sfx. All heroes share 201800 attack/skill sounds.
- scripts/import-supplied-sfx.py explicitly labels these assignments shared defaults, not verified per-hero mapping.
- src/domain/hero/skill-kit.mjs declares ong-pho.hammer-keng for Ong Pho basic/ultimate, but asset status needs-user-created. That identifier is not used by the above active dispatcher. Its name alone does not prove the heard sound.
- Forge reveal is command-driven in the inspected owner; no periodic forge sound loop found there.
- Release sound is deliberately a no-op in the build patch to prevent duplicate cast SFX; old approach beep is removed. Damage miss returns before impact. AoE/multi-hit can call impact repeatedly; bus throttles impact for 120 ms globally, not per action.
- VFX authored action waits use battleId cancellation checks in the inspected battle branches. Source applyDamage also has hurt-recovery setTimeout callbacks without a captured battleId; this is a review risk, not a reproduced bug, and later build patches must be checked before changing it.

## Verification
Command: node --test tests/battle-audio-lifecycle.test.mjs
9 tests: 8 PASS, 1 FAIL, exit 1. Failure: ENOENT dist/index.html in generated close-owner test.
Passing behavior tests cover parent/child close cleanup, pending decode cancellation, old iframe pagehide versus new battle, active/pending ultimate voices, HTML fallback cleanup, result unlock cancellation.
No full build or browser/audio listening performed in this audit. No VFX visual PASS claimed. No Safari/device evidence.

## Conclusion and next action
Shared impact mapping is a concrete explanation for identical forging/combat timbre, but the exact audible file is NOT confirmed by listening. Do not claim background forge leakage or remove all combat sound on this evidence.
Next: capture the reported battle with actor/action and compare the four combat files; verify generated dispatch and VFX timing on that same preview. If impact is confirmed, separate semantic forge/combat events and use an approved suitable sound assignment, retaining current scheduler and lifecycle bus. Do not arbitrarily replace audio/art or alter damage timing.
Existing rejected visual pass remains rejected. Main/production untouched. Runtime fix and audio acceptance remain OPEN.
