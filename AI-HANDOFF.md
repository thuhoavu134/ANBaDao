# AI Handoff — Hồn Việt: Mộng Giới

This file is the first file future AI agents should read before modifying the project.

Project: Hồn Việt: Mộng Giới
Genre: mobile-first 2.5D turn-based 6v6 Vietnamese fantasy RPG
Source of truth: this GitHub repository

---

## Required Reading Order

1. `AI-HANDOFF.md` — this entrypoint.
2. `docs/HON-VIET-ASSET-PRODUCTION-STANDARD.md` — locked asset size, sharpness, and AI-frame pipeline standard.
3. Existing project design / resume / runtime docs in `docs/`.
4. Current runtime patch scripts under `scripts/` before editing `index.html` or `battle.html`.

---

## Non-Negotiable Workflow Rules

- Do not replace huge `index.html` or `battle.html` directly when a small post-build patch script can do the job.
- Prefer small, auditable scripts under `scripts/`, then import them from `scripts/build-static.mjs`.
- Do not claim runtime PASS without actual evidence.
- Do not claim iPhone/iPad PASS without testing on a real or representative mobile runtime.
- Do not hardcode Slot 1 combat behavior; attacks must be target-aware.
- Do not require the user to learn Spine unless the user explicitly asks for a Spine workflow.

---

## Official Asset Direction

The project uses AI-generated video/GIF/PNG-sequence assets supplied by the user.

Official pipeline:

```text
User-created AI video/GIF/source frames
→ assistant extracts/cleans/normalizes frames
→ assistant packs atlas
→ assistant generates metadata
→ assistant integrates runtime
→ assistant QA checks in game
```

Frame-by-frame sprite animation remains the default production path.

Spine is allowed only as an optional future optimization, not a requirement.

---

## Locked Visual Reference

Ông Phở is the current approved battle-size reference.

All Golden Characters should be normalized to the same perceived battle scale as Ông Phở while keeping the body, weapon, silhouette, and baseline stable.

For exact sizes and rules, read:

`docs/HON-VIET-ASSET-PRODUCTION-STANDARD.md`

Key standards:

- battle character source frame: `768×768` minimum;
- premium Golden source frame: `960×960` preferred;
- hero detail/showcase idle: `1200×1200`;
- full enemy-team ultimate VFX: `1280×720`;
- small projectile/VFX: `512×512` or `640×320`;
- runtime must be HiDPI/Retina aware.

---

## Current Important Runtime Notes

- iOS/iPadOS audio cannot autoplay before user interaction.
- Runtime should unlock audio on the first real game tap/click, not with a blocking splash unless explicitly requested.
- Lục Ảnh has a dedicated runtime patch flow and audio bus patches.
- Recent runtime work includes Retina/HiDPI sharpness improvements for Lục Ảnh, but true sharpness still requires source frames at the locked standard resolution.

---

## Guidance for Future AI Agents

When the user sends a new character asset pack:

1. inspect actual source dimensions;
2. check baseline consistency;
3. check blur / crop / identity drift;
4. normalize to the official asset standard;
5. pack runtime atlas;
6. generate or update metadata;
7. integrate through patch scripts;
8. build and test;
9. report exactly what passed and what was not tested.

Never hide missing assets or failed runtime checks.
## Main Quest System (3Q-style reference loop)

- `src/domain/quest/main-quest.mjs` is the pure quest state module (`hon-viet-main-quest/v1`).
- `scripts/quest-system-3q-v1.mjs` injects the module into the static build; it must remain imported by `scripts/build-static.mjs`.
- The main loop is one active quest per account: Hub/Daily mission card → compact `ĐẾN NGAY` CTA → one 6v6 auto encounter → result → compact reward → next ải/chapter. The Hub card stays above the dock and pointer-safe so it does not cover function buttons.
- The module is intentionally Hồn Việt-only: it borrows the readable 3Q-style quest cadence and CTA hierarchy, not 3Q names, branding, or commercial assets.
- The 3Q source archive (`3Q.rar`, 2.36 GB) is over the connected Drive download limit; do not claim direct source-code reuse unless a smaller extract is supplied.
## Battle Background Set (20 authored arenas)

- `assets/battle/backgrounds-v1/` contains the 20 `*_battle_stage.png` images from the Library pack `HON-VIET-MONG-GIOI-20-THEME-BACKGROUND-PAIRS.zip`; source artwork is 941×1672 and is kept lossless.
- `src/domain/battle/background-registry.mjs` is the pure deterministic selector. Known campaign IDs are mapped in sequence; `luyen_tap` and `default` reserve themes 19–20, and unknown IDs use a stable hash.
- `scripts/battle-backgrounds-20-v1.mjs` replaces the image source block after `battle-visual-polish-v1.mjs` and loads the selected stage without editing the large `battle.html` file. `scripts/build-static.mjs` imports it immediately after the visual polish patch.
- The battle canvas remains the existing 1600×870 world; portrait stages are fit centrally with a softened side extension so the authored gate/floor/rear wall remain visible while unit coordinates and HUD layout remain unchanged; the legacy painted scenery is not used as a fallback.
