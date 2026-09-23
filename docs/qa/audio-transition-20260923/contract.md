# Audio continuity after the first gesture

## Goal
After the player’s first real gesture unlocks audio, BGM and SFX keep working through hub → battle → victory/defeat → next screen without another tap to restart playback.

## Acceptance
- **A1 — Shared audio owner:** hub, combat, and result music use the host-owned `HonVietAudio` Web Audio context after its first gesture. The result message must not construct a new autoplay-gated media player when the shared bus is available.
- **A2 — Gap-free switch:** the current track keeps playing while the next buffer decodes; the newest route request wins, then the new track crossfades in.
- **A3 — Result handoff:** closing the battle frame cancels pending result work but keeps its active music until the next route switches tracks.
- **A4 — Existing controls:** profile BGM volume and the hunt screen’s pause behavior still control the shared owner; SFX stays on the existing shared bus.
- **A5 — Evidence labels:** source tests, full CI/browser QA, and physical iPhone/Safari are reported separately.

## Scope
Only audio lifecycle and route transitions. No changes to combat, gameplay data, audio assets, track selection, or account/save behavior.

## Workflow note
Ticket board, claim/lease, and path-lock tools are unavailable in this workspace. No claim or lock is asserted. The source and test work proceeds under the project’s existing owner authorization; CI remains the merge gate.
