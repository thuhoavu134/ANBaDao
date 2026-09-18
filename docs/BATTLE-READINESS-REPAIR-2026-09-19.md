# Battle asset readiness repair - component checkpoint

Date: 2026-09-19
Mode: repair. Scope: micro for this checkpoint; the complete battle repair remains open.
Branch: `fix/battle-asset-readiness-20260918`
Baseline: `7f53dd74c086d8dcef36eb883f07dc9cee60d513`
Code checkpoint: `9e3e09e4a6ebff8295dccd8667a7bbef4f725fc3`
Status: component-tested, NOT gameplay-accepted, NOT merged, NOT deployed by this task.

## Contract

User reported heavy loading, disappearing characters and missing battle SFX/VFX.
This checkpoint repairs the shared decoded atlas cache and exposes a cancellable
readiness lease. It does NOT yet connect the lease to the hero action scheduler,
visible idle/run ownership or SFX release markers.

- A1: A queued image starts when capacity opens without another draw-loop call;
  its readiness promise must stay pending until the image is actually ready.
- A2: Pinned atlases survive LRU pressure; separate leases never release one
  another's protection; finishing a lease does not discard decoded images.
- A3: Scope cancellation, AbortSignal and acquisition timeout settle promises and
  remove the lease's pins. Existing loading and decoded-reservation limits remain.

Non-goals: no art/atlas replacement, combat math, timing, movement positions,
reward/save/auth changes, new Vercel project or production deployment.

## Implemented

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
A full repository checkout was not available: the container could not resolve
api.github.com. Only the required component files were reconstructed from the
pinned source, with original Git blob hashes checked:

- `src/assets/asset-loader.mjs`: `35782e5f3d328c185568f75eb200a01c7c4309d0`
- `src/assets/decoded-atlas-cache.mjs`: `9bab6e753940c65a2ab42056d4ba670c4b042506`

Commands actually run:

```sh
node --test tests/battle-asset-readiness.test.mjs
node --check src/assets/decoded-atlas-cache.mjs
node --check src/assets/asset-loader.mjs
```

RED against pinned originals: exit 1, 12 tests, 1 pass, 11 fail, 0 cancelled.
GREEN against the repaired files: exit 0, 12 tests, 12 pass, 0 fail,
0 cancelled, 0 skipped. Both syntax checks exited 0.

Local logs at this checkpoint: `evidence/red.log` and `evidence/green.log` in the
working directory. They are not committed repository artifacts. Later container
calls failed with TransportTimeoutError; do not infer a subsequent full build or
browser result from these component logs.

Full repository CI is a separate gate. Browser screenshots, Chinh Chien 6v6,
x1/x2/x3, physical iPhone/Safari, frame time, full memory and production deployment
are UNVERIFIED. The component tests use synthetic Image objects, not the art pack.

## Remaining implementation and verification

1. Wire action leases before any character/VFX clock or action cost starts; release
   them after return/cancellation. Protect required visible idle/run assets.
2. Remove end-of-action forced atlas disposal only after the working set has proper
   ownership, bounded eviction and cancellation coverage.
3. Prepare audio on the existing owner; only mark SFX played after the real async
   result succeeds. Do not replay stale audio after a cancelled action or new battle.
4. Keep mute non-blocking; distinguish unsupported/locked/load-failed/stale audio.
5. Capture a cold-cache Chinh Chien 6v6 run plus the next battle and x1/x2/x3, with
   actual character/VFX draw evidence, sound outcomes and failed-request logs.
6. Profile decoded-memory churn and atlas packaging before claiming improved FPS,
   startup time or iPhone stability. A WebP byte count is not a RAM measurement.

Known limit: images are still loaded at original size before downsampling. The
cache budget is not a total-browser-memory bound. Pinning an oversized working
set cannot manufacture capacity; acquisition has a timeout and must get a visible
recoverable error path when wired into battle.

## Rollback

Revert this branch's component commits as a unit; no data migration is involved.
Keep this PR draft until the remaining runtime and verification gates are resolved.
Do not label this component checkpoint as a complete missing-SFX/VFX fix.
