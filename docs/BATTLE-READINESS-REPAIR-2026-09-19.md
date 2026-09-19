# Battle asset readiness repair - component checkpoint

> HISTORICAL CHECKPOINT. Runtime integration and real browser/host evidence now exist.
> Continue from [BATTLE-READINESS-INTEGRATION-2026-09-19.md](BATTLE-READINESS-INTEGRATION-2026-09-19.md), not from the remaining-work list below.

Date: 2026-09-19
Mode: repair. Scope: micro for this checkpoint; the complete battle repair remains open.
Branch: `fix/battle-asset-readiness-20260918`
Baseline: `7f53dd74c086d8dcef36eb883f07dc9cee60d513`
Code checkpoint: `9e3e09e4a6ebff8295dccd8667a7bbef4f725fc3`
Status at this historical checkpoint: component-tested, NOT gameplay-accepted, NOT merged, NOT deployed by this task.

## Contract

User reported heavy loading, disappearing characters and missing battle SFX/VFX.
This checkpoint repairs the shared decoded atlas cache and exposes a cancellable
readiness lease. It did NOT yet connect the lease to the hero action scheduler,
visible idle/run ownership or SFX release markers. That integration is now covered
in the linked later handoff.

- A1: A queued image starts when capacity opens without another draw-loop call;
  its readiness promise must stay pending until the image is actually ready.
- A2: Pinned atlases survive LRU pressure; separate leases never release one
  another's protection; finishing a lease does not discard decoded images.
- A3: Scope cancellation, AbortSignal and acquisition timeout settle promises and
  remove the lease's pins. Existing loading and decoded-reservation limits remain.

Non-goals: no art/atlas replacement, combat math, timing, movement positions,
reward/save/auth changes, new Vercel project or production deployment.

## Implemented at the component checkpoint

- Pending queue keyed by source, automatically pumped on completion/failure/unpin.
- Priority-aware eviction that excludes pinned and loading entries.
- Scope-aware pins and unique Symbol tokens per acquisition, even for duplicate
  human-readable owner labels.
- `loader.acquire(clips, {owner, scope, timeoutMs, signal})` returns an object with
  `handles` and an idempotent `release()` that removes pins without discarding images.
- Cancelled pending cache requests now reject rather than remaining unresolved.
- Existing `ensure/retry/release/clearScope/inspect` API and explicit retry behavior
  remain. Queued handles preserve `state: idle, image: null`; `inspect()` also exposes
  their queue/pin status.

## Observed component verification

Working directory: `/mnt/data/luc-than-readiness`.
Runtime: Node v22.16.0.
A full repository checkout was not available at this checkpoint: the container
could not resolve api.github.com. Required component files were reconstructed
from pinned source, with original Git blob hashes checked:

- `src/assets/asset-loader.mjs`: `35782e5f3d328c185568f75eb200a01c7c4309d0`
- `src/assets/decoded-atlas-cache.mjs`: `9bab6e753940c65a2ab42056d4ba670c4b042506`

Commands actually run:

```sh
node --test tests/battle-asset-readiness.test.mjs
node --check src/assets/decoded-atlas-cache.mjs
node --check src/assets/asset-loader.mjs
```

RED against pinned originals: exit 1, 12 tests, 1 pass, 11 fail, 0 cancelled.
GREEN against repaired files: exit 0, 12 tests, 12 pass, 0 fail/cancel/skip.
Both syntax checks exited 0.

Local logs: `evidence/red.log` and `evidence/green.log` in the working directory.
These component tests use synthetic Image objects, not the art pack. They must
not be represented as a browser battle replay. Later actual browser and CI
results are recorded separately in the integration handoff linked above.

## Rollback

Revert the PR as a unit; no data migration. Do not label this historical component
checkpoint alone as a complete missing-SFX/VFX fix. Refer to the newer handoff
for implemented runtime scope and remaining device/legacy-kit limitations.
