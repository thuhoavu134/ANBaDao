# Kỷ Vân / Tiêu Phong idle scale — 2026-10-15
Baseline PR306 b08b63b0cb25b9993d85287182e4d78409ffcc6c. Source-only patch; not merged or deployed.

Acceptance: one shared scale for all 30 idle poses; median body matches the existing 413px standing/action reference; feet align at y=-12; aspect ratio, mirroring, action geometry and timing remain unchanged.

Measurements (alpha >32): Ky Van idle median body 645, foot 657; Tieu Phong 648.5, foot 658. Previous displayed idle body was 475.54/478.12. New fixed scale is 413/645 and 413/648.5. No source pixels or frame clocks changed. Tieu Phong Ultimate keeps its authored crouch and lift.

RED: both renderer VM scale cases failed on baseline. GREEN: 22/22 focused idle/assets/visibility/VFX cases pass. Initial new test harness missed existing lift dependencies, then corrected. Existing visibility page-order assertions named superseded idle-0/1 pages; updated to current authored page names without weakening order/priority checks.

Offline asset comparison visually inspected: fixed idle matches ATK body scale and ground, Ky Van ULT matches, Tieu Phong ULT retains crouched pose. This is not browser evidence. Full build/npm test/browser NOT_RUN in this sparse workspace (no package.json). Physical Safari and production NOT_RUN.

Existing unavailable Ticket Board exception retained; no claim/status or gate completion fabricated. Owner explicitly authorized updating PR306 on 2026-10-15. Branch-ref API failed twice; source and tests were uploaded sequentially through the Contents API. Apply patch to PR306 branch, run full normal build/tests and desktop/mobile browser QA before review. Every merge still requires explicit owner approval under AGENTS.md.
