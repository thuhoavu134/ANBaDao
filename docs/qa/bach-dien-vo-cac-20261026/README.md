# Bạch Diện — Võ các preview

Owner approved the illustrated concept in chat and requested a separate PR. Base: `d3c63fa4c25c719e8e9046e42634fe0e65715882`. Draft only; no merge or production approval.

## Scope

The existing detail hall reparents `#hdBody` out of `#heroDetailScreen`. Much of the earlier tab/scene CSS consequently does not match the rendered overlay. Add a presentation stylesheet targeting the real `#hvHeroDetailRoot[data-hero-id="bach_dien"]`, loaded by the existing late `installCoreScreenPolish` build owner. The existing hall renderer records the current hero ID on its root, including when navigating to another hero.

Only Bạch Diện receives the new look in this PR. Other hero details and roster remain unchanged. The background PR #379 is separate.

- New clean pavilion background, warm brown/brass chrome, opaque ivory panels and jade primary action.
- Existing animated Bạch Diện canvas and authored mask/outfit remain the source of character art. No generated hero replacement.
- Six existing tabs, skill shortcuts, previous/next, Back, upgrade, five-level upgrade, star upgrade, reset, awakening, equipment, bonds and mastery retain their existing nodes and handlers.
- CSS uses `display:contents` on the existing dock so the stat row, workspace and upgrades can be ordered without cloning controls/canvas. Long tab content remains scrollable; controls are not hidden to force a one-screen fit.
- No balance, save, cost, reward, animation-clock or roster changes. No UI text/numbers baked into background.

## Design reference versus implemented runtime

![Owner-approved concept, NOT a runtime screenshot](approved-concept.jpg)

The concept is a visual target, not a pixel-exact screenshot of the implementation. Real skill symbols, six-star count, text and stats come from existing game data. The artwork's invented skill pictures are not substituted for game assets. The rendered implementation needs browser review before acceptance.

## Verification

- PASS: `node --test tests/hero-detail-vo-cac.test.mjs` — 3 focused cases, covering real hall wrapper execution, current-hero scoping/reset on hero switch, Back and double-install guard, and existing late CSS installer preserving live markup/scripts.
- PASS: changed JavaScript parses; new WebP decodes as 1200 × 900.
- NOT RUN: clean full `npm run build` / full `npm test`; this workspace has a sparse connector checkout, not the full multi-asset repository.
- BLOCKED: desktop/mobile Chromium interaction and screenshot QA. Playwright is present but no browser executable; browser downloads returned invalid/truncated ZIP archives. No browser visual pass is claimed.
- NOT RUN: physical iPhone/Safari, production deployment, runtime asset-error audit.
- Repository-requested `vibelab-build` / ticket-board are unavailable in this session; no ticket status or workflow pass is claimed.

## Remaining acceptance before merge

Run full build/test and open the real game at 390×844, 320×700 and desktop. Open Bạch Diện from roster, inspect full body and moving idle, scroll through all six tabs, activate each skill shortcut, check enabled upgrade and ×5 against actual costs, test star/reset confirmation, navigate next/back and reopen. Verify no duplicated action, no horizontal overflow, readable disabled states, no missing assets/runtime exceptions, and >=44px controls. Review screenshots at top and at actions. Confirm another hero retains its previous layout. Physical Safari remains a separate check.

This draft intentionally does not certify screenshot parity or production readiness.
