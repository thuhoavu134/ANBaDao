# Vercel sharp build dependency repair — 2026-09-22

Tracking: GitHub issue #192. This is not a Ticket Board claim or completed VibeLab gate.
Baseline: main `7ebc973aa244b3e7e0ea26236cc306704d2bdb25`.
Branch: `fix/vercel-sharp-build-dependency-20260922`.
Scope: deployment installation configuration only, plus regression tests and this handoff. Independent of PR #191; no movement-preview approval is implied.

## Diagnosis and contract

The owner's Vercel log runs `npm install --omit=dev --no-audit --no-fund`, then `npm run build`, which fails with `ERR_MODULE_NOT_FOUND` for `sharp` imported by `scripts/luc-anh-idle-asset.mjs`.
Source confirms `sharp: 0.34.3` is a devDependency. Static asset generation needs it before the build can complete.

A1: Explicitly install development build dependencies even under NODE_ENV=production.
A2: Exercise installed sharp's native resize and lossless RGBA WebP encode/decode in the Node regression suite.
A3: Preserve package versions, package-lock, build command, output directory, routes, headers, existing CI gates and all gameplay/assets.

## Minimal owner patch

Only change to deployment configuration:

```diff
-  "installCommand": "npm install --omit=dev --no-audit --no-fund",
+  "installCommand": "npm install --include=dev --no-audit --no-fund",
```

Keep sharp as a build-time devDependency. No library upgrade or Node runtime change is required by this diagnosis. The log is a missing-package failure, not evidence of an asset defect or a Node-version incompatibility.

## Executed local evidence

Local focused fixture contains byte-identical baseline files, verified with `git hash-object`:
- package.json: `38babcd20554409546bff5ef24209beaf6115496`
- vercel.json before patch: `e626bdd586460ae75d1ec67c20903f24a5dd04f5`

Test authored before configuration change:
`node --test --test-name-pattern='Vercel installs' tests/vercel-build-dependencies.test.mjs`

- RED baseline: 1 test, 0 passed, 1 failed, exit 1. Assertion: Vercel must explicitly include development build tools.
- GREEN patched configuration: 1 test, 1 passed, 0 failed, exit 0.
- `node --check tests/vercel-build-dependencies.test.mjs`: exit 0.

Clean installation attempt:
`NODE_ENV=production npm install --include=dev --no-audit --no-fund`

BLOCKED locally: `EAI_AGAIN`, DNS resolution for registry.npmjs.org while fetching @neondatabase/serverless. This is an environment limitation distinct from the owner's Vercel missing-sharp error. The native sharp test, complete game build and full suite have not passed locally; no substitute global sharp version or mock renderer is claimed as installation evidence.

## Review and next action

- Existing CI will pick up the new test through `tests/*.test.mjs`; no workflow/check was disabled or weakened.
- Read actual CI and Vercel results on the published revision. Do not merge with required CI red or claim READY/live before verifying a successful deployment.
- Actual desktop/mobile game render, physical iPhone/Safari and production deployment are UNVERIFIED for this revision.
- A local source/test-only exception is documented in the existing project brief while Ticket Board is unavailable; no claim/lease/lock or completed workflow is fabricated here.
- After merge, a new deployment must build the new commit. Redeploying the old 7ebc973 snapshot alone retains the broken installCommand.
- Rollback is the single config line, but restores the known missing-dependency failure.

References: npm CLI install documentation (include/omit) and sharp installation documentation. No authored frames, atlas data, combat timing, rewards, save, auth or PR #191 source changed.
