# Victory result, navigation and rewards — 2026-09-30

Base: `8fe57f81b6f002aa6ac0ee2d9890480507f118e0` (main / PR #245).

## Observed regression

The user's iPhone screenshot shows an opaque Thầy Mo portrait, cropped reward icons and three hard-coded labels (Tinh thông / EXP tướng / Trang bị), with no quantities. The result motion manifest excluded Thầy Mo, and the visible reward markup never used the result's rewards.

Live Chromium interaction on `https://luc-than-chi.vercel.app/` before this change:

1. Existing guest test save: 500 gold, player EXP 0, stage 1–1. Complete a real iframe battle; press Confirm. Returned to 1–2, EXP 80, 880 gold.
2. Start 1–2; navigate the same tab to its observed iframe URL to exercise the full-page return transport used on iOS. Finish battle and press Next.
3. Incorrectly reached chapter 2 / 2–1, player EXP still 80, 1,960 gold / 880 gems, next battle blocked by level 11.

This verifies a full-page routing/progression regression in Chromium, not the exact Safari tap failure. The immediate return consumer saw the early story route rather than the final 18-stage campaign, and restored neither mode nor stage context. It could award the chapter bonus prematurely.

## Changes

- Wait for the completed host bootstrap; validate pending session/battle/stage and restore campaign context before settlement. Clear return data/URL only after success.
- Use a single native click action owner on the existing overlay. Confirm settles then returns; Next settles then enters the next encounter subject to existing stamina/level checks; Back and defeat tips use the canonical iframe/full-page transport.
- A failed transport no longer latches `resultPublished`. Save failure preserves pending data, re-enables iframe controls through a validated reply, and displays a retry message.
- Gold, first-clear player EXP, capped mastery and pet progress participate in the existing transaction receipt. Duplicate delivery does not repeat those rewards. Main quest/chapter awards retain their existing owners and values.
- Render actual reward quantities, names and purposes: battle gold, total capped team mastery, first-clear player EXP, applicable main quest and chapter bonuses. Zero-value rows are omitted. Reward rows cannot change the settlement payload's base gold. Existing independent daily/quest ceremonies remain separate.
- Use full transparent Thầy Mo idle with authored padding and exact 60/70ms timings during the left-to-center entrance. **No authored Thầy Mo Run/Fall clip exists in this pack**: this is an animated idle translation plus the existing generic defeat transform. Other heroes use their authored Run or battle archetype pose.
- Fix Lục Ảnh's stale result idle source and compact legacy painter competition. Prepare/paint idle before hiding the run canvas; no fade-to-empty between canvases. Release result image/RAF/timer ownership when closing.

## Validation

`node --test tests/result-settlement-regression.test.mjs tests/result-character-motion.test.mjs tests/settlement-navigation.test.mjs`: **35 passed**.

Tests execute extracted production functions and the action/motion runtime with controlled transport, clocks, storage and transaction state. They cover the 1–2 → 1–3 return, Confirm, defeat, mismatched lease, failed save retention, transport retry, duplicate click/result, gold/XP/mastery rollback and caps, data-driven escaped rewards, sprite crop/timing, delayed idle decoding and cleanup. All generated inline scripts parse. Patch application is idempotent.

Five downloaded runtime assets match the base commit's Git blob SHA (see `assets.json`). Six Thầy Mo frames were extracted and visually inspected: no portrait rectangle, whole body retained. `sprite-check.json` records atlas geometry/timing. No authored asset was changed or uploaded.

## Limits

This is a recovered sparse checkout. Validation used the recovered main generated runtime plus the actual changed build owners, preserving readiness variants. A full clean `npm test` / all late build steps was **not run**. Browser reproduction above is **pre-fix**. The updated visual layout, physical iPhone/Safari and production deployment remain **unverified** until the new build is served. Existing saves already advanced by the old bug are not silently rewritten.

User explicitly authorized merging without the prior gate. CI/deployment results must still be reported separately, without calling an unstarted CI job a code assertion failure.
