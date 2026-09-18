# Phase 1 trace bootstrap repair

Date: 2026-09-18
Base: `d1ceff36bee36df7b7bfb91daa0e12d8fd336f10` (merged PR #159)
Branch: `work/phase1-trace-bootstrap-20260918`
Mode/scope: repair / micro
Status: review checkpoint; not merged or deployed by this change.

## Finding and scope

PR #159 added `window.__HV_BATTLE_PHASE1_TRACE` references to the action hooks in
`battle.html`. The build patch used the presence of that same string to decide
that initialization had already happened. As a result, the actual wired battle
skipped its initializer even with `?qaPhase01=1`. Previous source-string tests
passed without executing the patch or checking the emitted HTML.

Only the build-time trace bootstrap and its regression tests change. No combat
math, timing, positions, audio, art, save ownership or reward rules change.
No homeAnchor/C/M changes are permitted based on this component fix alone.

## Acceptance

- A1: Actual patch execution injects exactly one initializer despite pre-existing
  action references; it runs before the first body action and records its lifecycle.
- A2: Normal URLs still run action hooks without creating trace state or global
  helper bindings. Existing `qaPhase01` presence semantics remain unchanged.
- A3: Repeated patching is byte-idempotent, refreshes only its owned script, retains
  literal JavaScript dollar sequences, and fails without overwriting when the
  required head anchor is absent.

The patch now identifies its own script ID rather than searching for a global
name. It initializes inside a function scope in the head, before battle hooks.

## Evidence

- Reconstructed only the two required source files from the pinned GitHub base.
  Their Git blob hashes matched the originals:
  - patch: `fb54b12d08f98424423345718c18e75a8f462d4b`
  - trace module: `2d640bc756d9e926d7a12c600e041f968f25f710`
- RED: `node --test tests/battle-phase1-bootstrap.test.mjs` against the original
  patch exited 1: 1 passed, 5 failed, 0 skipped.
- GREEN: the same command against the repair exited 0: 6 passed, 0 failed/skipped.
- `node --check scripts/battle-phase1-trace-v1.mjs`: exit 0.
- `tests/battle-phase1-build.test.mjs` now also executes the initializer extracted
  from the final `dist/battle.html`, checks its order and verifies normal mode.
  Full-repository build/tests are delegated to the existing PR CI, not inferred
  from the isolated component fixture.

## Remaining gates

The working container cannot resolve github.com, so it does not have a full
checkout or the game asset pack. Local component tests are not a 6v6 replay.
Full-repository CI, browser game replay, Android/LDPlayer, physical iOS/Safari,
and comparison against IMG_7408 must be reported separately when observed.
No ticket-board transition, main merge or production deployment is claimed.

Next: after review/build verification, run the generated battle with
`?qaPhase01=1`, confirm the trace exists, capture actual 6v6 action events plus
Phase 0/1 snapshots, and correlate those with the reference video before changing
movement or timing contracts.

Rollback: revert this branch's patch and tests together; no data migration.
