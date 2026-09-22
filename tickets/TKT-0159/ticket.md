# TKT-0159 — Lục Ảnh: dịch chuyển tức thời, không thử nhiều kiểu

Updated: 2026-09-22
Contract: snap-only-20260922
Status: SOURCE_REVIEW / runtime verification still open (not a Ticket Board transition).
Branch: `work/tkt-0159-action-movement-profiles-20260921`
Main baseline incorporated: `e44ddbf500447753be32355c845cdbabee1a964a`.
Previous branch checkpoint: `40f72120de0de33c8ad60d49e0e8550834c1d243`.

## Owner decision — authoritative

Owner: “dịch chuyển tức thời còn gì nữa phải làm hướng đó!”

Lục Ảnh uses instantaneous approach for Basic, Skill and Ultimate. Do not ask the owner to choose between snap/dash/run/stationary again. The earlier four-profile comparison scope is superseded, not an unresolved design decision.

## Scope

- Keep the exact movement owner already on main: all three Lục Ảnh policies have `travel: 'snap'` and snap sets x/y directly rather than tweening the approach.
- Remove the four-way chooser, selectedMovement state and action-time setTravel override from skill-test.html. Display only a fixed snap note.
- Remove the mutable movement QA setter and the unapproved dash/run/stationary profile extension by restoring their exact main blobs.
- Retain the existing main browser QA that requires actual approach:snap and destination equality for each Lục Ảnh action, plus all nine authored actions and Reset on desktop/mobile.
- Preserve the controller lifecycle fixes: no stale unlocks, recoverable preflight/runtime/setup errors, correct iframe session after Reset.
- Bring in main's merged sharp install fix without changing it.

## Acceptance

A1: no movement selector or controller-side movement policy mutation.
A2: all three hero hooks, all actions, action markers and return-home checks retained; controller/reset protections pass focused tests.
A3: production movement owner, integration patch and domain/browser regression tests match main exactly; other heroes and return-home unchanged.
A4: full build/full suite and real 6v6 browser verification before technical acceptance. Owner's design choice is settled; this is not a request to compare alternative movements.

## Non-goals

No damage, energy, crit, targeting, reward, save, auth, authored animation/VFX/SFX/timing, other-hero movement or Victory/Defeat change. This decision covers approach to the cast point; return-home behavior is not redesigned.

## Evidence and limitations

See `evidence/snap-only-20260922.json`. New selector/override tests were written and run before changing the page: baseline 3 tests, 1 PASS / 2 FAIL. Candidate controller fixture: 24 PASS / 0 FAIL, repeated after diff review. Inline controller and test syntax PASS. These are controller tests with controlled iframe/DOM/timers, not real battle/render tests.

Full local checkout was blocked by GitHub DNS resolution; game build/assets/browser/device validation remains unverified. The VibeLab run `20260922-145935-ft5m200a` reached ticket-guard; Ticket Board claim/lease/lock is unavailable. Existing documented source/test-only exception is used; no complete gate, fake claim or deployment PASS is asserted.

Historical lifecycle evidence remains in this ticket directory and applies only to its recorded revision. No main merge or production success is claimed for the current source follow-up. Do not reintroduce the comparison selector in a later session.
