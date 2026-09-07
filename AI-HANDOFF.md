# AI Handoff — Hồn Việt: Mộng Giới

Start with AGENTS.md and the current block in docs/LUNA-HANDOFF.md; this file is a compatibility entrypoint for older handoffs.

Project: Hồn Việt: Mộng Giới
Genre: mobile-first 2.5D turn-based 6v6 Vietnamese fantasy RPG
Source of truth: this GitHub repository

---

## Samkok v2 direction — 06/09/2026 update

Read `docs/HON-VIET-MASTER-PLAN-SAMKOK-v2-2026-09-06.md` and `docs/HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md`; these are the GitHub source-of-truth plan and current progress snapshot. Preserve the approved Samkok v2 direction in sections 3.1, 7.4, 7.7 and R05/R11. The approved target kit is **Basic + Ultimate + passives**: two principal animated actions including Basic. New concepts do not require a third Skill 1 animation. Plan VFX production and QC from the concept stage; characters may draw on other cultures and fantasy creatures while keeping the common visual style.

The user's roster capacity instruction remains **32 SSR + 16 SR + 16 A + 8 B = 72**. Keep the 12 existing authored heroes and their assets/save ownership. Capacity is not permission to invent 60 placeholder identities, downgrade existing SSRs or change banner odds. At target capacity, plan 144 principal action contracts plus passive/behavior assets; this is not a count of finished assets.

R11 remains a tracked transition: map each hero's legacy skill IDs, investment and assets to a versioned kit before changing combat. Lục's six effigies remain legacy Skill 1 assets; poison cloud remains the legacy Ultimate. Do not silently swap or discard them. Existing automatic talent/Skill 1 behavior is not evidence that the new two-animation contract has been completed.

The first R05/R11 pilot is now implemented for Ông Phở with `samkok-v2.1`: Basic, Ultimate and one bounded passive are versioned in `src/domain/hero/skill-kit.mjs`; legacy Skill 1 investment maps into Basic while the original levels and IDs remain available. The hero detail screen ships a depthful Imagen background at `assets/ui/hero-detail/ong-pho-showcase-bg.png`, and the build exposes the same kit mapping to the battle payload. The authored forge/impact animation and VFX remain connected; the short metallic impact SFX still has an explicit creation brief in the kit registry for the next audio asset pass. Every future hero kit must pass the same asset, motion, VFX, SFX and UI quality gate before roster expansion.

Current completed slices are documented in `docs/SAMKOK-LOADOUT-TRANSACTIONS-2026-09-06.md` and `docs/SAMKOK-FORGE-TRANSACTIONS-2026-09-06.md`. The forge slice belongs to E11-04/05 and extends the existing R07 transaction owner. The next expansion step is to repeat the R05/E02-06 and R11 evidence loop for the remaining authored heroes before adding new identities. Banner/seed decisions and real-device QA retain their separate gates.

## Current implementation and next work — 07/09/2026

- Code baseline: `c8fefca0e31b6ddb926921454413d38860171665`; 171/171 tests passed. Vercel production alias was verified READY at that SHA. Post-hotfix browser interaction and real Safari/audio checks remain pending; deployment is not a device test.
- PR #16 campaign/AFK/preparation and MVP portraits was merged at `92b503c`. The subsequent audio hotfix cancels shared parent SFX, ultimate voice, result audio and stale child callbacks before iframe teardown.
- The new Hermes handoff source audit is complete at the stated static-inspection scope: 7 archive parts, valid CRC, 1,748 modules, 169 decoded configs, Cocos client bundles and protocol schemas. No complete editable Cocos project or backend implementation was found. Do not import the reference runtime/assets into the game build.
- The current execution queue is L01–L20 in `docs/LUNA-EXECUTION-PLAN-2026-09-07.md`, mapped back to E/R/M. **Next code slice: L02a, catalog inventory/validator without changing rewards or seed.** L01 is device verification of existing fixes. L03a transaction/event audit and L04a/L05a route/combat fixtures can proceed independently of banner policy.
- Ông Phở and Lục Ảnh are the two registered v2 kits. Keep 12 existing heroes and all old save ownership; capacity 72 is a future content target.
- Current gaps include legacy chapter rewards outside the official playable roster, seed/migration granting all 12, incomplete full-flow quest/transaction evidence and unseeded gameplay RNG. Client network hooks are not a deployed authoritative backend.
- Status paragraphs before this block describe earlier slices. Use the current progress snapshot and L tickets for priorities; do not reopen a historical bug solely because an older note mentions it.

## Required reading order

1. `AGENTS.md`, then the current section of `docs/LUNA-HANDOFF.md`.
2. `docs/HON-VIET-MONG-GIOI-PROGRESS-2026-09-06.md` — current snapshot; filename kept for link compatibility.
3. `docs/LUNA-EXECUTION-PLAN-2026-09-07.md` — select one ticket/subtask and its file owners.
4. `docs/HERMES-SOURCE-AUDIT-2026-09-07.md` — source evidence and adaptation boundaries; the E/R/M master plan for the relevant product decisions.
5. Relevant domain, build patches and tests; asset production standard and active manifests when editing art/motion.

---

## Non-Negotiable Workflow Rules

- Do not replace huge `index.html` or `battle.html` directly when a small post-build patch script can do the job.
- Prefer small, auditable scripts under `scripts/`, then import them from `scripts/build-static.mjs`.
- Do not claim runtime PASS without actual evidence.
- Do not claim iPhone/iPad Safari PASS without testing on a real device; report Chrome responsive checks separately.
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
## Lục Ảnh IDLE 1080 Repack

- `assets/characters/luc-anh/idle-1080-atlas.webp` is the approved 96-frame IDLE repack from the user-supplied `IDLE.rar` (1510×1004 RGB PNG frames).
- The frames use one fixed crop and edge-connected black-background removal plus enclosed dark-hole cleanup and transparent-edge color bleed, then pack into an 8×12, 3840×5760 atlas with 480×480 cells, alpha, and WebP quality 100. This keeps the 1080/Retina render sharp without enlarging the old 240 px cells.
- `src/domain/character/luc-anh-idle.mjs` is the single metadata contract. `scripts/luc-anh-idle-1080-v1.mjs` patches both the hero-detail IDLE canvas in `index.html` and the combat renderer in `battle.html`; it is imported by `scripts/build-static.mjs` after the spatial Lục Ảnh patch.
- The old `idle-atlas.webp` remains in the repository as a rollback asset, but no longer serves the Lục Ảnh IDLE runtime path.

