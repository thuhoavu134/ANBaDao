# Repair contract — 2026-09-29

Baseline: `3f63fd1465491798b9f0385e8cd0423f329a6f69`.
Branch: `fix/save-arena-hero-scale-20260929`.
User requested all non-Apple review fixes and consistent arena character scale, particularly Linh Đồng idle/attack/ultimate.

Acceptance:
- S1: OAuth/password/resumed sessions read cloud state before any upload; failures do not overwrite either saved state.
- S2: independent server save versions reject stale and concurrent writes atomically; client serializes writes and isolates account changes.
- S3: database initialization failure returns unavailable and cannot silently acknowledge volatile saves in production.
- S4: profile synchronization preserves friends, inbox and rank; ranking queries are bounded in SQL.
- A1: online rank changes require a server-verified match, one settlement and atomic rank changes; client booleans are not authority.
- V1: authored character scale/pivot remain stable across clips and mirrored teams; VFX and combat clocks are unchanged.

Apple authentication is outside scope. Preserve existing rules/rewards, original RGBA assets and the single build/runtime owners.

Workflow status: DRAFT / BLOCKED, not acceptance-complete. Vibe Builder/VibeLab skills and ticket-board/claim/path-lock connector are unavailable in this session. This file records scope and evidence only; it is not a board claim or completed gate. Required full build/browser/CI/physical-device results are reported independently in README.md. No merge or deployment is authorized by this record.
