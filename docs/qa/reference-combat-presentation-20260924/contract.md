# Reference combat presentation contract — 2026-09-24

## Goal

Use the supplied 710 × 1536 portrait battle screenshots to tune hero scale and formation spacing, make melee contact distances readable, and focus Ultimate rendering on the acting hero and the units affected by that Ultimate.

## Scope and non-goals

- Change portrait formation coordinates, portrait sprite scale, and contact standoff presentation.
- During Ultimate, render the actor and the set returned by the existing presentation target resolver. Restore all living units after recovery or battle reset.
- Preserve desktop formation, battle math, target selection, damage timing, authored animation timing, SFX/VFX owners, and home anchors.
- No save, reward, roster, balance, asset, or deployment changes.

## Acceptance

- **RCP-1:** portrait formation uses two staggered columns per side, three lanes, and a wider middle lane matching the supplied reference composition.
- **RCP-2:** portrait character scale increases modestly while desktop scale remains unchanged.
- **RCP-3:** contact attacks stop within a bounded standoff range instead of collapsing toward the target from the current-distance ratio alone.
- **RCP-4:** an Ultimate renders only its actor and its resolved presentation targets; single target actions show one target, multi-target actions show their complete resolved set.
- **RCP-5:** focus clears after recovery and on battle reset. The combat resolver remains byte-for-byte unchanged.
- **RCP-6:** the build patch is idempotent and runs after every owner that rewrites `battle.html`, immediately before final battle payload handling.

## Evidence

- Local isolated test against `main` source snapshot `3b2add02c63e192d5808724c7d70c4e4f2170fa7`: 4/4 focused tests pass.
- Patch idempotence and generated inline JavaScript syntax were checked.
- Full repository build, browser screenshots/interactions, CI, and physical iPhone/Safari remain pending on the project checkout.
