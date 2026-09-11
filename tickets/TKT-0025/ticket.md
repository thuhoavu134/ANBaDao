---
id: TKT-0025
title: Automatic CI/CD pipeline
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T11:15:00.000Z
updated: 2026-09-11T11:25:00.000Z
acceptance_ids: ["L25-C1","L25-C2","L25-C3"]
required_gates: ["vibelab","tdd"]
affected_paths: [".github/workflows/ci.yml","package.json","tests/ci-pipeline.test.mjs","tests/battle-audio-lifecycle.test.mjs","tests/mobile-render-sfx.test.mjs","tests/settlement-navigation.test.mjs","tests/transaction-command-audit.test.mjs"]
resource_locks: ["github-actions","vercel-config"]
---
# TKT-0025 — CI/CD tự động

Goal: Every pull request and every push to main runs install → build → tests. Main still auto-deploys to luc-than.vercel.app via Vercel. After a main push, CI waits until live answers 200.

Non-goals: new game features, changing combat/seed/reward, replacing Vercel with another host, required branch protection (needs owner settings).

## Acceptance

- L25-C1: workflow file exists and runs on pull_request, push to main, and workflow_dispatch
- L25-C2: CI job installs with devDependencies, builds, and runs node tests
- L25-C3: production job on main confirms https://luc-than.vercel.app returns 200

## Result

- RED: no `.github/workflows/ci.yml`; first Actions run on PR #25 failed 6 stale tests (531/537)
- GREEN: 3/3 `tests/ci-pipeline.test.mjs`; full suite **537/537 PASS** after aligning 6 stale assertions with current approved runtime (no combat/seed/reward change)
- CD: Vercel Git on `main` unchanged
- Safari/device: NOT_RUN

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
