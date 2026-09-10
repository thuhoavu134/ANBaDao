# L12-DRAG-TAP — leftover tap after formation drag

Goal: After dragging a hero on Bày trận, the next tap on an empty slot selects it. A completed drop does not leave the vacated hole selected.

Non-goals: visual redesign, bench-to-field drag, AFK, combat, crop, balance.

Acceptance:

- L12-D1: a moved drop that rebuilds the slot DOM does not keep `suppressSlotClick` armed through the next empty-slot pointerdown.
- L12-D2: a moved drop clears `sceneState.slot`.

Owner: `src/ui/campaign-scene.js`. Tests: `tests/campaign-pointer-lifecycle.test.mjs`.
Release: work branch + preview. Do not merge to main.
