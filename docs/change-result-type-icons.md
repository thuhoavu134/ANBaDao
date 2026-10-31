# Change — result type & reward icons (2026-10-31)

Scope: the real battle-result screen (`#integratedResultV6`, rendered inside `battle.html`).
Layout, background art, wing art, buttons and all reward logic/amounts are untouched.

## Problem
1. **Lettering.** `VICTORY` / `DEFEAT` were a 480-px-wide raster PNG
   (`assets/owner-refresh-20261018/result-*-letters.png`). The letters occupy only 295×74 of a 480×287
   canvas, and `.irv-word{width:100%;aspect-ratio:16/9;object-fit:contain}` stretched that canvas across the
   crest — so the CSS box lied about the real letter size and the art was upscaled and soft on phones. The
   face was a flat Impact-style grotesque with no rim, no metal, and no relationship to the painted wings.
2. **Reward icons.** The same logical reward used different assets on different surfaces, and unknown ids
   silently borrowed another reward's art:
   - result loot tiles: gems used `assets/meta/economy/icon-gems.png` (flat shop glyph **with baked "300" and
     "Hạn mua 1/1" text**); unknown ids fell back to the EXP scroll;
   - in-battle reward cards (`RESULT_REWARD_ART_ICONS`): no gems entry at all, unknown ids fell back to the
     **mastery orb** (a visibly wrong reward).

## Change
1. **Vector word mark** — `scripts/asset-design/result-words-v2.py` converts Constantia Bold caps to
   outlines (no live text, so mobile font substitution cannot change the shape) with a tight viewBox and a
   layered metal treatment: dark rim, six-stop gradient, clipped top gloss, bottom shade, soft glow.
   Output: `assets/result-art/result-word-v2/{victory,defeat}.svg` (gold / cold steel).
   `scripts/owner-refresh-20261018.mjs` now points `.irv-word` at the SVG and sizes it into the crest:
   `min(62vw,286px)` at `top:calc(min(100vw,56.25vh)*.085)`; defeat `min(46vw,212px)` at `.075`.
   Constantia was chosen from a Palatino/Bookman/Constantia A/B (`docs/qa/result-type-icons/face-sheet.png`):
   its wedge serifs survive phone size and echo the crest's feather tips.
2. **One reward-icon map** — `scripts/result-reward-icons.mjs` (gold, mastery, playerXp/exp, shards, gems,
   plus a neutral empty-slot fallback). `result-screen-contract-v1.mjs` embeds it for the loot tiles;
   `battle.html`'s card map mirrors it (gems added, `rewardArtIcon` no longer returns the mastery orb for
   unknown ids). `tests/result-reward-icons.test.mjs` fails on drift between the two.

## Deliberately NOT changed
- Two gold tiles on the same screen (e.g. "Vàng" + "Vàng vượt ải") keep the same icon on purpose: same
  logical reward → same asset. Card heights, button hierarchy, reward text and amounts are unchanged.
- `VICTORY`/`DEFEAT` stay in English (owner: don't change language unless necessary).
- Defeat-screen action tips (`idle-reward`, `upgrade-hero`, `summon-hero`, `equip-gear`) are navigation
  shortcuts, not rewards, so they keep their own art.

## Verification
- `node --test tests/result-reward-icons.test.mjs` → 4/4 pass.
- Real-path QA (`docs/qa/result-type-icons/qa-result.mjs`): login → campaign → prepare → launch → battle →
  instant skip → real overlay, at 375×812 and 430×932, DPR 2. Win at Ải 6–2 (`winner=player`) and loss at
  Ải 6–2 (`winner=enemy`); no console exceptions, no `/assets/` 404s, no horizontal overflow, both buttons
  still act (overlay closes, gold credited).
- Evidence: `docs/qa/result-type-icons/result-final.json`, `final-{victory,defeat}-{375,430}.png`,
  `qa-final.log`, `build-3.log`.
