# Primer removal / recovery ownership — 2026-10-05

Baseline upstream main: `2ab4c9bd3748d4870050d63f3a867a2ebdd9d9a0` (PR #280). Branch: `fix/primer-recovery-ownership-20261005`. Source-only REVIEW; no merge or production certification.

The generated rebuild/force owner called `upsertReactionStatus` as a global even though that helper is private inside HonVietCore and is not exported. Unweave also spliced native status objects without emitting their native removal event. Restoring a copied native status through a legacy merge could preserve an expired deadline or overwrite a newer managed object.

The existing mixed settlement build owner now removes the selected primer through `settleLegacyStatusRemoval` and calls an injected `restoreLegacyPrimer`. Legacy restoration uses the existing `addStatus` adapter. Native restoration delegates to the new `restoreStatus` method inside the existing S+ factory, retaining original expiry/applied round/tick budget and honoring native grant rules. A newer same-source effect is preserved. Force caps remaining native lifetime/ticks to one round and retains the existing power expression. Expired/blocked restoration returns before costs and leaves recovery retryable. No new scheduler, art, targeting, economy, damage multiplier or balance tuning.

## Evidence

- `red.tap`: 9/9 original cases failed before implementation; the actual generated recovery raised `ReferenceError: upsertReactionStatus is not defined`; native removal accounting also failed. Exit 1.
- `selected-primer-red.tap`: a later RED case reproduced removing an earlier managed attackDown alias instead of the selected legacy atkDown. The removal helper now accepts an exact selectedStatus while preserving other callers' alias/cleanse semantics. Exit 1.
- `green.tap`: initial 9/9 cases passed. Exit 0.
- `regression-final.tap`: 84/84 tests passed across nine files, including 13 recovery ownership cases, existing recovery/shield/status/team-reaction tests and S+ combat/V2/consumption tests. Exit 0.
- Syntax: changed modules checked; all five inline scripts in the sparse generated battle parse. Build patch idempotency/drift and document prefix verified by test. Serialized S+ factory restoration verified in a separate VM realm.
- `regression.tap` preserves the earlier 79/80 result: the sparse fixture omitted the existing dead-recipient guard. Restoring that exact guard from the unmodified `battle-living-targets-v1.mjs` fixed the harness failure; no production patch or assertion was changed for that failure.

The local fixture uses real source battle + Core injection + 3Q adapter + mixed settlement patches, with the existing dead-recipient guard. It has a minimal shell stub only for the adapter's fixture hook. This is **not** a full clean asset build, served UI, screenshot review or browser acceptance. Full build/full suite belong to PR CI. Interactive browser, physical iPhone/iPad/Safari and production deployment NOT_RUN.

Owner's existing workflow waiver is recorded in the current handoff. Supplied vibe-builder and vibe-lab were read. Ticket Board is unavailable; no claim/lease/lock or DONE state is invented.

Remaining work: reaction extension/consumption and tactical special statuses still need native ownership/trace equivalence review; canonical mixed campaign progression/affordability simulation, activity receipts/gates and final visual regression. Preserve Ông Phở ultimate chase.
