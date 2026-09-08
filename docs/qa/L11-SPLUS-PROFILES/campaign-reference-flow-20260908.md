# Campaign reference continuation — REVIEW / NOT RELEASED

## Contract and reference

Owner approved implementing the demonstrated flow after reviewing the 20:05, 20:11 and 22:46 screen recordings on 2026-09-08. Chinh chiến (AFK) → Khiêu chiến → Bày trận → Xuất chiến → actual battle → victory/defeat → return/next. AFK presentation is distinct from actual combat. Six slots are a maximum; the defeat recording explicitly starts with one hero.

Target branch remains `handoff/l11-splus-profiles-v2-20260908`, upstream checkpoint `a9b043d`. No production. Board/Vibe unavailable; source/test continuation remains authorized as recorded in L11. No claim/lease or DONE state is fabricated.

## Changes

- A1: green-tick bench buttons remove deployed heroes; reserves add only below six, full roster reports the limit. Empty roster cannot launch. Other loadout callers retain their six-hero validation unless explicitly opting into campaign partial formation.
- A2: preparation now uses the existing animated scene canvas on a battlefield with both sides, existing authored background registry, a five-column bench, element filters and quick-deploy. Pointer dragging swaps occupied positions; tapping two occupied positions is the keyboard/click alternative. Existing canvas/clock/scope owner is reused and restored on exit.
- A3: campaign formation save uses the existing transaction command with partial validation. Normalization preserves nonempty valid selections instead of refilling them during load/combat snapshots. Wholly invalid/empty legacy selections retain the recovery fill. No save schema version, ownership, economy or combat balance change.
- A4: the single M0/P0 result-action owner transmits explicit confirm/next intent through the existing result payload/callback. Confirm advances a won checkpoint then returns to campaign; explicit next starts a new encounter. Defeat keeps the checkpoint and returns to campaign. Chapter completion respects the same intent. No second result listener/scheduler/reward owner.
- Cost preview now uses the same `costCampaign` setting as `startChapter`.

Source owners: `campaign-scene.js/.css`, `campaign-view.mjs`, `loadout.mjs`, `party-command-runtime.js`; build owners `afk-chest-runtime-v1.mjs` and `campaign-reference-flow-v1.mjs` through `build-static.mjs`, before embedded battle synchronization.

## Evidence

- RED: three new toggle/partial/swap tests failed before implementation.
- Initial focused source/domain/transaction/settlement run: 30/30 passed.
- Additional executable tests against built `startChapter` and `normalizeSquad` confirm: confirm does not launch twice; explicit next opens the next battle; defeat does not advance; one-hero selection is retained; invalid legacy recovery still fills.
- Final build PASS. Independent/embedded battle synchronization retained (1,410,907 bytes).
- Final test invocation `node --test --test-concurrency=1 tests/*.test.mjs`: **407 passed / 2 failed**, 409 total. Both failures are pre-existing `sharp` dependency failures in `luc-anh-idle-1080.test.mjs` and `mobile-render-sfx.test.mjs`. Not full-green. Logs alongside this document.
- One former preparation-timer source assertion was updated because preparation now uses `startSceneClock`, which already owns the scoped interval and RAF, rather than calling `trackSceneTimer` directly. No lifecycle assertion was removed.
- Cloud Chrome opening local `http://127.0.0.1:4173` returned `ERR_BLOCKED_BY_CLIENT`. Browser capabilities contain no viewport/emulation. UI interaction, screenshots, real mobile/Safari are **NOT VERIFIED** for this candidate.

## Open acceptance / continuation

1. Preview actual campaign/formation/one-hero battle/confirm/next/defeat with pointer and touch. Inspect actor scale and background framing, drag cancellation and return animation lifetime. Do not infer visual PASS from source tests.
2. Enemy preview reads authored static encounter arrays only; it does not run dynamic encounter factories. Unknown identities reuse existing role-art fallback. Complete visual parity of enemy art, dynamic encounters and enemy power header remains open.
3. Current save stores row and order, so removing a hero compacts that row. Empty fixed-slot movement is not added; occupied-position drag is implemented.
4. Existing victory/defeat art and reward data are reused. Reference countdown auto-next, extra defeat improvement shortcuts, and the larger AFK-home visual redesign are not implemented by this slice. Do not label the entire reference UI finished.
5. Owner explicitly confirmed permission to upload this candidate to `bktimmy247/luc-than`, branch `handoff/l11-splus-profiles-v2-20260908`, after the earlier automatic review rejection. Upload is now authorized; verify the resulting commit and preview separately. No production promotion is authorized.

Fractional timing remains REVIEW_UNCHANGED. Prior S+ crop/target/restart/15-round evidence stays historical and was not repeated as UI acceptance. Earlier unpushed hero-detail scene changes remain in the local workspace and are not lost.
