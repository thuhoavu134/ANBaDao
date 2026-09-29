# Save safety and arena scale repair — draft

Baseline: `3f63fd1465491798b9f0385e8cd0423f329a6f69`.
Apple authentication is explicitly excluded by the owner.

## Changes

- One cloud-session owner loads an account before uploading, backs up the replaced local save, retains acknowledged offline work, serializes writes and rejects late responses after an account switch. Guest entry cancels a pending cloud restore.
- `/api/save` returns an independent server version. PUT requires `expectedVersion` (428 when missing, 409 when stale). PostgreSQL uses conditional INSERT/UPDATE; file-store versions survive restart and migrate legacy records from version 0. Old clients must reload to acquire the versioned protocol.
- Production database initialization failure returns 503 instead of acknowledging volatile memory saves. Profile stat sync updates only those fields, preserving friends, inbox and rank. Rival/friend/leaderboard queries are bounded in SQL with ranking indexes.
- Battle formation owner resolves all canonical identity fields, fixes S+ paths missing horizontal scale/offset, avoids double mirroring of authored sprites and keeps depth scale tied to the home slot while approaching/casting/returning. Existing hero scale constants, sprite pixels, clip clocks, VFX and damage remain unchanged.
- **Temporary online ranked maintenance:** the API rejects unverified client wins. The online challenge is blocked before stamina is charged, while local arena remains playable. This closes the reported rank-forgery endpoint; it does **not** implement a server combat verifier or complete ranked PvP.

## Evidence and limits

| Acceptance | Result |
| --- | --- |
| S1 cloud reads before writes | PASS in VM running actual auth runtime; failed reads do not upload |
| S2 concurrency / account isolation | PASS in memory/file/session tests; PostgreSQL integration NOT RUN |
| S3 unavailable database | PASS in environment factory and HTTP tests |
| S4 profile preservation / bounded query path | PASS targeted tests; real PostgreSQL query plans NOT RUN |
| A1 authoritative online arena | PARTIAL: fail-closed safeguard only; online ranking remains unavailable |
| V1 stable battle transforms | PASS module and injected-runtime tests for identity, motion and both render paths |
| V1 equal apparent size inside different atlas clips | UNVERIFIED; no new screenshots with current assets |
| Full build / full Node suite | BLOCKED by incomplete binary asset checkout |
| Desktop/mobile Chromium / physical Safari-iPhone | NOT RUN for this change |
| Production | NOT DEPLOYED |

`targeted-tests.tap`: 47 passing tests, zero failures/skips. Regression tests were first observed failing for unsafe save writes, OAuth overwrite, profile erasure, volatile production fallback, client-declared arena wins and the three scale-path defects. Existing renderer/formation/auth contracts also pass. These are targeted tests, not a full game certification. PostgreSQL tests use a SQL stub; they do not establish production transaction behavior.

The checkout was assembled through the connected GitHub plugin. Text sources were accessible, but Contents API returned empty payloads for large binary assets and direct downloads were unavailable. Two historical successful workflow runs had no downloadable artifacts. The build stops at the missing `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`; source files were not replaced with placeholders to make it pass. See `build.log`.

Inspection found different Linh Đồng `cropBox` values in the current manifest (Idle 1296×992, ATK 1336×984, Ultimate 1696×1040). The native packing generator is not available in the checked-out source, so a compensating scale derived from an assumed resize mode would be speculative. No per-frame crop or guessed atlas rescale is shipped. Historical screenshots were inspected only for context; they are not evidence for this patch.

## Remaining gates before merge

1. Obtain the complete existing assets and run `npm test` plus current browser gates. Inspect fresh desktop/mobile Idle → ATK → Ultimate → Idle captures on both teams, including Linh Đồng and Bạch Diện. Verify any remaining intrinsic atlas size difference using the actual packing geometry and a shared authored coordinate space.
2. For online ranking, implement the shared combat replay/verifier, server-owned match snapshots and a one-time atomic settlement. A ticket signature plus client `win` is insufficient. Review the temporary maintenance behavior before release.
3. Complete Vibe Builder/VibeLab contract/claim/lock/review gates when their skills and ticket-board are available. The repository documents a ticket-file fallback, but this report does not claim a board ticket or a completed gate.
4. Require green CI and review current visual evidence before merge. Physical Safari/iPhone and deployment remain separate checks.
