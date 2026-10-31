# PROGRESS — result type & reward icons (ui/result-type-icons-20261031)

Branch: `ui/result-type-icons-20261031` @ worktree `C:/lt/wt-result-icons` (base `origin/main` 2fa023c1)
Last update: 2026-10-31 12:58 (+07)

## What the owner asked
Fix the ugly VICTORY / DEFEAT lettering on the **real battle result** screen (stage 6–2 mobile), matching the
existing ornate gold style and staying readable on phones; unify reward icons across the result surfaces with
one mapping. Keep layout/background/wing art/buttons. No new image generation, no reward-logic or amount changes.

## Key findings (verified in the built dist, not guessed)
1. The result overlay is `#integratedResultV6` and it lives **inside the battle iframe** (`dist/battle.html`,
   renderer id `v3246-result-v6-v4-js`), NOT in `index.html`. `index.html` only references it in a visibility watcher.
2. Layers, measured at 375×812 in the real result screen:
   - `.irv-stage`  = `assets/result-victory-v6/victory-stage-original-quality-smooth-v5.apng` (480×270, background art only — **no baked word**)
   - `.irv-card`   = `victory-info-card-portrait-v6.png`
   - `.irv-title`  = `assets/owner-refresh-20261018/result-{victory,defeat}-wings.png` (wings only, **no baked word**)
   - `.irv-word`   = `assets/owner-refresh-20261018/result-{victory,defeat}-letters.png` — the word mark
3. So the word is a **480-px-wide raster PNG** (`letters.png`, letters occupy only bbox 295×74 of a 480×287
   canvas) stretched by `.irv-word{width:100%;top:0;aspect-ratio:16/9;object-fit:contain}` → soft/upscaled on
   mobile, and the empty canvas margins make CSS sizing lie about the real letter size. That is the "ugly
   lettering": flat Impact-ish grotesque, no metal treatment, no rim, clashing with the painted wings.
4. The word art is **not** baked into the stage or wings art (checked each layer separately), so a vector
   replacement is legitimate and needs no cover-up blocks.
5. Reward-icon inventory — four separate maps for the same logical rewards:
   - `scripts/result-screen-contract-v1.mjs` `icons` (result loot tiles): gold/mastery/playerXp/shards from
     `assets/result-icons-art/*`, but **gems → `assets/meta/economy/icon-gems.png`** (flat shop glyph with baked
     "300" + "Hạn mua 1/1" text), and **unknown id → scroll icon** (silently mislabels as EXP).
   - `battle.html` `RESULT_REWARD_ART_ICONS` / `rewardArtIcon()`: gold/mastery/scroll/shard only, **no gems**,
     **unknown → mastery icon** (mislabels as mastery).
   - `src/ui/campaign-scene.js` `sceneRewards`: gold/mastery/hoat (same result-icons-art family, already consistent).
   - Visual family check (contact sheet `docs/qa/result-type-icons/candidates.png`): `result-icons-art/*` are one
     painterly glowing-orb family (gold, jade mastery, scroll, hero shard); `icon-gems` and `menu-v3233/resource-*`
     are a different 3D/flat family. Canonical single-gem art without baked text =
     `assets/ui/menu-v3233/icons/resource-gem-imagen.png`.

## Files created so far (all in this worktree)
- `docs/qa/result-type-icons/` — QA harness + evidence:
  - `qa-result.mjs` (real path: login → campaign → prepare → launch → battle → skip → overlay), `qa-baseline.log`,
    `result-baseline.json` (geometry + reward rows + button behaviour)
  - `baseline-victory-375.png`, `baseline-defeat-375.png`, `-430.png`, `*-after-confirm.png`
  - `candidates.png`, `layer-audit.png`, `letters-source.png`, `grid-sheet.png`, `face-sheet.png`, `faces.json`
  - `qa-battle-readiness-browser.mjs` (repo QA harness) got one additive fix: `.svg → image/svg+xml` in its
    static server mime map (it was serving SVG as octet-stream, so vector previews silently failed).
- `scripts/asset-design/result-words-v2.py` — deterministic outline word marks (fontTools) →
  `assets/result-art/result-word-v2/{victory,defeat}.svg` (tight viewBox, dark rim, 6-stop gold gradient,
  clipped top gloss + bottom shade, soft glow). Defeat uses a cold steel palette.
- `assets/result-art/result-word-alt/*` — Palatino / Bookman / Constantia alternates for the typeface A/B
  (generated, preview only, not referenced by the app).

## Verified so far
- Real win at Ải 6–2 (levelled squad fixture) and real loss at Ải 6–2 (default squad): `winner=player` / `winner=enemy`
  in `result-baseline.json`, i.e. the screens are produced by the real engine, not by a forced placeholder.
- Confirm button acts: overlay closes, frame returns to the campaign scene, gold is credited.
- Reward rows read at 375: Vàng +180 / Tinh Thông đội +24 / Vàng vượt ải +246 / EXP người chơi +188 (values untouched).

## Next action (in order)
1. ~~Bake the chosen word mark into `scripts/owner-refresh-20261018.mjs`~~ DONE — `.irv-word` now points at
   `assets/result-art/result-word-v2/{victory,defeat}.svg`, sized `min(72vw,331px)` at
   `top:calc(min(100vw,56.25vh)*.22)` (defeat `min(64vw,294px)` / `.24`), plus a soft drop shadow.
   Typeface A/B (palatino / bookman / constantia) picked **Constantia Bold** — wedge serifs survive phone
   size and echo the crest's feather tips (`docs/qa/result-type-icons/face-sheet.png`).
2. ~~Add `scripts/result-reward-icons.mjs`~~ DONE — one map (gold, mastery, playerXp/exp, shards, gems) +
   neutral fallback `reward-empty-slot-imagen-v154.png`. Wired into `result-screen-contract-v1.mjs`
   (loot tiles) and `battle.html` `RESULT_REWARD_ART_ICONS` (+ gems, + rewardArtIcon no longer returns the
   mastery orb for unknown ids). Drift guard: `tests/result-reward-icons.test.mjs` (4/4 pass).
3. Build #2 running → final `qa-result.mjs` at 375/430 for win + defeat.
4. Commit locally (no push / no PR).

STATUS: IN PROGRESS
