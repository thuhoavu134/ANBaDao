# Campaign loot and full-page return — 2026-10-02

Base: `8a57b69dd6dde0f6648f5bfb3016bdb2964f079f` (PR #246).

## Reproduction on production before this change

Existing guest QA session in Chromium at luc-than-chi.vercel.app:

- Victory 1–1 showed 180 battle gold + 120 quest gold, 24 team mastery and 80 player XP. Confirm moved 1–1 → 1–2 and gold 500 → 880: the 80 seal gold was not displayed.
- Stage 1–2 was opened at its actual iframe URL in the same tab to exercise the full-page return transport. Victory showed 180 battle gold + 135 quest gold and 88 XP. Next reached 1–3, but showed the welcome gate while the new battle ran behind it; Continue exposed that battle.
- Source confirms the reconstructed full-page onEnd bypassed runBattleWithSealLoot, losing the separate seal reward.
- Inspected Victory: Thầy Mo is transparent/full body, no opaque portrait; reward quantities and buttons are visible. This remains the previously merged idle translation, not a newly authored running clip.

## Scope

- Keep all 108 existing stage reward values and the existing shard hero pool. Expose read-only preview and preparation from the lore owner.
- Add seal gold/gems/shards to the existing battle transaction/ledger. Failed save rolls back; duplicates do not award or roll twice. A retry within the same document retains the shard draw.
- Show Vàng vượt ải, Ngọc vượt ải and Mảnh tướng ngẫu nhiên from the same formula. No economy increases, new currency or retroactive save rewrite.
- Resume a validated full-page return only for the same previously entered account in the same tab. Await existing cloud readiness; close the gate without routing through the hub. Preserve normal first-entry login and logout.
- Coalesce concurrent return attempts. Retain failed/blocked returns so Continue can retry them.
- Update the actual progression build transform for the one remaining competitive callback.

## Validation

`node --test tests/campaign-loot-return.test.mjs tests/result-settlement-regression.test.mjs tests/result-character-motion.test.mjs tests/settlement-navigation.test.mjs`

47 PASS. Initial new regressions: 6 FAIL / 1 PASS. Coverage includes both transports, failed save/rollback, duplicate currency/shards, loss/wrong stage/other modes, 108 reward amounts, read-only preview, retained shard draw, same-account gate, cloud readiness/failure, in-flight coalescing, manual retry and the real callback build transform.

Affected source owners replayed on downloaded production HTML, retaining late modal/callback transforms; all inline scripts parse and the result patch is idempotent. Full clean npm build/full suite not run in this sparse recovery.

Browser observations above are PRE-FIX desktop Chromium, not post-fix or physical iPhone/Safari certification. GitHub merge and Vercel deployment must be verified separately. Main-quest/chapter awards retain their separate existing owners. User previously authorized merge without the workflow gate.
